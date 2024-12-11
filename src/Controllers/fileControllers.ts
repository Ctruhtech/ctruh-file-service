import { Request, Response } from "express";
import { FileService } from "../Services/fileServices";

const fileService = new FileService();

// Get all login files
export const getAllFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getAllFiles();

    res.status(200).json(files);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

// Get all system files
export const getAllSystemFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getAllSystemFiles();
    if (files.length === 0) {
      res.status(404).send("No files found");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

// Get a file by its ID
export const getFileById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = await fileService.getFileById(req.params.id);
    if (!file) {
      res.status(404).send("File not found");
    } else {
      res.status(200).json(file);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

// Get all files by a specific user ID
export const getFileByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getFileByUserId(req.params.userId);
    if (files.length === 0) {
      res.status(404).send("No files found for this user");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};

// Get a specific type of file by user ID (e.g., based on file type)
export const getSpecificFileByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getSpecificFileByUserId(
      req.params.userId,
      req.query.fileType?.toString() || "" // Ensure a default empty string if query param is not provided
    );
    if (files.length === 0) {
      res.status(404).send("No specific files found for this user and type");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
export const removeFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // Get the file ID from the request parameters

    // Call the service method to delete the file
    const isRemoved = await fileService.deleteBlobFile(id);
    console.log("🚀 ~ isRemoved:", isRemoved)

    if (isRemoved) {
      // Return a success response if the file is removed
      res.status(200).send(`File with ID ${id} removed successfully`);
    }
  } catch (error) {
    // Handle any errors that occurred during the delete operation
    res.status(400).send(`Error: ${(error as Error).message}`);
  }
};
export const uploadFilesToBlobOnly = async (req, res) => {
  const file = req.file; // Extracting the file data and body data
  const nonFileParams = req.body; // Non-file related data in request body

  const userId = nonFileParams.userId;
  const uploadCategory = nonFileParams.uploadCategory;
  try {
    // Call the service to handle the file logic (e.g., saving the file to a storage service)
    const cdnLink = await fileService.uploadFileToBlobOnly(
      file,
      userId,
      uploadCategory
    );
    // Send success response
    res.status(200).json(cdnLink);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the file.");
  } finally {
    // Clear the file buffer to free up memory
    if (file && file.buffer) {
      file.buffer = Buffer.alloc(0);
    }
  }
};

export const uploadFileFromExternalURL = async (req, res) => {
  const extFile = {
    fileUrl: req.body.fileUrl,
    corr2DImageUrl: req.body.corr2DImageUrl,
    fileName: req.body.fileName,
  }; // Extracting the file data and body data
  const userId = req.body.userId;
  try {
    // Call the service to handle the file logic (e.g., saving the file to a storage service)
    const cdnLink = await fileService.uploadFileFromExternalURL(
      extFile,
      userId
    );
    // t5hius is a function to get cdn liink and send a
    // Send success response
    res.status(200).json(cdnLink.blobUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the file.");
  }
};
export const uploadFile = async (req, res) => {
  const file = req.file; // Extracting the file data and body data
  const nonFileParams = req.body; // Non-file related data in request body
  const {
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
  } = nonFileParams;

  try {
    const uploadDetails = await fileService.uploadFile(
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
    );
    // Send success response
    res.status(200).json(uploadDetails);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while uploading the file.");
  } finally {
    // Clear the file buffer to free up memory
    if (file && file.buffer) {
      file.buffer = Buffer.alloc(0);
    }
  }
};
