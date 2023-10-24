import unittest
from datetime import datetime
from flask import Flask
from app import db
from utils import DBUtils
from models import User, Folder, Document

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
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
        DBUtils.create_user("testuser", "testpassword",
                            {"propA": "testA", "propB": "testB"})
        user = User.query.filter_by(id="testuser").first()

        self.assertDictEqual(user.as_dict(), {
            "id": "testuser", "properties": {"propA": "testA",
                                             "propB": "testB"}})
        self.assertListEqual(sorted(list(set(d.folder.name
                                             for d in user.documents))),
                             sorted(["settings", "personas",
                                     "prompt_templates"]))
        self.assertEqual(len(user.documents), 50)

    def test_create_folder(self):
        DBUtils.create_user("testuser", "testpassword")
        DBUtils.create_folder(user_id="testuser", name="testfolder",
                              properties={"propA": "testA", "propB": "testB"})
        folder = Folder.query.filter_by(name="testfolder").first()
        folder_as_dict = folder.as_dict()
        del folder_as_dict["id"]
        self.assertDictEqual(folder_as_dict, {
            "user_id": "testuser", "name": "testfolder",
            "properties": {"propA": "testA", "propB": "testB"}})

    def test_create_document(self):
        DBUtils.create_user("testuser", "testpassword")
        DBUtils.create_folder("testuser", "testfolder")
        DBUtils.create_document(user_id="testuser", name="testdoc",
                                folder_name="testfolder",
                                tags=["tag1", "tag2"],
                                properties={"propertyA": "testA",
                                            "propertyB": "testB"},
                                content={"contentA": "testA",
                                         "propertyB": "contentB"})
        document = Document.query.filter_by(name="testdoc").first()
        doc_as_dict = document.as_dict()
        del doc_as_dict["metadata"]["id"]
        del doc_as_dict["metadata"]["created_date"]
        del doc_as_dict["metadata"]["updated_date"]

        self.assertDictEqual(doc_as_dict, {
            "metadata": {
                "user_id": "testuser",
                "folder_name": "testfolder",
                "name": "testdoc",
                "tags": ["tag1", "tag2"],
                "properties": {"propertyA": "testA", "propertyB": "testB"},
            },
            "content": {"contentA": "testA", "propertyB": "contentB"}
        })