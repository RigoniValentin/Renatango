import { IVideoPurchase } from "@models/VideoPurchase";

export interface VideoPurchase {
  userId: string;
  purchaseType: "video" | "module";
  itemId: string;
  moduleId?: string;
  videoIds: string[];
  price: number;
  paymentMethod: "paypal" | "mercadopago";
  paymentId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  purchaseDate: Date;
  expirationDate?: Date;
}

export interface IVideoPurchaseRepository {
  createPurchase(purchase: Partial<VideoPurchase>): Promise<IVideoPurchase>;
  findPurchaseById(id: string): Promise<IVideoPurchase | null>;
  findPurchasesByUserId(userId: string): Promise<IVideoPurchase[]>;
  findPurchaseByPaymentId(paymentId: string): Promise<IVideoPurchase | null>;
  updatePurchaseStatus(
    paymentId: string,
    status: "pending" | "completed" | "failed" | "refunded"
  ): Promise<IVideoPurchase | null>;
  getUserVideoAccess(userId: string): Promise<string[]>;
  hasAccessToVideo(userId: string, videoId: string): Promise<boolean>;
  hasAccessToModule(userId: string, moduleId: string): Promise<boolean>;
  getUserModuleAccess(userId: string): Promise<string[]>;
  getUserVideosByModule(userId: string, moduleId: string): Promise<string[]>;
  getUserPurchasesSummary(userId: string): Promise<{
    modulesPurchased: string[];
    videosByModule: Record<string, string[]>;
    totalVideosAccess: string[];
  }>;
}

export interface IVideoPurchaseService {
  createPurchase(purchase: Partial<VideoPurchase>): Promise<IVideoPurchase>;
  findPurchaseById(id: string): Promise<IVideoPurchase | null>;
  findPurchasesByUserId(userId: string): Promise<IVideoPurchase[]>;
  findPurchaseByPaymentId(paymentId: string): Promise<IVideoPurchase | null>;
  updatePurchaseStatus(
    paymentId: string,
    status: "pending" | "completed" | "failed" | "refunded"
  ): Promise<IVideoPurchase | null>;
  getUserVideoAccess(userId: string): Promise<string[]>;
  hasAccessToVideo(userId: string, videoId: string): Promise<boolean>;
  hasAccessToModule(userId: string, moduleId: string): Promise<boolean>;
  getUserModuleAccess(userId: string): Promise<string[]>;
  getUserVideosByModule(userId: string, moduleId: string): Promise<string[]>;
  getUserPurchasesSummary(userId: string): Promise<{
    modulesPurchased: string[];
    videosByModule: Record<string, string[]>;
    totalVideosAccess: string[];
  }>;
}
