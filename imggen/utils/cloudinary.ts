
import { CloudinaryUploadResponse } from "@/schema/cloudinaryUpload";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadBufferToCloudinary = async (buffer: Buffer, folder: string) => {
  return await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as CloudinaryUploadResponse);
        }
      }
    )

    uploadStream.end(buffer);
  })
}
export async function uploadFileToCloudinary(file: File, folder = "ads/inputs") {
  const buf = Buffer.from(await file.arrayBuffer());
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, res) => (err ? reject(err) : resolve(res as any))
    );
    stream.end(buf);
  });
}
