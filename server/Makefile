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
	pipenv run python init.py
	gunicorn -c gunicorn_config.py --worker-class gevent -b --timeout 120 --workers 4 --threads 4 0.0.0.0:5000 app:app

stop-container:
	docker stop sidekick-server; \
	docker ps

test-locally:
	$(MAKE) init
	$(MAKE) test

db-upgrade:
	pipenv run flask db upgrade
