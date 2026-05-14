import { products, users } from './../../prisma/data_old';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';

import slugify from 'slugify';
import { BadRequestException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: CategoryRepository;

  const mockRepo = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    findProductByCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repo = module.get<CategoryRepository>(CategoryRepository);

    jest.clearAllMocks();
  });

  it('should get allCategory successfully', async () => {
    const result = [
      { id: 1, name: 'category1', slug: 'category1' },
      { id: 2, name: 'category2', slug: 'category2' },
    ];

    mockRepo.findAll.mockReturnValue(result);

    const resultResponse = await service.getAllCategory();

    expect(mockRepo.findAll).toHaveBeenCalledWith();
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
    expect(service).toBeDefined();
  });

  it('should get category by slug', async () => {
    const slug = 'drink';

    const result = {
      id: 1,
      name: 'Drink',
      slug: 'drink',
    };

    mockRepo.findBySlug.mockReturnValue(result);

    const resultResponse = await service.getCategoryBySlug(slug);
    expect(mockRepo.findBySlug).toHaveBeenCalledWith(slug);
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });

  it('should create category successfully', async () => {
    const userId = 'userId-1';

    const dto = {
      name: 'Drink',
      description: 'Drink description',
      imageUrl: 'https://url.com',
    };

    const result = {
      success: true,
      message: `Category ${dto.name} created successfully`,
    };

    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    mockRepo.findBySlug.mockReturnValue(null);

    mockRepo.create.mockResolvedValue({
      id: 1,
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });

    const resultResponse = await service.createCategory(userId, dto);
    expect(mockRepo.findBySlug).toHaveBeenCalledWith(generatedSlug);
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);

    expect(mockRepo.create).toHaveBeenCalledWith({
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });
    expect(mockRepo.create).toHaveBeenCalledTimes(1);

    expect(resultResponse).toEqual(result);
  });

  it('should throw badRequestException if slug already exist when create category', async () => {
    const userId = 'userId-1';

    const dto = {
      name: 'Drink',
      description: 'Drink description',
      imageUrl: 'https://url.com',
    };

    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    mockRepo.findBySlug.mockReturnValue(generatedSlug);

    await expect(service.createCategory(userId, dto)).rejects.toThrow(
      new BadRequestException('Category already exists'),
    );

    expect(mockRepo.findBySlug).toHaveBeenCalledWith(generatedSlug);
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);

    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalledTimes(0);
  });

  it('should get Product by category slug', async () => {
    const slug = 'drink';

    const result = [
      { id: 1, name: 'drink1', description: 'drink1 description' },
      {
        id: 2,
        name: 'drink2',
        description: 'drink2 description',
      },
    ];

    mockRepo.findProductByCategory.mockReturnValue(result);

    const resultResponse = await service.getProductByCategory(slug);
    expect(mockRepo.findProductByCategory).toHaveBeenCalledWith(slug);
    expect(mockRepo.findProductByCategory).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });

  it('should update category successfully', async () => {
    const userId = 'userId-1';
    const categoryId = 1;

    const dto = {
      name: 'Drink',
      description: 'Drink description',
      imageUrl: 'https://url.com',
    };

    const category = {
      id: 1,
      name: 'Food',
      description: 'Food description',
      imageUrl: 'https://url.com',
    };

    const result = {
      success: true,
      message: `Category ${category.name} updated successfully`,
    };

    mockRepo.findById.mockResolvedValue(category);

    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    mockRepo.findBySlug.mockReturnValue(null);

    mockRepo.update.mockResolvedValue({
      id: 1,
      name: dto.name,
      slug: generatedSlug,
      description: dto.description,
      imageUrl: dto.imageUrl,
    });

    const resultResponse = await service.updateCategory(
      userId,
      categoryId,
      dto,
    );
    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);

    expect(mockRepo.findBySlug).toHaveBeenCalledWith(generatedSlug);
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);

    expect(mockRepo.update).toHaveBeenCalledWith(
      { id: categoryId },
      {
        name: dto.name,
        slug: generatedSlug,
        description: dto.description,
        imageUrl: dto.imageUrl,
      },
    );
    expect(mockRepo.update).toHaveBeenCalledTimes(1);

    expect(resultResponse).toEqual(result);
  });

  it('should throw BadRequestException when category not found for update', async () => {
    const userId = 'userId-1';
    const categoryId = 1;

    const dto = {
      name: 'Drink',
      description: 'Drink description',
      imageUrl: 'https://url.com',
    };

    const category = {
      id: 2,
      name: 'Food',
      description: 'Food description',
      imageUrl: 'https://url.com',
    };

    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateCategory(userId, categoryId, dto),
    ).rejects.toThrow(new BadRequestException('Category not found'));

    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);

    expect(mockRepo.findBySlug).not.toHaveBeenCalled();
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(0);

    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalledTimes(0);
  });

  it('should throw BadRequestException if slug already exist when update category', async () => {
    const userId = 'userId-1';
    const categoryId = 1;

    const dto = {
      name: 'Food',
      description: 'Food description',
      imageUrl: 'https://url.com',
    };

    const category = [
      {
        id: 1,
        name: 'Drink',
        slug: 'drink',
        description: 'Drink description',
        imageUrl: 'https://url.com',
      },
      {
        id: 2,
        name: 'Food',
        slug: 'food',
        description: 'Food description',
        imageUrl: 'https://url.com',
      },
    ];

    mockRepo.findById.mockResolvedValue(categoryId);

    const generatedSlug = slugify(dto.name, { lower: true, strict: true });

    mockRepo.findBySlug.mockResolvedValue(generatedSlug);

    await expect(
      service.updateCategory(userId, categoryId, dto),
    ).rejects.toThrow(new BadRequestException('Category already exists'));

    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);

    expect(mockRepo.findBySlug).toHaveBeenCalledWith(generatedSlug);
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);

    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalledTimes(0);
  });

  it('should delete category successfully', async () => {
    const userId = 'userId-1';
    const categoryId = 1;

    const category = {
      id: 1,
      name: 'Food',
      description: 'Food description',
      imageUrl: 'https://url.com',
      products: [],
    };

    const result = {
      success: true,
      message: `${category.name} deleted successfully`,
    };

    mockRepo.findById.mockResolvedValue(category);

    mockRepo.delete.mockResolvedValue(undefined);
    const resultResponse = await service.deleteCategory(userId, categoryId);

    expect(mockRepo.delete).toHaveBeenCalledWith({
      id: categoryId,
    });
    expect(mockRepo.delete).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);

    expect(resultResponse).toEqual(result);
  });

  it('should throw BadRequestException if category not found', async () => {
    const userId = 'user-123';
    const categoryId = 999;

    mockRepo.findById.mockResolvedValue(null);

    await expect(service.deleteCategory(userId, categoryId)).rejects.toThrow(
      new BadRequestException('Category not found'),
    );
    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if category has products', async () => {
    const userId = 'user-123';
    const categoryId = 1;

    const category = {
      id: categoryId,
      name: 'Drink',
      slug: 'drink',
      products: [
        {
          id: 1,
          name: 'Coca Cola',
        },
      ],
    };

    mockRepo.findById.mockResolvedValue(category);

    await expect(service.deleteCategory(userId, categoryId)).rejects.toThrow(
      new BadRequestException('Category has products'),
    );
    expect(mockRepo.findById).toHaveBeenCalledWith(categoryId);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);

    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
