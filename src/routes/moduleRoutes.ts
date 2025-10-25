import { Router } from "express";
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
} from "../controllers/moduleController";
import { verifyToken } from "../middlewares/auth";
import { verifyAdmin } from "../middlewares/verifyAdmin";

const router = Router();

// Rutas públicas
router.get("/", getAllModules);
router.get("/:id", getModuleById);

// Rutas protegidas (solo admin)
router.post("/", verifyToken, verifyAdmin, createModule);
router.put("/:id", verifyToken, verifyAdmin, updateModule);
router.delete("/:id", verifyToken, verifyAdmin, deleteModule);

export default router;
