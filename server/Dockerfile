FROM python:3.10-alpine
RUN apk add gcc musl-dev libffi-dev
WORKDIR /sidekick_server
COPY Pipfile.lock ./
RUN pip install pipenv
RUN pipenv requirements > requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY app.py models.py routes.py utils.py ./
COPY default_documents ./default_documents
COPY default_settings ./default_settings
COPY system_settings ./system_settings
COPY migrations ./migrations
CMD ["gunicorn", "--bind", "0.0.0.0:80", "app:app"]