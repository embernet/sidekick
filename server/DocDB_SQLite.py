import sqlite3
import json
import datetime
import os
import uuid

# No exception handling as errors should be handled by the caller

class DocDB_SQLite:
    def __init__(self, db_path, user_id):
        if not db_path.endswith('/'):
            db_path += '/'
        self.db_path = db_path + user_id + ".db"
        self.create_tables()
        self.setup_tables()

    def delete(self):
        os.remove(self.db_path)

    def create_tables(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                folder_id INTEGER,
                name TEXT NOT NULL,
                created_date TEXT NOT NULL,
                updated_date TEXT NOT NULL,
                tags TEXT NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY (folder_id) REFERENCES folders (id)
            )
        ''')
        conn.commit()

    def setup_tables(self):
        conn = sqlite3.connect(self.db_path)
        # Add a folder of name '' with id 0
        c = conn.cursor()
        # insert notes and chats into folders if that row doesn't already exist
        c.execute('''
            INSERT OR IGNORE INTO folders (id, name) VALUES (0, "notes")
        ''')
        c.execute('''
            INSERT OR IGNORE INTO folders (id, name) VALUES (1, "chats")
        ''')
        conn.commit()
    
    def create_folder(self, folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('INSERT INTO folders (name) VALUES (?)', (folder_name,))
        conn.commit()
        return {'success': True}

    def list_folders(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT name FROM folders')
        return [row[0] for row in c.fetchall()]

    def list_documents(self, folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT d.id, d.name, d.created_date, d.updated_date, d.tags, f.name
            FROM documents d
            JOIN folders f ON d.folder_id = f.id
            WHERE f.name = ?
        ''', (folder_name,))
        documents = []
        for row in c.fetchall():
            documents.append({
                'id': row[0],
                'name': row[1],
                'created_date': row[2],
                'updated_date': row[3],
                'tags': json.loads(row[4]),
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

    def create_document(self, folder_name, name, tags, content):
        conn = sqlite3.connect(self.db_path)
        id = self.new_id()
        c = conn.cursor()
        c.execute('SELECT id FROM folders WHERE name = ?', (folder_name,))
        row = c.fetchone()
        if row is None:
            c.execute('INSERT INTO folders (name) VALUES (?)', (folder_name,))
            folder_id = c.lastrowid
        else:
            folder_id = row[0]
        updated_date = created_date = datetime.datetime.now()
        if name == "":
            name = "New Note"
        c.execute('''
            INSERT INTO documents (folder_id, id, name, created_date, updated_date, tags, content)
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
        ''', (folder_id, id, name, created_date, updated_date, json.dumps(tags), json.dumps(content)))
        conn.commit()
        return self.load_document(folder_name, id)
    
    def get_document_id(self, folder_name, doc_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT id
            FROM documents
            WHERE name = ?
            AND folder_id = (SELECT id FROM folders WHERE name = ?)
        ''', (doc_name, folder_name,))
        row = c.fetchone()
        if row is None:
            raise ValueError(f"No document found with name {doc_name}")
        return row[0]
    
    def load_document(self, folder_name, id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT name, created_date, updated_date, tags, content
            FROM documents
            WHERE id = ?
            AND folder_id = (SELECT id FROM folders WHERE name = ?)
        ''', (id, folder_name,))
        row = c.fetchone()
        if row is None:
            raise ValueError(f"No document found with id {id}")
        document = {
            'metadata': {
                'id': id,
                'name': row[0],
                'created_date': row[1],
                'updated_date': row[2],
                'tags': json.loads(row[3])
            },
            'content': json.loads(row[4])
        }
        return document        
    
    def rename_document(self, folder_name, id, new_doc_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE documents
            SET name = ?, updated_date = ?
            WHERE id = ?
        ''', (new_doc_name, datetime.datetime.now(), id))
        conn.commit()
        return self.load_document(folder_name, id)
    
    def rename_folder(self, folder_name, new_folder_name):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE folders
            SET name = ?
            WHERE name = ?
        ''', (new_folder_name, folder_name))
        conn.commit()
        return new_folder_name

    def save_document(self, folder_name, id, name, tags, content):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            UPDATE documents
            SET name = ?, tags = ?, content = ?, updated_date = ?
            WHERE id = ?
        ''', (name, json.dumps(tags), json.dumps(content), datetime.datetime.now(), id))
        conn.commit()
        return self.load_document(folder_name, id)
    
    def delete_document(self, folder_name, id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('DELETE FROM documents WHERE id = ?', (id,))
        conn.commit()
        return {'success': True}

    
