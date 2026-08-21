import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { RedisService } from '../../core/cache/redis.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';

/**
 * 🔐 Session Fingerprinting Service
 *
 * تتبع الجلسات باستخدام بصمة الجهاز/المتصفح
 * للكشف عن سرقة الجلسات أو الاستخدام غير المصرح
 */
@Injectable()
export class SessionFingerprintService {
  private readonly logger = new Logger(SessionFingerprintService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * إنشاء بصمة للجهاز/المتصفح
   */
  generateFingerprint(data: {
    userAgent: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    screenResolution?: string;
    timezone?: string;
    platform?: string;
    plugins?: string;
    canvas?: string;
    webgl?: string;
    fonts?: string;
  }): string {
    // تجميع البيانات الثابتة
    const fingerprintData = [
      data.userAgent || '',
      data.acceptLanguage || '',
      data.platform || '',
      data.timezone || '',
      data.screenResolution || '',
      // بيانات إضافية من المتصفح
      data.plugins || '',
      data.canvas || '',
      data.webgl || '',
      data.fonts || '',
    ].join('|');

    // إنشاء hash
    return createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * إنشاء بصمة مبسطة من headers HTTP
   *
   * يعتمد على حقول مستقرة عبر أنواع الطلبات (GET/POST) ومسارات BFF:
   * User-Agent و Accept-Language و x-client-fingerprint فقط.
   * لا نستخدم sec-ch-ua* لأن المتصفح لا يرسلها بشكل متسق على كل fetch.
   */
  generateSimpleFingerprint(headers: {
    'user-agent'?: string;
    'accept-language'?: string;
    'accept-encoding'?: string;
    'sec-ch-ua'?: string;
    'sec-ch-ua-platform'?: string;
    'sec-ch-ua-mobile'?: string;
    'x-client-fingerprint'?: string;
  }): string {
    const data = [
      headers['user-agent'] || '',
      headers['accept-language'] || '',
      headers['x-client-fingerprint'] || '',
    ].join('|');

    return createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /** Stable slice of the fingerprint (language + client id) — ignores UA churn. */
  private stableComponents(headers: {
    'accept-language'?: string;
    'x-client-fingerprint'?: string;
  }): { acceptLanguage: string; clientFp: string; stableHash: string } {
    const acceptLanguage = headers['accept-language'] || '';
    const clientFp = headers['x-client-fingerprint'] || '';
    const stableHash = createHash('sha256')
      .update(`${acceptLanguage}|${clientFp}`)
      .digest('hex')
      .substring(0, 32);
    return { acceptLanguage, clientFp, stableHash };
  }

  /**
   * ربط بصمة بجلسة
   */
  async bindFingerprintToSession(
    sessionId: string,
    fingerprint: string,
    userId: string,
    headers?: {
      'user-agent'?: string;
      'accept-language'?: string;
      'x-client-fingerprint'?: string;
    },
  ): Promise<void> {
    const key = `session:fingerprint:${sessionId}`;
    const stable = this.stableComponents(headers || {});

    await this.redis.hmset(key, {
      fingerprint,
      userId,
      acceptLanguage: stable.acceptLanguage,
      clientFp: stable.clientFp,
      stableHash: stable.stableHash,
      userAgent: headers?.['user-agent'] || '',
      createdAt: Date.now().toString(),
      lastVerified: Date.now().toString(),
    });

    // انتهاء مع الجلسة (7 أيام)
    await this.redis.expire(key, 604800);

    this.logger.debug(
      `Fingerprint bound to session ${sessionId.substring(0, 8)}...`,
    );
  }

  /**
   * التحقق من بصمة الجلسة
   */
  async verifySessionFingerprint(
    sessionId: string,
    currentFingerprint: string,
    headers?: {
      'user-agent'?: string;
      'accept-language'?: string;
      'x-client-fingerprint'?: string;
    },
  ): Promise<{
    valid: boolean;
    mismatch: boolean;
    /** UA (or similar) changed but stable components still match — rebind, don't revoke. */
    softMismatch: boolean;
    confidence: number;
    hadStored: boolean;
  }> {
    const key = `session:fingerprint:${sessionId}`;
    const stored = await this.redis.hgetall(key);

    if (!stored || !stored.fingerprint) {
      // 🔒 F-01: لا توجد بصمة مخزنة — نُبلغ المتصل ليطبّق Trust-On-First-Use
      return {
        valid: true,
        mismatch: false,
        softMismatch: false,
        confidence: 50,
        hadStored: false,
      };
    }

    const storedFingerprint = stored.fingerprint;

    // تطابق تام
    if (storedFingerprint === currentFingerprint) {
      await this.redis.hset(key, 'lastVerified', Date.now().toString());
      return {
        valid: true,
        mismatch: false,
        softMismatch: false,
        confidence: 100,
        hadStored: true,
      };
    }

    // حساب نسبة التشابه
    const similarity = this.calculateSimilarity(
      storedFingerprint,
      currentFingerprint,
    );

    // إذا كان التشابه عالياً (>80%) - قد يكون تحديث متصفح
    if (similarity > 80) {
      this.logger.debug(
        `Fingerprint slightly changed (${similarity}% similar)`,
      );
      return {
        valid: true,
        mismatch: false,
        softMismatch: false,
        confidence: similarity,
        hadStored: true,
      };
    }

    // UA churn (DevTools mobile, Brave, desktop↔phone) with same locale/client id.
    // Rebind instead of treating as session theft.
    const currentStable = this.stableComponents(headers || {});
    const hasStableMeta = Boolean(
      stored.stableHash || stored.acceptLanguage || stored.clientFp,
    );
    const storedStable =
      stored.stableHash ||
      this.stableComponents({
        'accept-language': stored.acceptLanguage,
        'x-client-fingerprint': stored.clientFp,
      }).stableHash;

    if (!hasStableMeta) {
      // Legacy Redis records (pre-component storage): upgrade by rebinding once.
      this.logger.warn(
        `Fingerprint legacy upgrade for session ${sessionId.substring(0, 8)} — will rebind`,
      );
      return {
        valid: true,
        mismatch: true,
        softMismatch: true,
        confidence: similarity,
        hadStored: true,
      };
    }

    if (
      storedStable &&
      currentStable.stableHash === storedStable &&
      // Require at least one stable signal so empty||empty cannot soft-match forever.
      (currentStable.acceptLanguage !== '' || currentStable.clientFp !== '')
    ) {
      this.logger.warn(
        `Fingerprint soft mismatch (UA churn) for session ${sessionId.substring(0, 8)} — will rebind`,
      );
      return {
        valid: true,
        mismatch: true,
        softMismatch: true,
        confidence: similarity,
        hadStored: true,
      };
    }

    // تغيير كبير - محتمل سرقة جلسة
    this.logger.warn(
      `Fingerprint mismatch detected for session ${sessionId.substring(0, 8)}`,
    );
    return {
      valid: false,
      mismatch: true,
      softMismatch: false,
      confidence: similarity,
      hadStored: true,
    };
  }

  /**
   * حساب نسبة التشابه بين بصمتين
   */
  private calculateSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 100;
    if (!fp1 || !fp2) return 0;

    let matches = 0;
    const minLength = Math.min(fp1.length, fp2.length);

    for (let i = 0; i < minLength; i++) {
      if (fp1[i] === fp2[i]) matches++;
    }

    return Math.round((matches / Math.max(fp1.length, fp2.length)) * 100);
  }

  /**
   * إزالة بصمة الجلسة
   */
  async removeSessionFingerprint(sessionId: string): Promise<void> {
    await this.redis.del(`session:fingerprint:${sessionId}`);
  }

  /**
   * الحصول على جميع البصمات لمستخدم
   */
  async getUserFingerprints(userId: string): Promise<
    {
      fingerprint: string;
      firstSeen: Date;
      lastSeen: Date;
      sessionCount: number;
    }[]
  > {
    const key = `user:fingerprints:${userId}`;
    const fingerprints = await this.redis.hgetall(key);

    if (!fingerprints) return [];

    return Object.entries(fingerprints).map(([fp, data]) => {
      const parsed = JSON.parse(data);
      return {
        fingerprint: fp,
        firstSeen: new Date(parsed.firstSeen),
        lastSeen: new Date(parsed.lastSeen),
        sessionCount: parsed.count,
      };
    });
  }

  /**
   * تسجيل بصمة لمستخدم
   */
  async recordUserFingerprint(
    userId: string,
    fingerprint: string,
  ): Promise<void> {
    const key = `user:fingerprints:${userId}`;
    const existing = await this.redis.hget(key, fingerprint);

    if (existing) {
      const data = JSON.parse(existing);
      data.lastSeen = Date.now();
      data.count = (data.count || 0) + 1;
      await this.redis.hset(key, fingerprint, JSON.stringify(data));
    } else {
      await this.redis.hset(
        key,
        fingerprint,
        JSON.stringify({
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          count: 1,
        }),
      );
    }

    // الاحتفاظ لمدة 90 يوماً
    await this.redis.expire(key, 7776000);
  }

  /**
   * التحقق من أن البصمة معروفة للمستخدم
   */
  async isKnownFingerprint(
    userId: string,
    fingerprint: string,
  ): Promise<boolean> {
    const key = `user:fingerprints:${userId}`;
    const exists = await this.redis.hexists(key, fingerprint);
    return exists === 1;
  }

  /**
   * إنشاء token للتحقق من الجهاز
   */
  async createDeviceVerificationToken(
    userId: string,
    fingerprint: string,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const key = `device:verify:${token}`;

    await this.redis.hmset(key, {
      userId,
      fingerprint,
      createdAt: Date.now().toString(),
    });

    await this.redis.expire(key, 3600); // ساعة

    return token;
  }

  /**
   * التحقق من token الجهاز
   */
  async verifyDeviceToken(
    token: string,
  ): Promise<{ valid: boolean; userId?: string; fingerprint?: string }> {
    const key = `device:verify:${token}`;
    const data = await this.redis.hgetall(key);

    if (!data || !data.userId) {
      return { valid: false };
    }

    // حذف Token بعد الاستخدام
    await this.redis.del(key);

    // تسجيل البصمة كموثوقة
    await this.recordUserFingerprint(data.userId, data.fingerprint);

    return {
      valid: true,
      userId: data.userId,
      fingerprint: data.fingerprint,
    };
  }
}
