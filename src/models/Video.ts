import mongoose, { Schema, Document } from "mongoose";

export interface IVideo extends Document {
  moduleId: mongoose.Types.ObjectId;
  titulo: string;
  descripcion: string;
  videoId: string; // YouTube video ID
  precio: number; // Precio legacy - mantener por compatibilidad
  precioARS: number; // Precio en pesos argentinos (MercadoPago)
  precioUSD: number; // Precio en dólares (PayPal)
  duracion: string; // Formato: "MM:SS"
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    videoId: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
      default: 200,
    },
    precioARS: {
      type: Number,
      required: true,
      min: 0,
      default: 5000, // Precio en pesos argentinos
    },
    precioUSD: {
      type: Number,
      required: true,
      min: 0,
      default: 5, // Precio en dólares
    },
    duracion: {
      type: String,
      required: true,
      default: "00:00",
    },
    orden: {
      type: Number,
      required: true,
      default: 1,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
VideoSchema.index({ moduleId: 1, orden: 1 });
VideoSchema.index({ moduleId: 1 });

// Evitar error de modelo duplicado en desarrollo (hot-reload)
// Usamos "AdminVideo" para no conflictuar con el modelo "Video" existente de Videos.ts
export const VideoModel =
  mongoose.models.AdminVideo ||
  mongoose.model<IVideo>("AdminVideo", VideoSchema);
