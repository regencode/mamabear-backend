import { Test, TestingModule } from '@nestjs/testing';
<<<<<<< HEAD
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';

describe('VariantsController', () => {
  let controller: VariantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantsController],
      providers: [VariantsService],
    }).compile();

    controller = module.get<VariantsController>(VariantsController);
=======
import { VariantController } from './variant.controller';
import { VariantService } from './variant.service';

describe('VariantController', () => {
  let controller: VariantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantController],
      providers: [VariantService],
    }).compile();

    controller = module.get<VariantController>(VariantController);
>>>>>>> dev
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
