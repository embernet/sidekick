import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from sqlalchemy.engine.url import make_url
import uuid
from prometheus_flask_exporter import PrometheusMetrics

VERSION = "0.3.5"
server_instance_id = str(uuid.uuid4())

app = Flask(__name__)
app.logger.setLevel(logging.getLevelName(
    os.environ.get("LOG_LEVEL", "ERROR")))
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["SQLALCHEMY_DATABASE_URI"]
app.config["SIDEKICK_WEBUI_BASE_URL"] = os.environ.get("SIDEKICK_WEBUI_BASE_URL", "http://localhost:8081")
app.config["OPENAI_API_KEY"] = os.environ["OPENAI_API_KEY"]
app.config["OPENAI_BASE_URL"] = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

# Optionally count chat tokens if specified in the env var
# (token count is not returned by the streaming interface)
# Set to True to count prompt and completion tokens, or leave blank
# Counting tokens uses the tiktoken library, which calls an additional cloud endpoint
app.config["SIDEKICK_COUNT_TOKENS"] = os.environ.get("SIDEKICK_COUNT_TOKENS", False)

app.config["OIDC_WELL_KNOWN_URL"] = os.environ.get("OIDC_WELL_KNOWN_URL")
app.config["OIDC_TOKEN_ENDPOINT"] = os.environ.get("OIDC_TOKEN_ENDPOINT")
app.config["OIDC_REDIRECT_URL"] = os.environ.get("OIDC_REDIRECT_URL")
app.config["OIDC_CLIENT_ID"] = os.environ.get("OIDC_CLIENT_ID")
app.config["OIDC_CLIENT_SECRET"] = os.environ.get("OIDC_CLIENT_SECRET")

app.config["SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]

db_url = make_url(app.config["SQLALCHEMY_DATABASE_URI"])
db_dialect_name = db_url.get_dialect().name
app.config["DB_DIALECT_NAME"] = db_dialect_name
try:
    app.config["DB_NAME"] = db_url.database
    app.config["DB_HOST"] = db_url.host
except:
    pass

db = SQLAlchemy()
db.init_app(app)
jwt = JWTManager(app)
CORS(app)
migrate = Migrate(app, db)

metrics = PrometheusMetrics(app)

# static information as metric
metrics.info('app_info', 'Application info', version=VERSION)

# Remove all logger handlers and add a new one
while app.logger.hasHandlers():
    app.logger.removeHandler(app.logger.handlers[0])
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s][%(levelname)s][%(filename)s]'
                              '[%(name)s.%(funcName)s:%(lineno)s] %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.info(f"message::Sidekick server started, version::{VERSION}")

import routes
