import os
import uuid
import json
import random
import string
import bcrypt
import traceback
from datetime import datetime
from sqlalchemy.exc import NoResultFound

from app import app, db
from models import User, Document, Tag, DocumentTag, UserTag


server_stats = {
    "server_start_time": datetime.now(),
    "server_uptime": "0 days 0 hours 0 minutes 0 seconds",
    "new_chats_count": 0,
    "chat_interaction_count": 0,
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
}

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
    app.logger.debug(f"ai_request: {ai_request}")
    return ai_request

def log_exception(e):
    tb = traceback.format_exc()
    app.logger.error(f"An error occurred: {str(e)}\n{tb}")

def get_random_string(len=32):
    return "".join(random.choice(string.ascii_lowercase) for i in range(len))



class DBUtils:

    @staticmethod
    def create_user(user_id, password, properties={}):
        password_hash = bcrypt.hashpw(password.encode("utf-8"),
                                      bcrypt.gensalt()).decode("utf-8")
        user = User(id=user_id, password_hash=password_hash,
                    properties=properties)
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

    @staticmethod
    def login(user_id, password):
        try:
            user = User.query.filter_by(id=user_id).one()
            if bcrypt.checkpw(password.encode('utf-8'),
                              user.password_hash.encode('utf-8')):
                return{'success': True}
            else:
                return {'success': False, 'message': 'Invalid login'}
        except NoResultFound:
            return {'success': False, 'message': 'Invalid login'}

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
        # TODO: Check user has admin role
        # if "admin" in acting_user_roles and acting_user_roles["admin"]:
        user = User.query.filter_by(id=user_id).one()
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'),
                                        bcrypt.gensalt()).decode('utf-8')
        user.password_hash = new_password_hash
        db.session.commit()
        return {'success': True}
        # else:
        #     return {'success': False, 'message': 'Not authorized'}

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
            return {'success': True}
        except NoResultFound:
            app.logger.error(f"Tried to delete a user with user ID: "
                             f"{user_id}, but that document doesn't exist.")
            return {'success': False, 'message': 'Error deleting user'}

    @staticmethod
    def get_user(user_id):
        user = User.query.filter_by(id=user_id).one()
        return user.as_dict()

    @staticmethod
    def user_isadmin(user_id):
        user = User.query.filter_by(id=user_id).one()
        return user.as_dict().get("properties", {}).get("roles", {}).get(
            "admin", False) is True


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
            app.logger.error(f"Tried to create a document with document ID: "
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
        db.session.add(document)
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def update_document_type(document_id, document_type):
        document = Document.query.filter_by(id=id).first()
        document.type = document_type
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
            server_stats["new_chats_count"] += 1
        else:
            DBUtils.update_document(id=chat["id"], name=name, tags=[],
                                    properties={}, content=chat)

        return document.as_dict()
