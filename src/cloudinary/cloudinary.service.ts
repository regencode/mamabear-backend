import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
          },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result?.secure_url as string);
            }
          },
        );
        stream.end(file.buffer);
      });
    } catch (error) {
      throw new InternalServerErrorException('Upload ke Cloudinary gagal');
    }
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }
}
