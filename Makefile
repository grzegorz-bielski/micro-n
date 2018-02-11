# vars

prod-dockerfile = -f docker-compose.yml -f docker-compose.prod.yml

# Development env

.PHONY: build-dev
build-dev:
	docker-compose build
	$(MAKE) install-backend-dependencies

.PHONY: start-dev
start-dev:
	docker-compose down
	docker-compose up

# Production env

.PHONY: build-prod
build-prod:
	docker-compose $(prod-dockerfile) build
	$(MAKE) install-backend-dependencies
	$(MAKE) build-backend

.PHONY: start-prod
start-prod:
	docker-compose down
	docker-compose $(prod-dockerfile) up -d

# helpers

.PHONY: install-backend-dependencies
install-backend-dependencies:
	docker-compose run --rm --no-deps backend npm install

.PHONY: build-backend
build-backend:
	docker-compose run --rm --no-deps backend npm run prestart:prod