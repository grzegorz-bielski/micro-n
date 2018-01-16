# Micro-N - Microblogging API 

Being developed as backend for not yet existing web app.

**Currently in active development.**

## Stack
Node.js, [Nest framework](https://github.com/nestjs/nest), TypeORM, MySQL, Redis, Nodemailer, JWT, class-validator and Jest.

## Roadmap & to do
- [x] basic posts module
- [x] basic comments module
- [x] basic mail module
- [x] basic users module
- [x] basic auth module
- [x] basic tags module
- [x] e2e tests refactor
- [x] voting
- [ ] user details config
- [ ] admin/mod dashboard
- [ ] chat module
- [ ] auth module refactor
- [ ] more unit tests
- [ ] cache (?)
- [ ] docker (?)
- [ ] swagger / postman doc integration (??)
- [ ] aws integration (?)
- [ ] subscriptions (?)
- [ ] notifications (?)

## Installation & start
1. install Node.js
1. install MySQL and Redis
1. create your config 
	* create folder `project-root/src/config/details`
	* create file `config.ts` and add your email config (only OAuth for now)

		```typescript
			export default {
				production: {
					mail: {
						user: 'name@email.com',
						id: '3434',
						secret: '234234',
						refreshToken: '234234',
						accessToken: '2342',
					},
				},
				development: {
					mail: {
						user: 'name@email.com',
						id: '3434',
						secret: '234234',
						refreshToken: '234234',
						accessToken: '2342',
					},
				},
			};
		```
	* create file `variables.ts` and add yuour DB config and JWT config

		```typescript
			export default {
				test: {
						PORT: 3001,
						MYSQL_URL: 'mysql://name:pass@localhost:3306/test',
						REDIS_DATABASE: 1,
						JWT_SECRET: 'weqwdqqwd3x424',
				},
				development: {
						PORT: 3000,
						MYSQL_URL: 'mysql://pess:pass@localhost:3306/dev',
						REDIS_DATABASE: 0,
						JWT_SECRET: '233qwdqwdr4pfdw',
				},
			};
		```
4. start server

```
$ npm install
$ npm run start
```

## Tests

```
$ npm run test:watch
$ npm run e2e:watch
```



