import { Request, Response } from "express";
import { FileService } from "../Services/fileService";

const fileService = new FileService();

export const getAllFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getAllLogins();
    if (files.length === 0) {
      res.status(404).send("No files found");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
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
export const getFileById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getFileById(req.params.id);
    if (files.length === 0) {
      res.status(404).send("No filefound");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
export const getFileByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getFileByUserId(req.params.userId);
    if (files.length === 0) {
      res.status(404).send("No filefound");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
export const getSpecificFileByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.getSpecificFileByUserId(
      req.params.userId,
      req.query.fileType.toString()
    );
    if (files.length === 0) {
      res.status(404).send("No filefound");
    } else {
      res.status(200).json(files);
    }
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
export const uploadFileToBlobOnly = async (req, res) => {
  const file = req.file; // Extracting the file data and body data
  const nonFileParams = req.body; // Non-file related data in request body

  const userId = nonFileParams.userid;
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
  const userId = req.body.userid;
  try {
    // Call the service to handle the file logic (e.g., saving the file to a storage service)
    const cdnLink = await fileService.uploadFileFromExternalURL(
      extFile,
      userId
    );
    // t5hius is a function to get cdn liink and send a
    // Send success response
    res.status(200).json(cdnLink.bloburl);
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
    userid,
    corr2DImageUrl,
    category,
    subcategory,
    subtype,
    uploadCategory,
  } = nonFileParams;

  try {
    const uploadDetails = await fileService.uploadFile(
      file,
      fileName,
      fileType,
      isCompressed,
      userid,
      corr2DImageUrl,
      category,
      subcategory,
      subtype,
      uploadCategory
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
export const removeFileById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = await fileService.deleteBlobFile(req.params.id);

    res.status(200).json(files);
  } catch (error) {
    res.status(400).send((error as Error).message);
  }
};
