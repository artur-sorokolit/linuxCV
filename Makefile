# Variables
CLIENT_DIR = client
SERVER_DIR = server
DOCKER_COMPOSE = docker-compose

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies for all parts"
	@echo "  make dev          - Run client and server in development mode"
	@echo "  make server       - Run only server"
	@echo "  make start        - Start server + cloudflared tunnel + deploy client"
	@echo "  make build        - Build client for production"
	@echo "  make deploy       - Deploy client to GitHub Pages (runs lint first)"
	@echo "  make lint         - Run linter for client and server"
	@echo "  make format       - Run formatter for client and server"
	@echo "  make format-check - Check formatting for client and server"
	@echo "  make clean        - Remove build artifacts and node_modules"
	@echo "  make docker-up    - Start docker containers (future)"
	@echo "  make docker-down  - Stop docker containers (future)"

# Installation
.PHONY: install
install:
	cd $(CLIENT_DIR) && npm install
	cd $(SERVER_DIR) && npm install

# Development
.PHONY: dev
dev:
	make -j 2 dev-client dev-server

.PHONY: dev-client
dev-client:
	cd $(CLIENT_DIR) && npm run dev

.PHONY: dev-server
dev-server:
	cd $(SERVER_DIR) && npm run dev

.PHONY: server
server:
	cd $(SERVER_DIR) && npm run dev

# Self-hosted: server + cloudflared tunnel + deploy
.PHONY: start
start:
	./scripts/start-server.sh

# Production Build
.PHONY: build
build:
	cd $(CLIENT_DIR) && npm run build

# Deployment
.PHONY: deploy
deploy: lint
	cd $(CLIENT_DIR) && npm run deploy

# Linting
.PHONY: lint
lint:
	@echo "Running lint for client..."
	cd $(CLIENT_DIR) && npm run lint
	@echo "Running lint for server..."
	cd $(SERVER_DIR) && npm run lint

# Formatting
.PHONY: format
format:
	@echo "Running format for client..."
	cd $(CLIENT_DIR) && npm run format
	@echo "Running format for server..."
	cd $(SERVER_DIR) && npm run format

.PHONY: format-check
format-check:
	@echo "Checking format for client..."
	cd $(CLIENT_DIR) && npm run format:check
	@echo "Checking format for server..."
	cd $(SERVER_DIR) && npm run format:check

# Cleanup
.PHONY: clean
clean:
	rm -rf $(CLIENT_DIR)/dist
	rm -rf $(CLIENT_DIR)/node_modules

# Docker (Placeholders for future backend/db)
.PHONY: docker-up
docker-up:
	@echo "Starting Docker containers..."
	# $(DOCKER_COMPOSE) up -d

.PHONY: docker-down
docker-down:
	@echo "Stopping Docker containers..."
	# $(DOCKER_COMPOSE) down
