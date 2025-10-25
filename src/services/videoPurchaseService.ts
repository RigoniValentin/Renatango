import {
  IVideoPurchaseRepository,
  IVideoPurchaseService,
  VideoPurchase,
} from "types/VideoPurchaseTypes";
import { IVideoPurchase } from "@models/VideoPurchase";

export class VideoPurchaseService implements IVideoPurchaseService {
  private repository: IVideoPurchaseRepository;

  constructor(repository: IVideoPurchaseRepository) {
    this.repository = repository;
  }

  async createPurchase(
    purchase: Partial<VideoPurchase>
  ): Promise<IVideoPurchase> {
    return this.repository.createPurchase(purchase);
  }

  async findPurchaseById(id: string): Promise<IVideoPurchase | null> {
    return this.repository.findPurchaseById(id);
  }

  async findPurchasesByUserId(userId: string): Promise<IVideoPurchase[]> {
    return this.repository.findPurchasesByUserId(userId);
  }

  async findPurchaseByPaymentId(
    paymentId: string
  ): Promise<IVideoPurchase | null> {
    return this.repository.findPurchaseByPaymentId(paymentId);
  }

  async updatePurchaseStatus(
    paymentId: string,
    status: "pending" | "completed" | "failed" | "refunded"
  ): Promise<IVideoPurchase | null> {
    return this.repository.updatePurchaseStatus(paymentId, status);
  }

  async getUserVideoAccess(userId: string): Promise<string[]> {
    return this.repository.getUserVideoAccess(userId);
  }

  async hasAccessToVideo(userId: string, videoId: string): Promise<boolean> {
    return this.repository.hasAccessToVideo(userId, videoId);
  }

  async hasAccessToModule(userId: string, moduleId: string): Promise<boolean> {
    return this.repository.hasAccessToModule(userId, moduleId);
  }

  async getUserModuleAccess(userId: string): Promise<string[]> {
    return this.repository.getUserModuleAccess(userId);
  }

  async getUserVideosByModule(
    userId: string,
    moduleId: string
  ): Promise<string[]> {
    return this.repository.getUserVideosByModule(userId, moduleId);
  }

  async getUserPurchasesSummary(userId: string): Promise<{
    modulesPurchased: string[];
    videosByModule: Record<string, string[]>;
    totalVideosAccess: string[];
  }> {
    return this.repository.getUserPurchasesSummary(userId);
  }
}
