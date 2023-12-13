import os
import json
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from flask_cors import CORS
from sqlalchemy.exc import NoResultFound
from sqlalchemy.engine.url import make_url
from flask_oidc import OpenIDConnect

VERSION = "0.1.5"

app = Flask(__name__)
app.logger.setLevel(logging.getLevelName(
    os.environ.get("LOG_LEVEL", "ERROR")))
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["SQLALCHEMY_DATABASE_URI"]
app.config["OPENAI_API_KEY"] = os.environ["OPENAI_API_KEY"]
app.config["OPENAI_PROXY"] = os.environ.get("OPENAI_PROXY")

# Optionallay count chat tokens if specified in the env var
# (token count is not returned by the streaming interface)
# Set to True to count prompt and completion tokens, or leave blank
# Counting tokens uses the tiktoken library, which calls an additional cloud endpoint
app.config["SIDEKICK_COUNT_TOKENS"] = os.environ.get("SIDEKICK_COUNT_TOKENS", False)

app.config["OIDC_CLIENT_SECRETS"] = {
    "web": {
        "client_id": os.environ.get("OIDC_CLIENT_ID"),
        "client_secret": os.environ.get("OIDC_CLIENT_SECRET"),
        "redirect_uris": [os.environ.get("OIDC_REDIRECT_URI")],
        "issuer": os.environ.get("OIDC_ISSUER")
    }
}
app.config["OVERWRITE_REDIRECT_URI"] = os.environ.get("OIDC_REDIRECT_URI")
app.config["SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]

db = SQLAlchemy()
db.init_app(app)
jwt = JWTManager(app)
CORS(app)
migrate = Migrate(app, db)

# Remove all logger handlers and add a new one
while app.logger.hasHandlers():
    app.logger.removeHandler(app.logger.handlers[0])
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s][%(levelname)s][%(filename)s]'
                              '[%(name)s.%(funcName)s:%(lineno)s] %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.info(f"message::Sidekick server started, version::{VERSION}")

if app.config["OIDC_CLIENT_SECRETS"]["web"]["client_id"]:
    oidc = OpenIDConnect(app)
else:
    oidc = None

from utils import DBUtils, get_random_string, merge_settings,\
    update_system_settings, update_default_settings

db_url = make_url(app.config["SQLALCHEMY_DATABASE_URI"])
db_dialect_name = db_url.get_dialect().name
app.config["DB_DIALECT_NAME"] = db_dialect_name
try:
    app.config["DB_NAME"] = db_url.database
    app.config["DB_HOST"] = db_url.host
except:
    pass


with app.app_context():
    if db_dialect_name == "sqlite":
        db.create_all()
    if db_dialect_name == "postgresql":
        upgrade(directory="migrations")

    # Create sidekick user if they don't exist
    try:
        DBUtils.get_user("sidekick")
    except NoResultFound:
        DBUtils.create_user(user_id="sidekick",
                            password=get_random_string())

    # Create admin user if they don't exist
    try:
        DBUtils.get_user("admin")
    except NoResultFound:
        DBUtils.create_user(user_id="admin",
                            password="changemenow",
                            properties={"roles": {"admin": True}})
        
    update_system_settings()
    update_default_settings("sidekick")

import routes
