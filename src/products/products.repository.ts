import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EmbeddingsService } from '@/embeddings/embeddings.service';
import slugify from 'slugify';
import { Product } from '@/generated/prisma';
import { FilterProductsDto } from './dto/filter-products.dto';
import { argv0 } from 'process';


export const PRODUCT_INCLUDE = {
  category: true,
  images: true,
  variants: true,
};

@Injectable()
export class ProductsRepository {
  constructor(
     private readonly prisma: PrismaService,
     private readonly embedService: EmbeddingsService,
  ) {}

  create(data: CreateProductDto) {
    data.slug = slugify(data.name, { lower: true, strict: true });
    return this.prisma.$transaction(async (tx) => {
        const { images, variants, weightG, priceIdr, stock, sku, ...productData } = data;
        const product = await tx.product.create({ data: { ...productData }, include: PRODUCT_INCLUDE })
        const embed = await this.embedService.generateEmbeddingsFromProduct(product);
        tx.$executeRaw`
            UPDATE "Product" 
            SET embedding = ${this.embedService.embeddingArrayToString(embed)}::vector
            WHERE id = ${product.id}
        `;
        if(variants?.length) {
            await tx.productVariant.createMany({
                data: variants.map(v => ({...v, productId: product.id }))
            })
        }
        if(images?.length) {
            await tx.productImage.createMany({
                data: images.map(img => ({...img, productId: product.id }))
            })
        }
        return tx.product.findUnique({ where: { id: product.id }, include: PRODUCT_INCLUDE })
    })
  }

  findMany() {
    return this.prisma.product.findMany({ include: PRODUCT_INCLUDE });
  }

  findByFilter(query: FilterProductsDto) {
      return this.prisma.product.findMany({
          where: { AND: {
          ...query.categories && query.categories.length > 0
          ? { category: { slug: { in: query.categories } } }
          : {},
          ...query.highlights && query.highlights.length > 0  
          ? { highlight: { slug: { in: query.highlights } } }
          : {},
          ...typeof query.inStock === 'boolean' && query.inStock
          ? { variants: { some: { stock: { gte: 1 } } } }
          : {},
          ...query.minPrice && query.maxPrice
          ? { variants: { some: { priceIdr: { gte: query.minPrice, lte: query.maxPrice } }}}
          : {},
          }},
          include: {
              variants: { 
                  where: { AND: {
                    ...typeof query.inStock === 'boolean' && query.inStock
                    ? { stock: { gte: 1 } } 
                    : {}
                  }}
              },
          },
      });
  }

  findById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }

  findBySlug(slug: string) {
      return this.prisma.product.findUnique({
          where: { slug },
          include: PRODUCT_INCLUDE,
      });
  }
  async findRelated(id: number) {
    return (await this.prisma.$queryRaw`
        SELECT *, 1 - (embedding <=> (SELECT embedding FROM "Product" WHERE id = ${id})) AS similarity
        FROM "Product"
        WHERE id != ${id} AND embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 5
    ` as Product[])
}

  update(id: number, data: UpdateProductDto) {
    const { images, variants, weightG, priceIdr, stock, sku, ...productData } = data;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  delete(id: number) {
    return this.prisma.product.delete({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  }

}
