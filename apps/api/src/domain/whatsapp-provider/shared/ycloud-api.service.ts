import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export type YCloudBindResult = {
  attempted: boolean;
  success: boolean;
  paymentMethodAttached: boolean;
  error?: string;
  raw?: Record<string, unknown>;
};

/**
 * YCloud Tech Partner API — credit-line bind after Embedded Signup.
 * Docs: https://helpdocs.ycloud.com/partner-center/.../embedded-signup
 */
@Injectable()
export class YCloudApiService {
  private readonly logger = new Logger(YCloudApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('YCLOUD_API_BASE_URL')?.trim() ||
      'https://api.ycloud.com';
    this.apiKey = this.configService.get<string>('YCLOUD_API_KEY')?.trim() || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: `${this.baseUrl.replace(/\/$/, '')}/v2`,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  /**
   * Attach YCloud credit line to a WABA onboarded via Multi-Partner Solution.
   * POST /v2/whatsapp/businessAccounts/{wabaId}/tp/bind
   */
  async bindTechProviderWaba(wabaId: string): Promise<YCloudBindResult> {
    if (!this.isConfigured()) {
      return {
        attempted: false,
        success: false,
        paymentMethodAttached: false,
        error: 'YCLOUD_API_KEY is not configured',
      };
    }

    try {
      const client = this.createClient();
      const response = await client.post(
        `/whatsapp/businessAccounts/${encodeURIComponent(wabaId)}/tp/bind`,
      );
      const data = (response.data || {}) as Record<string, unknown>;
      const paymentMethodAttached = data.paymentMethodAttached === true;

      this.logger.log(
        `YCloud tp/bind ok for WABA ${wabaId} (paymentMethodAttached=${paymentMethodAttached})`,
      );

      return {
        attempted: true,
        success: true,
        paymentMethodAttached,
        raw: data,
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'YCloud bind failed';
      this.logger.error(
        `YCloud tp/bind failed for WABA ${wabaId}: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );
      return {
        attempted: true,
        success: false,
        paymentMethodAttached: false,
        error: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }
  }

  /**
   * Register a phone on YCloud after bind (optional but recommended).
   * POST /v2/whatsapp/phoneNumbers/{wabaId}/{phoneNumberId}/register
   */
  async registerPhoneNumber(
    wabaId: string,
    phoneNumberId: string,
  ): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const client = this.createClient();
      await client.post(
        `/whatsapp/phoneNumbers/${encodeURIComponent(wabaId)}/${encodeURIComponent(phoneNumberId)}/register`,
      );
      this.logger.log(
        `YCloud phone register ok: ${phoneNumberId} on WABA ${wabaId}`,
      );
      return true;
    } catch (error: any) {
      this.logger.warn(
        `YCloud phone register failed for ${phoneNumberId}: ${error?.response?.data?.message || error?.message}`,
      );
      return false;
    }
  }
}
