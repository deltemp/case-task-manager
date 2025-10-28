import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = service.getHello();
      expect(result).toBe('Hello World!');
    });

    it('should return a string', () => {
      const result = service.getHello();
      expect(typeof result).toBe('string');
    });

    it('should return the same value on multiple calls', () => {
      const firstCall = service.getHello();
      const secondCall = service.getHello();
      
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe('Hello World!');
    });

    it('should not return null or undefined', () => {
      const result = service.getHello();
      
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    it('should return a non-empty string', () => {
      const result = service.getHello();
      
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});