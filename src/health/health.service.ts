import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealth() {
        return "OK";
    }
    getDBHealth() {
        return "DB Health";
    }
    getStorageHealth() {
        return "Storage health";
    }
}
