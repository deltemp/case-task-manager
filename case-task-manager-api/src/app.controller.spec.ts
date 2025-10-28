import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<AppService>;

  const mockAppService = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get(AppService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const expectedResult = 'Hello World!';
      appService.getHello.mockReturnValue(expectedResult);

      const result = appController.getHello();

      expect(appService.getHello).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should call AppService.getHello method', () => {
      appService.getHello.mockReturnValue('Hello World!');

      appController.getHello();

      expect(appService.getHello).toHaveBeenCalledTimes(1);
    });

    it('should return the exact value from AppService', () => {
      const customMessage = 'Custom Hello Message';
      appService.getHello.mockReturnValue(customMessage);

      const result = appController.getHello();

      expect(result).toBe(customMessage);
    });

    it('should handle service errors gracefully', () => {
      appService.getHello.mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => appController.getHello()).toThrow('Service error');
    });
  });
});
