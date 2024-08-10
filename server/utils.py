import os
import uuid
import json
import random
import string
import bcrypt
import traceback
import time
from datetime import datetime
from sqlalchemy.exc import NoResultFound, OperationalError
import tiktoken
import requests
from flask import url_for
from requests_oauthlib import OAuth2Session
from flask_jwt_extended import get_jwt_identity
from jwt import PyJWKClient

from app import app, db, VERSION
from models import User, Document, Tag, DocumentTag, UserTag


server_stats = {
    "serverStartTime": datetime.now()
}

def increment_server_stat(category, stat_name, increment=1):
    if category not in server_stats:
        server_stats[category] = {}
    server_stats[category][stat_name] = server_stats[category].get(stat_name, 0) + increment

class RequestLogger:
    """
    A class for logging events during processing of a request
    with a timestamp, duration, route, userid, in a standard format,
    and transaction id (tid) to link events from the same request.
    Any logging parameters can be passed as keyword arguments and
    will be included in the log message. If logging parameters are ditcts,
    they will be converted to json strings and pretty printed.

    Simple usage is to just wrap the request in a with block

    More comprehensive usage example:
        with RequestLogger(request) as rl:
            # Automatically logs 'started' at the beginning of the with block
            try:
                # process the request
                rl.info('info to log during processing', data=additional_data_to_log)
                rl.debug('debug to log during processing', data=additional_data_to_log)
            except Exception as e:
                rl.exception(e, "optional message to log", data=additional_data_to_log)
            rl.info('response', size=response_size, status=response_status)
        # Automatically logs 'finished' at the end of the with block
        # Automatically logs any uncaught exceptions

    """
    def __init__(self, request, skip_start_log=False, skip_finish_log=False):
        self.start_time = time.time()
        # create a unique transaction id for all logs for this request
        self.tid = str(uuid.uuid4())
        self.request = request
        self.route = request.url_rule.rule if self.request.url_rule else None
        self.method = request.method
        self.skip_start_log = skip_start_log
        self.skip_finish_log = skip_finish_log
        self.pushed_items = []
        try:
            self.user = get_jwt_identity()
        except:
            self.user = 'None'
        if not skip_start_log:
            self.info('started')

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            # If the with block exited due to an exception, log the exception
            self.error('error', exception_message=str(exc_val),  traceback=''.join(traceback.format_tb(exc_tb)))
        if not self.skip_finish_log:
            collected_pushed_items = {k: v for d in self.pushed_items for k, v in d.items()}
            self.info('finished', **collected_pushed_items)
        # return True to suppress any uncaught exceptions
        # to avoid end-points causing the server to exit
        return True

    def _get_timestamp(self):
        return datetime.now().strftime('%y%m%d-%H%M%S.%f')[:-3]

    def _get_duration(self):
        return '{:.3f}'.format(time.time() - self.start_time)
    
    def _construct_log_message(self, type, message, **kwargs):
        """
        Construct a standard format log message with the given logger method, state, and additional key, value pairs.

        Parameters
        ----------
            type : str
                The type of message (e.g., INFO, ERROR).
            state : str
                The state of the request (e.g., 'request', 'response', 'error').
            **kwargs : dict
                Additional keyword arguments to include in the log message.
        """
        timestamp = self._get_timestamp()
        duration = self._get_duration()
        client = self.request.remote_addr
        sep = '::'
        log_message = f'{type} version{sep}{VERSION} time{sep}{timestamp}, duration{sep}{duration}, route{sep}{self.route}, method{sep}{self.method}, user{sep}{self.user}, client{sep}{client}, message{sep}{message}'
        for key, value in kwargs.items():
            # for dicts, convert to json string and pretty print
            if isinstance(value, dict):
                value = json.dumps(value, indent=4)
            log_message += f', {key}{sep}{value}'
        log_message += f', tid{sep}{self.tid}'
        return log_message
    
    def push(self, **kwargs):
        """
        Push a set of key value pairs
        to be included in the finished log message on with block exit.
        """
        self.pushed_items.append(kwargs)
        self.skip_finish_log = False

    def info(self, message, **kwargs):
        app.logger.info(self._construct_log_message("INFO", message, **kwargs))

    def error(self, message, **kwargs):
        app.logger.error(self._construct_log_message("ERROR", message, **kwargs))

    def exception(self, e, message="", **kwargs):
        app.logger.exception(self._construct_log_message("EXCEPTION", message, **kwargs), e)

    def warning(self, message, **kwargs):
        app.logger.warning(self._construct_log_message("WARNING", message, **kwargs))

    def debug(self, message, **kwargs):
        app.logger.debug(self._construct_log_message("DEBUG", message, **kwargs))


def num_characters_from_messages(messages):
    """Return the number of characters used by a list of messages."""
    num_characters = 0
    for message in messages:
        for key, value in message.items():
            num_characters += len(key) + len(value)
    return num_characters    
    

def openai_num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613"):
    """Return the number of tokens used by a list of messages.
    from: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Model not found. Using cl100k_base encoding.
        encoding = tiktoken.get_encoding("cl100k_base")
    if model in {
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-16k-0613",
        "gpt-4-0314",
        "gpt-4-32k-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
        "gpt-4o"
        }:
        tokens_per_message = 3
        tokens_per_name = 1
    elif model == "gpt-3.5-turbo-0301":
        tokens_per_message = 4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        tokens_per_name = -1  # if there's a name, the role is omitted
    elif "gpt-3.5-turbo" in model:
        # Warning: gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613.
        return openai_num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613")
    elif "gpt-4" in model:
        # Warning: gpt-4 may update over time. Returning num tokens assuming gpt-4-0613.
        return openai_num_tokens_from_messages(messages, model="gpt-4-0613")
    else:
        raise NotImplementedError(
            f"""openai_num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
        )
    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


def construct_ai_request(request):
    model_settings = request.json["model_settings"]
    system_prompt = request.json["system_prompt"]
    prompt = request.json["prompt"]
    chatHistory = request.json["chatHistory"] if (
                'chatHistory' in request.json) else []
    ai_request = model_settings["request"]
    ai_request["messages"] = [{"role": "system", "content": system_prompt}] + \
                             chatHistory + [
                                 {"role": "user", "content": prompt}]
    return ai_request


def get_random_string(len=32):
    return "".join(random.choice(string.ascii_lowercase) for i in range(len))


def merge_settings(settings, new_settings):
    """
    Recursively merge new keys of new_settings dictionary into settings dictionary.
    Existing keys in settings dictionary are not overwritten.

    Returns:
        settings: The updated settings dictionary
        settings_updated: True if any new settings were added, False otherwise
    """
    settings_updated = False
    overrides = new_settings.get("_overrides", [])
    for key, value in new_settings.items():
        if key not in settings or key in overrides:
            settings[key] = value
            settings_updated = True
        elif isinstance(value, dict):
            settings[key], new_nested_settings = merge_settings(settings.get(key, {}), value)
            settings_updated = settings_updated or new_nested_settings
    return settings, settings_updated


def update_system_settings():
    """
    Create new system settings documents if they don't exist
    Merge new settings within those documents if they do exist
    """
    for settings_file in os.listdir("system_settings"):
        settings_name = settings_file.split(".")[0]
        filesystem_settings = json.loads(open("system_settings/"
                                    f"{settings_file}").read())
        try:
            system_settings = DBUtils.get_document(user_id="sidekick",
                                 name=settings_name,
                                 type="system_settings")
            # If there are new settings that aren't present in the database, add them
            updated_system_settings, settings_updated = merge_settings(system_settings, { 'content': filesystem_settings })
            if settings_updated:
                DBUtils.update_document(id=updated_system_settings["metadata"]["id"],
                                        name=updated_system_settings["metadata"]["name"],
                                        tags=updated_system_settings["metadata"]["tags"],
                                        properties=updated_system_settings["metadata"]["properties"],
                                        content=updated_system_settings["content"])
        except NoResultFound:
            DBUtils.create_document(user_id="sidekick",
                                    name=settings_name,
                                    type="system_settings",
                                    content=filesystem_settings)


def update_default_settings(user_id):
    """
    Update default settings for the sidekick user in the database
    if they have changed in this app release (i.e. on the filesystem)
    """
    for filename in os.listdir("default_settings"):
        if filename.endswith(".json"):
            settings_name = os.path.splitext(filename)[0]
            with open(os.path.join("default_settings", filename), "r") as f:
                filesystem_settings = json.load(f)
                try:
                    default_settings = DBUtils.get_document(user_id=user_id,
                                        name=settings_name,
                                        type="settings")
                    # If there are new settings that aren't present in the database, add them
                    updated_default_settings, settings_updated = merge_settings(default_settings, { 'content': filesystem_settings })
                    if settings_updated:
                        DBUtils.update_document(id=updated_default_settings["metadata"]["id"],
                                                name=updated_default_settings["metadata"]["name"],
                                                tags=updated_default_settings["metadata"]["tags"],
                                                properties=updated_default_settings["metadata"]["properties"],
                                                content=updated_default_settings["content"])
                except NoResultFound:
                    DBUtils.create_document(user_id=user_id,
                                            name=settings_name,
                                            type="settings",
                                            content=filesystem_settings)


def get_well_known_metadata():
    """
    Get the well known metadata from the OIDC well-known URL
    """
    response = requests.get(app.config["OIDC_WELL_KNOWN_URL"])
    response.raise_for_status()
    return response.json()


def get_oauth2_session(**kwargs):
    """
    Return an OAuth2Session that is configured with the OIDC client and redirect URI
    """
    return OAuth2Session(app.config["OIDC_CLIENT_ID"], scope=["profile", "email", "openid"],
                         redirect_uri=app.config["OIDC_REDIRECT_URL"], **kwargs)


def get_jwks_client():
    """
    Get a JWKS client that can be used to decode JWTs
    """
    well_known_metadata = get_well_known_metadata()
    jwks_client = PyJWKClient(well_known_metadata["jwks_uri"])
    return jwks_client


class DBUtils:

    @staticmethod
    def create_user(user_id, password, name="", is_oidc=False, properties={}):
        password_hash = bcrypt.hashpw(password.encode("utf-8"),
                                      bcrypt.gensalt()).decode("utf-8")
        user = User(id=user_id, password_hash=password_hash,
                    name=name, is_oidc=is_oidc, properties=properties)
        db.session.add(user)
        db.session.commit()

        # Setup default user settings
        for filename in os.listdir("default_settings"):
            if filename.endswith(".json"):
                name = os.path.splitext(filename)[0]
                with open(os.path.join("default_settings", filename),
                          "r") as f:
                    settings = json.load(f)
                    DBUtils.create_document(user_id=user_id,
                                            name=name,
                                            tags=[],
                                            properties={},
                                            content=settings,
                                            type="settings")
        # Setup default user documents
        for filename in os.listdir("default_documents"):
            if filename.endswith(".json"):
                with open(os.path.join("default_documents", filename),
                          "r") as f:
                    document_types = json.load(f)
                    for type, documents in document_types.items():
                        for name, document in documents.items():
                            DBUtils.create_document(
                                user_id=user_id,
                                name=name,
                                tags=list(set(document["tags"]
                                if "tags" in document else "[]")),
                                properties=document["properties"]
                                if "properties" in document else "{}",
                                content=document["content"]
                                if "content" in document else "{}",
                                type=type)
        return user.as_dict()
    
    @staticmethod
    def list_users():
        users = [user.as_dict() for user in User.query.all()]
        return users
    
    @staticmethod
    def update_user(user_id, name=None, properties=None):
        if not name and not properties:
            return
        user = User.query.filter_by(id=user_id).one()
        if name:
            user.name = name
        if properties:
            user.properties = json.dumps(properties)
        db.session.add(user)
        db.session.commit()
        return user.as_dict()

    @staticmethod
    def login(user_id, password):
        try:
            user = User.query.filter_by(id=user_id).one()
            if bcrypt.checkpw(password.encode('utf-8'),
                              user.password_hash.encode('utf-8')):
                return { 
                    'user': {
                        'id': user.id, 
                        'name': user.name,
                        'is_oidc': user.is_oidc,
                        'properties': json.loads(user.properties)
                    },
                    'success': True
                }
            else:
                return {'success': False, 'message': 'Invalid login'}
        except NoResultFound:
            return {'success': False, 'message': 'Invalid login'}

    @staticmethod
    def login_user_details(user_id):
        try:
            user = User.query.filter_by(id=user_id).one()
            return { 
                'user': {
                    'id': user.id, 
                    'properties': json.loads(user.properties)
                },
                'success': True
            }
        except NoResultFound:
            return {'success': False, 'message': 'Invalid user'}

    @staticmethod
    def change_password(user_id, current_password, new_password):
        user = User.query.filter_by(id=user_id).one()
        if bcrypt.checkpw(current_password.encode('utf-8'),
                          user.password_hash.encode('utf-8')):
            new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'),
                                              bcrypt.gensalt()).decode('utf-8')
            user.password_hash = new_password_hash
            db.session.commit()
            return {'success': True}
        return {'success': False, 'message': 'Invalid login'}

    @staticmethod
    def reset_password(acting_user_id, user_id, new_password):
        acting_user = User.query.filter_by(id=acting_user_id).one()
        app.logger.info(f"/reset_password {acting_user.as_dict()}")
        user = User.query.filter_by(id=user_id).one()
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'),
                                        bcrypt.gensalt()).decode('utf-8')
        user.password_hash = new_password_hash
        db.session.commit()
        return {'success': True}
    
    @staticmethod
    def rename_user_id(user_id, new_user_id, user_name):
        try:
            user = User.query.filter_by(id=user_id).one()
        except NoResultFound:
            return {'success': False, 'message': 'User ID not found'}
        # Check if user is an OIDC user as they cannot be renamed
        if user.is_oidc:
            return {'success': False, 'message': 'OIDC users cannot be renamed'}
        # Check if the new user_id already exists
        try:
            User.query.filter_by(id=new_user_id).one()
            return {'success': False, 'message': 'User ID already exists'}
        except NoResultFound:
            pass
        # create a new user with the new user_id
        new_user = User(id=new_user_id, password_hash=user.password_hash,
                        name=user_name, is_oidc=user.is_oidc,
                        properties=json.loads(user.properties))
        db.session.add(new_user)
        # Update user_id in all documents
        documents = Document.query.filter_by(user_id=user_id).all()
        for document in documents:
            document.user_id = new_user_id
        # Update user_id in all user tags
        user_tags = UserTag.query.filter_by(user_id=user_id).all()
        for user_tag in user_tags:
            user_tag.user_id = new_user_id
        # Delete the old user
        db.session.delete(user)
        db.session.commit()
        return {'success': True, 'message': 'User ID renamed'}

    @staticmethod
    def delete_user(user_id):
        try:
            user = User.query.filter_by(id=user_id).one()
            for document in user.documents:
                DocumentTag.query.filter_by(document_id=document.id).delete()
                DBUtils.delete_document(document.id)
            UserTag.query.filter_by(user_id=user_id).delete()
            db.session.delete(user)
            db.session.commit()
            app.logger.info(f"Deleted user: {user_id}")
            return {'success': True, 'message': f'Deleted user: {user_id}'}
        except NoResultFound:
            app.logger.error(f"Tried to delete a user with user ID: "
                             f"{user_id}, but that document doesn't exist.")
            return {'success': False, 'message': f'Error deleting user: {user_id}'}

    @staticmethod
    def get_user(user_id):
        user = User.query.filter_by(id=user_id).one()
        return user.as_dict()

    @staticmethod
    def user_isadmin(user_id):
        user = User.query.filter_by(id=user_id).one()
        user_dict = user.as_dict()
        properties = user_dict.get("properties", {})
        if isinstance(properties, str):
            try:
                properties = json.loads(properties)
            except:
                properties = {}
        roles = properties.get("roles", {})
        is_admin = roles.get("admin", False)
        return is_admin is True


    @staticmethod
    def add_tags(tags, document_id=None, user_id=None):
        for tag_name in tags:
            try:
                Tag.query.filter_by(name=tag_name).one()
            except NoResultFound:
                db.session.add(Tag(name=tag_name))

            if document_id:
                try:
                    DocumentTag.query.filter_by(document_id=document_id,
                                                tag_name=tag_name).one()
                except NoResultFound:
                    db.session.add(DocumentTag(document_id=document_id,
                                               tag_name=tag_name))

            if user_id:
                try:
                    UserTag.query.filter_by(user_id=user_id,
                                            tag_name=tag_name).one()
                except NoResultFound:
                    db.session.add(UserTag(user_id=user_id,
                                           tag_name=tag_name))

            db.session.commit()

    @staticmethod
    def create_document(user_id, name, type="",tags=[],
                        properties={}, content={}):
        try:
            User.query.filter_by(id=user_id).one()
        except NoResultFound:
            app.logger.error(f"Tried to create a document with user_id: "
                             f"{user_id}, but that user doesn't exist.")
            return

        document = Document(id=str(uuid.uuid4()), user_id=user_id, name=name,
                            type=type, properties=properties,
                            updated_date=str(datetime.now()),
                            created_date=str(datetime.now()),
                            content=content)

        db.session.add(document)
        db.session.commit()

        DBUtils.add_tags(tags, document.id, user_id)

        return document.as_dict()

    @staticmethod
    def update_document(id, name, tags, properties, content):
        document = Document.query.filter_by(id=id).one()
        document.name = name
        document.properties = json.dumps(properties)
        document.content = json.dumps(content)
        document.updated_date = str(datetime.now())
        db.session.add(document)

        DocumentTag.query.filter_by(document_id=id).delete()
        DBUtils.add_tags(tags, document.id, document.user_id)

        db.session.commit()
        return document.as_dict()

    @staticmethod
    def update_document_name(id, name):
        document = Document.query.filter_by(id=id).first()
        document.name = name
        document.updated_date = str(datetime.now())
        db.session.add(document)
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def update_document_type(document_id, document_type):
        document = Document.query.filter_by(id=id).first()
        document.type = document_type
        document.updated_date = str(datetime.now())
        db.session.add(document)
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def get_document(document_id=None, user_id=None, name=None, type=None):
        if document_id:
            document = Document.query.filter_by(id=document_id).one()
        elif user_id and name and type:
            document = Document.query.filter_by(user_id=user_id, name=name,
                                                type=type).one()
        else:
            document = {}
        return document.as_dict()

    @staticmethod
    def list_documents(document_type, user_id=""):
        documents = [doc.as_dict()["metadata"] for doc in
                     Document.query.filter_by(type=document_type,
                                              user_id=user_id
                                              if user_id else None).all()]
        return {"file_count": len(documents), "error_count": 0, "status": "OK",
                "message": "All files read successfully",
                "documents": documents}
    
    @staticmethod
    def list_feedback():
        documents = [doc.as_dict()["metadata"] for doc in
                     Document.query.filter_by(type="feedback").all()]
        return {"file_count": len(documents), "error_count": 0, "status": "OK",
                "message": "All files read successfully",
                "documents": documents}

    @staticmethod
    def delete_document(document_id):
        try:
            document = Document.query.filter_by(id=document_id).one()
            document_as_dict = document.as_dict()
            for tag in document.tags:
                db.session.delete(tag)
            db.session.delete(document)
            db.session.commit()
            return document_as_dict
        except NoResultFound:
            app.logger.error(f"Tried to delete a document with document ID: "
                             f"{document_id}, but that document doesn't "
                             f"exist.")
            return

    @staticmethod
    def save_chat(user_id, type, chat):
        name = chat["name"] if "name" in chat else "New Chat"
        tags = chat["tags"] if "tags" in chat else []
        properties = chat["properties"] if "properties" in chat else "{}"
        content = {"chat": chat["chatHistory"]} if "chatHistory" in chat \
            else {"chat": []}
        if "id" not in chat or chat["id"] == "":
            document = DBUtils.create_document(user_id=user_id, name=name,
                                               type=type, tags=tags,
                                               properties=properties,
                                               content=content)
            server_stats["newChats"] += 1
        else:
            DBUtils.update_document(id=chat["id"], name=name, tags=[],
                                    properties={}, content=chat)

        return document.as_dict()

    @staticmethod
    def health():
        database_health = {}
        if "DB_DIALECT_NAME" in app.config:
            database_health["dialect"] = app.config["DB_DIALECT_NAME"]
        if "DB_NAME" in app.config:
            database_health["name"] = app.config["DB_NAME"]
        if "DB_HOST" in app.config:
            database_health["host"] = app.config["DB_HOST"]

        try:
            database_health["status"] = "UP"
            database_health["documents"] = Document.query.count()
            database_health["users"] = User.query.count()  
        except OperationalError:
            database_health["status"] = "DOWN"
        return database_health
