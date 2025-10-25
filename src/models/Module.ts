import mongoose, { Schema, Document } from "mongoose";

export interface IModule extends Document {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  videoId: string; // YouTube video ID para preview
  precio: number; // Precio legacy - mantener por compatibilidad
  precioARS: number; // Precio en pesos argentinos (MercadoPago)
  precioUSD: number; // Precio en dólares (PayPal)
  imagen: string;
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema: Schema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    subtitulo: {
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
      default: 1500,
    },
    precioARS: {
      type: Number,
      required: true,
      min: 0,
      default: 15000, // Precio en pesos argentinos
    },
    precioUSD: {
      type: Number,
      required: true,
      min: 0,
      default: 15, // Precio en dólares
    },
    imagen: {
      type: String,
      required: true,
      trim: true,
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

// Índice para orden
ModuleSchema.index({ orden: 1 });

// Evitar error de modelo duplicado en desarrollo (hot-reload)
export const ModuleModel =
  mongoose.models.AdminModule ||
  mongoose.model<IModule>("AdminModule", ModuleSchema);
