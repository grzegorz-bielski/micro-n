# vars
prod-dockerfile = -f docker-compose.yml
dev-dockerfile = -f docker-compose.yml -f docker-compose.dev.yml

# Development env

.PHONY: build-dev
build-dev:
	docker-compose $(dev-dockerfile) build
	$(MAKE) install-backend-dependencies

.PHONY: dev
dev:
	docker-compose down
	docker-compose $(dev-dockerfile) up

# Production env

.PHONY: build-prod
build-prod:
	docker-compose $(prod-dockerfile) build
	$(MAKE) install-backend-dependencies

.PHONY: prod
prod:
	docker-compose down
	docker-compose $(prod-dockerfile) up -d

# helpers

.PHONY: install-backend-dependencies
install-backend-dependencies:
	docker-compose run --rm --no-deps backend npm install

.PHONY: backend-tests
backend-tests:
	docker-compose run --rm -e NODE_ENV=test -e MYSQL_USER=admin backend bash -c "npm run e2e"
