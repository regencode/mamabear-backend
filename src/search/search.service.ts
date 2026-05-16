import { ForbiddenException, Injectable } from '@nestjs/common';
import { SearchRequestDto } from './dto/search-request.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Product } from '@/generated/prisma';
import { SearchAutocompleteOptionsDto } from './dto/search-autocomplete-options.dto';
import { ServiceResult } from '@/common/ServiceResult';

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
            message: `Found ${uniqueProducts.length} products with word matching query "${query}"`,
            data: uniqueProducts
        };
    }
    async getFuzzyAutocompleteResults(query: SearchRequestDto, options?: SearchAutocompleteOptionsDto) {
        const defaultOptions: SearchAutocompleteOptionsDto = {
            limit: 3,
            minChars: 3
        }
        const limit = options?.limit || defaultOptions.limit!;
        const minChars = options?.minChars! || defaultOptions.minChars!;

        if(query.q && query.q?.trim().length < minChars) return [];
        const matchedProducts = [
            ...await this.matchProductsByTags(query, true),
            ...await this.matchProductsByName(query, true),
            ...await this.matchProductsBySlug(query, true),
            ...await this.matchProductsByVariantSku(query, true),
        ]
        var seen = {};
        var uniqueProducts: Product[] = [];
        // filter to only unique products and limit returns
        for(const product of matchedProducts) {
            if(uniqueProducts.length >= limit) break;
            if(!seen[product.id]) {
                seen[product.id] = true;
                uniqueProducts.push(product);
            }
        }
        return {
            success: true,
            message: `Found ${uniqueProducts.length} products with fuzzy matching query "${query}"`,
            data: uniqueProducts
        };
    }
    matchProductsByName(query: SearchRequestDto, fuzzySearch: boolean = false) {
        return this.prisma.product.findMany({
            where: {
                name: fuzzySearch ? { contains: query.q } : { search: query.q },
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
    matchProductsByDescription(query: SearchRequestDto, fuzzySearch: boolean = false) {
        return this.prisma.product.findMany({
            where: {
                description: fuzzySearch ? { contains: query.q } : { search: query.q },
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
    matchProductsByTags(query: SearchRequestDto, fuzzySearch: boolean = false) {
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
    matchProductsBySlug(query: SearchRequestDto, fuzzySearch: boolean = false) {
        return this.prisma.product.findMany({
            where: {
                slug: fuzzySearch ? { contains: query.q } : { search: query.q },
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
    async matchProductsByVariantSku(query: SearchRequestDto, fuzzySearch: boolean = false) {
        const matchedVariants = await this.prisma.productVariant.findMany({
            where: {
                sku: fuzzySearch ? { contains: query.q } : { search: query.q },
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
