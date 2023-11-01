import os
import uuid
import json
import bcrypt
import traceback
from datetime import datetime
from sqlalchemy.exc import NoResultFound

from app import app, db
from models import User, Doctype, Document, Tag, DocumentTag, UserTag


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


class DBUtils:

    @staticmethod
    def create_user(user_id, password, properties={}):
        password_hash = bcrypt.hashpw(password.encode("utf-8"),
                                      bcrypt.gensalt()).decode("utf-8")
        user = User(id=user_id, password_hash=password_hash,
                    properties=properties)
        db.session.add(user)
        db.session.commit()

        # Setup default user doctypes
        for doctype_name in ["notes", "chats", "feedback", "settings",
                             "logs", "personas", "prompt_templates",
                             "note_templates"]:
            DBUtils.create_doctype(user_id, doctype_name)

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
                                            doctype_name="settings")
        # Setup default user documents
        for filename in os.listdir("default_documents"):
            if filename.endswith(".json"):
                with open(os.path.join("default_documents", filename),
                          "r") as f:
                    doctypes = json.load(f)
                    for doctype, documents in doctypes.items():
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
                                doctype_name=doctype)

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
    def delete_user(user_id):
        try:
            user = User.query.filter_by(id=user_id).one()
            user_as_dict = user.as_dict()
            for document in user.documents:
                DocumentTag.query.filter_by(document_id=document.id).delete()
                DBUtils.delete_document(document.id)
            UserTag.query.filter_by(user_id=user_id).delete()
            for doctype in user.doctypes:
                db.session.delete(doctype)
            db.session.delete(user)
            db.session.commit()
            return {'success': True}
        except NoResultFound:
            app.logger.error(f"Tried to delete a user with user ID: "
                             f"{user_id}, but that document doesn't exist.")
            return {'success': False, 'message': 'Error deleting user'}

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
    def create_document(user_id, name, tags=[], properties={}, content={},
                        doctype_name=""):
        try:
            User.query.filter_by(id=user_id).one()
        except NoResultFound:
            app.logger.error(f"Tried to create a document with document ID: "
                             f"{user_id}, but that user doesn't exist.")
            return

        if doctype_name:
            try:
                doctype = Doctype.query.filter_by(user_id=user_id,
                                                 name=doctype_name).one()
                document = Document(id=str(uuid.uuid4()),
                                    user_id=user_id, name=name,
                                    doctype_id=doctype.as_dict()["id"],
                                    properties=properties,
                                    updated_date = str(datetime.now()),
                                    created_date = str(datetime.now()),
                                    content=content)
            except NoResultFound:
                app.logger.error(f"Tried to create a document with doctype: "
                                 f"{doctype_name}, but that doctype doesn't "
                                 f"exist.")
                return
        else:
            document = Document(id=str(uuid.uuid4()), user_id=user_id,
                                name=name, properties=properties,
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
    def update_document_doctype(id, doctype_name):
        document = Document.query.filter_by(id=id).first()
        document.doctype_name = doctype_name
        db.session.add(document)
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def get_document_by_id(document_id):
        document = Document.query.filter_by(id=document_id).one()
        return document.as_dict()

    @staticmethod
    def get_document_by_name(user_id, name, doctype_name=""):
        if doctype_name:
            doctype = DBUtils.get_doctype_by_name(user_id, doctype_name)
        document = Document.query.filter_by(user_id=user_id, name=name,
                                            doctype_id=doctype["id"]).one()
        return document.as_dict()

    @staticmethod
    def list_documents(doctype_id):
        documents = [document.as_dict()["metadata"] for document in
                     Document.query.filter_by(doctype_id=doctype_id).all()]
        return {
            "file_count": len(documents),
            "error_count": 0,
            "status": "OK",
            "message": "All files read successfully",
            "documents": documents
        }

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
    def save_chat(user_id, doctype_name, chat):
        name = chat["name"] if "name" in chat else "New Chat"
        tags = chat["tags"] if "tags" in chat else []
        properties = chat["properties"] if "properties" in chat else "{}"
        content = {"chat": chat["chatHistory"]} if "chatHistory" in chat \
            else {"chat": []}
        if "id" not in chat or chat["id"] == "":
            document = DBUtils.create_document(user_id=user_id,
                                               name=name, tags=tags,
                                               properties=properties,
                                               content=content,
                                               doctype_name=doctype_name)
            server_stats["new_chats_count"] += 1
        else:
            DBUtils.update_document(id=chat["id"], name=name, tags=[],
                                    properties={}, content=chat)

        return document.as_dict()

    @staticmethod
    def create_doctype(user_id, name, properties={}):
        doctype = Doctype(id=str(uuid.uuid4()), user_id=user_id,
                          name=name, properties=properties)
        db.session.add(doctype)
        db.session.commit()

    @staticmethod
    def get_doctype_by_name(user_id, name):
        doctype = Doctype.query.filter_by(user_id=user_id, name=name).one()
        return doctype.as_dict()

    @staticmethod
    def list_doctypes():
        return [doctype.name for doctype in Doctype.query.all()]
