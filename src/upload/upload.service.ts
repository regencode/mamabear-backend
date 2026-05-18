import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadRepository } from './upload.repository';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { CreateUploadDto } from './dto/create-upload.dto';

@Injectable()
export class UploadService {
  constructor(
    private readonly repo: UploadRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}
  async uploadImage(file: Express.Multer.File, dto: CreateUploadDto) {
    if (!file) {
      throw new BadRequestException('file needed');
    }

    const { imageUrl, publicId, width, height, fileSize, format, altText } =
      await this.cloudinary.uploadFile(file);

    const result = await this.repo.create({
      imageUrl: imageUrl,
      altText: altText,
      publicId,
      width,
      height,
      fileSize,
      format,
      ...(dto.productId ? { product: { connect: { id: dto.productId } } } : {}),
      ...(dto.variantId ? { variant: { connect: { id: dto.variantId } } } : {}),
      sortOrder: dto.sortOrder ?? 0,
    });

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: result.id,
        altText: result.altText,
        imageUrl: result.imageUrl,
      },
    };
  }

  async uploadImages(files: Express.Multer.File[], dto: CreateUploadDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const images = await Promise.all(
      files.map((file) => this.cloudinary.uploadFile(file)),
    );

    const result = await this.repo.createMany(
      images.map((image) => ({
        imageUrl: image.imageUrl,
        altText: image.altText,
        publicId: image.publicId,
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        format: image.format,
        ...(dto.productId
          ? { product: { connect: { id: dto.productId } } }
          : {}),
        ...(dto.variantId
          ? { variant: { connect: { id: dto.variantId } } }
          : {}),
        sortOrder: dto.sortOrder ?? 0,
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

  getUploadSignature() {
    return {
      success: true,
      message: 'Upload signature generated successfully',
      data: this.cloudinary.generateUploadSignature(),
    };
  }

  findAll() {
    return this.repo.findAll();
  }
}
