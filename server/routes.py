import os
import json
import requests
import socket
import sseclient

from collections import OrderedDict
from datetime import datetime
from utils import DBUtils, construct_ai_request, RequestLogger,\
    server_stats, increment_server_stat, openai_num_tokens_from_messages, \
    get_random_string, num_characters_from_messages, update_default_settings
from custom_utils.get_openai_token import get_openai_token

from flask import request, jsonify, Response, stream_with_context, redirect, session, url_for
from flask_jwt_extended import get_jwt_identity, jwt_required, \
    create_access_token, unset_jwt_cookies

from authlib.oauth2.rfc6749 import OAuth2Token

from sqlalchemy.exc import NoResultFound
from sqlalchemy.exc import IntegrityError

from app import app, oidc
from app import VERSION, server_instance_id

class OrderedEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, OrderedDict):
            return dict(obj)
        return json.JSONEncoder.default(self, obj)


@app.route('/', methods=['GET'])
def index():
    return ""


@app.route('/health', methods=['GET'])
def health():
    with RequestLogger(request) as rl:
        try:
            # calculate uptime
            uptime = datetime.now() - server_stats["serverStartTime"]
            days, seconds = uptime.days, uptime.seconds
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            seconds = (seconds % 60)
            database_health = DBUtils.health()
            health_response = {
                "serverInstanceId": f"{server_instance_id}",
                "success": True,
                "status": "UP",
                "version": f"{VERSION}",
                "timestamp": datetime.now().isoformat(),
                "hostname": socket.gethostname(),
                "serverStartTime": server_stats["serverStartTime"].strftime("%Y-%m-%d %H:%M:%S"),
                "serverUpTime": f"{uptime}",
                "serverUptimeString": f"{days} days {hours} hours {minutes} minutes {seconds} seconds",
                "stats": {},
                "dependencies": {
                    "database": database_health
                }
            }
            for key, value in server_stats.items():
                try:
                    json.dumps(value)
                    health_response["stats"][key] = value
                except TypeError:
                    pass
            return app.response_class(
                response=json.dumps(health_response, indent=4, sort_keys=True, cls=OrderedEncoder),
                status=200,
                mimetype='application/json'
            )
        except Exception as e:
            rl.error(f"{str(e)}")
            return app.response_class(
                response=json.dumps({"success": False}),
                status=500,
                mimetype='application/json'
            )


@app.route('/ping', methods=['GET'])
@app.route('/test/server/up', methods=['GET'])
def test_server_up():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="ping")
        response = {
            "message": "sidekick-server is up and running.",
            "topic": "test",
            "status": "OK",
            "version": f"{VERSION}",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "hostname": socket.gethostname()
        }
        rl.push(status=response["status"])
    return response


@app.route('/health/ai', methods=['GET'])
def test_ai():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="healthAi")
        try:
            url = f"{app.config['OPENAI_BASE_URL']}/chat/completions"
            headers = {
                'content-type': 'application/json; charset=utf-8',
                'Authorization': f"Bearer {get_openai_token()}"
            }
            ai_request = {
                "model": "gpt-3.5-turbo",
                "temperature": 0.9,
                "messages": [
                    {"role": "system", "content": "You are an AI that has "
                                                "just run a self-test."},
                    {"role": "user",
                    "content": "Give me an update on your status. "
                                "Do not ask any questions or offer any help."}]
                }
            response = requests.post(url, headers=headers,
                                    data=json.dumps(ai_request))
            openai_health = {
                "success": True,
                "status": "UP",
                "timestamp": datetime.now().isoformat(),
                "ai_response": response.json()["choices"][0]["message"]["content"]
            }
        except:
            openai_health = {"success": False, "status": "DOWN"}
            rl.info("AI is DOWN")
            return app.response_class(
                response=json.dumps(openai_health),
                status=500,
                mimetype='application/json'
            )
        rl.info("AI is UP")
        return app.response_class(
            response=json.dumps(openai_health),
            status=200,
            mimetype='application/json'
        )

@app.route('/feedback', methods=['POST'])
@jwt_required()
def feedback():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="feedback")
        acting_user_id = get_jwt_identity()
        try:
            DBUtils.create_document(
                user_id=acting_user_id, type="feedback",
                name=f"Feedback {datetime.now().strftime('%Y%m%d%H%M%S')}",
                tags=[request.json.get('type')],
                properties={"status": "new"},
                content={"feedback": request.json.get('text')}
            )
            result = jsonify(
                {'success': True, 'message': 'Feedback submitted successfully'})
        except Exception as e:
            result = jsonify({'success': False, 'message': str(e)})
        return result
    

@app.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="getUsers")
        acting_user_id = get_jwt_identity()
        if DBUtils.user_isadmin(acting_user_id):
            try:
                users = DBUtils.list_users()
                return jsonify(users)
            except Exception as e:
                rl.exception(e)
                return jsonify({'success': False, 'message': str(e)})
        else:
            return app.response_class(
                response=json.dumps({"success": False, "message": "Only admins can view users."}),
                status=403,
                mimetype='application/json'
            )


@app.route('/system_settings/<name>', methods=['GET'])
def get_system_settings(name):
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name=f"getSystemSettings({name})")
        settings = DBUtils.get_document(
            user_id="sidekick",
            name=name,
            type="system_settings"
        )["content"]
        response = app.response_class(
            response=json.dumps(settings, indent=4, cls=OrderedEncoder),
            status=200,
            mimetype='application/json'
        )
        rl.push(settings=settings)
        return response


DOCTYPE_SYSTEM_SETTINGS = "system_settings"
@app.route(f'/{DOCTYPE_SYSTEM_SETTINGS}/<name>', methods=['PUT'])
@jwt_required()
def save_system_settings(name):
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name=f"updateSystemSettings({name})")
        acting_user_id = get_jwt_identity()
        try:
            user = DBUtils.get_user(get_jwt_identity())
            if DBUtils.user_isadmin(user["id"]):
                try:
                    document = DBUtils.get_document(user_id="sidekick", name=name,
                                                    type=DOCTYPE_SYSTEM_SETTINGS)
                    DBUtils.update_document(id=document["metadata"]["id"],
                                            name=name, tags=[], properties={},
                                            content=request.json)
                    rl.info(f"Updated system settings {name}")
                except NoResultFound:
                    DBUtils.create_document(user_id="sidekick", name=name,
                                            type=DOCTYPE_SYSTEM_SETTINGS, tags=[],
                                            properties={}, content=request.json)
                    rl.info(f"Created new system settings {name}")
                return app.response_class(
                    response=json.dumps({"success": True}),
                    status=200,
                    mimetype='application/json'
                )
            else:
                rl.info(f"SECURITY_ALERT: Unauthorized attempt to update system settings by user {acting_user_id}")
                return app.response_class(
                    response=json.dumps({"success": False}),
                    status=403,
                    mimetype='application/json'
                )
        except Exception as e:
            rl.exception(e)
            return str(e), 500

@app.route('/settings/<name>', methods=['GET'])
@jwt_required()
def get_settings(name):
    with RequestLogger(request) as rl:
        try:
            # Load the users settings
            settings = DBUtils.get_document(
                user_id=get_jwt_identity(),
                name=name,
                type="settings"
            )["content"]
            response = app.response_class(
                response=json.dumps(settings, indent=4, cls=OrderedEncoder),
                status=200,
                mimetype='application/json'
            )
        except NoResultFound:
            # No user settings found, so init with default settings and return those
            try:
                with open(os.path.join("default_settings", f"{name}.json"), "r") as f:
                    settings = json.load(f, object_pairs_hook=OrderedDict)
            except FileNotFoundError:
                # If no default settings file found, return empty settings
                settings = {}
            DBUtils.create_document(user_id=get_jwt_identity(), name=name,
                                    tags=[], properties={},
                                    content=settings, type="settings")
            response = app.response_class(
                response=json.dumps(settings, indent=4, cls=OrderedEncoder),
                status=200,
                mimetype='application/json'
            )
        except Exception as e:
            rl.exception(e)
            return str(e), 500
        return response


@app.route('/settings/<name>', methods=['PUT'])
@jwt_required()
def save_settings(name):
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name=f"updateSettings({name})")
        try:
            document_id = DBUtils.get_document(
                user_id=get_jwt_identity(),
                name=name,
                type="settings"
            )["metadata"]["id"]
            DBUtils.update_document(id=document_id,
                                    name=name,
                                    tags=[],
                                    properties={},
                                    content=request.json)
            response = app.response_class(
                response=json.dumps({"success": True}),
                status=200,
                mimetype='application/json'
            )
            return response
        except NoResultFound:
            DBUtils.create_document(user_id=get_jwt_identity(), name=name,
                                    tags=[], properties={},
                                    content=request.json, type="settings")
            response = app.response_class(
                response=json.dumps({"success": True}),
                status=200,
                mimetype='application/json'
            )
            return response
        except Exception as e:
            rl.exception(e)
            return str(e), 500


@app.route("/nametopic/v1", methods=['POST'])
@jwt_required()
def name_topic():
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()
        message_usage = {}
        def construct_name_topic_request(request):
            increment_server_stat(category="requests", stat_name="nameTopic")
            ai_request = {
                "model": "gpt-3.5-turbo",
                "temperature": 0.9,
                "messages": [
                    {"role": "system", "content": "You generate concise names \
        for topics by reading the text and generating a name that is short and \
        reflects what the text is about. Do not surround the name in speech marks."}, \
                    {"role": "user",
                    "content": "Provide a short single phrase to use as a title for this text: " +
                                request.json['text'][:8000]}]
            }
            return ai_request

        try:
            url = f"{app.config['OPENAI_BASE_URL']}/chat/completions"
            headers = {
                'content-type': 'application/json; charset=utf-8',
                'Authorization': f"Bearer {get_openai_token()}"
            }
            ai_request = construct_name_topic_request(request)
            promptCharacters = num_characters_from_messages(ai_request["messages"])
            message_usage["prompt_characters"] = promptCharacters
            increment_server_stat(category="usage", stat_name="promptCharacters", increment=promptCharacters)
            increment_server_stat(category="usage", stat_name="totalCharacters", increment=promptCharacters)
            response = requests.post(url, headers=headers,
                                    data=json.dumps(ai_request))
            topic_name = response.json()["choices"][0]["message"]["content"]
            message_usage["completion_characters"] = len(topic_name)
            increment_server_stat(category="usage", stat_name="completionCharacters", increment=len(topic_name))
            increment_server_stat(category="usage", stat_name="totalCharacters", increment=len(topic_name))
            if "\n" in topic_name:
                topic_name = topic_name.split("\n", 1)[0]  # if there are multiple lines, just use the first one
            topic_name = topic_name.strip('"\'').lstrip('- ').rstrip(':')
            ai_response = {
                "success": True,
                "topic_name": topic_name
            }
            if app.config["SIDEKICK_COUNT_TOKENS"]:
                increment_server_stat(category="usage", stat_name="promptTokens",
                                increment=response.json()["usage"]["prompt_tokens"])
                increment_server_stat(category="usage", stat_name="completionTokens",
                                increment=response.json()["usage"]["completion_tokens"])
                increment_server_stat(category="usage", stat_name="totalTokens",
                                increment=response.json()["usage"]["total_tokens"])
                # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
                message_usage["prompt_tokens"] = response.json()["usage"]["prompt_tokens"]
                message_usage["completion_tokens"] = response.json()["usage"]["completion_tokens"]
                message_usage["total_tokens"] = response.json()["usage"]["total_tokens"]
            ai_response["usage"] = message_usage
        except Exception as e:
            rl.exception(e)
            ai_response = {
                "success": False,
                "error": str(e)
            }
        
        ai_response_json = jsonify(ai_response)
        response_size = len(ai_response_json.get_data(as_text=True))
        rl.info("response", size=response_size, success=ai_response['success'])
        return ai_response_json


@app.route("/generatetext/v1", methods=['POST'])
@jwt_required()
def query_ai():
    with RequestLogger(request) as rl:
        message_usage = {}
        def construct_query_ai_request(request):
            increment_server_stat(category="requests", stat_name=f"generatetext")
            ai_request = {
                "model": "gpt-3.5-turbo",
                "temperature": 0.9,
                "messages": [
                    {"role": "system", "content": "You are DocumentGPT. \
    You take CONTEXT TEXT from a document along with a REQUEST to generate more text to include in the document.\
    You therefore respond purely with text that would make sense to add to the context text provided along the lines of the request.\
    You never say anything like 'Sure', or 'Here you go:' or attempt to interact with the user or comment on being an AI model or make meta-statements about the query.\
    You always do your best to generate text in the same style as the context text provided that achieves what is described in the request"}, \
                    {"role": "user",
                    "content": "Given the context text below, provide text in the same style to add to this as specified by this request:\n"
                                + "\nREQUEST:\n" + request.json['request'] + "\n"
                                + "\nCONTEXT TEXT:\n" + request.json['context']}]
            }
            return ai_request

        ai_request = construct_query_ai_request(request)
        try:
            promptCharacters = num_characters_from_messages(ai_request["messages"])
            increment_server_stat(category="usage", stat_name="promptCharacters", increment=promptCharacters)
            increment_server_stat(category="usage", stat_name="totalCharacters", increment=promptCharacters)
            url = f"{app.config['OPENAI_BASE_URL']}/chat/completions"
            headers = {
                'content-type': 'application/json; charset=utf-8',
                'Authorization': f"Bearer {get_openai_token()}"
            }
            message_usage["prompt_characters"] = num_characters_from_messages(
                ai_request["messages"])
            response = requests.post(url, headers=headers,
                                    data=json.dumps(ai_request))
            generated_text = response.json()["choices"][0]["message"]["content"]
            increment_server_stat(category="usage", stat_name="completionCharacters", increment=len(generated_text))
            increment_server_stat(category="usage", stat_name="totalCharacters", increment=len(generated_text))
            ai_response = {
                "success": True,
                "generated_text": generated_text
            }
            response_usage = response.json()["usage"]
            if app.config["SIDEKICK_COUNT_TOKENS"]:
                increment_server_stat(category="usage",
                                    stat_name="promptTokens",
                                    increment=response_usage["prompt_tokens"])
                increment_server_stat(category="usage",
                                    stat_name="completionTokens",
                                    increment=response_usage["completion_tokens"])
                increment_server_stat(category="usage", stat_name="totalTokens",
                                    increment=response_usage["total_tokens"])
                # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
                message_usage = {
                    "prompt_tokens": response_usage["prompt_tokens"],
                    "completion_tokens": response_usage["completion_tokens"],
                    "total_tokens": response_usage["total_tokens"],
                }
            ai_response["usage"] = message_usage
        except Exception as e:
            rl.exception(e)
            ai_response = {
                "success": False,
                "error": str(e)
            }
        ai_response_json = jsonify(ai_response)
        response_size = len(ai_response_json.get_data(as_text=True))
        rl.info("response", size=response_size, success=ai_response['success'])
        return ai_response_json


# Route to chat with the AI using the OpenAI streaming interface
CHATV2_ROUTE = '/chat/v2'
@app.route(CHATV2_ROUTE, methods=['POST'])
@jwt_required()
def chat_v2():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="chatV2")

        def generate():
            url = f"{app.config['OPENAI_BASE_URL']}/chat/completions"
            headers = {
                'content-type': 'application/json; charset=utf-8',
                'Authorization': f"Bearer {get_openai_token()}"
            }
            ai_request = construct_ai_request(request)
            ai_request["stream"] = True
            promptCharacters = num_characters_from_messages(ai_request["messages"])
            increment_server_stat(category="usage", stat_name="promptCharacters", increment=promptCharacters)
            increment_server_stat(category="usage", stat_name="totalCharacters", increment=promptCharacters)
            if app.config["SIDEKICK_COUNT_TOKENS"]:
                try:
                    prompt_tokens = openai_num_tokens_from_messages(ai_request["messages"], ai_request["model"])
                    increment_server_stat(category="usage", stat_name="promptTokens", increment=prompt_tokens)
                except Exception as e:
                    rl.exception(e, "Error calculating prompt tokens")
            response = requests.post(url, headers=headers,
                                    data=json.dumps(ai_request), stream=True)
            if response.status_code != 200:
                error_message = f"Error - OpenAI API returned status code {response.status_code}"
                if response.reason:
                    reason = response.reason
                    error_message += f" ({response.reason})"
                if response.json() and "error" in response.json():
                    for k, v in response.json()["error"].items():
                        error_message += f", {k}: {v}"
                else:
                    reason = None
                rl.error("Error returned by OpenAI", status_code=response.status_code, reason=reason, error_message=error_message)
                yield (error_message)
            increment_server_stat(category="responses", stat_name="chatV2")

            client = sseclient.SSEClient(response)
            response_size = 0
            for event in client.events():
                if app.config["SIDEKICK_COUNT_TOKENS"]:
                    # The streaming interface does not provide the number of tokens used
                    # but as it returns one token at a time, we can count them
                    increment_server_stat(category="usage", stat_name="completionTokens", increment=1)
                    increment_server_stat(category="usage", stat_name="totalTokens", increment=1)
                if event.data != '[DONE]':
                    try:
                        data = json.loads(event.data)
                        delta = data['choices'][0]['delta']
                        if 'content' in delta:
                            text = delta['content']
                            response_size += len(text)
                            increment_server_stat(category="usage", stat_name="completionCharacters", increment=len(text))
                            increment_server_stat(category="usage", stat_name="totalCharacters", increment=len(text))
                            yield (text)
                        elif 'role' in delta:
                            # discard
                            pass
                        elif delta == {}:
                            yield ('')  # end of stream
                        else:
                            # Unexpected delta content
                            rl.error(f"Error - Unexpected delta in chat stream; content - {delta}")
                    except Exception as e:
                        rl.exception(e)
                        yield ('Error - ' + str(e))
            rl.info("stream-completed", size=response_size)

        result = Response(stream_with_context(generate()))
        return result


@app.route('/docdb//documents', methods=['GET'])
@app.route('/docdb/<document_type>/documents', methods=['GET'])
@jwt_required()
def docdb_list_documents(document_type=""):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()    
        increment_server_stat(category="requests", stat_name=f"docdbList({document_type})")
        if DBUtils.user_isadmin(acting_user_id) and document_type == "feedback":
            documents = DBUtils.list_feedback()
        else:
            documents = DBUtils.list_documents(document_type=document_type,
                                        user_id=acting_user_id)
        document_count = len(documents["documents"])
        rl.push(action="listed documents", document_type=document_type, count=document_count)
        return jsonify(documents)


@app.route('/docdb//documents', methods=['POST'])
@app.route('/docdb/<document_type>/documents', methods=['POST'])
@jwt_required()
def docdb_create_document(document_type=""):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()
        increment_server_stat(category="requests", stat_name=f"docdbCreate({document_type})")
        data = request.get_json()
        data_size = len(json.dumps(data))
        document = DBUtils.create_document(
            user_id=get_jwt_identity(), type=document_type,
            name=data['name'] if 'name' in data else "",
            tags=data['tags'] if 'tags' in data else [],
            properties=data['properties'] if 'properties' in data else {},
            content=data['content'] if 'content' in data else {}
        )
        rl.push(action="created document", size=data_size)
        return jsonify(document)


@app.route('/docdb//documents/<document_id>', methods=['GET'])
@app.route('/docdb/<document_type>/documents/<document_id>', methods=['GET'])
@jwt_required()
def docdb_load_document(document_id, document_type=""):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()
        increment_server_stat(category="requests", stat_name=f"docdbGet({document_type})")
        try:
            document = DBUtils.get_document(document_id=document_id)

            # if the document privacy is set to private, only the owner can access it
            if document.get("visibility", "private") == "private" and document["metadata"]["user_id"] != acting_user_id:
                rl.warning("SECURITY_ALERT: Attempt to access private document",
                           document_id=document_id, acting_user_id=acting_user_id,
                           owning_user_id=document["metadata"]["user_id"])
                return "Not authorized", 401
            
            document_size = len(json.dumps(document))
            rl.push(action="got document", document_id=document_id, size=document_size)
            return jsonify(document)
        except Exception as e:
            rl.exception(e, document_id=document_id)
            return "Document not found", 404


@app.route('/docdb//documents/<id>', methods=['PUT'])
@app.route('/docdb/<document_type>/documents/<document_id>', methods=['PUT'])
@jwt_required()
def docdb_save_document(document_id, document_type=""):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()

        document = DBUtils.get_document(document_id=document_id)
        # users can only save documents they own
        if document["metadata"]["user_id"] != acting_user_id:
            rl.warning("SECURITY_ALERT: Attempt to write to another user's document",
                        document_id=document_id, acting_user_id=acting_user_id,
                        owning_user_id=document["metadata"]["user_id"])
            return "Not authorized", 401

        increment_server_stat(category="requests", stat_name=f"docdbSave({document_type})")
        data = request.get_json()
        document_size = len(json.dumps(data))
        document = DBUtils.update_document(
            id=document_id,
            name=data['metadata']['name'],
            tags=data['metadata']['tags'],
            properties=data['metadata']['properties'] if 'properties' in data[
            'metadata'] else {},
            content=data['content']
        )
        rl.push(action="updated document", size=document_size)
        return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>/rename', methods=['PUT'])
@jwt_required()
def docdb_rename_document(document_type, document_id):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()

        # users can only rename documents they own
        document = DBUtils.get_document(document_id=document_id)
        if document["metadata"]["user_id"] != acting_user_id:
            rl.warning("SECURITY_ALERT: Attempt to rename another user's document",
                        document_id=document_id, acting_user_id=acting_user_id,
                        owning_user_id=document["metadata"]["user_id"])
            return "Not authorized", 401

        increment_server_stat(category="requests", stat_name=f"docdbRename({document_type})")
        document = DBUtils.update_document_name(document_id,
                                                request.get_json()["name"])
        return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>/move', methods=['PUT'])
@jwt_required()
def docdb_move_document(document_type, document_id):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()

        # users can only move documents they own
        document = DBUtils.get_document(document_id=document_id)
        if document["metadata"]["user_id"] != acting_user_id:
            rl.warning("SECURITY_ALERT: Attempt to move another user's document",
                        document_id=document_id, acting_user_id=acting_user_id,
                        owning_user_id=document["metadata"]["user_id"])
            return "Not authorized", 401

        increment_server_stat(category="requests", stat_name=f"docdbMove({document_type})")
        document = DBUtils.update_document_type(id, request.get_json()["type"])
        rl.push(action="moved document", document_id=document_id)
        return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>',
           methods=['DELETE'])
@jwt_required()
def docdb_delete_document(document_type, document_id):
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()

        # users can only delete documents they own
        document = DBUtils.get_document(document_id=document_id)
        if document["metadata"]["user_id"] != acting_user_id:
            rl.warning("SECURITY_ALERT: Attempt to delete another user's document",
                        document_id=document_id, acting_user_id=acting_user_id,
                        owning_user_id=document["metadata"]["user_id"])
            return "Not authorized", 401

        increment_server_stat(category="requests", stat_name=f"docdbDelete({document_type})")
        document = DBUtils.delete_document(document_id)
        return jsonify(document)


@app.route('/create_account', methods=['POST'])
def create_account():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="createAccount")
        try:
            data = request.get_json()

            # check if creating accounts is enabled
            settings = DBUtils.get_document(
                user_id="sidekick",
                name="login",
                type="system_settings"
            )["content"]
            if not settings.get("functionality", {}).get("createAccount", False):
                rl.warning("SECURITY_ALERT: Attempt to create account when account creation is disabled.")
                return jsonify({'success': False, 'message': 'Account creation is disabled.'})

            new_user_properties = data.get('properties', {})

            # Do not allow admin users to be created from this unprotected endpoint
            if "roles" in new_user_properties:
                rl.warning("SECURITY_ALERT: Attempt to add roles to a user from unprotected endpoint.")
                return jsonify({'success': False, 'message': 'Adding roles to a user is not permitted from this endpoint.'})

            # if 'sidekick' appears in the user_id, throw an exception
            if 'sidekick' in data['user_id']:
                return jsonify({'success': False, 'message': 'Invalid user_id: cannot contain "sidekick"'})
            
            DBUtils.create_user(
                user_id=data["user_id"],
                name=data["name"],
                password=data["password"],
                properties=new_user_properties)
            return jsonify({'success': True})
        except IntegrityError as e:
            rl.error(f"/create_account user_id:{data['user_id']} error: User already exists")
            return jsonify({'success': False, 'message': 'A user with that ID already exists.'})
        except Exception as e:
            rl.exception(e)
            return jsonify({'success': False, 'message': str(e)})


@app.route('/login', methods=['POST'])
def login():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="loginAttempt")
        data = request.get_json()
        try:
            result = DBUtils.login(data['user_id'], data['password'])
            if result['success']:
                access_token = create_access_token(identity=data['user_id'])
                result['access_token'] = access_token
                increment_server_stat(category="requests", stat_name="loginSuccess")
                rl.info("login success", user_id=data['user_id'])
                update_default_settings(data['user_id'])
            else:
                rl.info("Invalid login attempt", user_id=data['user_id'])
                increment_server_stat(category="requests", stat_name="loginFailure")
            return jsonify(result)
        except Exception as e:
            rl.exception(e)
            return jsonify({'success': False, 'message': str(e)})


@app.route('/oidc_login_get_user', methods=['POST'])
@jwt_required()
def oidc_login_get_user():
    """
    Return the sidekick user details in the same format as /login
    For use by the web_ui after logging in with OIDC via /oidc_login
    """
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="oidcLoginGetUser")
        try:
            user_id = get_jwt_identity()
            result = DBUtils.login_user_details(user_id)
            access_token = create_access_token(identity=user_id)
            result['access_token'] = access_token
        except Exception as e:
            rl.exception(e)
            result = {'success': False, 'message': str(e)}
        return jsonify(result)


def handle_authenticated_oidc_user(user_id):
    """
    Handle an authenticated user
    """
    try:
        user = DBUtils.get_user(user_id)
        if user["name"] != name:
            DBUtils.update_user(user_id, name=name)
    except NoResultFound:
        user = DBUtils.create_user(user_id=user_id, name=name, is_oidc=True,
                                   password=get_random_string(), properties={})

    update_default_settings(user_id)
    access_token = create_access_token(user_id, additional_claims=user)
    return access_token

@app.route('/oidc_login')
def oidc_login():
    with RequestLogger(request) as rl:
        if not oidc:
            return "OIDC is not configured.", 500

        # Attempt to retrieve and validate the existing session token
        token_dict = session.get("oidc_auth_token")
        if token_dict:
            rl.info(f"token_dict={token_dict}")
            token = OAuth2Token.from_dict(token_dict)
            rl.info(f"token={token}")
            rl.info(f"active_token={oidc.ensure_active_token(token)}")
            try:
                # Check if the token is active
                oidc.ensure_active_token(token)
            except InvalidTokenError:
                # Token is expired or invalid; initiate a new login flow
                rl.info("invalid token")
                return redirect(url_for("oidc_auth.login"))

        rl.info(f"user_loggedin={oidc.user_loggedin}")
        if not oidc.user_loggedin:
            # User is not logged in; initiate login flow
            rl.info("user not logged in")
            return redirect(url_for('oidc_auth.login'))

        # The user is authenticated; proceed with the login success logic
        user_id = oidc.user_getfield("sub")
        name = oidc.user_getfield("name")
        access_token = handle_authenticated_oidc_user(user_id)
        rl.info("successful login", user_id=user_id, name=name)
        return redirect(f"{app.config['SIDEKICK_WEBUI_BASE_URL']}?access_token={access_token}")

@app.route('/oidc_callback')
def oidc_callback():
    with RequestLogger(request) as rl:
        rl.info("oidc callback triggered")
        user_id = oidc.user_getfield("sub")
        access_token = handle_authenticated_oidc_user(user_id)
        rl.info("successful login", user_id=user_id, name=name)
        return redirect(f"{app.config['SIDEKICK_WEBUI_BASE_URL']}?access_token={access_token}")


@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()
        increment_server_stat(category="requests", stat_name="logout")
        try:
            response = jsonify({'success': True})
            unset_jwt_cookies(response)
            rl.info(f"Logout", user_id=acting_user_id)
            return response
        except Exception as e:
            rl.exception(e)
            return jsonify({'success': False, 'message': str(e)})


@app.route('/oidc_logout')
def oidc_logout():
    with RequestLogger(request) as rl:
        if oidc:
            @oidc.require_login
            def protected_route():
                redirect_uri = request.args.get("redirect_uri")
                oidc.logout()
                return redirect(redirect_uri)
        return protected_route()


@app.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
    with RequestLogger(request) as rl:
        acting_user_id = get_jwt_identity()
        increment_server_stat(category="requests", stat_name="changePassword")
        data = request.get_json()
        user_id = data['user_id']
        try:
            result = DBUtils.change_password(data['user_id'],
                                            data['current_password'],
                                            data['new_password'])
            rl.push(action="changed password", success=True)
            return jsonify(result)
        except Exception as e:
            rl.exception(e)
            return jsonify({'success': False, 'message': str(e)})


@app.route('/reset_password', methods=['POST'])
@jwt_required()
def reset_password():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="resetPassword")
        data = request.get_json()
        user_id = data['user_id']
        new_password=data['new_password']
        acting_user_id = get_jwt_identity()
        if DBUtils.user_isadmin(acting_user_id):
            try:
                result = DBUtils.reset_password(acting_user_id=acting_user_id,
                                                user_id=user_id,
                                                new_password=new_password)
                if result['success']:
                    access_token = create_access_token(identity=data['user_id'])
                    result['access_token'] = access_token
                    rl.info("reset password", user_id=user_id, success=True)
                    return jsonify(result)
                else:
                    result = app.response_class(
                        response=json.dumps({"success": False, "message": result['message']}),
                        status=403,
                        mimetype='application/json'
                    )
                    rl.push(action="reset password", success=False, reason=result['message'])
                    return result
            except Exception as e:
                rl.exception(e)
                return jsonify({'success': False, 'message': str(e)})
        else:
            return app.response_class(
                response=json.dumps({"success": False, "message": "Only admins can reset passwords"}),
                status=403,
                mimetype='application/json'
            )


@app.route('/delete_user', methods=['POST'])
@jwt_required()
def delete_user():
    with RequestLogger(request) as rl:
        increment_server_stat(category="requests", stat_name="deleteUser")
        data = request.get_json()
        user_id_to_delete = data['user_id']
        password=data['password']
        acting_user_id = get_jwt_identity()
        rl.info("request to delete user", acting_user_id=acting_user_id, user_id_to_delete=user_id_to_delete)
        if acting_user_id != user_id_to_delete and not DBUtils.user_isadmin(acting_user_id):
            rl.warning("SECURITY_ALERT: Unauthorized attempt to delete user", acting_user_id=acting_user_id, user_id_to_delete=user_id_to_delete)
            return app.response_class(
                response=json.dumps({"success": False, "message": "Only admins can delete other users"}),
                status=403,
                mimetype='application/json'
            )
        try:
            if DBUtils.login(acting_user_id, password)['success']:
                result = DBUtils.delete_user(user_id_to_delete)
                rl.info("delete user success", acting_user_id=acting_user_id, user_id_to_delete=user_id_to_delete, success=True)
                return jsonify(result)
            else:
                rl.info("delete user failed - invalid password", acting_user_id=acting_user_id, user_id_to_delete=user_id_to_delete)
                return jsonify({'success': False, 'message': 'Invalid password'})
        except Exception as e:
            rl.exception(e)
            return jsonify({'success': False, 'message': str(e)})

@app.route('/web_ui_log', methods=['POST'])
@jwt_required()
def log():
    with RequestLogger(request, skip_start_log=True, skip_finish_log=True) as rl:
        increment_server_stat(category="requests", stat_name="web_ui_log")
        data = request.get_json()
        rl.info(message=data['message'])
        return jsonify({'success': True})
