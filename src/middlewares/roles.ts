import { RolesRepository } from "@repositories/rolesRepository";
import { RolesService } from "@services/rolesService";
import { NextFunction, Request, Response } from "express";
import { IRolesRepository, IRolesService } from "types/RolesTypes";

const rolesRepository: IRolesRepository = new RolesRepository();
const rolesService: IRolesService = new RolesService(rolesRepository);

export const checkRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log("🔧 checkRoles middleware called");
  console.log("🛣️ Request path:", req.path);
  console.log("📋 Request body:", req.body);

  const roles: string[] = req.body && req.body?.roles ? req.body.roles : [];
  // Si no se especifican roles, asignar automáticamente "user"
  const role = Array.isArray(roles) && roles.length != 0 ? roles : ["user"];
  console.log("req.body roles to check:", role);

  try {
    const findRoles = await rolesService.findRoles({ name: { $in: role } });
    console.log("🔍 Found roles:", findRoles.length);

    if (findRoles.length === 0) {
      console.log("❌ No roles found, returning 404");
      res.status(404).json({ message: "Role not found" });
      return;
    }

    req.body.roles = findRoles.map((x) => x._id);

    console.log("req.body.roles :>>", req.body.roles);
    console.log("✅ checkRoles passed, calling next()");

    next();
  } catch (error) {
    console.log("error :>>", error);
    res.status(500).json(error);
    return;
  }
};

/**
 * Middleware para verificar si el usuario tiene uno de los roles especificados
 */
export const verifyRole = (allowedRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.currentUser;

      if (!user || !user.roles) {
        res.status(403).json({
          message:
            "Acceso denegado: No tienes permisos para realizar esta acción",
        });
        return;
      }

      // Verificar si el usuario tiene alguno de los roles permitidos
      const hasPermission = user.roles.some((userRole: any) =>
        allowedRoles.includes(userRole.name)
      );

      if (!hasPermission) {
        res.status(403).json({
          message: `Acceso denegado: Se requiere uno de los siguientes roles: ${allowedRoles.join(
            ", "
          )}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error verifying role:", error);
      res.status(500).json({
        message: "Error interno del servidor al verificar permisos",
      });
      return;
    }
  };
};
