DB_FILENAME = 'sidekick.db'
USERS_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        properties TEXT DEFAULT "{}",
        password_hash TEXT)
'''
FOLDERS_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        properties TEXT DEFAULT "{}",
        UNIQUE (user_id, name),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
'''
DOCUMENTS_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        folder_id INTEGER,
        name TEXT NOT NULL,
        created_date TEXT NOT NULL,
        updated_date TEXT NOT NULL,
        tags TEXT DEFAULT "[]",
        properties TEXT DEFAULT "{}",
        content TEXT NOT NULL,
        FOREIGN KEY (folder_id) REFERENCES folders (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
'''
RELATIONSHIPS_SCHEMA = '''
    CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tags TEXT DEFAULT "[]",
        from_document_id TEXT NOT NULL,
        name TEXT NOT NULL,
        to_document_id TEXT NOT NULL,
        properties TEXT DEFAULT "{}",
        FOREIGN KEY (user_id) REFERENCES users (id)
        FOREIGN KEY (from_document_id) REFERENCES documents (id)
        FOREIGN KEY (to_document_id) REFERENCES documents (id)
    )
'''