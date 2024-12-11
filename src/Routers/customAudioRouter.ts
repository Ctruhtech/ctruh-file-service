// /routes/customAudioRoutes.js

import {Router} from "express";
import { deleteCustomAudioHandler, getCustomAudioByIdHandler, getCustomAudiosByPaginationHandler, postCustomAudioHandler } from "../Controllers/customAudioController";
import { upload } from "../Configs/middleware";
const customAudioRouter = Router();
customAudioRouter.post('/postCustomAudio',upload,postCustomAudioHandler);
// API Routes
customAudioRouter.get('/getCustomAudiosByPagination',getCustomAudiosByPaginationHandler);

customAudioRouter.get('/getCustomAudioById/:id',getCustomAudioByIdHandler);
customAudioRouter.delete('/deleteCustomAudio/:id',deleteCustomAudioHandler);

export default customAudioRouter;
