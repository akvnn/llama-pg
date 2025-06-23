SHELL := /usr/bin/env bash

.EXPORT_ALL_VARIABLES:
# ================================
# ENVIRONMENTAL VARIABLES
# ================================
IMAGE_REGISTRY :=
IMAGE_TAG := local
PYTHONPATH  := .

CURRENT_DIR := $(shell pwd)

.PHONY: check-pip
check-pip:
	uv pip check

.PHONY: check-lint
check-lint:
	uv run ruff check src tests --quiet

.PHONY: check-format
check-format:
	uv run ruff format src tests --check --quiet

.PHONY: docker-cleanup
docker-cleanup:
	docker container kill $(shell docker container ls -qa) || true
	docker container rm $(shell docker container ls -qa) || true
	docker volume rm $(shell docker volume ls -q) || true
	docker network prune -f
	docker system prune -f


.PHONY: dev-up
dev-up: docker-cleanup
	docker compose up -d
