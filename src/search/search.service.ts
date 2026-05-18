import { ForbiddenException, Injectable } from '@nestjs/common';
import { SearchRequestDto } from './dto/search-request.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Product } from '@/generated/prisma';
import { SearchAutocompleteOptionsDto } from './dto/search-autocomplete-options.dto';
import { ServiceResult } from '@/common/ServiceResult';
import { Sql } from '@prisma/client-runtime-utils';

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) {}
    async findRelatedProducts(product: Product) {
        // TODO: implement embedding
        throw new ForbiddenException("Related products not yet implemented");
    }
    async findProductsMatchingQuery(query: SearchRequestDto): Promise<ServiceResult<Product[]>> {
        const matchedProducts = [
            ...await this.matchProductsByTags(query),
            ...await this.matchProductsByName(query),
            ...await this.matchProductsBySlug(query),
            ...await this.matchProductsByVariantSku(query),
        ]
        var seen = {};
        var uniqueProducts: Product[] = [];
        // filter to only unique products
        matchedProducts.forEach((product) => {
            if(!seen[product.id]) {
                seen[product.id] = true;
                uniqueProducts.push(product);
            }
        })
        return {
            success: true,
            message: `Found ${uniqueProducts.length} products matching query '${query.q}' with full text search`,
            data: uniqueProducts
        };
    }
    async getFuzzyAutocompleteResults(query: SearchRequestDto, options?: SearchAutocompleteOptionsDto) {
        const defaultOptions: SearchAutocompleteOptionsDto = {
            limit: 3,
            minChars: 3,
            similarityThreshold: 0.02,
        }
        const limit = options?.limit || defaultOptions.limit!;
        const minChars = options?.minChars! || defaultOptions.minChars!;
        const similarityThreshold = options?.similarityThreshold! || defaultOptions.similarityThreshold!;
        if(query.q && query.q?.trim().length < minChars) {
            return {
                success: true,
                message: `Query should be at least ${minChars} chars long to activate fuzzy searching`,
                data: []
            }
        } 
        var matchedProducts: (Product & { similarity: number })[] = await this.prisma.$queryRaw`SELECT name, similarity(name, ${query.q}) as similarity FROM "Product" ORDER BY sml DESC`;
        var i = 0;
        matchedProducts = matchedProducts.filter(p => {
            if(p.similarity >= similarityThreshold && i < limit) {
                i++; return true;
            }
            return false;
        })
        return {
            success: true,
            message: `Found ${i} products matching query '${query.q}' with fuzzy search`,
            data: matchedProducts
        };
    }

    async matchProductsByName(query: SearchRequestDto) {
        return this.prisma.product.findMany({
            where: {
                name: { contains: query.q, mode: 'insensitive' },
            },
            orderBy: {
                _relevance: {
                    fields: ["name"],
                    search: query.q,
                    sort: "desc",
                },
             }
        })
    }

    matchProductsByDescription(query: SearchRequestDto) {
        return this.prisma.product.findMany({
            where: {
                description: { contains: query.q, mode: 'insensitive' },
            },
            orderBy: {
                _relevance: {
                    fields: ["description"],
                    search: query.q,
                    sort: "desc",
                },
            }
        })
    }

    matchProductsByTags(query: SearchRequestDto) {
        return this.prisma.product.findMany({
            where: {
                tags: { has: query.q },
            },
            orderBy: {
                _relevance: {
                    fields: ["tags"],
                    search: query.q,
                    sort: "desc",
                },
            }
        })
    }

    matchProductsBySlug(query: SearchRequestDto) {
        return this.prisma.product.findMany({
            where: {
                slug: { contains: query.q, mode: 'insensitive' },
            },
            orderBy: {
                _relevance: {
                    fields: ["slug"],
                    search: query.q,
                    sort: "desc",
                },
            }
        })
    }

    async matchProductsByVariantSku(query: SearchRequestDto) {
        const matchedVariants = await this.prisma.productVariant.findMany({
            where: {
                sku: { contains: query.q, mode: 'insensitive' },
            },
            select: { product: true }, 
            orderBy: {
                _relevance: {
                    fields: ["sku"],
                    search: query.q,
                    sort: "desc",
                },
            }
        })
        var seen = {};
        var uniqueProducts: Product[] = [];
        // filter to only unique products
        matchedVariants.forEach((variant) => {
            if(!seen[variant.product.id]) {
                seen[variant.product.id] = true;
                uniqueProducts.push(variant.product);
            }
            uniqueProducts.push(variant.product);
        })
        return uniqueProducts;
    }
}
