# Micro-N - Microblogging Platform

**Currently in active development.**

## Backend Stack

Node.js, [Nest framework](https://github.com/nestjs/nest), TypeORM, MySQL, Redis, Nodemailer, JWT, class-validator and Jest.

## Backend Roadmap & TODO

* [x] basic posts module
* [x] basic comments module
* [x] basic mail module
* [x] basic users module
* [x] basic auth module
* [x] basic tags module
* [x] e2e tests refactor
* [x] voting
* [ ] user details config
* [ ] admin/mod dashboard
* [ ] chat module
* [ ] auth module refactor
* [ ] more unit tests
* [ ] cache (?)
* [x] docker
* [ ] swagger / postman doc integration (??)
* [ ] aws integration (?)
* [ ] subscriptions (?)
* [ ] notifications (?)

## Frontend

todo

## Installation & start

1. [install docker and docker-compose](https://docs.docker.com/compose/install/)
2. Add `.env` file

Email module is adapted to use gmail's OAuth2 but it probably can be used with other services

```
# Backend
NODE_PORT=3000
NODE_ENV=dev
JWT_SECRET=some_super_secret_string
MAIL_USER=email@kek.com
MAIL_ID=id
MAIL_SECRET=secret
MAIL_REFRESH_TOKEN=token
MAIL_ACCESS_TOKEN=token

# MySQL
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_DATABASE=micro-n
MYSQL_USER=admin
MYSQL_PASSWORD=admin
MYSQL_ROOT_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DATABASE=0
```

3. build containers from images

```
# development
$ make build-dev

# production
$ make build-prod
```

4. start all services

```
# development
$ make dev

# production
$ make prod
```

## Tests

```
$ make backend-tests
```
