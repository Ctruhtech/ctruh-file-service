import {
  blobContainerClient,
  blobServiceClient,
} from "../Containers/blobClient";
import objectsContainer from "../Containers/fileContainer";
import { BlobServiceClient } from "@azure/storage-blob";
import { Readable } from "stream";
import crypto from "crypto";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ClientSecretCredential } from "@azure/identity";
import dotenv from "dotenv";
dotenv.config();

export class FileService {
  async getAllLogins(): Promise<any[]> {
    try {
      const querySpec = {
        query: "SELECT * FROM c",
      };
      const { resources: logins } = await objectsContainer.items
        .query(querySpec)
        .fetchAll();

      //only return id , userid and passeprd from logins
      let loginDetails = logins.map((login) => {
        return {
          id: login.id,
          filename: login.filename,
          fileextension: login.fileextension,
          type: login.type,
          isCompressed: login.isCompressed,
          category: login.category,
          subcategory: login.subcategory,
          subtype: login.subtype,
          uploadCategory: login.uploadCategory,
          bloburl: login.bloburl,
          blobId: login.blobId,
          corr2DImageUrl: login.corr2DImageUrl,
          userid: login.userid,
        };
      });

      return loginDetails;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
  async getAllSystemFiles() {
    try {
      const querySpec = {
        query:
          "SELECT * FROM c WHERE c.uploadCategory = 'system-defined' ORDER BY c.sequence",
      };

      // Query the database (Cosmos DB in your case, assuming the same context as in your example)
      const { resources: files } = await objectsContainer.items
        .query(querySpec)
        .fetchAll();

      // Map the files to the required structure (similar to how you select and project properties in the C# code)
      const fileDetails = files.map((file) => {
        return {
          id: file.id,
          filename: file.filename,
          fileextension: file.fileextension,
          type: file.type,
          isCompressed: file.isCompressed,
          category: file.category,
          subcategory: file.subcategory,
          subtype: file.subtype,
          uploadCategory: file.uploadCategory,
          bloburl: file.bloburl,
          blobId: file.blobId,
          corr2DImageUrl: file.corr2DImageUrl,
          userid: file.userid,
        };
      });

      return fileDetails;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getFileById(id: String): Promise<any> {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [
          {
            name: "@id",
            value: id,
          },
        ],
      };

      // Query the database (Cosmos DB in your case, assuming the same context as in your previous example)
      const { resources: files } = await objectsContainer.items
        .query(querySpec)
        .fetchAll();

      // If no file is found with the provided ID, return null or handle it as per your requirement
      if (files.length === 0) {
        return null; // Or handle the "not found" scenario differently
      }

      // Assuming we only expect one file to be returned
      const file = files[0];

      // Map the file to the desired response format
      const fileDetails = {
        id: file.id,
        filename: file.filename,
        fileextension: file.fileextension,
        type: file.type,
        isCompressed: file.isCompressed,
        category: file.category,
        subcategory: file.subcategory,
        subtype: file.subtype,
        uploadCategory: file.uploadCategory,
        bloburl: file.bloburl,
        blobId: file.blobId, // Fix: Was using bloburl in the C# code for blobId
        corr2DImageUrl: file.corr2DImageUrl,
        userid: file.userid,
      };

      return fileDetails;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getFileByUserId(userId: String): Promise<any> {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.userid = @userid",
        parameters: [
          {
            name: "@userid",
            value: userId,
          },
        ],
      };

      // Query the database (Cosmos DB in your case, assuming the same context as in your previous example)
      const { resources: files } = await objectsContainer.items
        .query(querySpec)
        .fetchAll();

      // If no file is found with the provided ID, return null or handle it as per your requirement
      if (files.length === 0) {
        return null; // Or handle the "not found" scenario differently
      }
      const fileDetails = files.map((file) => {
        return {
          id: file.id,
          filename: file.filename,
          fileextension: file.fileextension,
          type: file.type,
          isCompressed: file.isCompressed,
          category: file.category,
          subcategory: file.subcategory,
          subtype: file.subtype,
          uploadCategory: file.uploadCategory,
          bloburl: file.bloburl,
          blobId: file.blobId,
          corr2DImageUrl: file.corr2DImageUrl,
          userid: file.userid,
        };
      });

      return fileDetails;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSpecificFileByUserId(userId: String, type: String): Promise<any> {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.userid = @userid AND c.type = @type",
        parameters: [
          {
            name: "@userid",
            value: userId,
          },
          {
            name: "@type",
            value: type,
          },
        ],
      };

      // Query the database (Cosmos DB in your case, assuming the same context as in your previous example)
      const { resources: files } = await objectsContainer.items
        .query(querySpec)
        .fetchAll();

      // If no file is found with the provided ID, return null or handle it as per your requirement
      if (files.length === 0) {
        return null; // Or handle the "not found" scenario differently
      }
      const fileDetails = files.map((file) => {
        return {
          id: file.id,
          filename: file.filename,
          fileextension: file.fileextension,
          type: file.type,
          isCompressed: file.isCompressed,
          category: file.category,
          subcategory: file.subcategory,
          subtype: file.subtype,
          uploadCategory: file.uploadCategory,
          bloburl: file.bloburl,
          blobId: file.blobId,
          corr2DImageUrl: file.corr2DImageUrl,
          userid: file.userid,
        };
      });

      return fileDetails;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async uploadFileToBlobOnly(file, userId, uploadCategory) {
    try {
      // Generate a new GUID for the file and get its extension
      const newGuid = crypto.randomUUID();
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
      const newGuid = crypto.randomUUID();
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
          id: newGuid,
          filename: extFile.fileName,
          fileextension: extension,
          bloburl: blobFilePath,
          isCompressed: false,
          corr2DImageUrl: extFile.corr2DImageUrl, // Using provided correlated image URL
          type: "sketchfab", // Static type for this example
          uploadCategory: "user-defined", // Static upload category
          userid: userId,
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

  // Simulated database functions for file operations
  async getFileFromDatabase(id) {
    // Simulate querying the database for an existing file by ID
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };

    // Simulate a database query (assuming CosmosDB-like behavior)
    const { resources: files } = await objectsContainer.items
      .query(querySpec)
      .fetchAll();
    return files.length > 0 ? files[0] : null;
  }

  async saveFileToDatabase(newFile) {
    const { resource: file } = await objectsContainer.items.create(newFile);
    return file;
  }

  async uploadFile(
    file,
    fileName,
    fileType,
    isCompressed,
    userId,
    corr2DImageUrl,
    category,
    subcategory,
    subtype,
    uploadCategory
  ) {
    try {
      // Generate a new GUID for the file
      const newGuid = uuidv4();
      const extension = file.originalname.split(".").pop();
      const systemFileName = newGuid + "." + extension;

      let containerClient;

      if (uploadCategory.includes("user")) {
        const containerName = `user-${userId}`;
        containerClient = blobServiceClient.getContainerClient(containerName);
      } else {
        containerClient = blobContainerClient;
      }

      // Check if the container exists and create if not
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        await containerClient.create({ access: "blob" });
      }

      // Get a reference to the blob
      const blobClient = containerClient.getBlockBlobClient(systemFileName);

      // Ensure file is valid
      if (!file || file.size <= 0) {
        throw new Error("Invalid file");
      }

      // Define block size and list for block IDs
      const blockSize = 4 * 1024 * 1024; // 4MB block size
      const blockIDArrayList = [];
      const tasks = [];

      let offset = 0;
      const fileBuffer = file.buffer; // Assuming file.buffer holds the binary content

      // Upload file in blocks asynchronously
      while (offset < fileBuffer.length) {
        const blockID = Buffer.from(uuidv4()).toString("base64"); // Block ID should be base64 encoded GUID
        blockIDArrayList.push(blockID);

        const chunk = fileBuffer.slice(offset, offset + blockSize);

        // Create a custom Readable stream for the chunk
        const chunkStream = new Readable({
          read() {
            this.push(chunk);
            this.push(null); // End the stream
          },
        });

        // Upload the chunk as a block
        tasks.push(
          new Promise((resolve, reject) => {
            blobClient
              .stageBlock(blockID, chunkStream, chunk.length)
              .then(resolve)
              .catch(reject);
          })
        );

        offset += blockSize;
      }

      // Wait for all block upload tasks to complete
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

      // Insert the file metadata into your database
      const newFile = {
        id: newGuid,
        filename: fileName,
        fileextension: extension,
        bloburl: cdnUrl,
        isCompressed,
        corr2DImageUrl,
        type: fileType,
        uploadCategory,
        userid: userId,
        category,
        subcategory,
        subtype,
      };

      const existingFile = await this.getFileFromDatabase(newGuid);

      if (!existingFile) {
        await this.saveFileToDatabase(newFile);
        return newFile; // Return the new file info
      } else {
        return existingFile; // If file exists, return existing file info
      }
    } catch (error) {
      console.error("File upload failed:", error.message);
      throw new Error(error.message);
    }
  }
  // Delete the blob file and purge it from CDN
  async deleteBlobFile(id) {
    try {
      const existingFile = await this.getFileFromDatabase(id); // Replace with actual DB fetch
      if (!existingFile) {
        throw new Error(`File with ID ${id} does not exist!`);
      }

      const containerName = existingFile.blobId; // or username
      let containerClient;

      // Files in the "editor" container
      if (containerName === "editor") {
        containerClient = blobServiceClient.getContainerClient(containerName);

        if (existingFile.bloburl) {
          // Delete the main blob and handle failure
          const deleteBlobFileResult = await this.deleteBlobFileAsync(
            existingFile.bloburl,
            containerClient
          );
          const cdnPurgeBlobFileResult = await this.cdnPurgeAsync(
            existingFile.bloburl
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

        await this.removeFileFromDatabase(existingFile); // Replace with actual DB remove logic
      } else {
        // For files NOT in the "editor" container
        containerClient = blobServiceClient.getContainerClient(containerName);
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
        PROFILENAME 
      } = process.env;
  
      // Set up the ClientSecretCredential
      const credential = new ClientSecretCredential(TENANTID, CLIENTID, CLIENTSECRETVALUE);
  
      // Get the token for authentication
      const tokenResponse = await credential.getToken("https://management.azure.com/.default");
  
      // Construct the CDN purge endpoint URL
      const endpointUrl = `https://management.azure.com/subscriptions/${SUBSCRIPTIONID}/resourceGroups/${RESOURCEGROUPNAME}/providers/Microsoft.Cdn/profiles/${PROFILENAME}/endpoints/${PROFILENAME}/purge?api-version=2023-05-01`;
  
      // Parse the blob URL to extract the path
      const parsedUrl = new URL(blobUrl);
      const pathWithSlash = parsedUrl.pathname.startsWith("/") ? parsedUrl.pathname : `/${parsedUrl.pathname}`;
  
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
      return false;  // Return false in case of failure
    }
  }

  // Helper method to check and delete blob if exists
  async deleteBlobIfExists(containerClient, blobName) {
    try {
      const blobClient = containerClient.getBlobClient(blobName);

      if (await blobClient.exists()) {
        await blobClient.deleteIfExists();
      }
    } catch (error) {
      console.error(`Error deleting blob ${blobName}:`, error.message);
    }
  }

  async removeFileFromDatabase(file) {
    try {
      // Delete the file from Cosmos DB using its ID
      await objectsContainer.item(file.id).delete();
      return true; // Return success
    } catch (error) {
      // Log and handle any errors that occur during the delete operation
      console.error("Error removing file from database:", error.message);
      throw new Error(
        `Failed to remove file ${file.id} from the database: ${error.message}`
      );
    }
  }
}
