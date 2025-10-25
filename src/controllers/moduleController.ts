import { Request, Response } from "express";
import { ModuleModel } from "@models/Module";

/**
 * Obtener todos los módulos
 * GET /api/modules
 */
export const getAllModules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const modules = await ModuleModel.find().sort({ orden: 1 });
    res.json(modules);
  } catch (error: any) {
    console.error("Error getting modules:", error);
    res
      .status(500)
      .json({ message: "Error fetching modules", error: error.message });
  }
};

/**
 * Obtener un módulo por ID
 * GET /api/modules/:id
 */
export const getModuleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const module = await ModuleModel.findById(id);

    if (!module) {
      res.status(404).json({ message: "Module not found" });
      return;
    }

    res.json(module);
  } catch (error: any) {
    console.error("Error getting module:", error);
    res
      .status(500)
      .json({ message: "Error fetching module", error: error.message });
  }
};

/**
 * Crear un nuevo módulo (Admin only)
 * POST /api/modules
 */
export const createModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      titulo,
      subtitulo,
      descripcion,
      videoId,
      precio,
      precioARS,
      precioUSD,
      imagen,
      orden,
    } = req.body;

    // Validaciones
    if (!titulo || !subtitulo || !descripcion || !videoId || !imagen) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newModule = new ModuleModel({
      titulo,
      subtitulo,
      descripcion,
      videoId,
      precio: precio || 1500, // Legacy
      precioARS: precioARS || 15000,
      precioUSD: precioUSD || 15,
      imagen,
      orden: orden || 1,
    });

    const savedModule = await newModule.save();
    res.status(201).json(savedModule);
  } catch (error: any) {
    console.error("Error creating module:", error);
    res
      .status(500)
      .json({ message: "Error creating module", error: error.message });
  }
};

/**
 * Actualizar un módulo (Admin only)
 * PUT /api/modules/:id
 */
export const updateModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedModule = await ModuleModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedModule) {
      res.status(404).json({ message: "Module not found" });
      return;
    }

    res.json(updatedModule);
  } catch (error: any) {
    console.error("Error updating module:", error);
    res
      .status(500)
      .json({ message: "Error updating module", error: error.message });
  }
};

/**
 * Eliminar un módulo (Admin only)
 * DELETE /api/modules/:id
 */
export const deleteModule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedModule = await ModuleModel.findByIdAndDelete(id);

    if (!deletedModule) {
      res.status(404).json({ message: "Module not found" });
      return;
    }

    res.json({ message: "Module deleted successfully", module: deletedModule });
  } catch (error: any) {
    console.error("Error deleting module:", error);
    res
      .status(500)
      .json({ message: "Error deleting module", error: error.message });
  }
};
