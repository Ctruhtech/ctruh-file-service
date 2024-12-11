// /services/customAudioService.js

import CustomAudio, { ICustomAudio } from "../Models/customAudioModel";
import { BlobServiceClient } from "@azure/storage-blob"; // Ensure this is installed
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
dotenv.config();

const connectionString = process.env.AZURE_BLOB_CONN_STR;
const containerPrefix = "user-"; // Prefix with the user id for container nam

// Get Custom Audios with Pagination
export const getCustomAudiosByPagination = async (
  userId: any,
  pageLimit: number,
  pageNumber: number,
  titleQuery?: string,
  tagQueries?: string
) => {
  try {
    // Define the query object with the userId (typed correctly based on ICustomAudio)
    const query: any = { userId };  // Use `any` type here to allow MongoDB operators

    // If tags are provided, add a filter for matching tags
    if (tagQueries) {
      const tagsArray = tagQueries.split(',').map(tag => tag.trim());
      query.tags = { $in: tagsArray };  // Use $in to match any of the tags
    }

    // Fetch the count of documents matching the query to handle pagination
    const totalAudios = await CustomAudio.countDocuments(query);

    // Apply pagination and fetch the results
    const audios = await CustomAudio.find(query)
      .skip((pageNumber - 1) * pageLimit)  // Skipping the documents for pagination
      .limit(pageLimit)                   // Limit the number of results per page
      .exec();

    // If titleQuery is provided, filter the results in memory (case-insensitive)
    if (titleQuery) {
      const lowerCaseTitleQuery = titleQuery.toLowerCase();
      // Filter audios to check if title includes the titleQuery (case-insensitive)
      const filteredAudios = audios.filter(audio =>
        audio.title.toLowerCase().includes(lowerCaseTitleQuery)
      );
      return {
        audios: filteredAudios,
        totalAudios
      };
    }

    // If no titleQuery is provided, just return the paginated results
    return {
      audios,
      totalAudios
    };
  } catch (error) {
    throw new Error("Error fetching custom audios by pagination: " + error.message);
  }
};
// Post a new Custom Audio
export const postCustomAudio = async (
  userId,
  title,
  url,
  duration,
  category,
  tags
) => {
  try {
    const newCustomAudio = new CustomAudio({
      userId,
      title,
      url,
      duration,
      category,
      tags,
      id: uuidv4(), // Generate a unique ID (instead of using a timestamp)
    });

    // Save to database (assuming mongoose model)
    await newCustomAudio.save();
    return newCustomAudio;
  } catch (error) {
    throw new Error("Error creating custom audio: " + error.message);
  }
};

// Get Custom Audio by ID
export const getCustomAudioById = async (id) => {
  try {
    const customAudio = await CustomAudio.findById(id);
    if (!customAudio) {
      throw new Error("Custom Audio not found");
    }
    return customAudio;
  } catch (error) {
    throw new Error("Error fetching custom audio by ID: " + error.message);
  }
};

// Delete Custom Audio by ID
export const deleteCustomAudio = async (id) => {
  try {
    const customAudio = await CustomAudio.findByIdAndDelete(id);
    if (!customAudio) {
      throw new Error("Custom Audio not found");
    }
    return customAudio;
  } catch (error) {
    throw new Error("Error deleting custom audio: " + error.message);
  }
};

// Upload file to Azure Blob Storage and return CDN URL
export const uploadFileToBlob = async (userId, file) => {
  try {
    // Generate a unique blob file name using GUID
    const fileExtension = path.extname(file.originalname); // Get file extension from original file name
    const blobName = `${uuidv4()}${fileExtension}`; // Generate a unique blob name

    // Get the container name (using userId to dynamically generate it)
    const containerName = `${containerPrefix}${userId}`;

    // Create BlobServiceClient instance
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create the container if it doesn't exist
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      await containerClient.create(); // Create a new container
    }

    // Get a block blob client to upload the file
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the file (file.data is the buffer of the file)
    const buffer = Buffer.from(file.buffer); // Assuming file.buffer is a Buffer
    await blockBlobClient.upload(buffer, buffer.length);

    // Construct the CDN URL for the uploaded file
    const blobUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`;

    return blobUrl;
  } catch (error) {
    throw new Error("Error uploading file to blob storage: " + error.message);
  }
};
// Function to delete a specific audio by audioId and remove it from DB and Blob Storage
export const deleteCustomAudioById = async (audioId) => {
  try {
    // Step 1: Find the audio by audioId
    const audio = await CustomAudio.findOne({ _id: new ObjectId(audioId) });
    if (!audio) {
      throw new Error('Audio not found');
    }

    // Step 2: Delete the audio from the database
  

    // Step 3: Delete the file from Azure Blob Storage
    await deleteBlobFile(audio.userId, audio.url);  // Delete from blob storage using userId and file url
    await CustomAudio.deleteOne({ _id: new ObjectId(audioId) });  // Delete from DB using audioId });

    return { message: 'Audio deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting custom audio: ' + error.message);
  }
};

// Helper function to delete the file from Azure Blob Storage
const deleteBlobFile = async (userId, fileUrl) => {
  try {
    // Create BlobServiceClient instance from the connection string
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Extract the blob name from the URL (assuming the URL format is:
    // `https://[account].blob.core.windows.net/[container]/[blobName]`)
    const parsedUrl = new URL(fileUrl);
    const containerName = `${containerPrefix}${userId}`;  // Container name format: user-[userId]
    const blobName = parsedUrl.pathname.split('/').pop();  // Extract the blob name (file name)

    // Get the container client and block blob client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // Delete the blob from Azure Blob Storage
    await blobClient.deleteIfExists();

    console.log(`Blob ${blobName} deleted successfully from container ${containerName}`);
  } catch (error) {
    throw new Error('Error deleting file from blob storage: ' + error.message);
  }
};