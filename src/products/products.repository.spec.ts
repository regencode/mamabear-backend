import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductsRepository } from './products.repository';
import { ProductUtils } from '@/product-utils/product-utils';
import { PinoLogger } from 'pino-nestjs';

jest.mock('@/embeddings/embeddings.service', () => {
  return {
    EmbeddingsService: class {
      generateEmbedding = jest.fn();
    },
  };
});

import { EmbeddingsService } from '@/embeddings/embeddings.service';

describe('ProductsRepository - update with images', () => {
  let repository: ProductsRepository;

  const mockSyncedImages = [
    {
      id: 10,
      publicId: 'img-updated',
      productId: 1,
      imageUrl: 'https://example.com/updated.jpg',
      sortOrder: 0,
      altText: 'Updated',
      width: 200,
      height: 200,
      fileSize: 8000,
      format: 'webp',
    },
  ];

  const mockProductResult = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    images: [
      {
        id: 1,
        publicId: 'img-old',
        productId: 1,
        imageUrl: 'https://example.com/old.jpg',
        sortOrder: 0,
      },
    ],
    variants: [],
    category: null,
  };

  const mockPrisma = {
    $transaction: jest.fn(async (fn) => {
      const mockTx = {
        product: {
          update: jest.fn().mockResolvedValue(mockProductResult),
        },
        image: {
          findMany: jest.fn().mockResolvedValue(mockSyncedImages),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          upsert: jest.fn().mockResolvedValue(mockSyncedImages[0]),
        },
      };
      return fn(mockTx);
    }),
  };

  const mockEmbeddingsService = {
    generateEmbedding: jest.fn(),
  };

  const mockUtils = {
    enrichOne: jest.fn((p) => p),
    enrichMany: jest.fn((p) => p),
  };

  const mockLogger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingsService, useValue: mockEmbeddingsService },
        { provide: ProductUtils, useValue: mockUtils },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    repository = module.get<ProductsRepository>(ProductsRepository);
    jest.clearAllMocks();
  });

  it('should not touch images when images is undefined', async () => {
    const result = await repository.update(1, { name: 'New Name' });

    expect(result.images).toEqual(mockProductResult.images);
  });

  it('should sync images when images array is provided', async () => {
    const images = [
      {
        imageUrl: 'https://example.com/updated.jpg',
        publicId: 'img-updated',
        sortOrder: 0,
        altText: 'Updated',
        width: 200,
        height: 200,
        fileSize: 8000,
        format: 'webp',
      },
    ];

    const result = await repository.update(1, { images } as any);

    expect(result.images).toEqual(mockSyncedImages);
  });

  it('should delete all images when images is empty array', async () => {
    const existingImages = [
      {
        id: 1,
        publicId: 'img-old',
        productId: 1,
        imageUrl: 'https://example.com/old.jpg',
        sortOrder: 0,
        altText: null,
        width: null,
        height: null,
        fileSize: null,
        format: null,
      },
    ];

    const mockTx = {
      product: {
        update: jest.fn().mockResolvedValue({
          ...mockProductResult,
          images: existingImages,
        }),
      },
      image: {
        findMany: jest.fn()
          .mockResolvedValueOnce(existingImages)
          .mockResolvedValueOnce([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn(),
      },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn) => fn(mockTx));

    const result = await repository.update(1, { images: [] } as any);

    expect(mockTx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
    expect(mockTx.image.upsert).not.toHaveBeenCalled();
    expect(result.images).toEqual([]);
  });

  it('should pass productId as FK field to syncImages', async () => {
    const images = [
      {
        imageUrl: 'https://example.com/a.jpg',
        publicId: 'img-a',
        sortOrder: 0,
      },
    ];

    let capturedTx: any;
    mockPrisma.$transaction.mockImplementationOnce(async (fn) => {
      const mockTx = {
        product: {
          update: jest.fn().mockResolvedValue(mockProductResult),
        },
        image: {
          findMany: jest.fn().mockResolvedValue(images),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          upsert: jest.fn().mockResolvedValue(images[0]),
        },
      };
      capturedTx = mockTx;
      return fn(mockTx);
    });

    await repository.update(1, { images } as any);

    const findManyCall = capturedTx.image.findMany.mock.calls[0][0];
    expect(findManyCall.where).toHaveProperty('productId', 1);
  });
});
