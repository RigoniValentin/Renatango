import mongoose, { Schema, Document } from "mongoose";
import { Video } from "types/VideosTypes";

const VideoSchema: Schema = new Schema<Video>(
  {
    url: {
      type: String,
      required: true,
      // Podrías agregar validación para asegurar que es un link de YouTube
    },
    category: {
      type: String,
      required: true,
    },
    trainingType: {
      type: String,
    },
    level: {
      type: String,
    },
    muscleGroup: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

// Evitar error de modelo duplicado en desarrollo (hot-reload)
export const VideoModel =
  mongoose.models.Video || mongoose.model<Video>("Video", VideoSchema);
