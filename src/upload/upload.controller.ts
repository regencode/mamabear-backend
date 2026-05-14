import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  uploadSingleImage() {
      return this.uploadService.uploadImage();
  }
  @Post('images')
  uploadMultipleImages() {
      return this.uploadService.uploadImage();
  }
  @Delete('image/:id')
  deleteImage(@Param('id') id: string) {
      return this.uploadService.deleteImage(id);
  }
}
