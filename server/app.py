import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from flask_cors import CORS
from sqlalchemy_utils import database_exists
from flask_oidc import OpenIDConnect


app = Flask(__name__)
app.logger.setLevel(logging.getLevelName(
    os.environ.get("LOG_LEVEL", "ERROR")))
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
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

import routes
