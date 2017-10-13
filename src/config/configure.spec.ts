import { setUpConfig, getConfig } from './configure';
import variables from './details/variables';

describe('configure', () => {
  describe('setUpConfig', () => {
    it('should set environment to development if there is none', () => {
      delete process.env.NODE_ENV;
      expect(process.env.NODE_ENV).toBeUndefined();

      setUpConfig();

      expect(process.env.NODE_ENV).toBeDefined();
      expect(typeof process.env.NODE_ENV).toBe('string');
      expect(process.env.NODE_ENV).toBe('development');

      process.env.NODE_ENV = 'test';
    });

    it('should set up env variables', () => {
      const envVariables = variables[process.env.NODE_ENV];

      setUpConfig();

      Object.keys(envVariables).forEach((key) => {
        expect(process.env[key]).toBeDefined();
        expect(process.env[key]).toBe(envVariables[key].toString());
      });
    });
  });

  describe('getConfig', () => {
    setUpConfig();

    it('should get config for proper environment', () => {
      const config = {
        test: {
          testData: {
            data: 'testData',
          },
        },
        development: {
          testData: {
            data: 'developmentData',
          },
        },
        production: {
          testData: {
            data: 'productionData',
          },
        },
      };
      const testConfig = getConfig('testData', config);

      expect(testConfig).toBeDefined();
      expect(testConfig.data).toBe(config.test.testData.data);
    });
  });
});
