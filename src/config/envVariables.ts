export default {
  test: {
      PORT: 3000,
      MYSQL_URL: 'mysql://pesio:password@localhost:3306/test',
      REDIS_DATABASE: 1,
      JWT_SECRET: 'werwer444333vhhvd8welkr3x424',
  },
  development: {
      PORT: 3000,
      MYSQL_URL: 'mysql://pesio:password@localhost:3306/dev',
      REDIS_DATABASE: 0,
      JWT_SECRET: '2334rc4c4343c4343rrr4pfott00',
  },
};
