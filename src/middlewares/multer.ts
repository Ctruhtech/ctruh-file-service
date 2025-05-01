import multer from 'multer';

// Set up file storage and file filter (e.g., only allow audio files)
const storage = multer.memoryStorage();  // Store the file in memory for direct upload to Azure Blob

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg']; // Example MIME types
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false); // Reject file if MIME type is not allowed
  }
};

// Set up the multer instance with file size limit and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limit file size to 50 MB (adjust as needed)
  },
}).single('file'); // 'file' is the field name for the uploaded file

export { upload };
