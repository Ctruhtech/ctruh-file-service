import { ObjectId } from "mongodb";
import {
  deleteCustomAudio,
  deleteCustomAudioById,
  getCustomAudioById,
  getCustomAudiosByPagination,
  postCustomAudio,
  uploadFileToBlob,
} from "../Services/customAudioService";



// Post a new Custom Audio
export const postCustomAudioHandler = async (req, res) => {
  const { userId, title, duration, category = "", tags = "" } = req.body;
  const file = req.file;  // multer automatically places the uploaded file in req.file

  // Split the tags into an array
  const tagList = tags ? tags.split(",").map((tag) => tag.trim()) : [];

  // Validate if the file is provided
  if (!file) {
    return res.status(400).json({ message: "Invalid file" });
  }

  try {
    // Step 1: Upload file to blob storage and get the CDN URL
    const blobUrl = await uploadFileToBlob(userId, file);

    // Step 2: Create a new CustomAudio entry with the uploaded file's URL
    const newCustomAudio = await postCustomAudio( new ObjectId(userId), title, blobUrl, duration, category, tagList);

    // Step 3: Send response with the new CustomAudio object
    res.status(201).json(newCustomAudio);
  } catch (error) {
    console.error("Error posting custom audio:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Custom Audio by ID
export const getCustomAudioByIdHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const customAudio = await getCustomAudioById(id);
    res.status(200).json(customAudio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Custom Audio by ID
export const deleteCustomAudioHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const customAudio = await deleteCustomAudioById(id);
    res.status(200).json({ message: "Custom Audio deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomAudiosByPaginationHandler = async (req, res) => {
  const { userId, pageLimit = 10, pageNumber = 1, titleQuery = null, tagQueries = null } = req.query;

  // Validate if the userId is provided
  if (!userId) {
    return res.status(400).json({ message: "Please provide a valid userId." });
  }

  try {
    // Fetch the custom audios with pagination and optional filtering by title and tags
    const audios = await getCustomAudiosByPagination(new ObjectId(userId), pageLimit, pageNumber, titleQuery, tagQueries);
    res.status(200).json(audios);
  } catch (error) {
    console.error('Error fetching paginated audios:', error);
    res.status(500).json({ message: error.message });
  }
};
