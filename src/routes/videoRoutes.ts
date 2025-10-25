import { Router } from "express";
import {
  getVideosByModule,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} from "@controllers/videoController";
import { verifyToken } from "@middlewares/auth";
import { verifyAdmin } from "@middlewares/verifyAdmin";

const router = Router();

// Rutas públicas
router.get("/module/:moduleId", getVideosByModule);
router.get("/:id", getVideoById);

// Rutas protegidas (solo admin)
router.post("/module/:moduleId", verifyToken, verifyAdmin, createVideo);
router.put("/:id", verifyToken, verifyAdmin, updateVideo);
router.delete("/:id", verifyToken, verifyAdmin, deleteVideo);

export default router;
