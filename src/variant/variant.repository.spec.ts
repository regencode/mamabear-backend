import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { VariantRepository } from './variant.repository';

describe('VariantRepository - update with images', () => {
  let repository: VariantRepository;
  let prisma: PrismaService;

  const mockSyncedImages = [
    {
      id: 10,
      publicId: 'variant-img-updated',
      variantId: 5,
      imageUrl: 'https://example.com/updated.jpg',
      sortOrder: 0,
      altText: 'Updated',
      width: null,
      height: null,
      fileSize: null,
      format: null,
    },
  ];

  const mockVariantResult = {
    id: 5,
    productId: 1,
    name: 'Test Variant',
    images: [
      {
        id: 1,
        publicId: 'variant-img-old',
        variantId: 5,
        imageUrl: 'https://example.com/old.jpg',
        sortOrder: 0,
      },
    ],
  };

  const mockPrisma = {
    $transaction: jest.fn(async (fn) => {
      const mockTx = {
        productVariant: {
          update: jest.fn().mockResolvedValue(mockVariantResult),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<VariantRepository>(VariantRepository);
    jest.clearAllMocks();
  });

  it('should not touch images when images is undefined', async () => {
    const result = await repository.update(5, { name: 'New Name' });

    expect(result.images).toEqual(mockVariantResult.images);
  });

  it('should sync images when images array is provided', async () => {
    const images = [
      {
        imageUrl: 'https://example.com/updated.jpg',
        publicId: 'variant-img-updated',
        sortOrder: 0,
        altText: 'Updated',
      },
    ];

    const result = await repository.update(5, { images } as any);

    expect(result.images).toEqual(mockSyncedImages);
  });

  it('should delete all images when images is empty array', async () => {
    const existingImages = [
      {
        id: 1,
        publicId: 'variant-img-old',
        variantId: 5,
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
      productVariant: {
        update: jest.fn().mockResolvedValue({
          ...mockVariantResult,
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

    const result = await repository.update(5, { images: [] } as any);

    expect(mockTx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
    expect(mockTx.image.upsert).not.toHaveBeenCalled();
    expect(result.images).toEqual([]);
  });

  it('should pass variantId as FK field to syncImages', async () => {
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
        productVariant: {
          update: jest.fn().mockResolvedValue(mockVariantResult),
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

    await repository.update(5, { images } as any);

    const findManyCall = capturedTx.image.findMany.mock.calls[0][0];
    expect(findManyCall.where).toHaveProperty('variantId', 5);
  });
});
