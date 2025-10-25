import { Request, Response } from "express";
import { VideoModel } from "@models/Video";
import { ModuleModel } from "@models/Module";

/**
 * Obtener todos los videos de un módulo
 * GET /api/modules/:moduleId/videos
 */
export const getVideosByModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { moduleId } = req.params;

    // Verificar que el módulo existe
    const module = await ModuleModel.findById(moduleId);
    if (!module) {
      res.status(404).json({ message: "Module not found" });
      return;
    }

    const videos = await VideoModel.find({ moduleId }).sort({ orden: 1 });
    res.json(videos);
  } catch (error: any) {
    console.error("Error getting videos:", error);
    res
      .status(500)
      .json({ message: "Error fetching videos", error: error.message });
  }
};

/**
 * Obtener un video por ID
 * GET /api/videos/:id
 */
export const getVideoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await VideoModel.findById(id).populate("moduleId");

    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    res.json(video);
  } catch (error: any) {
    console.error("Error getting video:", error);
    res
      .status(500)
      .json({ message: "Error fetching video", error: error.message });
  }
};

/**
 * Crear un nuevo video (Admin only)
 * POST /api/modules/:moduleId/videos
 */
export const createVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const {
      titulo,
      descripcion,
      videoId,
      precio,
      precioARS,
      precioUSD,
      duracion,
      orden,
    } = req.body;

    // Verificar que el módulo existe
    const module = await ModuleModel.findById(moduleId);
    if (!module) {
      res.status(404).json({ message: "Module not found" });
      return;
    }

    // Validaciones
    if (!titulo || !descripcion || !videoId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newVideo = new VideoModel({
      moduleId,
      titulo,
      descripcion,
      videoId,
      precio: precio || 200, // Legacy
      precioARS: precioARS || 5000,
      precioUSD: precioUSD || 5,
      duracion: duracion || "00:00",
      orden: orden || 1,
    });

    const savedVideo = await newVideo.save();
    res.status(201).json(savedVideo);
  } catch (error: any) {
    console.error("Error creating video:", error);
    res
      .status(500)
      .json({ message: "Error creating video", error: error.message });
  }
};

/**
 * Actualizar un video (Admin only)
 * PUT /api/videos/:id
 */
export const updateVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("🎬 Updating video with ID:", id);
    console.log("📝 Update data:", updateData);

    const updatedVideo = await VideoModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      console.log("❌ Video not found with ID:", id);
      res.status(404).json({ message: "Video not found" });
      return;
    }

    res.json(updatedVideo);
  } catch (error: any) {
    console.error("Error updating video:", error);
    res
      .status(500)
      .json({ message: "Error updating video", error: error.message });
  }
};

/**
 * Eliminar un video (Admin only)
 * DELETE /api/videos/:id
 */
export const deleteVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVideo = await VideoModel.findByIdAndDelete(id);

    if (!deletedVideo) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    res.json({ message: "Video deleted successfully", video: deletedVideo });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    res
      .status(500)
      .json({ message: "Error deleting video", error: error.message });
  }
};
