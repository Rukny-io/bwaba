import { Module } from '@nestjs/common';

/**
 * Shared checkout domain utilities (session types, assertions).
 * Guards remain in core/common/guards/auth for global availability.
 */
@Module({})
export class CheckoutModule {}

export * from './checkout-session.types';
export * from './checkout-session.util';
