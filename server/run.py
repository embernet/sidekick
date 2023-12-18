import os
from app import app
from init import init

if __name__ == '__main__':
    init()
    app.run(port=os.environ.get("SIDEKICK_SERVER_PORT", 5000))
