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
	@echo "  make sync         - Sync local code to remote server laptop via SSH (Fast!)"
	@echo "  make build        - Build client for production"
	@echo "  make deploy       - Deploy client to GitHub Pages (runs lint first)"
	@echo "  make lint         - Run linter for client and server"
	@echo "  make test         - Run server unit tests and typecheck"
	@echo "  make format       - Run formatter for client and server"
	@echo "  make format-check - Check formatting for client and server"
	@echo "  make clean        - Remove build artifacts and node_modules"
	@echo "  make up    	   - Start local Postgres for development"
	@echo "  make down         - Stop local Postgres"

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

# Load local environment variables for deployment/sync if .env exists
ifneq (,$(wildcard ./.env))
    include ./.env
    export
endif

# Self-hosted: server + cloudflared tunnel + deploy
.PHONY: start
start:
	./scripts/start-server.sh

# Sync code to remote server laptop securely
.PHONY: sync
sync:
ifndef REMOTE_SSH_TARGET
	$(error REMOTE_SSH_TARGET is not defined. Please create a root-level .env file with REMOTE_SSH_TARGET=user@host:dir)
endif
	rsync -avz --delete \
		--exclude 'node_modules' \
		--exclude '.git' \
		--exclude 'dist' \
		--exclude '.env' \
		--exclude 'data/database.sqlite' \
		--exclude 'server/data/database.sqlite' \
		./ $(REMOTE_SSH_TARGET)

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

# Testing
.PHONY: test
test:
	cd $(SERVER_DIR) && npm run typecheck && npm test

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

# Local Postgres for development
.PHONY: up
up:
	@echo "Starting local Postgres..."
	$(DOCKER_COMPOSE) up -d
	@echo "Postgres ready on postgresql://linuxcv:linuxcv@localhost:5432/linuxcv"

.PHONY: down
down:
	@echo "Stopping local Postgres..."
	$(DOCKER_COMPOSE) down
