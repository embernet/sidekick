import os
from flask_migrate import upgrade
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import NoResultFound
from app import app, db

db_url = make_url(os.environ["SQLALCHEMY_DATABASE_URI"])
db_dialect_name = db_url.get_dialect().name

with app.app_context():
    from utils import DBUtils, get_random_string, update_system_settings, update_default_settings
    
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
