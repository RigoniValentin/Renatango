import mongoose from "mongoose";
import dotenv from "dotenv";
import { ModuleModel } from "../models/Module";

dotenv.config();

const modules = [
  {
    titulo: "MÓDULO 1",
    subtitulo: "CENTRARSE",
    descripcion:
      "Encuentra tu centro, conecta con tu esencia y prepárate para el viaje del tango.",
    videoId: "5WPfj1YPnh8",
    precio: 1500,
    imagen: "centrarse.png",
    orden: 1,
    activo: true,
  },
  {
    titulo: "MÓDULO 2",
    subtitulo: "RECONOCERSE",
    descripcion:
      "Descubre quién eres en el abrazo, reconoce tu estilo único de movimiento.",
    videoId: "WVVLAaSW3zY",
    precio: 1500,
    imagen: "reconocerse.png",
    orden: 2,
    activo: true,
  },
  {
    titulo: "MÓDULO 3",
    subtitulo: "DESCUBRIRSE",
    descripcion:
      "Explora nuevas dimensiones de tu expresión corporal y emocional.",
    videoId: "Q-KKbWLolOs",
    precio: 1500,
    imagen: "descubrirse.png",
    orden: 3,
    activo: true,
  },
  {
    titulo: "MÓDULO 4",
    subtitulo: "BAILARSE",
    descripcion:
      "Vive el tango desde tu autenticidad, danza tu propia historia.",
    videoId: "7jXNVQMPemA",
    precio: 1500,
    imagen: "bailarse.png",
    orden: 4,
    activo: true,
  },
];

async function seedModules() {
  try {
    const mongoDbUrl = process.env.MONGODB_URL_STRING;
    if (!mongoDbUrl) {
      console.error("MONGODB_URL_STRING is not defined");
      process.exit(1);
    }

    await mongoose.connect(mongoDbUrl);
    console.log("Conectado a MongoDB");

    // Limpiar módulos existentes
    await ModuleModel.deleteMany({});
    console.log("Módulos existentes eliminados");

    // Insertar nuevos módulos
    const result = await ModuleModel.insertMany(modules);
    console.log(`✅ ${result.length} módulos insertados correctamente`);

    result.forEach((module) => {
      console.log(`  - ${module.titulo} (ID: ${module._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al insertar módulos:", error);
    process.exit(1);
  }
}

seedModules();
