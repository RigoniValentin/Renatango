import express, { Application } from "express";
import path from "path";
import routes from "@routes/routes";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ChatMessage } from "@models/ChatMessage"; // Importar el modelo de mensajes

const app: Application = express();
const projectRoot = process.cwd();

app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// Servir archivos de imágenes de productos
app.use("/uploads", express.static(path.join(projectRoot, "uploads")));

// Registrar rutas de la API
app.use("/api/v1", routes());

// Servir archivos estáticos
if (process.env.NODE_ENV === "production") {
  app.use(
    "/",
    express.static(path.join(projectRoot, "distFront"), { index: "index.html" })
  );
  app.get("*", (req, res) => {
    return res.sendFile(path.join(projectRoot, "distFront", "index.html"));
  });
}

// ── Agregar Socket.IO ──
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import { Server as SocketIOServer } from "socket.io";
import fs from "fs";
import type { Server } from "http";

// Crear servidor HTTP o HTTPS según el entorno
let httpServer: Server;

if (process.env.NODE_ENV === "production") {
  // En producción usar HTTP normal
  httpServer = createServer(app);
} else {
  // En desarrollo usar HTTPS con certificados autofirmados
  try {
    const options = {
      key: fs.readFileSync(path.join(projectRoot, "key.pem")),
      cert: fs.readFileSync(path.join(projectRoot, "cert.pem")),
    };
    httpServer = createHttpsServer(options, app);
    console.log("🔒 HTTPS habilitado en desarrollo");
  } catch (error) {
    console.log("⚠️ Certificados SSL no encontrados, usando HTTP");
    httpServer = createServer(app);
  }
}

// Inicializar Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Ejemplo de configuración de eventos
io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);

  socket.on("chat message", async (msg: string) => {
    console.log("Mensaje de chat:", msg);
    io.emit("chat message", msg);
    // Guardar el mensaje en la base de datos
    try {
      // Se asume que el mensaje viene en el formato "username: mensaje"
      const [sender] = msg.split(":");
      await ChatMessage.create({ sender: sender.trim(), message: msg });
    } catch (error) {
      console.error("Error al guardar mensaje:", error);
    }
  });

  // Listener para el evento "chat toggled"
  socket.on("chat toggled", (payload: any) => {
    console.log("Chat toggled:", payload);
    // Retransmitir el evento a todos los demás clientes conectados
    socket.broadcast.emit("chat toggled", payload);
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
  });
});

// Lógica de cierre gracioso en server.ts
const shutdown = () => {
  console.log("Cerrando servidor...");
  httpServer.close(() => {
    console.log("Servidor HTTP cerrado.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { httpServer };
