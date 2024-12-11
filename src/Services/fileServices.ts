import { FileModel, IFile } from "../Models/fileModel";
import { Readable } from "stream";
import crypto from "crypto";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ClientSecretCredential } from "@azure/identity";
import {
  blobContainerClient,
  blobServiceClient,
} from "../Containers/blobClient";
import objectsContainer from "../Containers/fileContainer";
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";
dotenv.config();

export class FileService {
  // Fetch all logins
  async getAllFiles(): Promise<any[]> {
    try {
      // Mongoose query to fetch all documents (logins) from the "File" collection
      const files = await FileModel.find().exec();

      if (files.length === 0) {
        return [];
      }

      return files;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  // Fetch all system files
  async getAllSystemFiles(): Promise<any[]> {
    try {
      // Mongoose query to fetch all system-defined files
      const files = await FileModel.find({ uploadCategory: "system-defined" })
        .sort({ sequence: 1 }) // Assuming there is a sequence field for ordering
        .exec();

      if (files.length === 0) {
        return [];
      }

      return files;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  // Fetch file by ID
  async getFileById(id: string): Promise<any | null> {
    console.log(`🚀 ~ FileService ~ getFileById ~ id: ${id}`);

    try {
      // Query the database using the ObjectId
      const file = await FileModel.findOne({ fileId: id.toString() }).exec();

      if (!file) {
        console.log("No file found with the given ID.");
        return null; // No file found
      }

      return file; // Return the file document
    } catch (error) {
      console.error(`Error fetching file by ID: ${error.message}`);
      throw new Error(`Error fetching file by ID: ${error.message}`);
    }
  }

  // Fetch files by user ID
  async getFileByUserId(userId: string): Promise<any[]> {
    try {
      const files = await FileModel.find({ userId: userId }).exec();

      if (files.length === 0) {
        return []; // No files found for this user
      }

      return files;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  // Fetch specific file by user ID and type
  async getSpecificFileByUserId(userId: string, type: string): Promise<any[]> {
    try {
      const files = await FileModel.find({ userId: userId, type }).exec();

      if (files.length === 0) {
        return []; // No files found for this user and type
      }

      return files;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
  async removeFileFromDatabase(id: string): Promise<boolean> {
    try {
      // Use Mongoose's `findByIdAndDelete` to remove the file by its ID
      const result = await FileModel.findOneAndDelete({ fileId: id }).exec();

      if (!result) {
        throw new Error(`File with ID not found`);
      }

      // Return true if deletion is successful
      return true;
    } catch (error) {
      // Log and handle any errors that occur during the delete operation
      console.error("Error removing file from database:", error.message);
      throw new Error(
        `Failed to remove filefrom the database: ${error.message}`
      );
    }
  }
  // Simulated database functions for file operations
  async getFileFromDatabase(id) {
    console.log("🚀 ~ FileService ~ getFileFromDatabase ~ id:", id);
    try {
      const file = await this.getFileById(id.toString());
      return file;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async saveFileToDatabase(newFile) {
    try {
      const file = await FileModel.create(newFile);
      return file;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async uploadFile(
    file,
    fileName,
    fileType,
    isCompressed,
    userId,
    corr2DImageUrl,
    category,
    subCategory,
    subType,
    uploadCategory,
    blobId
  ) {
    try {
      // Step 1: Generate a new GUID for the file (if needed for filename, not the MongoDB _id)
      const newGuid = uuidv4(); // Generate a GUID for the file name
      const extension = file.originalname.split(".").pop();
      const systemFileName = `${newGuid}.${extension}`;

      // Step 2: Determine the container client
      let containerClient;
      if (uploadCategory.includes("user")) {
        const containerName = `user-${userId}`;
        containerClient = blobServiceClient.getContainerClient(containerName);
      } else {
        containerClient = blobContainerClient; // Default container
      }

      // Step 3: Ensure the container exists or create it
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        console.log(
          `Container ${containerClient.containerName} does not exist, creating it.`
        );
        await containerClient.create({ access: "blob" });
      }

      // Step 4: Get a reference to the blob
      const blobClient = containerClient.getBlockBlobClient(systemFileName);

      // Step 5: Validate the file
      if (!file || file.size <= 0) {
        throw new Error("Invalid file. The file is empty or missing.");
      }

      // Step 6: Upload file in blocks
      const blockSize = 4 * 1024 * 1024; // 4MB block size
      const blockIDArrayList: string[] = [];
      const tasks = [];
      let offset = 0;
      const fileBuffer = file.buffer;

      // Upload in blocks
      while (offset < fileBuffer.length) {
        const blockID = Buffer.from(uuidv4()).toString("base64");
        blockIDArrayList.push(blockID);

        const chunk = fileBuffer.slice(offset, offset + blockSize);

        // Create a custom readable stream for the chunk
        const chunkStream = new Readable({
          read() {
            this.push(chunk);
            this.push(null); // End of stream
          },
        });

        // Upload the chunk asynchronously
        tasks.push(
          blobClient
            .stageBlock(blockID, chunkStream, chunk.length)
            .catch((err) => {
              console.error(`Failed to upload block: ${blockID}`, err.message);
              throw new Error(`Failed to upload block: ${blockID}`);
            })
        );

        offset += blockSize;
      }

      // Step 7: Wait for all block uploads to finish
      await Promise.all(tasks);

      // Step 8: Commit the blocks to finalize the file upload
      await blobClient.commitBlockList(blockIDArrayList);

      // Step 9: Construct the URL for the uploaded file
      const blobUrl = blobClient.url;
      const cdnBaseUrl = "https://ctruhcdn.azureedge.net";
      const cdnUrl = `${cdnBaseUrl}${blobUrl.substring(
        blobUrl.indexOf("/", 8)
      )}`;


      // 7. Construct the blob file URL
      const blobFilePath = blobClient.url;

      // 8. Get the blob ID (last part of the URL)
      const blobId = blobFilePath.split("/").pop();

      // Step 10: Check if the file already exists in the database
      const existingFile = await this.getFileById(newGuid); // No change needed if using ObjectId for DB

      if (!existingFile) {
        const newFile = {
          fileId: newGuid,
          userId,
          type: fileType,
          fileName,
          fileExtension: extension,
          isCompressed,
          category,
          subCategory,
          subType,
          uploadCategory,
          blobUrl: cdnUrl,
          corr2DImageUrl, // Assuming this URL is provided or generated elsewhere
        };

        console.log("🚀 ~ FileService ~ newFile:", newFile);

        // Save the new file info in the database
        await this.saveFileToDatabase(newFile);

        return newFile; // Return the new file info
      } else {
        console.log("File already exists, returning existing file.");
        return existingFile; // Return existing file info if it exists
      }
    } catch (error) {
      console.error("🚨 ~ FileService ~ uploadFile failed:", error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  // Delete the blob file and purge it from CDN
  async deleteBlobFile(id) {
    try {
      const existingFile = await this.getFileFromDatabase(id); // Replace with actual DB fetch
      console.log(
        "🚀 ~ FileService ~ deleteBlobFile ~ existingFile:",
        existingFile
      );

      if (!existingFile) {
        throw new Error(`File with ID ${id} does not exist!`);
      }

      const containerName = existingFile.blobId; // or username
      console.log("🚀 ~ FileService ~ deleteBlobFile ~ containerName:", containerName)
      let containerClient;

      // Files in the "editor" container
      if (containerName === "editor") {
        containerClient = blobServiceClient.getContainerClient(containerName);

        if (existingFile.blobUrl) {
          // Delete the main blob and handle failure
          const deleteBlobFileResult = await this.deleteBlobFileAsync(
            existingFile.blobUrl,
            containerClient
          );
          console.log(
            "🚀 ~ FileService ~ deleteBlobFile ~ deleteBlobFileResult:",
            deleteBlobFileResult
          );
          const cdnPurgeBlobFileResult = await this.cdnPurgeAsync(
            existingFile.blobUrl
          );
          console.log(
            "🚀 ~ FileService ~ deleteBlobFile ~ cdnPurgeBlobFileResult:",
            cdnPurgeBlobFileResult
          );

          if (!deleteBlobFileResult || !cdnPurgeBlobFileResult) {
            throw new Error("GLTF file Blob deletion or CDN purge failed");
          }
        }

        if (existingFile.corr2DImageUrl) {
          // Delete the image blob and handle failure
          const deleteImageFileResult = await this.deleteBlobFileAsync(
            existingFile.corr2DImageUrl,
            containerClient
          );
          const cdnPurgeImageFileResult = await this.cdnPurgeAsync(
            existingFile.corr2DImageUrl
          );

          if (!deleteImageFileResult || !cdnPurgeImageFileResult) {
            throw new Error("Image file Blob deletion or CDN purge failed");
          }
        }

        await this.removeFileFromDatabase(existingFile.fileId); // Replace with actual DB remove logic
      } else {
        // For files NOT in the "editor" container
        containerClient = blobServiceClient.getContainerClient(containerName);
        console.log("🚀 ~ FileService ~ deleteBlobFile ~ containerClient:", containerClient)
        const imageUrl = existingFile.corr2DImageUrl
          ? existingFile.corr2DImageUrl.split("/").pop()
          : "";

        await this.deleteBlobIfExists(
          containerClient,
          existingFile.id + "." + existingFile.fileextension
        );
        await this.deleteBlobIfExists(containerClient, imageUrl);

        await this.removeFileFromDatabase(existingFile); // Replace with actual DB remove logic
      }

      return "Blob deleted and purged successfully!";
    } catch (error) {
      console.error("File could not be deleted:", error.message);
      throw new Error(`File could not be deleted! ${error.message}`);
    }
  }

  // Helper method to delete a blob from the container
  async deleteBlobFileAsync(blobUrl, containerClient) {
    try {
      const fileUri = new URL(blobUrl);
      const filePath = fileUri.pathname.slice(1); // Remove leading slash

      const blobClient = containerClient.getBlobClient(filePath);

      if (await blobClient.exists()) {
        await blobClient.deleteIfExists();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Blob deletion failed:", error.message);
      return false;
    }
  }

  // Helper method to purge the CDN
  async cdnPurgeAsync(blobUrl) {
    try {
      // Retrieve environment variables
      const {
        CLIENTID,
        CLIENTSECRETID,
        CLIENTSECRETVALUE,
        TENANTID,
        SUBSCRIPTIONID,
        RESOURCEGROUPNAME,
        PROFILENAME,
      } = process.env;

      // Set up the ClientSecretCredential
      const credential = new ClientSecretCredential(
        TENANTID,
        CLIENTID,
        CLIENTSECRETVALUE
      );

      // Get the token for authentication
      const tokenResponse = await credential.getToken(
        "https://management.azure.com/.default"
      );
      console.log("🚀 ~ FileService ~ cdnPurgeAsync ~ tokenResponse:", tokenResponse)

      // Construct the CDN purge endpoint URL
      const endpointUrl = `https://management.azure.com/subscriptions/${SUBSCRIPTIONID}/resourceGroups/${RESOURCEGROUPNAME}/providers/Microsoft.Cdn/profiles/${PROFILENAME}/endpoints/${PROFILENAME}/purge?api-version=2023-05-01`;

      // Parse the blob URL to extract the path
      const parsedUrl = new URL(blobUrl);
      const pathWithSlash = parsedUrl.pathname.startsWith("/")
        ? parsedUrl.pathname
        : `/${parsedUrl.pathname}`;

      // Set up the request body for the purge request
      const requestBody = {
        contentPaths: [pathWithSlash],
      };

      // Send the purge request to the CDN
      const response = await axios.post(endpointUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${tokenResponse.token}`,
          "Content-Type": "application/json",
        },
      });

      // Check the response status to determine if the purge was successful
      return response.status === 200;
    } catch (error) {
      console.error("CDN purge failed:", error.message);
      return false; // Return false in case of failure
    }
  }

  // Helper method to check and delete blob if exists
  async deleteBlobIfExists(containerClient, blobName) {
    try {
      console.log("i am here");
      const blobClient = containerClient.getBlobClient(blobName);

      if (await blobClient.exists()) {
        await blobClient.deleteIfExists();
      }
    } catch (error) {
      console.error(`Error deleting blob ${blobName}:`, error.message);
    }
  }
  async uploadFileToBlobOnly(file, userId, uploadCategory) {
    try {
      // Generate a new GUID for the file and get its extension
      const newGuid = uuidv4();
      const extension = file.originalname.split(".").pop();
      const systemFileName = newGuid + "." + extension;

      // Determine container client
      let containerClient;
      if (uploadCategory.includes("user")) {
        const containerName = `user-${userId}`;
        containerClient = blobServiceClient.getContainerClient(containerName);
      } else {
        containerClient = blobContainerClient;
      }

      // Ensure the container exists, if not, create it
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        await containerClient.create({ access: "blob" });
      }

      // Get a reference to the block blob
      const blobClient = containerClient.getBlockBlobClient(systemFileName);

      // Check if file is valid
      if (!file || file.size <= 0) {
        throw new Error("Invalid file");
      }

      // Define block size and list for block IDs
      const blockSize = 4 * 1024 * 1024; // 4MB block size
      const blockIDArrayList = [];
      const tasks = [];

      // Read the file in chunks and upload them
      let offset = 0;
      const fileBuffer = file.buffer; // If using 'multer' or similar, 'file.buffer' gives the file content as a Buffer

      // Read and upload in blocks asynchronously
      while (offset < fileBuffer.length) {
        const blockID = btoa(crypto.randomUUID()); // Block ID should be base64 encoded GUID
        blockIDArrayList.push(blockID);

        const chunk = fileBuffer.slice(offset, offset + blockSize); // Use Buffer.slice() instead of file.slice()

        if (chunk.length === 0) {
          throw new Error("Chunk is empty, unable to upload block.");
        }

        // Create a custom Readable stream for the chunk
        const chunkStream = new Readable({
          read() {
            this.push(chunk); // Push the chunk into the stream
            this.push(null); // End the stream
          },
        });

        // Make sure to set the content length for each chunk (this is crucial for Azure to understand the chunk size)
        tasks.push(
          new Promise<void>(async (resolve, reject) => {
            try {
              // Upload the chunk as a block with the content length specified
              await blobClient.stageBlock(blockID, chunkStream, chunk.length); // Specify the chunk length here
              resolve();
            } catch (error) {
              reject(error);
            }
          })
        );

        offset += blockSize;
      }

      // Wait for all tasks to complete
      await Promise.all(tasks);

      // Commit the blocks
      await blobClient.commitBlockList(blockIDArrayList);

      // Construct the blob URL
      const blobUrl = blobClient.url;

      // Create the CDN URL (adjust the base URL as needed)
      const cdnBaseUrl = "https://ctruhcdn.azureedge.net";
      const cdnUrl = `${cdnBaseUrl}${blobUrl.substring(
        blobUrl.indexOf("/", 8)
      )}`;

      // Return the CDN URL
      return cdnUrl;
    } catch (error) {
      console.error("File upload failed:", error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
  async uploadFileFromExternalURL(extFile, userId) {
    try {
      // 1. Generate a new GUID for the file and set its extension
      const newGuid = uuidv4();
      const extension = "glb"; // Assuming extension is fixed for now
      const systemFileName = `${newGuid}.${extension}`;

      // 2. Construct the container name
      const containerName = `user-${userId.toString().toLowerCase()}`; // Ensure userId is lowercase
      const containerClient =
        blobServiceClient.getContainerClient(containerName);

      // 3. Ensure the container exists, create if it does not
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        await containerClient.create({ access: "blob" }); // Public read access for blobs
      }

      // 4. Download the file from the provided external URL
      const response = await axios.get(extFile.fileUrl, {
        responseType: "arraybuffer",
      });
      const fileBuffer = response.data;
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("Failed to download the file from the provided URL.");
      }

      // 5. Get the block blob client to upload the file
      const blobClient = containerClient.getBlockBlobClient(systemFileName);

      // 6. Upload the file buffer to Azure Blob Storage
      await blobClient.upload(fileBuffer, fileBuffer.length);

      // 7. Construct the blob file URL
      const blobFilePath = blobClient.url;

      // 8. Get the blob ID (last part of the URL)
      const blobId = blobFilePath.split("/").pop();
      // 9. Check if the file already exists in the database (simulate this part)
      const fileExists = await this.getFileFromDatabase(newGuid);

      let newFile;
      if (!fileExists) {
        // 10. Create a new file entry
        newFile = {
          fileId: newGuid,
          fileName: extFile.fileName,
          fileExtension: extension,
          blobUrl: blobFilePath,
          isCompressed: false,
          corr2DImageUrl: extFile.corr2DImageUrl, // Using provided correlated image URL
          type: "sketchfab", // Static type for this example
          uploadCategory: "user-defined", // Static upload category
          userId: userId,
          blobId: blobId,
        };

        // Simulate saving the file entry to a database
        await this.saveFileToDatabase(newFile);

        return newFile; // Return the newly created file
      } else {
        // 11. Return the existing file entry if it already exists
        return fileExists;
      }
    } catch (error) {
      console.error("File upload failed:", error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
}
