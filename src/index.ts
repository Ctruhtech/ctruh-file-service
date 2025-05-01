// src/index.ts
import express from "express";
import mongoose from "mongoose";
import { APP_PORT, MONGODB_DB, MONGODB_URI } from "./config";
import { appInitializationLogs, getHomePageHTML } from "./lib/helpers/app.helper";
import logger from "./logger/logger";
import { setupMetrics } from "./metrics";
import { addAppMetaHeaders } from "./middlewares/appMeta.middleware";
import customAudioRouter from "./routers/customAudioRouter";
import fileRouter from "./routers/fileRouter";

// Enable dotenv if you're using environment variables

const app = express();
const PORT = APP_PORT || 9003;

app.use(express.json());

//Add app meta headers X-MS-Name and X-MS-Version
app.use(addAppMetaHeaders);

// Setup service metrics
setupMetrics(app);

app.get("/", (req, res) => res.send(getHomePageHTML()));
mongoose
    .connect(MONGODB_URI, {
        dbName: MONGODB_DB,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("MongoDB connection error:", err));
app.use("/api/File", fileRouter);
app.use("/api/customAudio", customAudioRouter);

// Start the server
app.listen(PORT, () => {
    appInitializationLogs(PORT);
});

process.on("uncaughtException", (error: Error) => {
    logger.error("An uncaughtException : ", error);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(JSON.stringify(reason));
    throw error;
});
