import unittest
from datetime import datetime
from flask import Flask
from app import db
from utils import DBUtils
from models import User, Document

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
        self.assertListEqual(sorted(list(set(d.type for d in user.documents))),
                             sorted(["settings", "personas",
                                     "prompt_templates"]))
        self.assertEqual(len(user.documents), 51)

    def test_create_document(self):
        DBUtils.create_user("testuser", "testpassword")
        DBUtils.create_document(user_id="testuser", name="testdoc",
                                type="testtype",
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
                "type": "testtype",
                "name": "testdoc",
                "tags": ["tag1", "tag2"],
                "properties": {"propertyA": "testA", "propertyB": "testB"},
            },
            "content": {"contentA": "testA", "propertyB": "contentB"}
        })

    def test_get_document_by_name(self):
        DBUtils.create_user("testuser", "testpassword")
        DBUtils.create_document(user_id="testuser", name="testdoc",
                                type="testtype",
                                tags=["tag1", "tag2"],
                                properties={"propertyA": "testA",
                                            "propertyB": "testB"},
                                content={"contentA": "testA",
                                         "propertyB": "contentB"})
        doc_as_dict = DBUtils.get_document(user_id="testuser",
                                           name="testdoc",
                                           type="testtype")
        del doc_as_dict["metadata"]["id"]
        del doc_as_dict["metadata"]["created_date"]
        del doc_as_dict["metadata"]["updated_date"]

        self.assertDictEqual(doc_as_dict, {
            "metadata": {
                "user_id": "testuser",
                "type": "testtype",
                "name": "testdoc",
                "tags": ["tag1", "tag2"],
                "properties": {"propertyA": "testA", "propertyB": "testB"},
            },
            "content": {"contentA": "testA", "propertyB": "contentB"}
        })


    def test_delete_document(self):
        DBUtils.create_user("testuser", "testpassword")
        doc = DBUtils.create_document(user_id="testuser", name="testdoc",
                                type="testtype",
                                tags=["tag1", "tag2"],
                                properties={"propertyA": "testA",
                                            "propertyB": "testB"},
                                content={"contentA": "testA",
                                         "propertyB": "contentB"})
        DBUtils.delete_document(doc["metadata"]["id"])
        document = Document.query.filter_by(id="1").first()
        self.assertIsNone(document)

    def test_delete_user(self):
        DBUtils.create_user("testuser", "testpassword")
        doc = DBUtils.create_document(user_id="testuser", name="testdoc",
                                      type="testtype", tags=["tag1", "tag2"],
                                      properties={"propertyA": "testA",
                                                  "propertyB": "testB"},
                                      content={"contentA": "testA",
                                               "propertyB": "contentB"})
        DBUtils.delete_user("testuser")
        user = Document.query.filter_by(id="1").first()
        self.assertIsNone(user)
    #
    # def test_list_types(self):
    #     DBUtils.create_user("testuser", "testpassword")
    #     self.assertListEqual(DBUtils.list_types(),
    #                          ["notes", "chats", "feedback", "settings", "logs",
    #                           "personas", "prompt_templates", "note_templates"])