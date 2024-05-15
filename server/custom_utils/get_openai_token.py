from app import app

def get_openai_token():
    return app.config['OPENAI_API_KEY']
