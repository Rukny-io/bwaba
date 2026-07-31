-- Add APP_VERIFICATION to OtpType for developer app phone verification OTPs
ALTER TYPE "OtpType" ADD VALUE IF NOT EXISTS 'APP_VERIFICATION';
