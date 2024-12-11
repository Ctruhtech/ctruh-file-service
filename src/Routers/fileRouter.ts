import { Router } from "express";
import multer from "multer";

import { getAllFiles, getAllSystemFiles, getFileById, getFileByUserId, getSpecificFileByUserId, removeFile, uploadFile, uploadFileFromExternalURL, uploadFilesToBlobOnly } from "../Controllers/fileControllers";

const fileRouter = Router();
const upload = multer();

fileRouter.get("/getAllFiles", getAllFiles);
fileRouter.get("/getAllSystemFiles", getAllSystemFiles);
fileRouter.get("/getFileById/:id", getFileById);
fileRouter.delete("/deleteBlobFile/:id", removeFile);
fileRouter.get("/getFileByUserId/:userId", getFileByUserId);
fileRouter.get("/getSpecificFileByUserId/:userId", getSpecificFileByUserId);
// POST route for uploading a file
fileRouter.post("/uploadFileToBlobOnly", upload.single("file"), uploadFilesToBlobOnly);
fileRouter.post("/uploadFileFromExternalURL",  uploadFileFromExternalURL);
fileRouter.post("/uploadFile", upload.single("file"), uploadFile);

export default fileRouter;
  