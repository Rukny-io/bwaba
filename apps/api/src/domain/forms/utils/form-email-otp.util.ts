import { createHmac, timingSafeEqual } from 'crypto';

function getOtpPepper(): string {
  const pepper = process.env.FORMS_OTP_PEPPER?.trim();
  if (pepper && pepper.length >= 32) {
    return pepper;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FORMS_OTP_PEPPER must be set (min 32 chars) in production. Generate: openssl rand -hex 32',
    );
  }

  const fallback = process.env.JWT_SECRET?.trim();
  if (fallback && fallback.length >= 32) {
    return fallback;
  }

  throw new Error(
    'FORMS_OTP_PEPPER or JWT_SECRET (32+ chars) required for form email OTP',
  );
}

export function hashOtp(code: string, salt: string): string {
  return createHmac('sha256', getOtpPepper())
    .update(`${salt}:${code}`)
    .digest('hex');
}

export function compareOtp(providedCode: string, storedHash: string, salt: string): boolean {
  const providedHash = hashOtp(providedCode, salt);
  
  // Prevent timing attacks
  const a = Buffer.from(providedHash);
  const b = Buffer.from(storedHash);
  
  if (a.length !== b.length) {
    return false;
  }
  
  return timingSafeEqual(a, b);
}
