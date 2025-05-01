// /routes/customAudioRoutes.js

import {Router} from "express";
import { deleteCustomAudioHandler, getCustomAudioByIdHandler, getCustomAudiosByPaginationHandler, postCustomAudioHandler } from "../controllers/customAudioController";
import { upload } from "../middlewares/multer";
const customAudioRouter = Router();
customAudioRouter.post('/postCustomAudio',upload,postCustomAudioHandler);
// API Routes
customAudioRouter.get('/getCustomAudiosByPagination',getCustomAudiosByPaginationHandler);

customAudioRouter.get('/getCustomAudioById/:id',getCustomAudioByIdHandler);
customAudioRouter.delete('/deleteCustomAudio/:id',deleteCustomAudioHandler);

export default customAudioRouter;
