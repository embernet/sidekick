import os
import json
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from flask_cors import CORS
from sqlalchemy_utils import database_exists
from sqlalchemy.exc import NoResultFound
from flask_oidc import OpenIDConnect

app = Flask(__name__)
app.logger.setLevel(logging.getLevelName(
    os.environ.get("LOG_LEVEL", "ERROR")))
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "SQLALCHEMY_DATABASE_URI", "sqlite:///sqlite.db")
# app.config["OIDC_CLIENT_SECRETS"] = "client_secrets.json"
# app.config["SECRET_KEY"] =""
db = SQLAlchemy()
db.init_app(app)
jwt = JWTManager(app)
CORS(app)
migrate = Migrate(app, db)
# oidc = OpenIDConnect(app)

if not database_exists(app.config["SQLALCHEMY_DATABASE_URI"]):
    app.logger.info("Database doesn't exist, attempting to create one now.")
    with app.app_context():
        db.create_all()
        upgrade(directory="migrations")
        app.logger.info("Created database "
                        f"{app.config['SQLALCHEMY_DATABASE_URI']}")

from utils import DBUtils, get_random_string

with app.app_context():
    # Create sidekick user and system_settings doctype if they don't exist
    try:
        DBUtils.get_user_by_id("sidekick")
    except NoResultFound:
        DBUtils.create_user(user_id="sidekick",
                            password=get_random_string())
        DBUtils.create_doctype(user_id="sidekick", name="system_settings")

    # Create admin user if they don't exist
    try:
        DBUtils.get_user_by_id("admin")
    except NoResultFound:
        DBUtils.create_user(user_id="admin",
                            password="changemenow",
                            properties={"admin": True})

    # Create system settings documents if they don't exist
    for settings_file in os.listdir("system_settings"):
        settings_name = settings_file.split(".")[0]
        try:
            DBUtils.get_document_by_name(user_id="sidekick",
                                         name=settings_name,
                                         doctype_name="system_settings")
        except NoResultFound:
            settings = json.loads(open("system_settings/"
                                       f"{settings_file}").read())
            DBUtils.create_document(user_id="sidekick",
                                    name=settings_name,
                                    doctype_name="system_settings",
                                    content=settings)

import routes
