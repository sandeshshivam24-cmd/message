import multer from 'multer';
import path from 'path';

// Whitelisted file extensions
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|mp3|wav|ogg|mp4|webm/;

// Use memoryStorage so file binaries are held in memory buffer (req.file.buffer)
// and uploaded directly to Supabase Storage without touching local server disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extName = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
  if (extName) {
    return cb(null, true);
  }
  cb(new Error('File upload rejected: Unsupported file extension or type.'));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});
