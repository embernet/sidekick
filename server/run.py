import os
from app import app

if __name__ == '__main__':
    app.run(port=os.environ.get("SIDEKICK_SERVER_PORT", 5000))
