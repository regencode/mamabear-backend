import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { CategoryRepository } from './category.repository';

describe('CategoryRepository - update with images', () => {
  let repository: CategoryRepository;
  let prisma: PrismaService;

  const mockSyncedImages = [
    {
      id: 10,
      publicId: 'cat-img-updated',
      categoryId: 3,
      imageUrl: 'https://example.com/updated.jpg',
      sortOrder: 0,
      altText: 'Updated',
      width: null,
      height: null,
      fileSize: null,
      format: null,
    },
  ];

  const mockCategoryResult = {
    id: 3,
    name: 'Test Category',
    slug: 'test-category',
    images: [
      {
        id: 1,
        publicId: 'cat-img-old',
        categoryId: 3,
        imageUrl: 'https://example.com/old.jpg',
        sortOrder: 0,
      },
    ],
  };

  const mockPrisma = {
    $transaction: jest.fn(async (fn) => {
      const mockTx = {
        category: {
          update: jest.fn().mockResolvedValue(mockCategoryResult),
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
        CategoryRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
    jest.clearAllMocks();
  });

  it('should not touch images when images is undefined', async () => {
    const result = await repository.update(3, { name: 'New Name' });

    expect(result.images).toEqual(mockCategoryResult.images);
  });

  it('should sync images when images array is provided', async () => {
    const images = [
      {
        imageUrl: 'https://example.com/updated.jpg',
        publicId: 'cat-img-updated',
        sortOrder: 0,
        altText: 'Updated',
      },
    ];

    const result = await repository.update(3, { images } as any);

    expect(result.images).toEqual(mockSyncedImages);
  });

  it('should delete all images when images is empty array', async () => {
    const existingImages = [
      {
        id: 1,
        publicId: 'cat-img-old',
        categoryId: 3,
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
      category: {
        update: jest.fn().mockResolvedValue({
          ...mockCategoryResult,
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

    const result = await repository.update(3, { images: [] } as any);

    expect(mockTx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
    expect(mockTx.image.upsert).not.toHaveBeenCalled();
    expect(result.images).toEqual([]);
  });

  it('should pass categoryId as FK field to syncImages', async () => {
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
        category: {
          update: jest.fn().mockResolvedValue(mockCategoryResult),
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

    await repository.update(3, { images } as any);

    const findManyCall = capturedTx.image.findMany.mock.calls[0][0];
    expect(findManyCall.where).toHaveProperty('categoryId', 3);
  });
});
