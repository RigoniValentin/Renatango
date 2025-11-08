import { Router } from "express";
import { InfoPageController } from "@controllers/infoPageController";
import { verifyToken } from "@middlewares/auth";
import { verifyRole } from "@middlewares/roles";

const router = Router();

router.get("/:slug", InfoPageController.getInfoPage);
router.put(
  "/:slug",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  InfoPageController.updateInfoPage
);

export default router;
