import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MetaApiService } from '../shared/meta-api.service';
import { TokenEncryptionService } from '../shared/token-encryption.service';
import { ConnectWabaDto } from './dto/connect-waba.dto';
import { generateNumericPublicId } from '../shared/public-id.util';

const PAYMENT_HELP_URL =
  'https://www.facebook.com/business/help/488291839463771';
const WHATSAPP_MANAGER_URL = 'https://business.facebook.com/wa/manage/home/';

export type PhoneRegistrationResult = {
  phoneNumberId: string;
  phoneId?: string;
  displayPhoneNumber?: string | null;
  pin: string;
  registered: boolean;
  alreadyRegistered?: boolean;
  error?: string;
};

@Injectable()
export class WabaService {
  private readonly logger = new Logger(WabaService.name);

  constructor(
    private prisma: PrismaService,
    private metaApi: MetaApiService,
    private tokenEncryption: TokenEncryptionService,
    private configService: ConfigService,
  ) {}

  /**
   * ربط حساب WABA عبر Embedded Signup (Tech Provider onboarding)
   *
   * Meta required steps:
   * 1. Exchange code → business token
   * 2. Subscribe app to WABA webhooks
   * 3. Register phone number(s) with a 6-digit two-step PIN
   * 4. Instruct customer to add a payment method in WhatsApp Manager
   */
  async connect(userId: string, dto: ConnectWabaDto) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId: dto.appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    let tokenData;
    try {
      tokenData = await this.metaApi.exchangeCodeForToken(dto.code);
    } catch (error) {
      this.logger.error(`Failed to exchange code: ${error.message}`);
      throw new BadRequestException(
        'Failed to exchange authorization code. Please try again.',
      );
    }

    const accessToken = tokenData.access_token;

    const debugInfo = await this.metaApi.debugToken(accessToken);
    const granularScopes = debugInfo.data?.granular_scopes || [];

    const wabaScope = granularScopes.find(
      (s: any) => s.scope === 'whatsapp_business_management',
    );

    const wabaIds: string[] = wabaScope?.target_ids || [];

    if (wabaIds.length === 0 && !dto.wabaId) {
      throw new BadRequestException(
        'No WhatsApp Business Account found. Please complete the Embedded Signup process.',
      );
    }

    const targetWabaId = dto.wabaId || wabaIds[0];

    const existing = await this.prisma.developerWhatsappAccount.findUnique({
      where: { wabaId: targetWabaId },
      include: { phoneNumbers: true },
    });

    if (existing) {
      if (existing.status === 'DISCONNECTED') {
        await this.prisma.developerWhatsappAccount.delete({
          where: { id: existing.id },
        });
        this.logger.log(
          `Deleted disconnected WABA ${targetWabaId} to allow reconnection`,
        );
      } else if (
        existing.userId === userId &&
        existing.developerAppId === app.id
      ) {
        return this.finalizeConnection({
          userId,
          accountId: existing.id,
          wabaId: targetWabaId,
          accessToken,
          preferredPhoneNumberId: dto.phoneNumberId,
          pin: dto.pin,
          reconnect: true,
        });
      } else if (existing.userId === userId) {
        throw new ConflictException(
          'This WABA is already connected to another app in your account',
        );
      } else {
        throw new ConflictException(
          'This WABA is connected to another developer account',
        );
      }
    }

    const wabaInfo = await this.metaApi.getWabaInfo(targetWabaId, accessToken);
    const ownerBusinessId = this.metaApi.extractOwnerBusinessId(wabaInfo);
    const encryptedToken = this.tokenEncryption.encrypt(accessToken);

    const account = await this.prisma.developerWhatsappAccount.create({
      data: {
        userId,
        developerAppId: app.id,
        wabaId: targetWabaId,
        businessName: wabaInfo.name,
        businessId: ownerBusinessId,
        currency: wabaInfo.currency || 'USD',
        timezoneId: wabaInfo.timezone_id || 'Asia/Baghdad',
        status: 'ACTIVE',
        accessTokenEncrypted: encryptedToken,
        connectedAt: new Date(),
        webhookSubscribed: false,
        metadata: {
          onboarding: {
            paymentMethodRequired: true,
            paymentHelpUrl: PAYMENT_HELP_URL,
            whatsappManagerUrl: WHATSAPP_MANAGER_URL,
          },
        },
      },
    });

    return this.finalizeConnection({
      userId,
      accountId: account.id,
      wabaId: targetWabaId,
      accessToken,
      preferredPhoneNumberId: dto.phoneNumberId,
      pin: dto.pin,
      reconnect: false,
    });
  }

  private async finalizeConnection(params: {
    userId: string;
    accountId: string;
    wabaId: string;
    accessToken: string;
    preferredPhoneNumberId?: string;
    pin?: string;
    reconnect: boolean;
  }) {
    const {
      userId,
      accountId,
      wabaId,
      accessToken,
      preferredPhoneNumberId,
      pin,
      reconnect,
    } = params;

    if (reconnect) {
      const encryptedToken = this.tokenEncryption.encrypt(accessToken);
      const wabaInfo = await this.metaApi.getWabaInfo(wabaId, accessToken);
      const ownerBusinessId = this.metaApi.extractOwnerBusinessId(wabaInfo);

      await this.prisma.developerWhatsappAccount.update({
        where: { id: accountId },
        data: {
          accessTokenEncrypted: encryptedToken,
          status: 'ACTIVE',
          connectedAt: new Date(),
          disconnectedAt: null,
          businessName: wabaInfo.name ?? undefined,
          businessId: ownerBusinessId ?? undefined,
          currency: wabaInfo.currency || undefined,
          timezoneId: wabaInfo.timezone_id || undefined,
        },
      });
    }

    await this.syncPhoneNumbers(accountId, wabaId, accessToken);

    let webhookSubscribed = false;
    try {
      await this.metaApi.subscribeToWebhooks(wabaId, accessToken);
      webhookSubscribed = true;
      await this.prisma.developerWhatsappAccount.update({
        where: { id: accountId },
        data: { webhookSubscribed: true },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to subscribe to webhooks for WABA ${wabaId}: ${error.message}`,
      );
    }

    const registrationPins = await this.registerConnectedPhones({
      accountId,
      accessToken,
      preferredPhoneNumberId,
      pin,
    });

    await this.mergeAccountMetadata(accountId, {
      onboarding: {
        paymentMethodRequired: true,
        paymentHelpUrl: PAYMENT_HELP_URL,
        whatsappManagerUrl: WHATSAPP_MANAGER_URL,
        completedAt: new Date().toISOString(),
      },
      registrationPinCiphertexts: Object.fromEntries(
        registrationPins
          .filter((r) => r.registered || r.alreadyRegistered)
          .map((r) => [
            r.phoneNumberId,
            this.tokenEncryption.encrypt(r.pin),
          ]),
      ),
    });

    this.logger.log(`WABA ${wabaId} connected for user ${userId}`);

    const account = await this.prisma.developerWhatsappAccount.findUnique({
      where: { id: accountId },
      include: { phoneNumbers: true },
    });

    if (!account) {
      throw new NotFoundException('WABA account not found');
    }

    const { metadata: _metadata, accessTokenEncrypted: _token, ...safe } =
      account;

    return {
      ...safe,
      onboarding: {
        webhookSubscribed,
        paymentMethodRequired: true,
        paymentHelpUrl: PAYMENT_HELP_URL,
        whatsappManagerUrl: WHATSAPP_MANAGER_URL,
        nextSteps: [
          ...(registrationPins.some((r) => !r.registered && !r.alreadyRegistered)
            ? (['register_phone'] as const)
            : []),
          'add_payment_method',
          'save_two_step_pin',
        ],
      },
      // Returned once so the developer can store the two-step PIN securely.
      registrationPins,
    };
  }

  private async registerConnectedPhones(params: {
    accountId: string;
    accessToken: string;
    preferredPhoneNumberId?: string;
    pin?: string;
  }): Promise<PhoneRegistrationResult[]> {
    const phones = await this.prisma.developerPhoneNumber.findMany({
      where: { accountId: params.accountId },
      orderBy: { createdAt: 'asc' },
    });

    if (phones.length === 0) {
      return [];
    }

    const ordered = [...phones].sort((a, b) => {
      if (params.preferredPhoneNumberId) {
        if (a.phoneNumberId === params.preferredPhoneNumberId) return -1;
        if (b.phoneNumberId === params.preferredPhoneNumberId) return 1;
      }
      return 0;
    });

    const results: PhoneRegistrationResult[] = [];

    for (const phone of ordered) {
      if (phone.status === 'ACTIVE' || phone.status === 'VERIFIED') {
        results.push({
          phoneNumberId: phone.phoneNumberId,
          phoneId: phone.phoneId,
          displayPhoneNumber: phone.displayPhoneNumber,
          pin: '',
          registered: true,
          alreadyRegistered: true,
        });
        continue;
      }

      const pin = params.pin || this.generateTwoStepPin();

      try {
        await this.metaApi.registerPhoneNumber(
          phone.phoneNumberId,
          params.accessToken,
          pin,
        );

        await this.prisma.developerPhoneNumber.update({
          where: { id: phone.id },
          data: { status: 'ACTIVE' },
        });

        results.push({
          phoneNumberId: phone.phoneNumberId,
          phoneId: phone.phoneId,
          displayPhoneNumber: phone.displayPhoneNumber,
          pin,
          registered: true,
        });
      } catch (error) {
        const message =
          error.response?.data?.error?.message || error.message || '';
        const alreadyRegistered = /already registered|already been registered/i.test(
          message,
        );

        if (alreadyRegistered) {
          await this.prisma.developerPhoneNumber.update({
            where: { id: phone.id },
            data: { status: 'ACTIVE' },
          });
          results.push({
            phoneNumberId: phone.phoneNumberId,
            phoneId: phone.phoneId,
            displayPhoneNumber: phone.displayPhoneNumber,
            pin,
            registered: true,
            alreadyRegistered: true,
          });
          continue;
        }

        this.logger.warn(
          `Failed to register phone ${phone.phoneNumberId}: ${message}`,
        );
        results.push({
          phoneNumberId: phone.phoneNumberId,
          phoneId: phone.phoneId,
          displayPhoneNumber: phone.displayPhoneNumber,
          pin,
          registered: false,
          error: message,
        });
      }
    }

    return results;
  }

  private generateTwoStepPin(): string {
    return String(randomInt(100000, 1000000));
  }

  private async mergeAccountMetadata(
    accountId: string,
    patch: Record<string, unknown>,
  ) {
    const existing = await this.prisma.developerWhatsappAccount.findUnique({
      where: { id: accountId },
      select: { metadata: true },
    });

    const current =
      existing?.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    await this.prisma.developerWhatsappAccount.update({
      where: { id: accountId },
      data: {
        metadata: {
          ...current,
          ...patch,
          onboarding: {
            ...((current.onboarding as object) || {}),
            ...((patch.onboarding as object) || {}),
          },
        },
      },
    });
  }

  /**
   * قائمة حسابات WABA
   */
  async findAll(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const accounts = await this.prisma.developerWhatsappAccount.findMany({
      where: {
        userId,
        developerAppId: app.id,
      },
      include: {
        phoneNumbers: {
          select: {
            id: true,
            phoneId: true,
            phoneNumber: true,
            phoneNumberId: true,
            displayPhoneNumber: true,
            verifiedName: true,
            qualityRating: true,
            messagingLimit: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => {
      const metadata =
        account.metadata &&
        typeof account.metadata === 'object' &&
        !Array.isArray(account.metadata)
          ? (account.metadata as Record<string, unknown>)
          : {};
      const onboardingMeta =
        metadata.onboarding && typeof metadata.onboarding === 'object'
          ? (metadata.onboarding as Record<string, unknown>)
          : {};

      const { metadata: _metadata, accessTokenEncrypted: _token, ...safe } =
        account;

      return {
        ...safe,
        businessId: account.businessId,
        onboarding: {
          paymentMethodRequired:
            onboardingMeta.paymentMethodRequired !== false,
          paymentHelpUrl:
            (onboardingMeta.paymentHelpUrl as string) || PAYMENT_HELP_URL,
          whatsappManagerUrl:
            (onboardingMeta.whatsappManagerUrl as string) ||
            WHATSAPP_MANAGER_URL,
        },
      };
    });
  }

  /**
   * فك ارتباط حساب WABA
   */
  async disconnect(userId: string, appId: string, accountId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const account = await this.prisma.developerWhatsappAccount.findFirst({
      where: {
        id: accountId,
        userId,
        developerAppId: app.id,
      },
    });

    if (!account) throw new NotFoundException('WABA account not found');

    await this.prisma.developerWhatsappAccount.update({
      where: { id: accountId },
      data: {
        status: 'DISCONNECTED',
        disconnectedAt: new Date(),
        accessTokenEncrypted: null,
      },
    });

    this.logger.log(`WABA ${account.wabaId} disconnected for user ${userId}`);

    return { success: true };
  }

  /**
   * تحديث حالة WABA (مزامنة مع Meta)
   */
  async refresh(userId: string, appId: string, accountId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const account = await this.prisma.developerWhatsappAccount.findFirst({
      where: {
        id: accountId,
        userId,
        developerAppId: app.id,
      },
    });

    if (!account) throw new NotFoundException('WABA account not found');
    if (!account.accessTokenEncrypted) {
      throw new BadRequestException(
        'Account is disconnected. Please reconnect.',
      );
    }

    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    const wabaInfo = await this.metaApi.getWabaInfo(
      account.wabaId,
      accessToken,
    );
    const ownerBusinessId = this.metaApi.extractOwnerBusinessId(wabaInfo);

    await this.prisma.developerWhatsappAccount.update({
      where: { id: accountId },
      data: {
        businessName: wabaInfo.name ?? undefined,
        businessId: ownerBusinessId ?? account.businessId,
        currency: wabaInfo.currency || undefined,
        timezoneId: wabaInfo.timezone_id || undefined,
      },
    });

    await this.syncPhoneNumbers(accountId, account.wabaId, accessToken);

    return this.prisma.developerWhatsappAccount.findUnique({
      where: { id: accountId },
      include: { phoneNumbers: true },
    });
  }

  private async generateUniquePhoneId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const phoneId = generateNumericPublicId();
      const exists = await this.prisma.developerPhoneNumber.findUnique({
        where: { phoneId },
        select: { id: true },
      });
      if (!exists) return phoneId;
    }
    throw new BadRequestException('Failed to generate phone id');
  }

  private async syncPhoneNumbers(
    accountId: string,
    wabaId: string,
    accessToken: string,
  ) {
    try {
      const phoneData = await this.metaApi.getPhoneNumbers(wabaId, accessToken);

      for (const phone of phoneData.data || []) {
        const existingPhone = await this.prisma.developerPhoneNumber.findUnique({
          where: { phoneNumberId: phone.id },
          select: { id: true, phoneId: true },
        });

        const phoneId =
          existingPhone?.phoneId ?? (await this.generateUniquePhoneId());

        await this.prisma.developerPhoneNumber.upsert({
          where: { phoneNumberId: phone.id },
          update: {
            accountId,
            phoneNumber:
              phone.display_phone_number?.replace(/[\s\-]/g, '') || '',
            displayPhoneNumber: phone.display_phone_number,
            verifiedName: phone.verified_name,
            qualityRating: this.mapQualityRating(phone.quality_rating),
            messagingLimit: phone.messaging_limit_tier,
            // Do not treat Meta "CONNECTED" as Cloud API registered — register() sets ACTIVE.
            ...(phone.status === 'BANNED' || phone.status === 'DISABLED'
              ? { status: 'DISABLED' as const }
              : {}),
            nameStatus: phone.name_status,
            isOfficialBusinessAccount:
              phone.is_official_business_account || false,
            platformType: phone.platform_type,
            codeVerificationStatus: phone.code_verification_status,
            ...(existingPhone?.phoneId ? {} : { phoneId }),
          },
          create: {
            phoneId,
            accountId,
            phoneNumber:
              phone.display_phone_number?.replace(/[\s\-]/g, '') || '',
            displayPhoneNumber: phone.display_phone_number,
            verifiedName: phone.verified_name,
            phoneNumberId: phone.id,
            qualityRating: this.mapQualityRating(phone.quality_rating),
            messagingLimit: phone.messaging_limit_tier,
            status: 'PENDING',
            nameStatus: phone.name_status,
            isOfficialBusinessAccount:
              phone.is_official_business_account || false,
            platformType: phone.platform_type,
            codeVerificationStatus: phone.code_verification_status,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to sync phone numbers for WABA ${wabaId}: ${error.message}`,
      );
    }
  }

  /**
   * فك تشفير access token لحساب WABA
   */
  async getDecryptedToken(accountId: string): Promise<string> {
    const account = await this.prisma.developerWhatsappAccount.findUnique({
      where: { id: accountId },
      select: { accessTokenEncrypted: true, status: true },
    });

    if (
      !account ||
      !account.accessTokenEncrypted ||
      account.status !== 'ACTIVE'
    ) {
      throw new BadRequestException('WABA account is not available');
    }

    return this.tokenEncryption.decrypt(account.accessTokenEncrypted);
  }

  /**
   * الحصول على Embedded Signup config
   */
  getEmbeddedSignupConfig() {
    const appId = this.configService.get<string>('WHATSAPP_APP_ID')?.trim();
    const configId = this.configService.get<string>('WHATSAPP_CONFIG_ID')?.trim();

    if (!appId || !configId) {
      throw new BadRequestException(
        'WhatsApp Embedded Signup is not configured. Set WHATSAPP_APP_ID and WHATSAPP_CONFIG_ID on the API server.',
      );
    }

    return {
      appId,
      configId,
      graphApiVersion:
        this.configService.get('WHATSAPP_GRAPH_API_VERSION', 'v25.0') ||
        'v25.0',
      paymentHelpUrl: PAYMENT_HELP_URL,
      whatsappManagerUrl: WHATSAPP_MANAGER_URL,
    };
  }

  private mapQualityRating(rating: string): any {
    const map: Record<string, string> = {
      GREEN: 'GREEN',
      YELLOW: 'YELLOW',
      RED: 'RED',
    };
    return map[rating] || 'UNKNOWN';
  }
}
