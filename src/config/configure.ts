import variables from './envVariables';

interface IenvConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

const listenForPromiseRejections = (): void => {
  process.on('unhandledRejection', (reason, promise) => {
    console.log(`Unhandled Rejection at: Promise ${promise} reason: ${reason}`);
  });
};

const setUpEnvVariables = (envConfig: IenvConfig): void => {
  Object.keys(envConfig).forEach(key => process.env[key] = envConfig[key]);
};

export const setUpConfig = (): void => {
  // if there is no NODE_ENV then assume that we are working in development environment
  const env: string = process.env.NODE_ENV || 'development';

  if (env === 'development' || env === 'test') {
    setUpEnvVariables(variables[env]);
    listenForPromiseRejections();
  }
};
