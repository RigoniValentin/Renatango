import { HOST, PAYPAL_API, PAYPAL_API_CLIENT, PAYPAL_API_SECRET } from "app";
import { Request, Response } from "express";
import axios from "axios";
import { VideoPurchaseRepository } from "@repositories/videoPurchaseRepository";
import { VideoPurchaseService } from "@services/videoPurchaseService";
import { Preference, MercadoPagoConfig } from "mercadopago";
import { VideoModel } from "@models/Video";

// Crear instancias de servicio
const videoPurchaseRepository = new VideoPurchaseRepository();
const videoPurchaseService = new VideoPurchaseService(videoPurchaseRepository);

/**
 * Función helper para verificar si el usuario actual es administrador
 * @param req - Request de Express con currentUser
 * @returns true si el usuario es admin, false en caso contrario
 */
const isUserAdmin = (req: Request): boolean => {
  const user = req.currentUser;
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }

  // Verificar si tiene el rol "admin" o el permiso "admingranted"
  const hasAdminRole = user.roles.some(
    (role: any) =>
      role.name === "admin" ||
      (role.permissions &&
        Array.isArray(role.permissions) &&
        role.permissions.includes("admingranted"))
  );

  console.log("🔍 Admin check:", {
    userId: user.id,
    roles: user.roles.map((r: any) => r.name),
    isAdmin: hasAdminRole,
  });

  return hasAdminRole;
};

// Credenciales de MercadoPago
const MP_ACCESS_TOKEN_ENV =
  process.env.NODE_ENV === "production"
    ? process.env.MP_ACCESS_TOKEN
    : process.env.MP_ACCESS_TOKENtest;

console.log("🔑 MercadoPago Config:", {
  environment: process.env.NODE_ENV,
  tokenLength: MP_ACCESS_TOKEN_ENV?.length || 0,
  tokenPreview: MP_ACCESS_TOKEN_ENV?.substring(0, 30) + "...",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://pilatestransmissionsarah.com"
      : "https://localhost:3010",
});

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN_ENV as string,
});

// Mapeo de videos por módulo
const MODULE_VIDEOS: Record<string, string[]> = {
  "1": ["SChqnZyrKW0", "r6EW-dOnGnE", "rhGlmpg4oN0", "MnIbkkDcUB4"],
  "2": ["WVVLAaSW3zY", "jAEnhMx7F4U", "Wzrr1rkU4W0", "6sBnx-6d3xk"],
  "3": ["Q-KKbWLolOs", "NW8GxgmQ3XQ", "KgTKhLOvVKo", "3vStaXhFcEk"],
  "4": ["7jXNVQMPemA", "gVrUec6AgTU", "ruG_C22Cfmk", "JndO50InEQM"],
};

/**
 * Función helper para encontrar el módulo al que pertenece un video
 * @param videoId - ID del video de YouTube
 * @returns El ID del módulo o undefined si no se encuentra
 */
const findModuleByVideoId = (videoId: string): string | undefined => {
  for (const [moduleId, videos] of Object.entries(MODULE_VIDEOS)) {
    if (videos.includes(videoId)) {
      return moduleId;
    }
  }
  return undefined;
};

/**
 * Función helper para obtener los videoIds de un módulo desde la base de datos
 * @param moduleId - ID del módulo (MongoDB ObjectId)
 * @returns Array de videoIds del módulo
 */
const getVideoIdsByModuleId = async (moduleId: string): Promise<string[]> => {
  try {
    console.log("🔍 Getting videos for moduleId:", moduleId);
    const videos = await VideoModel.find({ moduleId }).select("videoId");
    console.log(
      "📹 Found videos:",
      videos.map((v) => ({
        _id: v._id,
        videoId: v.videoId,
        moduleId: v.moduleId,
      }))
    );
    const videoIds = videos.map((video) => video.videoId);
    console.log("✅ Returning videoIds:", videoIds);
    return videoIds;
  } catch (error) {
    console.error("Error getting videos by moduleId:", error);
    return [];
  }
};

//#region PayPal - Videos
export const createVideoOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;
    const { itemType, itemId, itemTitle, itemPrice } = req.body;

    // Validar que el usuario no haya comprado ya este item
    if (itemType === "video") {
      const hasAccess = await videoPurchaseService.hasAccessToVideo(
        userId,
        itemId
      );
      if (hasAccess) {
        res.status(400).json({ message: "Ya tienes acceso a este video" });
        return;
      }
    } else if (itemType === "module") {
      const hasAccess = await videoPurchaseService.hasAccessToModule(
        userId,
        itemId
      );
      if (hasAccess) {
        res.status(400).json({ message: "Ya tienes acceso a este módulo" });
        return;
      }
    }

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://pilatestransmissionsarah.com"
        : "https://localhost:3010";

    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: itemPrice.toFixed(2), // itemPrice ya viene en USD desde el frontend
          },
          description: itemTitle,
        },
      ],
      application_context: {
        brand_name: "Tango",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${baseUrl}/api/v1/capture-video-order?state=${userId}&itemType=${itemType}&itemId=${itemId}&price=${itemPrice}`,
        cancel_url: `${baseUrl}/cancel-payment`,
      },
    };

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");

    const {
      data: { access_token },
    } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
      auth: {
        username: PAYPAL_API_CLIENT!,
        password: PAYPAL_API_SECRET!,
      },
    });

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      order,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    console.log("PayPal video order created:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error creating video order:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
};

export const captureVideoOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, state, itemType, itemId, price } = req.query;

  try {
    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
      {},
      {
        auth: {
          username: PAYPAL_API_CLIENT!,
          password: PAYPAL_API_SECRET!,
        },
      }
    );

    console.log("PayPal capture response:", response.data);

    const userId = state as string;
    const transactionId = response.data.id;

    // Determinar los videoIds y moduleId según el tipo de compra
    let videoIds: string[] = [];
    let moduleId: string | undefined;

    if (itemType === "video") {
      const videoId = itemId as string;
      videoIds = [videoId];
      // Encontrar el módulo al que pertenece este video desde la base de datos
      const video = await VideoModel.findOne({ videoId }).select("moduleId");
      moduleId = video?.moduleId?.toString();
    } else if (itemType === "module") {
      moduleId = itemId as string;
      // Obtener todos los videoIds del módulo desde la base de datos
      videoIds = await getVideoIdsByModuleId(moduleId);
    }

    // Crear el registro de compra
    const purchase = await videoPurchaseService.createPurchase({
      userId,
      purchaseType: itemType as "video" | "module",
      itemId: itemId as string,
      moduleId,
      videoIds,
      price: Number(price),
      paymentMethod: "paypal",
      paymentId: transactionId,
      status: "completed",
      purchaseDate: new Date(),
    });

    console.log("✅ PayPal purchase created:", {
      userId,
      purchaseType: itemType,
      moduleId,
      videoIds,
      paymentId: transactionId,
      purchaseId: purchase._id,
    });

    const successRedirect =
      process.env.NODE_ENV === "production"
        ? `https://pilatestransmissionsarah.com/pagoAprobado`
        : `https://localhost:5173/pagoAprobado`;

    res.redirect(successRedirect);
  } catch (error) {
    console.error("Error capturing video order:", error);
    res.status(500).json({ message: "Error processing payment", error });
  }
};
//#endregion

//#region MercadoPago - Videos
export const createVideoPreference = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser.id;
    const items = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: "No items provided" });
      return;
    }

    const item = items[0];
    const { itemType, itemId, title, unit_price } = item;

    // Validar que el usuario no haya comprado ya este item
    if (itemType === "video") {
      const hasAccess = await videoPurchaseService.hasAccessToVideo(
        userId,
        itemId
      );
      if (hasAccess) {
        res.status(400).json({ message: "Ya tienes acceso a este video" });
        return;
      }
    } else if (itemType === "module") {
      const hasAccess = await videoPurchaseService.hasAccessToModule(
        userId,
        itemId
      );
      if (hasAccess) {
        res.status(400).json({ message: "Ya tienes acceso a este módulo" });
        return;
      }
    }

    // URLs para MercadoPago
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? "https://pilatestransmissionsarah.com"
        : "https://localhost:5173"; // HTTPS en desarrollo

    const backendUrl =
      process.env.NODE_ENV === "production"
        ? "https://pilatestransmissionsarah.com"
        : "https://localhost:3010"; // Backend ahora también usa HTTPS en desarrollo

    const successUrl = `${backendUrl}/api/v1/capture-video-preference?state=${userId}&itemType=${itemType}&itemId=${itemId}&price=${unit_price}`;

    console.log("📦 Creating MercadoPago Preference:", {
      frontendUrl,
      backendUrl,
      successUrl,
      itemType,
      itemId,
    });

    const body = {
      items: [
        {
          id: itemId,
          title,
          quantity: 1,
          currency_id: "ARS",
          unit_price,
        },
      ],
      back_urls: {
        success: successUrl,
        failure: `${frontendUrl}/cancel-payment`,
        pending: `${frontendUrl}/pending-payment`,
      },
      auto_return: "approved",
    };

    const preference = new Preference(mercadoPagoClient);
    const result = await preference.create({ body });

    console.log("MercadoPago video preference created:", result.id);
    res.json({ id: result.id });
  } catch (error) {
    console.error("Error creating video preference:", error);
    res.status(500).json({ message: "Error al procesar el pago", error });
  }
};

export const captureVideoPreference = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { state, payment_id, status, itemType, itemId, price } = req.query;

  console.log("captureVideoPreference called with:", req.query);

  if (status !== "approved") {
    res.status(400).json({ message: "Payment not approved" });
    return;
  }

  try {
    const userId = state as string;

    // Determinar los videoIds y moduleId según el tipo de compra
    let videoIds: string[] = [];
    let moduleId: string | undefined;

    if (itemType === "video") {
      const videoId = itemId as string;
      videoIds = [videoId];
      // Encontrar el módulo al que pertenece este video desde la base de datos
      const video = await VideoModel.findOne({ videoId }).select("moduleId");
      moduleId = video?.moduleId?.toString();
    } else if (itemType === "module") {
      moduleId = itemId as string;
      // Obtener todos los videoIds del módulo desde la base de datos
      videoIds = await getVideoIdsByModuleId(moduleId);
    }

    // Crear el registro de compra
    const purchase = await videoPurchaseService.createPurchase({
      userId,
      purchaseType: itemType as "video" | "module",
      itemId: itemId as string,
      moduleId,
      videoIds,
      price: Number(price),
      paymentMethod: "mercadopago",
      paymentId: payment_id as string,
      status: "completed",
      purchaseDate: new Date(),
    });

    console.log("✅ MercadoPago purchase created:", {
      userId,
      purchaseType: itemType,
      moduleId,
      videoIds,
      paymentId: payment_id,
      purchaseId: purchase._id,
    });

    const successRedirect =
      process.env.NODE_ENV === "production"
        ? `https://pilatestransmissionsarah.com/pagoAprobado`
        : `https://localhost:5173/pagoAprobado`;

    res.redirect(successRedirect);
  } catch (error) {
    console.error("Error capturing video preference:", error);
    res.status(500).json({ message: "Error processing payment", error });
  }
};
//#endregion

//#region Consultas de acceso
export const getUserVideoAccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;

    // Si el usuario es admin, tiene acceso a todos los videos
    if (isUserAdmin(req)) {
      console.log("👑 Admin user - getting all videos");
      const allVideos = await VideoModel.find().select("videoId");
      const allVideoIds = allVideos.map((v) => v.videoId);
      res.json({ videoIds: allVideoIds, isAdmin: true });
      return;
    }

    const videoIds = await videoPurchaseService.getUserVideoAccess(userId);

    res.json({ videoIds, isAdmin: false });
  } catch (error) {
    console.error("Error getting user video access:", error);
    res.status(500).json({ message: "Error getting video access", error });
  }
};

export const checkVideoAccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;
    const { videoId } = req.params;

    // Si el usuario es admin, siempre tiene acceso
    if (isUserAdmin(req)) {
      console.log("👑 Admin user - granting access to video:", videoId);
      res.json({ hasAccess: true, isAdmin: true });
      return;
    }

    const hasAccess = await videoPurchaseService.hasAccessToVideo(
      userId,
      videoId
    );

    res.json({ hasAccess, isAdmin: false });
  } catch (error) {
    console.error("Error checking video access:", error);
    res.status(500).json({ message: "Error checking access", error });
  }
};

export const checkModuleAccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;
    const { moduleId } = req.params;

    // Si el usuario es admin, siempre tiene acceso
    if (isUserAdmin(req)) {
      console.log("👑 Admin user - granting access to module:", moduleId);
      res.json({ hasAccess: true, isAdmin: true });
      return;
    }

    const hasAccess = await videoPurchaseService.hasAccessToModule(
      userId,
      moduleId
    );

    res.json({ hasAccess, isAdmin: false });
  } catch (error) {
    console.error("Error checking module access:", error);
    res.status(500).json({ message: "Error checking access", error });
  }
};

/**
 * Obtiene todos los módulos a los que el usuario tiene acceso
 */
export const getUserModules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;

    // Si el usuario es admin, tiene acceso a todos los módulos
    if (isUserAdmin(req)) {
      console.log("👑 Admin user - getting all modules");
      const { ModuleModel } = await import("@models/Module");
      const allModules = await ModuleModel.find().select("_id");
      const allModuleIds = allModules.map((m) => m._id.toString());
      res.json({ moduleIds: allModuleIds, isAdmin: true });
      return;
    }

    const moduleIds = await videoPurchaseService.getUserModuleAccess(userId);

    res.json({ moduleIds, isAdmin: false });
  } catch (error) {
    console.error("Error getting user modules:", error);
    res.status(500).json({ message: "Error getting modules", error });
  }
};

/**
 * Obtiene los videos de un módulo específico a los que el usuario tiene acceso
 */
export const getUserVideosInModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;
    const { moduleId } = req.params;

    // Si el usuario es admin, tiene acceso a todos los videos del módulo
    if (isUserAdmin(req)) {
      console.log("👑 Admin user - getting all videos for module:", moduleId);
      const moduleVideoIds = await getVideoIdsByModuleId(moduleId);
      res.json({ moduleId, videoIds: moduleVideoIds, isAdmin: true });
      return;
    }

    const videoIds = await videoPurchaseService.getUserVideosByModule(
      userId,
      moduleId
    );

    res.json({ moduleId, videoIds, isAdmin: false });
  } catch (error) {
    console.error("Error getting user videos in module:", error);
    res.status(500).json({ message: "Error getting videos", error });
  }
};

/**
 * Obtiene un resumen completo de las compras del usuario
 */
export const getUserPurchasesSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser.id;
    const summary = await videoPurchaseService.getUserPurchasesSummary(userId);

    res.json(summary);
  } catch (error) {
    console.error("Error getting purchases summary:", error);
    res.status(500).json({ message: "Error getting summary", error });
  }
};
//#endregion
