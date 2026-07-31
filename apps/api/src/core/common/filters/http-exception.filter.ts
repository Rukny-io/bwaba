import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 🔒 Global Exception Filter
 *
 * يحمي من تسريب معلومات حساسة في Production
 * - يخفي تفاصيل الأخطاء في Production
 * - يسجل جميع الأخطاء للتحليل
 * - يعرض رسائل آمنة للمستخدمين
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // OAuth guards may redirect the browser before Nest throws Forbidden/Unauthorized.
    if (response.headersSent) {
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // الحصول على رسالة الخطأ
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'خطأ داخلي في الخادم' };

    const responseObj =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown>);

    const rawMessage = responseObj.message ?? 'حدث خطأ';
    const message: string | string[] =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.map((item) => String(item))
          : String(rawMessage);
    const businessCode =
      typeof responseObj.code === 'string' ? responseObj.code : undefined;
    const ticketNumber =
      typeof responseObj.ticketNumber === 'string'
        ? responseObj.ticketNumber
        : undefined;

    // 🔒 في Production، إرجاع رسائل عامة فقط (مع استثناء أخطاء الباقة/الحدود)
    const safeMessage = this.isProduction
      ? this.getSafeMessage(status, message, businessCode)
      : message;

    // بناء response آمن
    const requestId =
      (request as any).requestId || request.headers['x-request-id'];
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(safeMessage) ? safeMessage : [safeMessage],
      ...(businessCode ? { code: businessCode } : {}),
      ...(businessCode === 'PHONE_ALREADY_CLAIMED' && ticketNumber
        ? { ticketNumber }
        : {}),
      // 🔒 Request ID للتتبع والدعم الفني
      requestId,
      // 🔒 في Development فقط، إضافة تفاصيل إضافية
      ...(!this.isProduction && {
        error:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // تسجيل الخطأ
    // 🔕 401/403 on auth routes are expected for unauthenticated users - skip logging entirely
    const forwardedFor = request.headers['x-forwarded-for'];
    const firstForwardedIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;

    const logPayload = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: exception instanceof Error ? exception.message : String(exception),
      stack:
        status === HttpStatus.TOO_MANY_REQUESTS
          ? undefined
          : exception instanceof Error
            ? exception.stack
            : undefined,
      user: (request as any).user?.id,
      ip:
        firstForwardedIp ||
        request.ip ||
        request.headers['x-real-ip'] ||
        request.socket.remoteAddress,
      userAgent: request.get('User-Agent'),
    };

    // Skip logging entirely for expected auth failures on auth endpoints
    const isAuthEndpoint = request.url.includes('/auth/');
    const isExpectedAuthFailure =
      (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) &&
      isAuthEndpoint;
    const isExpectedAuthRateLimit =
      status === HttpStatus.TOO_MANY_REQUESTS && isAuthEndpoint;

    if (isExpectedAuthFailure) {
      // Silently skip - these are expected for unauthenticated users
    } else if (isExpectedAuthRateLimit) {
      // Auth throttling is expected under burst traffic; keep logs lightweight
      this.logger.debug(logPayload);
    } else if (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN
    ) {
      // Non-auth endpoint auth failures might be interesting
      this.logger.debug(logPayload);
    } else {
      this.logger.error(logPayload);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * 🔒 إرجاع رسائل آمنة في Production
   */
  private getSafeMessage(
    status: number,
    originalMessage: string | string[],
    code?: string,
  ): string | string[] {
    // رسائل التحقق من الصحة يمكن عرضها
    if (
      status === HttpStatus.BAD_REQUEST ||
      status === HttpStatus.UNPROCESSABLE_ENTITY
    ) {
      return originalMessage;
    }

    const passthroughCodes = new Set([
      'PLAN_REQUIRED',
      'FEATURE_UNAVAILABLE',
      'LIMIT_REACHED',
      'FEATURE_TIER_REQUIRED',
      'INSUFFICIENT_PERMISSION',
      'PHONE_ALREADY_CLAIMED',
    ]);
    if (code && passthroughCodes.has(code)) {
      return originalMessage;
    }

    // رسائل عامة للأنواع الأخرى من الأخطاء
    const safeMessages: Record<number, string> = {
      [HttpStatus.UNAUTHORIZED]: 'مطلوب تسجيل الدخول',
      [HttpStatus.FORBIDDEN]: 'تم رفض الوصول',
      [HttpStatus.NOT_FOUND]: 'المورد غير موجود',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'الطريقة غير مسموح بها',
      [HttpStatus.CONFLICT]: 'حدث تعارض',
      [HttpStatus.TOO_MANY_REQUESTS]:
        'عدد الطلبات كبير جدًا، يرجى المحاولة لاحقًا',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'خطأ داخلي في الخادم',
      [HttpStatus.BAD_GATEWAY]: 'بوابة غير صالحة',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'الخدمة غير متاحة',
    };

    return safeMessages[status] || 'حدث خطأ';
  }
}
