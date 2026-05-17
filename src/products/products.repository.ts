import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EmbeddingsService } from '@/embeddings/embeddings.service';
import slugify from 'slugify';
import { Product } from '@/generated/prisma';
import { FilterProductsDto } from './dto/filter-products.dto';


export const PRODUCT_INCLUDE = {
  category: true,
  images: true,
  variants: true,
};

type SortConfig = {
  orderByClause: string;
  cursorKeys: string[];
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

  findMany(args?: any) {
    return this.prisma.product.findMany({ ...args, include: PRODUCT_INCLUDE });
  }

  private getSortConfig(query: FilterProductsDto): SortConfig {
    if (query.priceAscending !== undefined) {
      const dir = query.priceAscending === 1 ? 'ASC' : 'DESC';
      return {
        orderByClause: `MIN(pv."priceIdr") ${dir}, p.id ${dir}`,
        cursorKeys: ['minPrice', 'id'],
      };
    }
    if (query.creationDateAscending !== undefined) {
      const dir = query.creationDateAscending === 1 ? 'ASC' : 'DESC';
      return {
        orderByClause: `p."createdAt" ${dir}, p.id ${dir}`,
        cursorKeys: ['createdAt', 'id'],
      };
    }
    return {
      orderByClause: `p."createdAt" DESC, p.id DESC`,
      cursorKeys: ['createdAt', 'id'],
    };
  }

  private decodeCursor(cursorStr: string): Record<string, any> | null {
    try {
      return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }

  private encodeCursor(values: Record<string, any>): string {
    return Buffer.from(JSON.stringify(values)).toString('base64');
  }

  private buildCursorCondition(sortConfig: SortConfig, decoded: Record<string, any>): string {
    const conditions: string[] = [];
    if (sortConfig.cursorKeys.includes('minPrice') && decoded.minPrice !== undefined) {
      const dir = sortConfig.orderByClause.includes('ASC') ? '>' : '<';
      conditions.push(`(MIN(pv."priceIdr"), p.id) ${dir} (${decoded.minPrice}, ${decoded.id})`);
    } else if (sortConfig.cursorKeys.includes('createdAt') && decoded.createdAt !== undefined) {
      const dir = sortConfig.orderByClause.includes('ASC') ? '>' : '<';
      conditions.push(`(p."createdAt", p.id) ${dir} ('${decoded.createdAt}'::timestamp, ${decoded.id})`);
    }
    return conditions.length > 0 ? `HAVING ${conditions.join(' AND ')}` : '';
  }

  async findByFilter(query: FilterProductsDto) {
    const limit = query.limit ?? 10;
    const sortConfig = this.getSortConfig(query);
    const decodedCursor = query.cursor ? this.decodeCursor(query.cursor) : null;

    const needsVariantJoin =
      query.priceAscending !== undefined ||
      query.minPrice !== undefined ||
      query.maxPrice !== undefined ||
      query.inStock;

    const whereParts: string[] = ['WHERE 1=1'];

    if (query.categories && query.categories.length > 0) {
      const cats = query.categories.map(c => `'${c}'`).join(',');
      whereParts.push(`AND c.slug IN (${cats})`);
    }
    if (query.highlights && query.highlights.length > 0) {
      const highs = query.highlights.map(h => `'${h}'`).join(',');
      whereParts.push(`AND h.slug IN (${highs})`);
    }

    const havingParts: string[] = [];
    if (query.inStock) {
      havingParts.push(needsVariantJoin
        ? `AND SUM(CASE WHEN pv.stock >= 1 THEN 1 ELSE 0 END) > 0`
        : '');
    }
    if (query.minPrice !== undefined) {
      havingParts.push(`AND MIN(pv."priceIdr") >= ${query.minPrice}`);
    }
    if (query.maxPrice !== undefined) {
      havingParts.push(`AND MIN(pv."priceIdr") <= ${query.maxPrice}`);
    }

    const cursorCondition = decodedCursor
      ? this.buildCursorCondition(sortConfig, decodedCursor)
      : '';

    const variantJoin = needsVariantJoin
      ? `LEFT JOIN "ProductVariant" pv ON pv."productId" = p.id`
      : '';
    const categoryJoin = `LEFT JOIN "Category" c ON c.id = p."categoryId"`;
    const highlightJoin = `LEFT JOIN "Highlight" h ON h.id = p."highlightId"`;

    const selectPrice = query.priceAscending !== undefined
      ? `, MIN(pv."priceIdr") as "minPrice"`
      : '';

    const rawQuery = `
      SELECT p.id ${selectPrice}
      FROM "Product" p
      ${categoryJoin}
      ${highlightJoin}
      ${variantJoin}
      ${whereParts.join(' ')}
      GROUP BY p.id
      ${havingParts.length > 0 ? `HAVING 1=1 ${havingParts.join(' ')}` : ''}
      ${cursorCondition}
      ORDER BY ${sortConfig.orderByClause}
      LIMIT ${limit + 1}
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(rawQuery);

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const nextRow = rows.pop();
      const cursorValues: Record<string, any> = { id: nextRow.id };
      if (nextRow.minPrice !== undefined && nextRow.minPrice !== null) {
        cursorValues.minPrice = Number(nextRow.minPrice);
      }
      if (nextRow.createdAt !== undefined && nextRow.createdAt !== null) {
        cursorValues.createdAt = nextRow.createdAt;
      }
      nextCursor = this.encodeCursor(cursorValues);
    }

    const ids = rows.map((r: any) => r.id);
    if (ids.length === 0) {
      return { items: [], nextCursor: null };
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: PRODUCT_INCLUDE,
    });

    const orderMap = new Map(ids.map((id: number, index: number) => [id, index]));
    const sortedProducts = products.sort(
      (a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!,
    );

    return { items: sortedProducts, nextCursor };
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
