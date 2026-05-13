import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategoryService = {
    getAllCategory: jest.fn(),
    getCategoryBySlug: jest.fn(),
    createCategory: jest.fn(),
    getProductByCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
  });

  it('should call CategoryService.createCategory', async () => {
    const dto = {
      name: 'category1',
      description: 'description1',
      imageUrl: 'url1',
    };
    const req = {
      user: { id: 'userid1' },
    };
    const result = {
      success: true,
      message: `Category ${dto.name} created successfully`,
    };
    mockCategoryService.createCategory.mockResolvedValue(result);

    const resultResponse = await controller.create(req, dto);
    expect(service.createCategory).toHaveBeenCalledWith(req.user.id, dto);
    expect(service.createCategory).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });

  it('should call CategoryService.updateCategory', async () => {
    const categoryId = 1;

    const dto = {
      name: 'updated category',
      description: 'category that have been updated',
      imageUrl: 'updated url',
    };

    const req = {
      user: {
        id: 'userId1',
      },
    };

    const result = {
      success: true,
      message: `Category old category updated successfully`,
    };

    mockCategoryService.updateCategory.mockResolvedValue(result);

    const resultResponse = await controller.update(req, categoryId, dto);

    expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
      req.user.id,
      categoryId,
      dto,
    );
    expect(mockCategoryService.updateCategory).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });

  it('should call CategoryService.deleteCategory', async () => {
    const category = {
      id: 1,
      name: 'category1',
    };
    const req = {
      user: {
        id: 'userId1',
      },
    };

    const result = {
      success: true,
      message: `${category.name} deleted successfully`,
    };

    mockCategoryService.deleteCategory.mockResolvedValue(result);
    const resultResponse = await controller.delete(req, category.id);

    expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(
      req.user.id,
      category.id,
    );
    expect(mockCategoryService.deleteCategory).toHaveBeenCalledTimes(1);

    expect(resultResponse).toEqual(result);
  });

  it('should call CategoryService.getAllCategory', async () => {
    const result = [
      {
        id: 1,
        name: 'Susu',
        slug: 'susu',
        description: 'Susu terbaik mamabear',
        imageUrl: 'susu.jpg',
      },
      {
        id: 2,
        name: 'Botol',
        slug: 'botol',
        description: 'botol terbaik mamabear',
        imageUrl: 'botol.jpg',
      },
    ];

    mockCategoryService.getAllCategory.mockResolvedValue(result);

    const response = await controller.findAll();
    expect(service.getAllCategory).toHaveBeenCalledTimes(1);
    expect(service.getAllCategory).toHaveBeenCalledWith();
    expect(response).toEqual(result);
  });

  it('should call CategoryService.getCategoryBySlug', async () => {
    const slug = 'slug';

    const result = {
      id: 1,
      name: 'Susu',
      slug: 'susu',
      description: 'Susu terbaik mamabear',
      imageUrl: 'susu.jpg',
    };

    mockCategoryService.getCategoryBySlug.mockResolvedValue(result);

    const resultResponse = await controller.findOne(slug);
    expect(service.getCategoryBySlug).toHaveBeenCalledWith(slug);
    expect(service.getCategoryBySlug).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });

  it('should call CaategoryService.getProductByCategory', async () => {
    const slug = 'drink';
    const result = [
      {
        id: 1,
        name: 'Product1',
        slug: 'product1',
        category: 'drink',
      },
      {
        id: 2,
        name: 'Product2',
        slug: 'product2',
        category: 'drink',
      },
    ];

    mockCategoryService.getProductByCategory.mockResolvedValue(result);
    const resultResponse = await controller.findProduct(slug);
    expect(service.getProductByCategory).toHaveBeenCalledWith(slug);
    expect(service.getProductByCategory).toHaveBeenCalledTimes(1);
    expect(resultResponse).toEqual(result);
  });
});
