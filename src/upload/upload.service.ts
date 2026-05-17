import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadRepository } from './upload.repository';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly repo: UploadRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}
  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file needed');
    }

    const { imageUrl, publicId } = await this.cloudinary.uploadFile(file);

    const altText = file.originalname.split('.').slice(0, -1).join('.');

    const result = await this.repo.create({
      imageUrl: imageUrl,
      altText: altText,
      publicId,
      sortOrder: 0,
    });

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: result.id,
        altText: altText,
        imageUrl: result.imageUrl,
      },
    };
  }

  async uploadImages(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const images = await Promise.all(
      files.map((file) => this.cloudinary.uploadFile(file)),
    );

    const altText = files.map((file) =>
      file.originalname.split('.').slice(0, -1).join('.'),
    );

    const result = await this.repo.createMany(
      images.map((image, index) => ({
        imageUrl: image.imageUrl,
        altText: altText[index],
        publicId: image.publicId,
        sortOrder: 0,
      })),
    );

    return {
      success: true,
      message: 'Images uploaded successfully',
      data: result,
    };
  }
  async deleteImage(imageId: number) {
    const image = await this.repo.findById(imageId);

    if (!image) {
      throw new BadRequestException('Image not found');
    }

    await this.cloudinary.deleteFile(image.publicId);

    await this.repo.delete({ id: imageId });

    return {
      success: true,
      message: `Image with ${image.altText} deleted successfully`,
    };
  }

  findAll() {
    return this.repo.findAll();
  }
}
