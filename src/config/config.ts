import config from './devConfig';

interface Iconfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

// if there is no NODE_ENV then assume that we are working in development environment
const env: string = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  const envConfig: Iconfig = config[env];

  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key];
  });
}