import { Router } from "express";
import { NoticeController } from "@controllers/noticeController";
import { verifyToken } from "@middlewares/auth";
import { verifyRole } from "@middlewares/roles";

const router = Router();

// Rutas para usuarios autenticados (ver avisos activos)
router.get("/active", verifyToken, NoticeController.getActiveNotices);
router.get("/urgent", verifyToken, NoticeController.getUrgentNotices);

// Rutas protegidas (solo admin/superadmin)
router.get(
  "/",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.getAllNotices
);
router.get(
  "/admin/stats",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.getNoticeStats
);
router.post(
  "/admin/cleanup",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.cleanupExpiredNotices
);
router.get(
  "/:id",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.getNoticeById
);
router.post(
  "/",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.createNotice
);
router.put(
  "/:id",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.updateNotice
);
router.patch(
  "/:id/toggle",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.toggleNoticeStatus
);
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  NoticeController.deleteNotice
);

export default router;
