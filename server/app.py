import os
import json
import logging
from urllib.parse import quote, urljoin
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from flask_cors import CORS
from sqlalchemy.exc import NoResultFound
from sqlalchemy.engine.url import make_url
from flask_oidc import OpenIDConnect

app = Flask(__name__)
app.logger.setLevel(logging.getLevelName(
    os.environ.get("LOG_LEVEL", "ERROR")))
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["SQLALCHEMY_DATABASE_URI"]
app.config["OPENAI_API_KEY"] = os.environ["OPENAI_API_KEY"]
# app.config["OIDC_CLIENT_SECRETS"] = "client_secrets.json"
# app.config["SECRET_KEY"] =""
db = SQLAlchemy()
db.init_app(app)
jwt = JWTManager(app)
CORS(app)
migrate = Migrate(app, db)
# oidc = OpenIDConnect(app)

proxy_user = os.environ.get('HTTPS_PROXY_USER', '')
proxy_password = os.environ.get('HTTPS_PROXY_PASSWORD', '')
proxy_host = os.environ.get('HTTPS_PROXY_HOST', '')
proxy_port = os.environ.get('HTTPS_PROXY_PORT', '')
proxy_protocol = proxy_host.split('://', 1)[0] if '://' in proxy_host else ''
proxy_host = proxy_host.split('://', 1)[1] if '://' in proxy_host else proxy_host
if proxy_user and proxy_password and proxy_host and proxy_port:
    os.environ['HTTPS_PROXY'] = urljoin(
        f"{proxy_protocol}://{quote(proxy_user)}:{quote(proxy_password)}@"
        f"{quote(proxy_host)}:{proxy_port}", ''
    )

from utils import DBUtils, get_random_string

url = make_url(app.config["SQLALCHEMY_DATABASE_URI"])
dialect_name = url.get_dialect().name

with app.app_context():
    if dialect_name == "sqlite":
        db.create_all()
    if dialect_name == "postgresql":
        upgrade(directory="migrations")

    # Create sidekick user they don't exist
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

    # Create system settings documents if they don't exist
    for settings_file in os.listdir("system_settings"):
        settings_name = settings_file.split(".")[0]
        try:
            DBUtils.get_document(user_id="sidekick",
                                 name=settings_name,
                                 type="system_settings")
        except NoResultFound:
            settings = json.loads(open("system_settings/"
                                       f"{settings_file}").read())
            DBUtils.create_document(user_id="sidekick",
                                    name=settings_name,
                                    type="system_settings",
                                    content=settings)

import routes
