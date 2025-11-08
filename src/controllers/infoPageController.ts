import { Request, Response } from "express";
import { InfoPageService } from "@services/infoPageService";
import { UpdateInfoPageRequest } from "types/InfoPageTypes";
import { InfoPageSlug } from "@models/InfoPage";

const infoPageService = new InfoPageService();

export class InfoPageController {
  static async getInfoPage(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      if (!infoPageService.isValidSlug(slug)) {
        res.status(400).json({
          success: false,
          message: "Slug inválido. Valores permitidos: clases, intensivos",
        });
        return;
      }

      const page = await infoPageService.getPage(slug as InfoPageSlug);

      res.json({
        success: true,
        data: page,
      });
    } catch (error) {
      console.error("Error fetching info page:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el contenido solicitado",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async updateInfoPage(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      if (!infoPageService.isValidSlug(slug)) {
        res.status(400).json({
          success: false,
          message: "Slug inválido. Valores permitidos: clases, intensivos",
        });
        return;
      }

      const payload = req.body as UpdateInfoPageRequest;

      if (!payload || typeof payload.content !== "string") {
        res.status(400).json({
          success: false,
          message: "El campo content es obligatorio y debe ser texto",
        });
        return;
      }

      if (payload.content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "El contenido no puede estar vacío",
        });
        return;
      }

      const title =
        typeof payload.title === "string" && payload.title.trim().length > 0
          ? payload.title.trim()
          : infoPageService.getDefault(slug as InfoPageSlug).title;

      const updatedPage = await infoPageService.updatePage(
        slug as InfoPageSlug,
        {
          title,
          content: payload.content,
        },
        req.currentUser?.id
      );

      res.json({
        success: true,
        message: "Contenido actualizado exitosamente",
        data: updatedPage,
      });
    } catch (error) {
      console.error("Error updating info page:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el contenido",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
