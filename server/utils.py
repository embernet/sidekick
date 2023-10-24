import os
import json
import bcrypt
import traceback
from datetime import datetime
from sqlalchemy.exc import NoResultFound

from app import app, db
from models import User, Folder, Document, DocumentTag


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
    if app.debug: print(f"ai_request: {ai_request}")
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

        # Setup default user folders
        for folder_name in ["notes", "chats", "feedback", "settings",
                            "logs", "personas", "prompt_templates",
                            "note_templates"]:
            DBUtils.create_folder(user_id, folder_name)

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
                                            folder_name="settings")
        # Setup default user documents
        for filename in os.listdir("default_documents"):
            if filename.endswith(".json"):
                with open(os.path.join("default_documents", filename),
                          "r") as f:
                    folders = json.load(f)
                    for folder, documents in folders.items():
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
                                folder_name=folder)

    @staticmethod
    def login(user_id, password):
        user = User.query.filter_by(id=user_id).one()
        if bcrypt.checkpw(password.encode('utf-8'),
                          user.password_hash.encode('utf-8')):
            response = {'success': True}
            return response
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
        user = User.query.filter_by(id=user_id).delete()
        db.session.commit()
        return user.as_dict()

    @staticmethod
    def create_document(user_id, name, tags=[], properties={}, content={},
                        folder_name=""):
        try:
            User.query.filter_by(id=user_id).one()
        except NoResultFound:
            app.logger.error(f"Tried to create a document with user ID: "
                             f"{user_id}, but that user doesn't exist.")
            return

        if folder_name:
            try:
                folder = Folder.query.filter_by(user_id=user_id,
                                                name=folder_name).one()
                document = Document(user_id=user_id, name=name,
                                    folder_id=folder.as_dict()["id"],
                                    created_date= str(datetime.now()),
                                    updated_date= str(datetime.now()),
                                    properties=properties,
                                    content=content)
            except NoResultFound:
                app.logger.error(f"Tried to create a document with folder: "
                                 f"{folder_name}, but that folder doesn't "
                                 f"exist.")
                return
        else:
            document = Document(user_id=user_id, name=name,
                                properties=properties, content=content,
                                created_date=datetime.now(),
                                updated_date=datetime.now())

        db.session.add(document)
        db.session.commit()

        tags = [DocumentTag(document_id=document.id, name=tag_name)
                for tag_name in tags]

        db.session.add_all(tags)
        db.session.commit()

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
        tags = [DocumentTag(document_id=document.id, name=tag_name)
                for tag_name in tags]
        db.session.add_all(tags)

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
    def update_document_folder(id, folder_name):
        document = Document.query.filter_by(id=id).first()
        document.folder_name = folder_name
        db.session.add(document)
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def get_document_by_id(document_id):
        document = Document.query.filter_by(id=document_id).one()
        return document.as_dict()

    @staticmethod
    def get_document_by_name(user_id, name, folder_name=""):
        if folder_name:
            folder = DBUtils.get_folder_by_name(user_id, name)
        document = Document.query.filter_by(user_id=user_id, name=name,
                                            folder_id=folder["id"]).one()
        return document.as_dict()

    @staticmethod
    def list_documents(folder_id):
        documents = [document.as_dict()["metadata"] for document in
                     Document.query.filter_by(folder_id=folder_id).all()]
        return {
            "file_count": len(documents),
            "error_count": 0,
            "status": "OK",
            "message": "All files read successfully",
            "documents": documents
        }

    @staticmethod
    def delete_document(document_id):
        document = Document.query.filter_by(id=document_id).delete()
        db.session.commit()
        return document.as_dict()

    @staticmethod
    def save_chat(user_id, folder_name, chat):
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
                                               folder_name=folder_name)
            server_stats["new_chats_count"] += 1
        else:
            DBUtils.update_document(id=chat["id"], name=name, tags=[],
                                    properties={}, content=chat)

        return document.as_dict()

    @staticmethod
    def create_folder(user_id, name, properties={}):
        folder = Folder(user_id=user_id, name=name, properties=properties)
        db.session.add(folder)
        db.session.commit()

    @staticmethod
    def get_folder_by_name(user_id, name):
        folder = Folder.query.filter_by(user_id=user_id, name=name).one()
        return folder.as_dict()

    @staticmethod
    def list_folders():
        return [folder.name for folder in Folder.query.all()]
