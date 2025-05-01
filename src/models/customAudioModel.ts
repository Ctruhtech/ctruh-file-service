// /models/CustomAudio.ts

import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the CustomAudio
export interface ICustomAudio extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    title?: string;
    url?: string;
    duration?: string;
    category?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Define the Mongoose schema for CustomAudio
const CustomAudioSchema: Schema<ICustomAudio> = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'User' },
    title: { type: String, required: false },
    url: { type: String, required: false },
    duration: { type: String, required: false },
    category: { type: String, required: false },
    tags: { type: [String], required: false },
}, { timestamps: true });

// Create and export the Mongoose model using the schema and interface
const CustomAudio = mongoose.model<ICustomAudio>('CustomAudio', CustomAudioSchema);

export default CustomAudio;
