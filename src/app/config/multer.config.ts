import multer from "multer";
import sharp from "sharp";

export const validateImageDimensions = async (
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number,
) => {
  const { width, height } = await sharp(buffer).metadata();

  if (!width || !height) {
    throw new Error("Invalid image.");
  }

  if (width > maxWidth || height > maxHeight) {
    throw new Error(
      `Image must not exceed ${maxWidth}x${maxHeight}.`,
    );
  }

  return { width, height };
};


export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});
