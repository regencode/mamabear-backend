import { Prisma } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class VariantRepository {
    constructor(private readonly prisma: PrismaService) {}

    findProductById(productId: number) {
        return this.prisma.product.findUnique({ where: { id: productId } });
    }

    findOne(variantId: number) {
        return this.prisma.productVariant.findUnique({ where: { id: variantId } });
    }

    update(variantId: number, dto: UpdateVariantDto) {
        return this.prisma.productVariant.update({
            where: { id: variantId },
            data: {
                name: dto.name,
                priceIdr: dto.priceIdr,
                weightG: dto.weightG,
                sku: dto.sku,
                stock: dto.stock,
            },
        });
    }

    delete(where: Prisma.ProductVariantWhereUniqueInput) {
        return this.prisma.productVariant.delete({ where });
    }

    createProductVariant(dto: CreateVariantDto) {
        return this.prisma.productVariant.create({
            data: { 
                name: dto.name,
                priceIdr: dto.priceIdr,
                weightG: dto.weightG,
                sku: dto.sku,
                stock: dto.stock,
                product: { connect: { id: dto.productId } }
            },
        });
    }

    findProductVariantsByProductId(productId: number) {
        return this.prisma.productVariant.findMany({ where: { productId } });
    }

    findProductBySlug(productSlug: string) {
        return this.prisma.product.findUnique({ where: { slug: productSlug } });
    }
}
