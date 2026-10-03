/** @deprecated Import from core/common/constants/crypto.constants */
export { BCRYPT_ROUNDS, OTP_BCRYPT_ROUNDS } from '../../core/common/constants/crypto.constants';

/** Minimum password length */
export const PASSWORD_MIN_LENGTH = 10;

/** Maximum password length (matches input-length pipe) */
export const PASSWORD_MAX_LENGTH = 128;

/** Password reset token TTL */
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;
