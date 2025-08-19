import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: "class" | "workshop" | "special" | "capacitation";
  category?: string;
  color: string;
  isRecurring: boolean;
  recurringDays: number[]; // 0-6 (Sunday-Saturday)
  location?: string;
  maxParticipants?: number;
  instructor?: string;
  price?: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [100, "El título no puede exceder 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    startDate: {
      type: Date,
      required: [true, "La fecha de inicio es requerida"],
    },
    endDate: {
      type: Date,
      // Eliminamos la validación custom aquí ya que se maneja en el servicio
    },
    type: {
      type: String,
      enum: {
        values: ["class", "workshop", "special", "capacitation"],
        message: "El tipo debe ser: class, workshop, special o capacitation",
      },
      required: [true, "El tipo de evento es requerido"],
    },
    category: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
      validate: {
        validator: function (value: string) {
          // Validar formato hexadecimal
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
        },
        message:
          "El color debe estar en formato hexadecimal válido (ej: #3B82F6)",
      },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: {
      type: [Number],
      validate: {
        validator: function (this: IEvent, value: number[]) {
          // Si es recurrente, debe tener al menos un día
          if (this.isRecurring && (!value || value.length === 0)) {
            return false;
          }
          // Todos los días deben estar entre 0-6
          return value.every((day) => day >= 0 && day <= 6);
        },
        message:
          "Los días recurrentes deben estar entre 0-6 (Domingo-Sábado) y al menos uno si es recurrente",
      },
    },
    location: {
      type: String,
      trim: true,
    },
    maxParticipants: {
      type: Number,
      min: [1, "El máximo de participantes debe ser al menos 1"],
    },
    instructor: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: [0, "El precio no puede ser negativo"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Esto agrega automáticamente createdAt y updatedAt
  }
);

// Índices para mejorar performance en consultas
eventSchema.index({ startDate: 1, isActive: 1 });
eventSchema.index({ type: 1, isActive: 1 });
eventSchema.index({ isRecurring: 1, isActive: 1 });
eventSchema.index({ createdBy: 1 });

// Middleware pre-save para actualizar updatedAt
eventSchema.pre<IEvent>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Event = mongoose.model<IEvent>("Event", eventSchema);

export default Event;
