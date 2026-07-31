export interface AdminNotificationChannels {
  inApp?: boolean;
  email?: boolean;
  whatsapp?: boolean;
}

export interface AdminNotificationDelivery {
  success: boolean;
  delivered: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  errors: {
    email?: string;
    whatsapp?: string;
  };
}
