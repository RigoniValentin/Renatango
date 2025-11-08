import mongoose, { Schema, Document } from "mongoose";

export type InfoPageSlug = "clases" | "intensivos";

export interface IInfoPage extends Document {
  slug: InfoPageSlug;
  title: string;
  content: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const infoPageSchema = new Schema<IInfoPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["clases", "intensivos"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, "El título no puede exceder 120 caracteres"],
    },
    content: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

infoPageSchema.index({ slug: 1 }, { unique: true });

const InfoPage = mongoose.model<IInfoPage>("InfoPage", infoPageSchema);

export default InfoPage;
