.PHONY: init test build-locally build-docker run-dev-locally run-prod-locally start-container stop-container test-locally

init:
	npm install

test:
	npm test

build-locally: init
	npm run build

build-docker:
	docker build --tag sidekick-web-ui .

run-dev-locally: init
	npm start

run-prod-locally: build-locally
	npx serve -s build

start-container:
	docker run -d -p 8081:8080 --name sidekick-web-ui sidekick-web-ui; \
	docker ps

stop-container:
	docker stop sidekick-web-ui; \
	docker ps

test-locally:
	$(MAKE) init
	$(MAKE) test
