import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

// Connection string for Azure Blob Storage
const blobConnStr = process.env.AZURE_BLOB_CONN_STR;

// Blob name (container name)
const blobName = "ctruh-test";

// Log the connection details (similar to C#)
console.log("Blob Connection String: " + blobConnStr);
console.log("Blob Name: " + blobName);

// Create a BlobServiceClient using the connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnStr);

// Get a reference to the container client
const blobContainerClient = blobServiceClient.getContainerClient(blobName);

// Example: List blobs in the container (this is just to show usage)
async function listBlobs() {
    console.log(`Listing blobs in container ${blobName}...`);
    let i = 1;
    for await (const blob of blobContainerClient.listBlobsFlat()) {
        console.log(`Blob ${i}: ${blob.name}`);
        i++;
    }
}

// listBlobs().catch(err => {
//     console.error("Error listing blobs:", err.message);
// });

export { blobServiceClient, blobContainerClient };