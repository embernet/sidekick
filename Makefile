# Makefile for the Sidekick project
# Make web_ui and server_api docker images

.PHONY: init local run-dev-locally run-prod-locally all test web_ui server_api test-locally

all: local build

init:
	$(MAKE) -C web_ui init
	$(MAKE) -C server init

test: init
	$(MAKE) -C web_ui test
	$(MAKE) -C server test

run-dev-locally: init
	$(MAKE) -C server run-dev-locally &
	$(MAKE) -C web_ui run-dev-locally &

run-prod-locally: init
	$(MAKE) -C server run-prod-locally &
	$(MAKE) -C web_ui run-prod-locally &

web_ui:
	$(MAKE) -C web_ui

server_api:
	$(MAKE) -C server

test-locally:
	$(MAKE) -C web_ui test-locally
	$(MAKE) -C server test-locally

build-docker:
	docker build --tag sidekick-server server/
	docker build --tag sidekick-web-ui web_ui/
