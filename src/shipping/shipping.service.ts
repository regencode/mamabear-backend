import { Province, Response } from '@/types/shipping.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShippingService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string | undefined;
  private readonly headers: Record<string, string>;
  constructor() {
    this.apiKey = process.env.RAJAONGKIR_API_KEY ?? '';
    this.baseUrl =
      process.env.RAJAONGKIR_BASE_URL ?? 'https://rajaongkir.komerce.id/api/v1';
    this.headers = {
      key: this.apiKey,
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  async findAllProvince() {
    try {
      const response = await fetch(`${this.baseUrl}/destination/province`, {
        method: 'GET',
        headers: this.headers,
      });
      const data: Response<Province> = await response.json();
      const province = data.data;
      return province;
    } catch (error) {
      throw new Error('Failed to fetch provinces');
    }
  }
}
