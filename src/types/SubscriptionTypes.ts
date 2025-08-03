export interface SubscriptionInfo {
  hasSubscription: boolean;
  isActive?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  subscription?: {
    transactionId: string;
    paymentDate: Date;
    expirationDate: Date;
    daysRemaining: number;
    daysSincePayment: number;
    paymentMethod: string;
    status: "Activa" | "Por expirar" | "Expirada";
  };
  user?: {
    email: string;
    name: string;
    roles: string[];
  };
  message?: string;
}

export interface SubscriptionStats {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  usagePercentage: number;
}

export interface ExtendSubscriptionRequest {
  email: string;
}

export interface ExtendSubscriptionResponse {
  message: string;
  details: {
    userEmail: string;
    userName: string;
    previousExpirationDate: Date;
    newExpirationDate: Date;
    daysAdded: number;
    extendedBy: {
      adminEmail: string;
      adminName: string;
      timestamp: Date;
    };
  };
}
