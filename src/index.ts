// src/index.ts
import express from "express";
import cors from "cors";
import fileRouter from "./Routers/fileRouter";
import mongoose from "mongoose";
import customAudioRouter from "./Routers/customAudioRouter";

// Enable dotenv if you're using environment variables


const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors()); // Enable CORS with default settings
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", async (req, res, next) => {
  try {
    res.send("I am running fine");
  } catch (err) {
    next(err); // Passes the error to the error handling middleware
  }
});
mongoose
  .connect("mongodb://localhost:27017/filedb")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));
app.use("/api/File", fileRouter);
app.use("/api/customAudio", customAudioRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
