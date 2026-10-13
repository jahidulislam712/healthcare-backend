import {v2 as cloudinary, UploadApiResponse} from "cloudinary"
import { envVars } from "./env"

cloudinary.config({
  cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
})

export const uploadImageToCloudinary = (
  buffer: Buffer,
  folder?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder ? `healthCare/${folder}` : 'healthCare',
        resource_type: "image"
      },
      (error, result) => {
        if( error ) {
          return reject(error)
        }
        if( !result ){
          return reject(new Error("Cloudinary returned no upload result."))
        }
        return resolve(result)
      }
    )
    stream.end(buffer)
  })
}

export const uploadPDFToCloudinary = (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "healthCare/prescriptions",
        public_id: fileName,
        resource_type: "raw",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary returned no PDF upload result."));
        }
        return resolve(result);
      },
    );
    stream.end(buffer);
  });
};

export const deleteImageFromCloudinary = async (public_id: string) => {
  try {
    await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });
    console.log(`Deleted image: ${public_id}`)
  } catch (error) {
    console.error(`Failed to delete Cloudinary image: ${public_id}`, error);
  }
};