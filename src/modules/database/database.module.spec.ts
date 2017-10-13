import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../config/configure';
import { DatabaseModule } from '../database/database.module';

describe('AuthModule', () => {
  let databaseModule;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
      ],
    }).compile();

    databaseModule = module.select<DatabaseModule>(DatabaseModule);

  });

  it('should create a module', () => {
    expect(databaseModule).toBeDefined();
  });
});