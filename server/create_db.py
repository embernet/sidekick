import os
import json
from sqlalchemy_utils import database_exists
from sqlalchemy.exc import NoResultFound

from app import app, db
from utils import DBUtils, get_random_string

SQLALCHEMY_DATABASE_URI = os.environ.get(
    "SQLALCHEMY_DATABASE_URI", "sqlite:///sqlite.db")

with app.app_context():
    if not database_exists(SQLALCHEMY_DATABASE_URI):
        print("Database doesn't exist, attempting to create one now.")
        db.create_all()
        print(f"Created database {SQLALCHEMY_DATABASE_URI}")

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