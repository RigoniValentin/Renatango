import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [100, "El título no puede exceder 100 caracteres"],
    },
    message: {
      type: String,
      required: [true, "El mensaje es requerido"],
      trim: true,
      maxlength: [500, "El mensaje no puede exceder 500 caracteres"],
    },
    type: {
      type: String,
      enum: {
        values: ["info", "warning", "urgent", "success"],
        message: "El tipo debe ser: info, warning, urgent o success",
      },
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (this: INotice, value: Date) {
          // Si hay endDate y startDate, startDate debe ser anterior
          if (value && this.endDate) {
            return value <= this.endDate;
          }
          return true;
        },
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
      },
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (this: INotice, value: Date) {
          // Si hay startDate y endDate, endDate debe ser posterior
          if (value && this.startDate) {
            return value >= this.startDate;
          }
          return true;
        },
        message: "La fecha de fin debe ser posterior a la fecha de inicio",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El creador es requerido"],
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar performance
noticeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
noticeSchema.index({ createdBy: 1 });
noticeSchema.index({ type: 1 });
noticeSchema.index({ createdAt: -1 });

// Middleware pre-save para validaciones adicionales
noticeSchema.pre<INotice>("save", function (next) {
  // Validar fechas si ambas están presentes
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    const error = new Error(
      "La fecha de inicio debe ser anterior a la fecha de fin"
    );
    return next(error);
  }
  next();
});

const Notice = mongoose.model<INotice>("Notice", noticeSchema);

export default Notice;
