import { Request, Response } from "express";
import { ModuleModel } from "@models/Module";
import { VideoModel } from "@models/Video";
import { VideoPurchaseModel } from "@models/VideoPurchase";

/**
 * Calcular el precio del módulo con descuento basado en videos ya comprados
 * GET /api/v1/modules/:moduleId/calculate-price
 */
export const calculateModulePrice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const currentUser = req.currentUser;

    if (!currentUser) {
      res.status(401).json({ message: "Usuario no autenticado" });
      return;
    }

    // Obtener el módulo
    const module = await ModuleModel.findById(moduleId);
    if (!module) {
      res.status(404).json({ message: "Módulo no encontrado" });
      return;
    }

    // Obtener todos los videos del módulo
    const moduleVideos = await VideoModel.find({
      moduleId: moduleId,
      activo: true,
    });

    // Obtener todas las compras completadas del usuario
    const userPurchases = await VideoPurchaseModel.find({
      userId: currentUser._id,
      status: "completed",
    });

    // Extraer todos los videoIds que el usuario ha comprado
    const purchasedVideoIds = userPurchases.flatMap(
      (purchase) => purchase.videoIds
    );

    // Filtrar los videos del módulo que el usuario ya compró
    const purchasedModuleVideos = moduleVideos.filter((video) =>
      purchasedVideoIds.includes(video.videoId)
    );

    // Calcular cuántos videos le faltan por comprar
    const unpurchasedVideosCount =
      moduleVideos.length - purchasedModuleVideos.length;

    // Calcular el precio total si se compran todos los videos individualmente
    const totalIndividualPriceARS = moduleVideos.reduce(
      (sum, video) => sum + (video.precioARS || video.precio),
      0
    );

    const totalIndividualPriceUSD = moduleVideos.reduce(
      (sum, video) => sum + (video.precioUSD || video.precio / 1000),
      0
    );

    // Calcular el total gastado en videos del módulo (ambas monedas)
    const totalSpentOnVideosARS = purchasedModuleVideos.reduce(
      (sum, video) => sum + (video.precioARS || video.precio),
      0
    );

    const totalSpentOnVideosUSD = purchasedModuleVideos.reduce(
      (sum, video) => sum + (video.precioUSD || video.precio / 1000),
      0
    );

    // Calcular el precio final del módulo con descuento (ambas monedas)
    const originalModulePriceARS = module.precioARS || module.precio;
    const originalModulePriceUSD = module.precioUSD || module.precio / 1000;

    const discountedPriceARS = Math.max(
      0,
      originalModulePriceARS - totalSpentOnVideosARS
    );

    const discountedPriceUSD = Math.max(
      0,
      originalModulePriceUSD - totalSpentOnVideosUSD
    );

    // Si el precio con descuento es 0, el usuario ya tiene acceso completo
    const hasFullAccess = discountedPriceARS === 0;

    // Solo permitir compra de módulo completo si quedan 2 o más videos sin comprar
    const canPurchaseModule = unpurchasedVideosCount >= 2;

    // Calcular el ahorro real (diferencia entre comprar videos individuales vs módulo completo)
    const savingsARS = totalIndividualPriceARS - originalModulePriceARS;
    const savingsUSD = totalIndividualPriceUSD - originalModulePriceUSD;

    res.json({
      moduleId: module._id,
      moduleName: `${module.titulo} - ${module.subtitulo}`,
      // Precios legacy (mantener compatibilidad)
      originalPrice: originalModulePriceARS,
      discountedPrice: discountedPriceARS,
      totalSpentOnVideos: totalSpentOnVideosARS,
      savings: savingsARS,
      // Nuevos precios duales
      originalPriceARS: originalModulePriceARS,
      originalPriceUSD: originalModulePriceUSD,
      discountedPriceARS,
      discountedPriceUSD,
      totalIndividualPriceARS,
      totalIndividualPriceUSD,
      totalSpentOnVideosARS,
      totalSpentOnVideosUSD,
      savingsARS,
      savingsUSD,
      // Información de videos
      videosInModule: moduleVideos.length,
      purchasedVideos: purchasedModuleVideos.length,
      unpurchasedVideos: unpurchasedVideosCount,
      purchasedVideosList: purchasedModuleVideos.map((v) => ({
        id: v._id,
        videoId: v.videoId,
        titulo: v.titulo,
        precio: v.precio,
        precioARS: v.precioARS,
        precioUSD: v.precioUSD,
      })),
      hasFullAccess,
      canPurchaseModule,
      message: hasFullAccess
        ? "Ya tienes acceso completo al módulo por haber comprado todos los videos"
        : !canPurchaseModule && unpurchasedVideosCount === 1
        ? "Solo queda 1 video sin comprar. Puedes comprarlo individualmente."
        : discountedPriceARS < originalModulePriceARS
        ? `Se aplicó un descuento de $${totalSpentOnVideosARS.toLocaleString(
            "es-AR"
          )} ARS / $${totalSpentOnVideosUSD} USD por videos previamente comprados`
        : "Aún no has comprado ningún video de este módulo",
    });
  } catch (error: any) {
    console.error("Error calculating module price:", error);
    res.status(500).json({
      message: "Error al calcular el precio del módulo",
      error: error.message,
    });
  }
};
