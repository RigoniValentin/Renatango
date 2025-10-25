import { VideoPurchaseModel, IVideoPurchase } from "@models/VideoPurchase";
import {
  IVideoPurchaseRepository,
  VideoPurchase,
} from "types/VideoPurchaseTypes";

export class VideoPurchaseRepository implements IVideoPurchaseRepository {
  async createPurchase(
    purchase: Partial<VideoPurchase>
  ): Promise<IVideoPurchase> {
    try {
      const newPurchase = new VideoPurchaseModel(purchase);
      return await newPurchase.save();
    } catch (error) {
      console.error("Error creating purchase:", error);
      throw error;
    }
  }

  async findPurchaseById(id: string): Promise<IVideoPurchase | null> {
    try {
      return await VideoPurchaseModel.findById(id);
    } catch (error) {
      console.error("Error finding purchase by id:", error);
      throw error;
    }
  }

  async findPurchasesByUserId(userId: string): Promise<IVideoPurchase[]> {
    try {
      return await VideoPurchaseModel.find({ userId, status: "completed" });
    } catch (error) {
      console.error("Error finding purchases by user id:", error);
      throw error;
    }
  }

  async findPurchaseByPaymentId(
    paymentId: string
  ): Promise<IVideoPurchase | null> {
    try {
      return await VideoPurchaseModel.findOne({ paymentId });
    } catch (error) {
      console.error("Error finding purchase by payment id:", error);
      throw error;
    }
  }

  async updatePurchaseStatus(
    paymentId: string,
    status: "pending" | "completed" | "failed" | "refunded"
  ): Promise<IVideoPurchase | null> {
    try {
      return await VideoPurchaseModel.findOneAndUpdate(
        { paymentId },
        { status },
        { new: true }
      );
    } catch (error) {
      console.error("Error updating purchase status:", error);
      throw error;
    }
  }

  async getUserVideoAccess(userId: string): Promise<string[]> {
    try {
      const purchases = await VideoPurchaseModel.find({
        userId,
        status: "completed",
      });

      console.log(
        "📚 All user purchases:",
        purchases.map((p) => ({
          id: p._id,
          type: p.purchaseType,
          moduleId: p.moduleId,
          videoIds: p.videoIds,
          status: p.status,
        }))
      );

      // Extraer todos los videoIds de todas las compras completadas
      const videoIds = purchases.reduce((acc: string[], purchase) => {
        return [...acc, ...purchase.videoIds];
      }, []);

      // Eliminar duplicados
      const uniqueVideoIds = [...new Set(videoIds)];

      console.log("🎥 User has access to videos:", uniqueVideoIds);

      return uniqueVideoIds;
    } catch (error) {
      console.error("Error getting user video access:", error);
      throw error;
    }
  }

  async hasAccessToVideo(userId: string, videoId: string): Promise<boolean> {
    try {
      const purchase = await VideoPurchaseModel.findOne({
        userId,
        videoIds: videoId,
        status: "completed",
      });

      return !!purchase;
    } catch (error) {
      console.error("Error checking video access:", error);
      throw error;
    }
  }

  async hasAccessToModule(userId: string, moduleId: string): Promise<boolean> {
    try {
      console.log("🔍 Checking module access:", { userId, moduleId });

      const purchase = await VideoPurchaseModel.findOne({
        userId,
        moduleId,
        purchaseType: "module",
        status: "completed",
      });

      console.log(
        "📦 Module purchase found:",
        purchase
          ? {
              id: purchase._id,
              moduleId: purchase.moduleId,
              purchaseType: purchase.purchaseType,
              status: purchase.status,
              videoIds: purchase.videoIds,
            }
          : "NO PURCHASE FOUND"
      );

      return !!purchase;
    } catch (error) {
      console.error("Error checking module access:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los módulos a los que un usuario tiene acceso
   * (ya sea por compra de módulo completo o por compra de videos individuales)
   */
  async getUserModuleAccess(userId: string): Promise<string[]> {
    try {
      const purchases = await VideoPurchaseModel.find({
        userId,
        status: "completed",
        moduleId: { $exists: true, $ne: null },
      });

      // Extraer todos los moduleIds únicos
      const moduleIds = purchases
        .map((purchase) => purchase.moduleId)
        .filter((id): id is string => !!id);

      return [...new Set(moduleIds)];
    } catch (error) {
      console.error("Error getting user module access:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las compras de videos individuales de un usuario por módulo
   */
  async getUserVideosByModule(
    userId: string,
    moduleId: string
  ): Promise<string[]> {
    try {
      const purchases = await VideoPurchaseModel.find({
        userId,
        moduleId,
        status: "completed",
      });

      // Extraer todos los videoIds únicos
      const videoIds = purchases.reduce((acc: string[], purchase) => {
        return [...acc, ...purchase.videoIds];
      }, []);

      return [...new Set(videoIds)];
    } catch (error) {
      console.error("Error getting user videos by module:", error);
      throw error;
    }
  }

  /**
   * Obtiene información detallada de las compras de un usuario agrupadas por módulo
   */
  async getUserPurchasesSummary(userId: string): Promise<{
    modulesPurchased: string[];
    videosByModule: Record<string, string[]>;
    totalVideosAccess: string[];
  }> {
    try {
      const purchases = await VideoPurchaseModel.find({
        userId,
        status: "completed",
      });

      const modulesPurchased: string[] = [];
      const videosByModule: Record<string, string[]> = {};
      const allVideoIds: string[] = [];

      purchases.forEach((purchase) => {
        // Agregar videos al total
        allVideoIds.push(...purchase.videoIds);

        if (purchase.moduleId) {
          // Agregar videos al módulo específico
          if (!videosByModule[purchase.moduleId]) {
            videosByModule[purchase.moduleId] = [];
          }
          videosByModule[purchase.moduleId].push(...purchase.videoIds);

          // Si es compra de módulo completo, agregarlo a la lista
          if (purchase.purchaseType === "module") {
            modulesPurchased.push(purchase.moduleId);
          }
        }
      });

      return {
        modulesPurchased: [...new Set(modulesPurchased)],
        videosByModule: Object.fromEntries(
          Object.entries(videosByModule).map(([moduleId, videos]) => [
            moduleId,
            [...new Set(videos)],
          ])
        ),
        totalVideosAccess: [...new Set(allVideoIds)],
      };
    } catch (error) {
      console.error("Error getting user purchases summary:", error);
      throw error;
    }
  }
}
