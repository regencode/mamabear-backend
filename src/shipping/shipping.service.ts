import {
  City,
  District,
  Province,
  Response,
  Subdistrict,
} from '@/types/shipping.type';
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
      const provinces = data.data;
      return provinces;
    } catch (error) {
      throw new Error('Failed to fetch provinces');
    }
  }

  async findCitiesByProvinceId(provinceId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/destination/city/${provinceId}`,
        {
          method: 'GET',
          headers: this.headers,
        },
      );
      const data: Response<City> = await response.json();
      const cities = data.data;
      return cities;
    } catch (error) {
      throw new Error('Failed to fetch cities');
    }
  }

  async findDistrictsByCityId(cityId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/destination/district/${cityId}`,
        {
          method: 'GET',
          headers: this.headers,
        },
      );
      const data: Response<District> = await response.json();
      const districts = data.data;
      return districts;
    } catch (error) {
      throw new Error('Failed to fetch districts');
    }
  }

  async findSubdistrictsByDistrictId(districtId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/destination/sub-district/${districtId}`,
        {
          method: 'GET',
          headers: this.headers,
        },
      );
      const data: Response<Subdistrict> = await response.json();
      const subdistricts = data.data;
      return subdistricts;
    } catch (error) {
      throw new Error('Failed to fetch subdistricts');
    }
  }
}
