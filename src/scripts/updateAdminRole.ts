import mongoose from "mongoose";
import { UserModel } from "../models/Users";
import { RolesModel } from "../models/Roles";

async function updateAdminRole() {
  try {
    // Conectar a la base de datos
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tango";
    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");

    // Buscar el rol "admin"
    const adminRole = await RolesModel.findOne({ name: "admin" });
    if (!adminRole) {
      console.error("❌ No se encontró el rol 'admin' en la base de datos");
      process.exit(1);
    }
    console.log(`✅ Rol admin encontrado: ${adminRole._id}`);

    // Buscar el usuario admin
    const adminUser = await UserModel.findOne({ username: "admin" });
    if (!adminUser) {
      console.error("❌ No se encontró el usuario 'admin' en la base de datos");
      process.exit(1);
    }
    console.log(`✅ Usuario admin encontrado: ${adminUser._id}`);

    // Actualizar el rol del usuario
    adminUser.roles = [adminRole._id as any];
    await adminUser.save();
    console.log("✅ Usuario admin actualizado con el rol correcto");

    // Verificar la actualización
    const updatedUser = await UserModel.findOne({ username: "admin" }).populate(
      "roles"
    );
    console.log(
      "📋 Usuario actualizado:",
      JSON.stringify(updatedUser, null, 2)
    );

    await mongoose.disconnect();
    console.log("✅ Desconectado de MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateAdminRole();
