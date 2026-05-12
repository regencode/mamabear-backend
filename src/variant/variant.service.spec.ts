import { Test, TestingModule } from '@nestjs/testing';
<<<<<<< HEAD
import { VariantsService } from './variants.service';

describe('VariantsService', () => {
  let service: VariantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantsService],
    }).compile();

    service = module.get<VariantsService>(VariantsService);
=======
import { VariantService } from './variant.service';

describe('VariantService', () => {
  let service: VariantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantService],
    }).compile();

    service = module.get<VariantService>(VariantService);
>>>>>>> dev
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
