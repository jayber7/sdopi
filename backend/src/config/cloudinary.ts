import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const FOLDER = 'sdop/evidencias';

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        public_id: filename.replace(/\.[^.]+$/, ''),
        format: 'jpg',
        transformation: [{ quality: 'auto:good', fetch_format: 'jpg' }],
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ponytail: ignore deletion errors
  }
}

export { cloudinary };
