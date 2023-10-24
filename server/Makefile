.PHONY: init test build-docker run-dev-locally run-prod-locally run-container stop-container

init:
	pipenv install

test: init
	pipenv run python -m pytest

build-docker:
	docker build --tag sidekick-server .

run-dev-locally: init
	pipenv run python run.py

run-prod-locally: init
	pipenv run gunicorn -w 4 -b 0.0.0.0:5003 app:app

run-container:
	docker run -d -p 5004:5004 --name sidekick-server app \
	docker ps

stop-container:
	docker stop sidekick-server; \
	docker ps

test-locally:
	$(MAKE) init
	$(MAKE) test

db-upgrade:
	pipenv run flask db upgrade

