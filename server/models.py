import json
import uuid
from datetime import datetime

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True)
    password_hash = db.Column(db.String, nullable=False)
    name = db.Column(db.String, nullable=False)
    is_oidc = db.Column(db.Boolean, default=False, nullable=False)
    properties = db.Column(db.String, default="{}", nullable=False)

    documents = db.relationship("Document", back_populates="user")

    def __init__(self, properties=None, **kwargs):
        super(User, self).__init__(**kwargs)
        if properties is not None:
            self.properties = json.dumps(properties)

    def __repr__(self):
        return "<User %r>" % self.id
    
    def as_dict(self):
        return {"id": self.id, "name": self.name, "is_oidc": self.is_oidc,
                "properties": json.loads(self.properties)}


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String, default=str(uuid.uuid4()), primary_key=True)
    user_id = db.Column(db.ForeignKey(User.id), nullable=False)
    name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)
    created_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
    updated_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
    tags = db.relationship("DocumentTag")
    properties = db.Column(db.String, default="{}", nullable=False)
    content = db.Column(db.String, default="{}", nullable=False)
    visibility = db.Column(db.String, default="private", nullable=False)

    user = db.relationship("User", back_populates="documents")

    def __init__(self, properties=None, content=None, **kwargs):
        super(Document, self).__init__(**kwargs)
        
        # Remove read-only fields from kwargs
        kwargs.pop('user_name', None)

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
                "user_name": self.user.name, # return the name of the user for easy reference
                "visibility": self.visibility,
                "name": self.name,
                "type": self.type,
                "created_date": self.created_date,
                "updated_date": self.updated_date,
                "tags": [tag.tag_name for tag in self.tags],
                "properties": json.loads(self.properties),
            },
            "content": json.loads(self.content)
        }


class Tag(db.Model):
    __tablename__ = "tags"

    name = db.Column(db.String, primary_key=True)
    created_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
    updated_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)


class DocumentTag(db.Model):
    __tablename__ = "document_tags"

    document_id = db.Column(db.ForeignKey(Document.id), primary_key=True)
    tag_name = db.Column(db.ForeignKey(Tag.name), primary_key=True)
    created_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
    updated_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)

class UserTag(db.Model):
    __tablename__ = "user_tags"

    user_id = db.Column(db.ForeignKey(User.id), primary_key=True)
    tag_name = db.Column(db.ForeignKey(Tag.name), primary_key=True)
    created_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
    updated_date = db.Column(db.String(), default=str(datetime.now()),
                             nullable=False)
