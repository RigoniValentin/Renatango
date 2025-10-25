import mongoose, { Schema, Document } from "mongoose";

export interface IVideoPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  purchaseType: "video" | "module";
  itemId: string; // ID del video o módulo
  moduleId?: string; // ID del módulo si es compra de módulo
  videoIds: string[]; // IDs de videos incluidos (1 si es video individual, 4 si es módulo)
  price: number;
  paymentMethod: "paypal" | "mercadopago";
  paymentId: string; // ID de la transacción de PayPal o MercadoPago
  status: "pending" | "completed" | "failed" | "refunded";
  purchaseDate: Date;
  expirationDate?: Date; // Por si queremos que expire el acceso
}

const VideoPurchaseSchema: Schema = new Schema<IVideoPurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    purchaseType: {
      type: String,
      enum: ["video", "module"],
      required: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    moduleId: {
      type: String,
    },
    videoIds: {
      type: [String],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "mercadopago"],
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

// Índice compuesto para búsquedas rápidas
VideoPurchaseSchema.index({ userId: 1, status: 1 });
VideoPurchaseSchema.index({ userId: 1, videoIds: 1 });

export const VideoPurchaseModel = mongoose.model<IVideoPurchase>(
  "VideoPurchase",
  VideoPurchaseSchema
);
