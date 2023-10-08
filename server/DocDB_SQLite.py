import sqlite3
import json
import datetime
import os
import uuid

from Schema import DB_FILENAME
from Schema import USERS_SCHEMA
from Schema import FOLDERS_SCHEMA
from Schema import DOCUMENTS_SCHEMA
from Schema import RELATIONSHIPS_SCHEMA

# No exception handling as errors should be handled by the caller

class DocDB_SQLite:
    def __init__(self, db_path, user_id):
        if not db_path.endswith('/'):
            db_path += '/'
        self.db_path = db_path + DB_FILENAME
        self.user_id = user_id
        self.create_tables()
        self.setup_tables()

    def create_tables(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(USERS_SCHEMA)
        c.execute(FOLDERS_SCHEMA)
        c.execute(DOCUMENTS_SCHEMA)
        c.execute(RELATIONSHIPS_SCHEMA)
        conn.commit()

    def setup_tables(self):
        conn = sqlite3.connect(self.db_path)
        # Add a folder of name '' with id 0
        c = conn.cursor()
        # Create the top level folders that hold the different types of documents
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (0, "notes")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (1, "chats")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (2, "feedback")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (3, "settings")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (4, "logs")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (5, "personas")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (6, "prompts")')
        c.execute('INSERT OR IGNORE INTO folders (id, name) VALUES (7, "note_templates")')
        conn.commit()
    
    def create_folder(self, folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('INSERT INTO folders (name, user_id) VALUES (?)', (folder_name, self.user_id,))
        conn.commit()
        return {'success': True}

    def list_folders(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT name FROM folders WHERE user_id = ?', (self.user_id,))
        return [row[0] for row in c.fetchall()]

    def list_documents(self, folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT d.id, d.name, d.created_date, d.updated_date, d.tags, d.properties, f.name
            FROM documents d
            JOIN folders f ON d.folder_id = f.id
            WHERE f.name = ? AND f.user_id = ?
        ''', (folder_name, self.user_id,))
        documents = []
        for row in c.fetchall():
            documents.append({
                'id': row[0],
                'name': row[1],
                'created_date': row[2],
                'updated_date': row[3],
                'tags': json.loads(row[4]),
                'properties': json.loads(row[5]),
            })
        result = {}
        result['file_count'] = len(documents)
        result['error_count'] = 0
        result['status'] = 'OK'
        result['message'] = 'All files read successfully'
        result['documents'] = documents
        return result

    def new_id(self):
        return str(uuid.uuid4())

    def create_document(self, folder_name, name, tags, properties, content):
        conn = sqlite3.connect(self.db_path)
        id = self.new_id()
        c = conn.cursor()
        c.execute('SELECT id FROM folders WHERE name = ? AND user_id = ?', (folder_name, self.user_id,))
        row = c.fetchone()
        if row is None:
            c.execute('INSERT INTO folders (name, user_id) VALUES (?, ?)', (folder_name, self.user_id,))
            folder_id = c.lastrowid
        else:
            folder_id = row[0]
        updated_date = created_date = datetime.datetime.now()
        if name == "":
            name = "New Document"
        c.execute('''
            INSERT INTO documents (user_id, folder_id, id, name, created_date, updated_date, tags, properties, content)
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
        ''', (self.user_id, folder_id, id, name, created_date, updated_date, json.dumps(tags), json.dumps(properties), json.dumps(content)))
        conn.commit()
        return self.load_document(id)
    
    def get_document_id(self, folder_name, doc_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT documents.id
            FROM documents
            JOIN folders ON documents.folder_id = folders.id
            WHERE documents.user_id = ? AND documents.name = ? AND folders.user_id = ? AND folders.name = ?
        ''', (self.user_id, doc_name, self.user_id, folder_name,))
        row = c.fetchone()
        if row is None:
            raise ValueError(f"No document found with name {doc_name}")
        return row[0]
    
    def load_document(self, id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT name, created_date, updated_date, tags, properties, content
            FROM documents
            WHERE user_id = ? AND id = ?
        ''', (self.user_id, id,))
        row = c.fetchone()
        if row is None:
            raise ValueError(f"No document found with id {id}")
        document = {
            'metadata': {
                'id': id,
                'name': row[0],
                'created_date': row[1],
                'updated_date': row[2],
                'tags': json.loads(row[3]),
                'properties': json.loads(row[4]),
            },
            'content': json.loads(row[5])
        }
        return document        
    
    def rename_document(self, id, new_doc_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE documents
            SET name = ?, updated_date = ?
            WHERE id = ? AND user_id = ?
        ''', (new_doc_name, datetime.datetime.now(), id, self.user_id,))
        conn.commit()
        return self.load_document(id)
    
    def rename_folder(self, folder_name, new_folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE folders
            SET name = ?
            WHERE name = ? AND user_id = ?
        ''', (new_folder_name, folder_name, self.user_id,))
        conn.commit()
        return new_folder_name

    def save_document(self, id, name, tags, properties, content):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE documents
            SET name = ?, tags = ?, properties = ?, content = ?, updated_date = ?
            WHERE id = ? AND user_id = ?
        ''', (name, json.dumps(tags), json.dumps(properties), json.dumps(content), datetime.datetime.now(), id, self.user_id,))
        conn.commit()
        return self.load_document(id)
    
    def delete_document(self, id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('DELETE FROM documents WHERE id = ? AND user_id = ?', (id, self.user_id,))
        conn.commit()
        return {'success': True}

    
