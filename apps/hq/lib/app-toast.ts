import { toast } from '@heroui/react';
import { ApiException } from '@/lib/api-client';

type ToastOptions = {
  description?: string;
};

export const appToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, options);
  },

  error(message: string, options?: ToastOptions) {
    return toast.danger(message, options);
  },

  info(message: string, options?: ToastOptions) {
    return toast.info(message, options);
  },

  fromError(error: unknown, fallback = 'An unexpected error occurred') {
    if (error instanceof ApiException && error.statusCode === 401) {
      return;
    }
    const message = getApiErrorMessage(error, fallback);
    return toast.danger(message);
  },
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
): string {
  if (error instanceof ApiException && error.message.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
