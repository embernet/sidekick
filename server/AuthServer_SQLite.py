import sqlite3
import datetime
import bcrypt
import os
import json
from collections import OrderedDict

from Schema import DB_FILENAME
from Schema import USERS_SCHEMA
from DocDB_SQLite import DocDB_SQLite as DocDB

class AuthServer_SQLite:
    def __init__(self, db_path):
        self.db_dir = db_path
        if not db_path.endswith('/'):
            db_path += '/'
        self.db_path = db_path + DB_FILENAME
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(USERS_SCHEMA)
        conn.commit()

    def login(self, user_id, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT id, properties, password_hash FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[2]
            if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                response = {'success': True}
                return response
        return {'success': False, 'message': 'Invalid login'}

    def create_account(self, user_id, properties, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT id, properties, password_hash FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            return {'success': False, 'message': 'User already exists'}
        else:
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            c.execute('INSERT INTO users VALUES (?, ?, ?)', (user_id, properties, password_hash))
            conn.commit()
            # Give the user a default set of settings
            for filename in os.listdir("default_settings"):
                if filename.endswith(".json"):
                    name = os.path.splitext(filename)[0]
                    with open(os.path.join("default_settings", filename), "r") as f:
                        settings = json.load(f, object_pairs_hook=OrderedDict)
                        # Insert the settings into the database
                        sidekickDB = DocDB(self.db_dir, user_id)
                        sidekickDB.create_document('settings', name, "[]", "{}", settings)
            default_documents_folder = "default_documents"
            for filename in os.listdir(default_documents_folder):
                if filename.endswith(".json"):
                    with open(os.path.join(default_documents_folder, filename), "r") as f:
                        folders = json.load(f)
                        for folder, documents in folders.items():
                            for name, document in documents.items():
                                tags = document['tags'] if 'tags' in document else "[]"
                                properties = document['properties'] if 'properties' in document else "{}"
                                content = document['content'] if 'content' in document else "{}"
                                sidekickDB.create_document(folder, name, document['tags'], properties, document['content'])


            return {'success': True}
                
    def change_password(self, user_id, current_password, new_password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT id, properties, password_hash FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[2]
            if bcrypt.checkpw(current_password.encode('utf-8'), password_hash.encode('utf-8')):
                new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                c.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_password_hash, user_id))
                conn.commit()
                return {'success': True}
        return {'success': False, 'message': 'Invalid login'}
            
    def delete_user(self, user_id, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT id, properties, password_hash FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[2]
            if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                # delete all their data
                c.execute('DELETE FROM documents WHERE user_id = ?', (user_id,))
                c.execute('DELETE FROM folders WHERE user_id = ?', (user_id,))
                # remove the user from the login database
                c.execute('DELETE FROM users WHERE id = ?', (user_id,))
                conn.commit()
                return {'success': True}
        return {'success': False, 'message': 'Invalid login'}
    
    def get_users(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT id FROM users')
        rows = c.fetchall()
        return {'success': True, 'users': rows}