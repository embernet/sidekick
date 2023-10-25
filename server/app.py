import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_oidc import OpenIDConnect


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URI",
                                                       "sqlite:///sqlite.db")
# app.config["OIDC_CLIENT_SECRETS"] = "client_secrets.json"
# app.config["SECRET_KEY"] =""
db = SQLAlchemy()
db.init_app(app)
jwt = JWTManager(app)
CORS(app)
migrate = Migrate(app, db)
# oidc = OpenIDConnect(app)

import routes
