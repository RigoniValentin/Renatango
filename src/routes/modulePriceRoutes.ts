import { Router } from "express";
import { calculateModulePrice } from "@controllers/modulePriceController";
import { verifyToken } from "@middlewares/auth";

const router = Router();

// Ruta para calcular el precio del módulo con descuento
router.get("/:moduleId/calculate-price", verifyToken, calculateModulePrice);

export default router;
