import variables from './details/variables';
import config from './details/config';

interface IenvConfig {
  PORT: number;
  MYSQL_URL: string;
  REDIS_DATABASE: number;
  JWT_SECRET: string;
}

interface Iconfig {
  test: object;
  development: object;
  production: object;
}

const listenForPromiseRejections = (): void => {
  process.on('unhandledRejection', (reason, promise) => {
    console.log(`Unhandled Rejection at: Promise ${JSON.stringify(promise)} reason: ${JSON.stringify(reason)}`);
  });
};

const setUpEnvVariables = (envConfig: IenvConfig): void => {
  Object.keys(envConfig).forEach(key => process.env[key] = envConfig[key]);
};

export const setUpConfig = (): void => {
  // if there is no NODE_ENV then assume that we are working in development environment
  // production env should be set up manually'
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  const env: string = process.env.NODE_ENV;

  if (env === 'development' || env === 'test') {
    setUpEnvVariables(variables[env]);
    listenForPromiseRejections();
  }
};

export const getConfig = (type: string, configuration: Iconfig = config) => (
  configuration[process.env.NODE_ENV][type]
);
