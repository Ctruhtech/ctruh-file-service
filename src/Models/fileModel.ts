import mongoose, { Schema, Document } from "mongoose";

// Define the interface for File
export interface IFile extends Document {
  fileId:string;
  userId: string;
  type: string;
  fileName: string;
  fileExtension: string;
  isCompressed: boolean;
  category: string;
  subCategory: string;
  subType: string;
  uploadCategory: string;
  blobUrl: string;
  blobId: string;
  corr2DImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the File schema
const fileSchema: Schema = new Schema(
  {
    fileId: { type: String, required: false },
    userId: { type: String, required: false},
    type: { type: String, required: false },
    fileName: { type: String, required: false },
    fileExtension: { type: String, required: false },
    isCompressed: { type: Boolean, required: false },
    category: { type: String, required: false },
    subCategory: { type: String, required: false },
    subType: { type: String, required: false },
    uploadCategory: { type: String, required: false },
    blobUrl: { type: String, required: false },
    blobId: { type: String, required: false },
    corr2DImageUrl: { type: String, required: false }
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

// Create the File model from the schema
export const FileModel = mongoose.model<IFile>("File", fileSchema);
