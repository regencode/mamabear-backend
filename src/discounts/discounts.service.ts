import { Injectable } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountsRepository } from './discounts.repository';

@Injectable()
export class DiscountsService {
  constructor(private readonly repo: DiscountsRepository) {} 
  async create(dto: CreateDiscountDto) {
      return await this.repo.create(dto);
  }

  async remove(id: number) {
      return await this.repo.delete(id);
  }
}
