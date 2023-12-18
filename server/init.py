import os
from flask_migrate import upgrade
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import NoResultFound
from app import app, db

def init():
    try:
        app.logger.info("Initializing Sidekick server...")
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
                app.logger.info("Creating sidekick user...")
                DBUtils.create_user(user_id="sidekick",
                                    password=get_random_string())
                app.logger.info("Sidekick user created.")

            # Create admin user if they don't exist
            try:
                DBUtils.get_user("admin")
            except NoResultFound:
                app.logger.info("Creating admin user...")
                DBUtils.create_user(user_id="admin",
                                    password="changemenow",
                                    properties={"roles": {"admin": True}})
                app.logger.info("Admin user created.")
                
            update_system_settings()
            update_default_settings("sidekick")
        app.logger.info("Sidekick server initialized.")
    except Exception as e:
        app.logger.error("Sidekick server initialization failed.")
        app.logger.error(e)
        raise e

if __name__ == '__main__':
    init()