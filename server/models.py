import json

from sqlalchemy.sql import func
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True)
    password_hash = db.Column(db.String, nullable=False)
    properties = db.Column(db.String, default="{}", nullable=False)

    folders = db.relationship("Folder", back_populates="user")
    documents = db.relationship("Document", back_populates="user")

    def __init__(self, properties=None, **kwargs):
        super(User, self).__init__(**kwargs)
        if properties is not None:
            self.properties = json.dumps(properties)

    def __repr__(self):
        return "<User %r>" % self.id
    
    def as_dict(self):
        return {
            "id": self.id,
            "properties": json.loads(self.properties)
        }


class Folder(db.Model):
    __tablename__ = "folders"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    user_id = db.Column(db.ForeignKey(User.id), nullable=False)
    properties = db.Column(db.String, default="{}", nullable=False)

    user = db.relationship("User", back_populates="folders")
    documents = db.relationship("Document", back_populates="folder")

    def __init__(self, properties=None, **kwargs):
        super(Folder, self).__init__(**kwargs)
        if properties is not None:
            self.properties = json.dumps(properties)

    def __repr__(self):
        return "<Folder %r>" % self.name

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "properties": json.loads(self.properties)
        }


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.ForeignKey(User.id), nullable=False)
    folder_id = db.Column(db.ForeignKey(Folder.id))
    name = db.Column(db.String, nullable=False)
    created_date = db.Column(db.String(), nullable=False)
    updated_date = db.Column(db.String(), nullable=False)
    tags = db.relationship("DocumentTag")
    properties = db.Column(db.String, default="{}", nullable=False)
    content = db.Column(db.String, default="{}", nullable=False)

    user = db.relationship("User", back_populates="documents")
    folder = db.relationship("Folder", back_populates="documents")

    def __init__(self, properties=None, content=None, **kwargs):
        super(Document, self).__init__(**kwargs)
        if properties is not None:
            self.properties = json.dumps(properties)
        if content is not None:
            self.content = json.dumps(content)

    def __repr__(self):
        return "<Document %r>" % self.name
    
    def as_dict(self):
        return {
            "metadata": {
                "id": self.id,
                "user_id": self.user_id,
                "folder_name": self.folder.as_dict()["name"],
                "name": self.name,
                "created_date": self.created_date,
                "updated_date": self.updated_date,
                "tags": [tag.name for tag in self.tags],
                "properties": json.loads(self.properties),
            },
            "content": json.loads(self.content)
        }


class DocumentTag(db.Model):
    __tablename__ = "document_tags"

    document_id = db.Column(db.ForeignKey(Document.id), primary_key=True)
    name = db.Column(db.String, primary_key=True)
