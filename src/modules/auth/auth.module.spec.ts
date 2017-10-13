import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../config/configure';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

describe('AuthModule', () => {
  let authService: AuthService;
  let authController: AuthController;
  let databaseModule: DatabaseModule;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        AuthModule,
      ],
    }).compile();

    const authModule = module.select<AuthModule>(AuthModule);
    authService = authModule.get<AuthService>(AuthService);
    authController = authModule.get<AuthController>(AuthController);
    databaseModule = authModule.get<DatabaseModule>(DatabaseModule);

  });

  it('should create a module with proper dependencies', () => {
    expect(authService).toBeDefined();
    expect(authController).toBeDefined();
    expect(databaseModule).toBeDefined();
  });
});