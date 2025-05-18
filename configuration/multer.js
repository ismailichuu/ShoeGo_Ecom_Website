
import multer from "multer";
import path from "path";
import fs from "fs";

// Dynamic storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/uploads/products';

    if (req.originalUrl.includes('/profile')) {
      folder = 'public/uploads/profiles';
    }

    // Ensure folder exists
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb('Only image files (jpg, jpeg, png, webp) are allowed');
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export default upload;
