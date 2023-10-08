# Makefile for the Sidekick server API
# Python Flask implementation of Sidekick server API

FROM python:3.10-alpine
WORKDIR /docker_server_api
COPY . .
RUN pip install openai flask flask_cors pyyaml python-dotenv bcrypt sseclient-py flask-jwt-extended gunicorn
EXPOSE 5004
CMD [ "python", "sidekick_server.py" ]
