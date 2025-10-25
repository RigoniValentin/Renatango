import { NextFunction, Request, Response } from "express";

/**
 * Middleware para verificar si el usuario autenticado tiene permisos de administrador
 * Debe usarse después del middleware verifyToken
 */
export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔒 verifyAdmin middleware called");
    const { currentUser } = req;

    if (!currentUser) {
      console.log("❌ No currentUser in request");
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { roles } = currentUser;
    console.log("👤 Checking admin status for user:", currentUser.email);
    console.log(
      "📋 User roles:",
      roles?.map((r) => ({ name: r.name, permissions: r.permissions }))
    );

    if (!roles || roles.length === 0) {
      console.log("❌ No roles assigned to user");
      res.status(403).json({ message: "Access denied: No roles assigned" });
      return;
    }

    // Verificar si el usuario tiene el rol admin con el permiso admingranted
    const isAdmin = roles.some(
      (role) =>
        role.name === "admin" ||
        (role.permissions &&
          Array.isArray(role.permissions) &&
          role.permissions.includes("admingranted"))
    );

    console.log("🎯 Is admin?", isAdmin);

    if (!isAdmin) {
      console.log("❌ User does not have admin privileges");
      res
        .status(403)
        .json({ message: "Access denied: Admin privileges required" });
      return;
    }

    console.log("✅ Admin verification passed");
    // Usuario es admin, continuar
    next();
  } catch (error: any) {
    console.error("❌ Error in verifyAdmin middleware:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
