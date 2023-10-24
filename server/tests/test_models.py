import unittest
from datetime import datetime
from flask import Flask
from app import db
from models import User, Folder, Document, DocumentTag

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
db.init_app(app)

class ModelTest(unittest.TestCase):
    def setUp(self):
        app.app_context().push()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_create_user(self):
        user = User(id="testuser", password_hash="123",
                    properties = {"age": "48", "height": "180"})
        db.session.add(user)
        db.session.commit()
        saved_user = User.query.filter_by(id='testuser').first()
        
        self.assertDictEqual(saved_user.as_dict(), {
            "id": "testuser",
            "properties": {"age": "48", "height": "180"}
        })

    def test_create_folder(self):
        objects = [
            User(id="testuser", password_hash="123"),
            Folder(id=1, user_id="testuser", name="testfolder",
                   properties={"colour": "red", "size": "10"})
        ]
        db.session.add_all(objects)
        db.session.commit()
        saved_folder = Folder.query.filter_by(id=1).first()

        self.assertDictEqual(saved_folder.as_dict(), {
            "id": 1,
            "user_id": "testuser",
            "name": "testfolder",
            "properties": {"colour": "red", "size": "10"}
        })

    def test_create_document(self):
        now = str(datetime.now())
        objects = [
            User(id="testuser", password_hash="123"),
            Folder(id=1, user_id="testuser", name="testfolder"),
            Document(id=1, user_id="testuser", folder_id=1, name="testdoc",
                     properties= {"colour": "red", "size": "3"},
                     content= {"prompt": "hi", "profile": "CEO"},
                     created_date=now, updated_date=now),
            DocumentTag(document_id=1, name="a doc"),
            DocumentTag(document_id=1, name="a nice thing"),
        ]
        db.session.add_all(objects)
        db.session.commit()
        saved_document = Document.query.filter_by(id=1).first()
        self.assertDictEqual(saved_document.as_dict(), {
            "metadata": {
                "id": 1,
                "user_id": "testuser",
                "folder_name": "testfolder",
                "name": "testdoc",
                "created_date": now,
                "updated_date": now,
                "tags": ["a doc", "a nice thing"],
                "properties": {"colour": "red", "size": "3"},
            },
            "content": {"prompt": "hi", "profile": "CEO"}
        })