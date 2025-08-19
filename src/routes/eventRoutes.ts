import { Router } from "express";
import { EventController } from "@controllers/eventController";
import { verifyToken } from "@middlewares/auth";
import { verifyRole } from "@middlewares/roles";

const router = Router();

// Rutas públicas (sin autenticación)
router.get("/", EventController.getEvents);
router.get("/month/:year/:month", EventController.getEventsByMonth);
router.get("/:id", EventController.getEventById);

// Rutas protegidas (solo admin/superadmin)
router.post(
  "/",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  EventController.createEvent
);
router.put(
  "/:id",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  EventController.updateEvent
);
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  EventController.deleteEvent
);
router.get(
  "/admin/stats",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  EventController.getEventStats
);

export default router;
