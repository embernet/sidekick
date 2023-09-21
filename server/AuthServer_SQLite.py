import sqlite3
import datetime
import bcrypt


class AuthServer_SQLite:
    def __init__(self, db_path):
        if not db_path.endswith('/'):
            db_path += '/'
        self.db_path = db_path + "login.db"
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, password_hash TEXT)')
        conn.commit()

    def login(self, user_id, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[1]
            if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                response = {'success': True}
                return response
        return {'success': False, 'message': 'Invalid login'}

    def create_account(self, user_id, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            return {'success': False, 'message': 'User already exists'}
        else:
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            c.execute('INSERT INTO users VALUES (?, ?)', (user_id, password_hash))
            conn.commit()
            return {'success': True}
                
    def change_password(self, user_id, old_password, new_password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[1]
            if bcrypt.checkpw(old_password.encode('utf-8'), password_hash.encode('utf-8')):
                new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                c.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_password_hash, user_id))
                conn.commit()
                return {'success': True}
        return {'success': False, 'message': 'Invalid login'}
            
    def delete_user(self, user_id, password):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            password_hash = row[1]
            if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
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