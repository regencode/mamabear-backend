import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
    uploadImage() {
        return "upload image endpoint";
    }
    uploadImages() {
        return "upload multiple images endpoint";
    }
    deleteImage(id: string) {
        return `endpoint to delete image ${id}`;
    }
}
