import mongoose from "mongoose";
import dotenv from "dotenv";
import { RolesModel } from "../models/Roles";

dotenv.config();

const initRoles = async () => {
  const mongoDbUrl = process.env.MONGODB_URL_STRING;

  if (!mongoDbUrl) {
    console.error("MONGODB_URL_STRING is not defined in your environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoDbUrl);
    console.log("Conectado a MongoDB");

    // Verificar si los roles ya existen
    const existingRoles = await RolesModel.find({
      name: { $in: ["user", "admin"] },
    });

    if (existingRoles.length === 2) {
      console.log("Los roles 'user' y 'admin' ya existen en la base de datos.");
    } else {
      // Crear rol 'user' si no existe
      const userRoleExists = existingRoles.find((r) => r.name === "user");
      if (!userRoleExists) {
        await RolesModel.create({
          name: "user",
          permissions: ["read_content", "comment", "upload_videos"],
        });
        console.log("✅ Rol 'user' creado exitosamente");
      }

      // Crear rol 'admin' si no existe
      const adminRoleExists = existingRoles.find((r) => r.name === "admin");
      if (!adminRoleExists) {
        await RolesModel.create({
          name: "admin",
          permissions: [
            "admin_granted",
            "read_content",
            "write_content",
            "delete_content",
            "manage_users",
            "manage_roles",
            "comment",
            "upload_videos",
          ],
        });
        console.log("✅ Rol 'admin' creado exitosamente");
      }
    }

    console.log("\n✨ Inicialización de roles completada");
    process.exit(0);
  } catch (error) {
    console.error("Error al inicializar roles:", error);
    process.exit(1);
  }
};

initRoles();
