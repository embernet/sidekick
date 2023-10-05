# File: sidekick_server.py
# Author: Mark Burnett
# Date: 2022-09-23
# Description: A Chat server providing a REST interface for interacting with LLMs such as available via the OpenAI API

PROGRAM_NAME = "sidekick_server"
VERSION = "0.0.4"

import logging
from logging.handlers import RotatingFileHandler
import openai
import os
from datetime import datetime, timedelta, timezone
import argparse
import json
import yaml
from flask import Flask, request, Response, stream_with_context, jsonify
from flask_cors import CORS
from DocDB_SQLite import DocDB_SQLite as DocDB
from AuthServer_SQLite import AuthServer_SQLite as AuthServer
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
from collections import OrderedDict
import socket
import requests
import sseclient # for streaming interface
import werkzeug
import traceback

import uuid
# Function to generate a unique transaction id (tid)
def generate_tid():
    return str(uuid.uuid4())

from dotenv import load_dotenv
load_dotenv()

RESULT_OK = 200
RESULT_INTERNAL_SERVER_ERROR = 500
RESULT_CREATED = 201
RESULT_BAD_REQUEST = 400
RESULT_NOT_FOUND = 404
RESULT_NO_CONTENT = 204

SETTINGS_FILENAME = "settings.yaml"
USERDB_DIR_SETTING = "userdb_dir"
LOGINDB_DIR_SETTING = "logindb_dir"
FEEDBACKDB_DIR_SETTING = "feedbackdb_dir"
SETTINGS_DIR_SETTING = "settings_dir"
CUSTOM_SETTINGS_DIR_SETTING = "custom_settings_dir"
LOGS_DIR_SETTING = "logs_dir"

if not os.path.exists("./etc"): os.makedirs("./etc")
if not os.path.exists("./etc/logs"): os.makedirs("./etc/logs")
if not os.path.exists("./data"): os.makedirs("./data")

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET"]
#app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
jwt = JWTManager(app)

print(f"{PROGRAM_NAME} {VERSION}")
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
if app.debug:
    print("Development mode enabled. To disable, export FLASK_ENV=production")
else:
    print("Development mode disabled. To enable, export FLASK_ENV=development")

run_mode = os.environ.get('SIDEKICK_RUN_MODE', 'development')

try:
    with open(SETTINGS_FILENAME, "r") as f:
        config = yaml.safe_load(f)
        if app.debug: print(f"config:\n{json.dumps(config, indent=4)}")
except FileNotFoundError:
    logger.error(f"{SETTINGS_FILENAME} not found. Exiting.")
    log_exception(FileNotFoundError)
    if app.debug: print(SETTINGS_FILENAME + " not found. Exiting.")
    exit()

def _init_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    handler = RotatingFileHandler(os.path.join(config[LOGS_DIR_SETTING], PROGRAM_NAME + '.log'), maxBytes=1000000, backupCount=1)
    formatter = logging.Formatter("%(asctime)s|%(levelname)s|%(name)s|%(module)s|%(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

_init_logger()
logger = logging.getLogger(__name__)
logger.info(f"Starting:{PROGRAM_NAME} version:{VERSION} mode:{run_mode}")

openai.api_key = os.environ[config["openai_api_key_env_var"]]

def userDB():
    # One database per user, which includes their settings, notes, and chats
    return DocDB(config[USERDB_DIR_SETTING], get_jwt_identity())

def feedbackDB():
    # One database for all feedback
    return DocDB(config[FEEDBACKDB_DIR_SETTING], "feedback")

@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token 
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original respone
        return response
    
def log_exception(e):
    tb = traceback.format_exc()
    logger.error(f"An error occurred in {request.url}: {str(e)}\n{tb}")

@app.errorhandler(Exception)
def handle_exception(e):
    # pass through HTTP errors
    if isinstance(e, werkzeug.exceptions.HTTPException):
        return e

    # handle non-HTTP exceptions
    log_exception(e)
    return jsonify(error=str(e)), RESULT_INTERNAL_SERVER_ERROR

server_stats = {
    "server_start_time": datetime.now(),
    "server_uptime": "0 days 0 hours 0 minutes 0 seconds",
    "new_chats_count": 0,
    "chat_interaction_count": 0,
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
}

def server_uptime():
    uptime = datetime.now() - server_stats["server_start_time"]
    uptime_str = str(uptime).split('.')[0]
    uptime_days = uptime.days
    uptime_hours, remainder = divmod(uptime.seconds, 3600)
    uptime_minutes, uptime_seconds = divmod(remainder, 60)
    uptime_formatted = f"{uptime_days} days {uptime_hours} hours {uptime_minutes} minutes {uptime_seconds} seconds"
    return uptime_formatted

@app.route('/', methods=['GET'])
def index():
    return f"""
<html>
    <head>
        <title>{PROGRAM_NAME}</title>
        <script>
            setInterval(function() {{
                location.reload();
            }}, 3000);
        </script>
    </head>
    <body>
        <h1>{PROGRAM_NAME}</h1>
        <p>Version: {VERSION}</p>
        <p>Server start time: {server_stats["server_start_time"].isoformat()}</p>
        <p>Run mode: {run_mode}</p>
        <p>New chats: {server_stats["new_chats_count"]}</p>
        <p>Chat interactions: {server_stats["chat_interaction_count"]}</p>
        <p>Prompt tokens: {server_stats["prompt_tokens"]}</p>
        <p>Completion tokens: {server_stats["completion_tokens"]}</p>
        <p>Total tokens: {server_stats["total_tokens"]}</p>
        <p>Server uptime: {server_uptime()}</p>
        <p>Up and running.</p>
        <p>Lauch the client server to access the API via the UI.</p>
    </body>
</html>"""


@app.route('/test', methods=['GET'])
def test():
    response = {}
    response["server"] = test_server_up()
    response["config"] = test_config()
    response["ai_response"] = test_ai()
    return response

@app.route('/ping', methods=['GET'])
@app.route('/test/server/up', methods=['GET'])
def test_server_up():
    response = {
        "message": "sidekick-server is up and running.",
        "topic": "test",
        "status": "OK",
        "version": VERSION,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "hostname": socket.gethostname()
    }
    if app.debug: print(response)
    logger.info(f"/ping GET request from:{request.remote_addr}")
    return response

@app.route('/test/config', methods=['GET'])
def test_config():
    if app.debug: print(config)
    return config

@app.route('/test/ai', methods=['GET'])
def test_ai():
    response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        { "role": "system", "content": "You are an AI that has just run a self-test." },
        { "role": "user", "content": "Give me an update on your status. Do not ask any questions or offer any help." }],
    temperature=0.9
    )
    if app.debug: print(response)
    return response

@app.route('/feedback', methods=['POST'])
@jwt_required()
def feedback():
    logger.info(f"/feedback [POST] request from:{request.remote_addr}")
    try:
        feedback_type = request.json.get('type')
        feedback_text = request.json.get('text')
        folder_name = "feedback"
        name = f"Feedback {datetime.now().strftime('%Y%m%d%H%M%S')}"
        tags = [feedback_type]
        content = { "feedback": feedback_text }
        document = feedbackDB().create_document(folder_name, name, tags, content)
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
    except Exception as e:
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})

@app.route('/models', methods=['GET'])
@jwt_required()
def get_models():
    models = openai.Model.list()
    return jsonify(models)


@app.route('/custom_settings/<name>', methods=['GET'])
def get_custom_settings(name):
    logger.info(f"/custom_settings/{name} GET request from:{request.remote_addr}")
    try:
        file_path = os.path.join(config[CUSTOM_SETTINGS_DIR_SETTING], f"{name}.json")
        if app.debug: print(f"Loading custom settings from file_path: {file_path}")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                settings = json.load(f)
            return jsonify(settings), 200
        else:
            # Custom settings are optional; no file, so return empty custom settings
            return jsonify({}), 200
    except Exception as e:
        log_exception(e)
        return jsonify({'error': str(e)}), 500
    

class OrderedEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, OrderedDict):
            return dict(obj)
        return json.JSONEncoder.default(self, obj)


@app.route('/settings/<name>', methods=['GET'])
@jwt_required()
def get_settings(name):
    logger.info(f"/settings/{name} GET request from:{request.remote_addr}")
    try:
        doc_id = userDB().get_document_id('settings', name)
        settings = userDB().load_document('settings', doc_id)["content"]
        response = app.response_class(
            response=json.dumps(settings, indent=4, cls=OrderedEncoder),
            status=200,
            mimetype='application/json'
        )
        return response
    except ValueError:
        # No settings found, so init with default settings and return those
        with open(os.path.join("settings_defaults", f"{name}.json"), "r") as f:
            settings = json.load(f, object_pairs_hook=OrderedDict)
            userDB().create_document('settings', name, "[]", settings)
            response = app.response_class(
                response=json.dumps(settings, indent=4, cls=OrderedEncoder),
                status=200,
                mimetype='application/json'
            )
            return response
    except Exception as e:
        log_exception(e)
        return str(e), RESULT_INTERNAL_SERVER_ERROR

@app.route('/settings/<name>', methods=['PUT'])
@jwt_required()
def save_settings(name):
    logger.info(f"/settings/{name} PUT request from:{request.remote_addr}")
    try:
        settings = request.json
        doc_id = userDB().get_document_id('settings', name)
        userDB().save_document('settings', doc_id, name, "[]", request.json)
        response = app.response_class(
            response=json.dumps({"success": True}),
            status=200,
            mimetype='application/json'
        )
        return response
    except ValueError:
        # No settings found, so init with default settings and return those
        with userDB() as db:
            db.create_document('settings', name, "[]", settings)
        response = app.response_class(
            response=json.dumps({"success": True}),
            status=200,
            mimetype='application/json'
        )
        return response
    except Exception as e:
        log_exception(e)
        return str(e), RESULT_INTERNAL_SERVER_ERROR

def construct_name_topic_request(request):
    ai_request = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.9,
        "messages": [
            { "role": "system", "content": "You generate concise names \
for topics by reading the text and generating a name that is short and \
reflects what the text is about. Do not surround the name in speech marks." },\
{ "role": "user", "content": "Provide a short single phrase to use as a title for this text: " + request.json['text']}]
    }
    if app.debug: print(f"ai_request: {ai_request}")
    return ai_request

# Provide a name for the topic of the provided text
@app.route('/nametopic', methods=['POST'])
@jwt_required()
def name_topic():
    logger.info(f"/nametopic POST request from:{request.remote_addr}")
    if app.debug: print("/nametopic request:\n", json.dumps(request.json, indent=4))
    ai_request = construct_name_topic_request(request)
    try:
        response = openai.ChatCompletion.create(**ai_request)
        topic_name = response.choices[0]["message"]["content"]
        if "\n" in topic_name:
            topic_name = topic_name.split("\n", 1)[0] # if there are multiple lines, just use the first one
        topic_name = topic_name.strip('"\'') # remove surrounding quotes
        topic_name = topic_name.lstrip('- ') # remove leading dash or space
        ai_response = { 
            "success": True,
            "topic_name": topic_name
        }
        if app.debug: print(f"openai response: {response}")
        server_stats["chat_interaction_count"] += 1
        server_stats["prompt_tokens"] += response["usage"]["prompt_tokens"]
        server_stats["completion_tokens"] += response["usage"]["completion_tokens"]
        server_stats["total_tokens"] += response["usage"]["total_tokens"]
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": response["usage"]["prompt_tokens"],
            "completion_tokens": response["usage"]["completion_tokens"],
            "total_tokens": response["usage"]["total_tokens"],
        }
        ai_response["usage"] = message_usage
    except Exception as e:
        log_exception(e)
        ai_response = {
            "success": False,
            "error": str(e)
        }
    ai_response_json = jsonify(ai_response)
    if app.debug: print("/nametopic response:\n", json.dumps(ai_response, indent=4))
    return ai_response_json


def save_chat(folder_name, request):
    name = request.json['name'] if ('name' in request.json) else config["default_chat_name"]
    tags = request.json['tags'] if ('tags' in request.json) else []
    content = { "chat": request.json["chatHistory"] } if ('chatHistory' in request.json) else { "chat": [] }
    if ('id' not in request.json or request.json['id'] == ""):
        document = userDB().create_document(folder_name, name, tags, content)
        id = document["metadata"]["id"]
        server_stats["new_chats_count"] += 1
    else:
        id = request.json["id"]
        document = userDB().save_document(folder_name, id, name, tags, content)
    logger.info(f"save_chat id:{id} from:{request.remote_addr}")

    if app.debug: print(f"document: {json.dumps(document, indent=4)}")
    return document


def construct_ai_request(request):
    model_settings = {}
    if ('chatHistory' in request.json):
        chatHistory = request.json['chatHistory']
    else:
        chatHistory = []
    model_settings = request.json["model_settings"]
    system_prompt = request.json["system_prompt"]
    prompt = request.json["prompt"]
    chatHistory = request.json["chatHistory"] if ('chatHistory' in request.json) else []
    ai_request = model_settings["request"]
    ai_request["messages"] = [{ "role": "system", "content": system_prompt }] +\
          chatHistory + [{ "role": "user", "content": prompt }]
    if app.debug: print(f"ai_request: {ai_request}")
    return ai_request


# Route to chat with the AI
@app.route('/chat/v1', methods=['POST'])
@jwt_required()
def chat_v1():
    logger.info(f"/chat/v1 POST request from:{request.remote_addr}")
    if app.debug: print("/chat/v1 request:\n", json.dumps(request.json, indent=4))
    folder_name = "chats"
    document = save_chat(folder_name, request)
    ai_request = construct_ai_request(request)
    try:
        response = openai.ChatCompletion.create(**ai_request)
        ai_response = response.choices[0]["message"]["content"]
        chat_response = [
            { 
                "role": "user",
                "content": request.json["prompt"],
                "metadata": { "usage": response["usage"]["prompt_tokens"] }
            },
            {
                "role": "assistant",
                "content": ai_response,
                "metadata": { "usage": response["usage"]["completion_tokens"] }
            }
        ]
        document["content"]["chat"].append(chat_response)
        if app.debug: print(f"openai response: {response}")
        server_stats["chat_interaction_count"] += 1
        server_stats["prompt_tokens"] += response["usage"]["prompt_tokens"]
        server_stats["completion_tokens"] += response["usage"]["completion_tokens"]
        server_stats["total_tokens"] += response["usage"]["total_tokens"]
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": response["usage"]["prompt_tokens"],
            "completion_tokens": response["usage"]["completion_tokens"],
            "total_tokens": response["usage"]["total_tokens"],
        }
        if "usage" not in document["content"]:
            document["content"]["usage"] = message_usage 
        else:
            document["content"]["usage"].append(message_usage)
    except Exception as e:
        log_exception(e)
        ai_response = str(e)
        chat_response = [
            { 
                "role": "user",
                "content": request.json["prompt"],
                "metadata": { "usage": 0 }
            },
            {
                "role": "assistant",
                "content": ai_response,
                "metadata": { "usage": 0 }
            }
        ]

    system_response = { **document }
    system_response["chat_response"] = chat_response
    if app.debug: print("document[content]", document["content"])
    userDB().save_document(folder_name, document["metadata"]["id"], document["metadata"]["name"], document["metadata"]["tags"], document["content"])
    system_response_json = jsonify(system_response)
    if app.debug: print("/chat/v1 response:\n", json.dumps(system_response, indent=4))
    return system_response_json

chat_streams = {} # to hold the mapping from our stream id to the OpenAI stream id

# Route to chat with the AI using the OpenAI streaming interface
@app.route('/chat/v2', methods=['POST'])
@jwt_required()
def chat_v2():
    tid = generate_tid()
    logger.info(f"/chat/v2 [POST] request from:{request.remote_addr} tid:{tid}")
    if app.debug: print("/chat/v2 request:\n", json.dumps(request.json, indent=4))    
    def generate():
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'content-type': 'application/json; charset=utf-8',
            'Authorization': f"Bearer {openai.api_key}"            
        }
        ai_request = construct_ai_request(request)
        ai_request["stream"] = True
        response = requests.post(url, headers=headers, data=json.dumps(ai_request), stream=True)
        client = sseclient.SSEClient(response)
        for event in client.events():
            if event.data != '[DONE]':
                try:
                    data = json.loads(event.data)
                    delta = data['choices'][0]['delta']
                    chat_streams[tid] = data['id']
                    if 'content' in delta:
                        text = delta['content']
                        if app.debug: print(f"{text}", end='')
                        yield(text)
                    elif 'role' in delta:
                        # discard
                        pass
                    elif delta == {}:
                        yield('') # end of stream
                    else:
                        #Unexpected delta content
                        logger.error(f"/chat/v2 tid:{tid} unexpected delta content: {delta}")
                except Exception as e:
                    log_exception(e)
                    yield('')
        logger.info(f"/chat/v2 tid:{tid} response stream-completed from:{request.remote_addr}")
    logger.info(f"/chat/v2 tid:{tid} response stream-started from:{request.remote_addr}")
    return Response(stream_with_context(generate()))

@app.route('/chat/v2/cancel/<id>', methods=['DELETE'])
@jwt_required()
def chat_v2_cancel(id):
# Use the OpenAI API to cancel a chat
    url = 'https://api.openai.com/v1/chat/completions' + '/' + id
    headers = {
        'content-type': 'application/json; charset=utf-8',
        'Authorization': f"Bearer {openai.api_key}"            
    }
    response = requests.delete(url, headers=headers, data=json.dumps({}))
    if app.debug: print(f"/chat/v2/cancel/{id} response: {response}")
    return response


#
# Run the server
#

auth = AuthServer(config[LOGINDB_DIR_SETTING])

@app.route('/docdb', methods=['GET'])
@jwt_required()
def docdb_list_folders():
    logger.info(f"/docdb [GET] request from:{request.remote_addr}")
    folders = userDB().list_folders()
    return jsonify(folders)

@app.route('/docdb//documents', methods=['GET'])
@app.route('/docdb/<folder_name>/documents', methods=['GET'])
@jwt_required()
def docdb_list_documents(folder_name=""):
    logger.info(f"/docdb/{folder_name}/documents [GET] request from:{request.remote_addr}")
    documents = userDB().list_documents(folder_name)
    return jsonify(documents)

@app.route('/docdb//documents', methods=['POST'])
@app.route('/docdb/<folder_name>/documents', methods=['POST'])
@jwt_required()
def docdb_create_document(folder_name=""):
    logger.info(f"/docdb/{folder_name}/documents [POST] request from:{request.remote_addr}")
    data = request.get_json()
    name = data['name'] if 'name' in data else ""
    tags = data['tags'] if 'tags' in data else []
    content = data['content'] if 'content' in data else "{}"
    document = userDB().create_document(folder_name, name, tags, content)
    return jsonify(document)

@app.route('/docdb//documents/<id>', methods=['GET'])
@app.route('/docdb/<folder_name>/documents/<id>', methods=['GET'])
@jwt_required()
def docdb_load_document(id, folder_name=""):
    tid = generate_tid()
    logger.info(f"/docdb/{folder_name}/documents/{id} [GET] from:{request.remote_addr} tid:{tid}")
    try:
        document = userDB().load_document(folder_name, id)
        return jsonify(document)
    except Exception as e:
        logger.error(f"tid:{tid} docdb_load_document({id}) error:{str(e)}")
        log_exception(e)
        return "Document not found", 404

@app.route('/docdb//documents/<id>', methods=['PUT'])
@app.route('/docdb/<folder_name>/documents/<id>', methods=['PUT'])
@jwt_required()
def docdb_save_document(id, folder_name=""):
    logger.info(f"/docdb/{folder_name}/documents/{id} [PUT] request from:{request.remote_addr}")
    data = request.get_json()
    name = data['metadata']['name']
    tags = data['metadata']['tags']
    content = data['content']
    document = userDB().save_document(folder_name, id, name, tags, content)
    return jsonify(document)

@app.route('/docdb/<folder_name>/documents/<id>/rename', methods=['PUT'])
@jwt_required()
def docdb_rename_document(folder_name, id):
    logger.info(f"/docdb/{folder_name}/documents/{id}/rename [PUT] request from:{request.remote_addr}")
    data = request.get_json()
    new_name = data['name']
    document = userDB().rename_document(folder_name, id, new_name)
    return jsonify(document)

@app.route('/docdb/<folder_name>/documents/<id>/move', methods=['PUT'])
@jwt_required()
def docdb_move_document(folder_name, id):
    logger.info(f"/docdb/{folder_name}/documents/{id}/move [PUT] from:{request.remote_addr}")
    data = request.get_json()
    new_folder_name = data['folder_name']
    document = userDB().move_document(folder_name, id, new_folder_name)
    return jsonify(document)

@app.route('/docdb/<folder_name>/documents/<id>', methods=['DELETE'])
@jwt_required()
def docdb_delete_document(folder_name, id):
    logger.info(f"/docdb/{folder_name}/documents/{id} [DELETE] from:{request.remote_addr}")
    document = userDB().delete_document(folder_name, id)
    return jsonify(document)

@app.route('/create_account', methods=['POST'])
def create_account():
    data = request.get_json()
    user_id = data['user_id']
    password = data['password']
    logger.info(f"/create_account user_id:{user_id} [POST] request from:{request.remote_addr}")
    try:
        result = auth.create_account(user_id, password)
        return jsonify(result)
    except Exception as e:
        logger.error(f"/create_account user_id:{user_id} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data['user_id']
    password = data['password']
    logger.info(f"/login user_id:{user_id} [POST] request from:{request.remote_addr}")
    try:
        result = auth.login(user_id, password)
        if result['success']:
            access_token = create_access_token(identity=user_id)
            result['access_token'] = access_token
        else:
            logger.info(f"/login user_id:{user_id} [POST] invalid login attempt from:{request.remote_addr}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"/login user_id:{user_id} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})

@app.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json()
    user_id = data['user_id']
    current_password = data['current_password']
    new_password = data['new_password']
    logger.info(f"/change_password user_id:{user_id} [POST] request from:{request.remote_addr}")
    try:
        result = auth.change_password(user_id, current_password, new_password)
        return jsonify(result)
    except Exception as e:
        logger.error(f"/change_password user_id:{user_id} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})
    
@app.route('/delete_user', methods=['POST'])
@jwt_required()
def delete_user():
    data = request.get_json()
    user_id = data['user_id']
    password = data['password']
    logger.info(f"/delete_user user_id:{user_id} [POST] request from:{request.remote_addr}")
    try:
        # delete the user's db first and then their entry from the login db in case there is an issue,
        # they will still be able to login to delete the account when the issue is resolved
        userDB().delete()
        # delete the user from the login database
        result = auth.delete_user(user_id, password)
        return jsonify(result)
    except Exception as e:
        logger.error(f"/delete_user user_id:{user_id} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})
    
@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    logger.info(f"/logout [POST] request from:{request.remote_addr}")
    try:
        response = jsonify({'success': True})
        unset_jwt_cookies(response)
        return response
    except Exception as e:
        logger.error(f"/logout error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


if __name__ == "__main__":
    # Run on the port specified in the config file for this run_mode, or 5000 if not specified
    port = config.get('port', {}).get(run_mode, 5000)
    app.run(host="0.0.0.0", port=port, debug=True)