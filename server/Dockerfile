FROM python:3.10-alpine

RUN apk add --no-cache gcc musl-dev libffi-dev

RUN adduser -D -u 1000 sidekick

WORKDIR /sidekick_server

COPY Pipfile.lock ./
RUN pip install --upgrade pip && \
    pip install pipenv && \
    pipenv requirements > requirements.txt && \
    pip install --no-cache-dir --upgrade -r requirements.txt

COPY init.py app.py models.py routes.py utils.py docker-entrypoint.sh ./
COPY custom_utils ./custom_utils
COPY default_documents ./default_documents
COPY default_settings ./default_settings
COPY system_settings ./system_settings
COPY migrations ./migrations

RUN chmod +x docker-entrypoint.sh

RUN chown -R sidekick:sidekick /sidekick_server

USER sidekick

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]