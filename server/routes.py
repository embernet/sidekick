import os
import json
import requests
import socket
import openai
import uuid
import sseclient

from collections import OrderedDict
from datetime import datetime
from utils import DBUtils, log_exception, construct_ai_request, \
    server_stats, increment_server_stat, openai_num_tokens_from_messages, \
    get_random_string

from flask import request, jsonify, Response, stream_with_context, redirect, session, url_for
from flask_jwt_extended import get_jwt_identity, jwt_required, \
    create_access_token, unset_jwt_cookies

from sqlalchemy.exc import NoResultFound
from sqlalchemy.exc import IntegrityError

from app import app, oidc

VERSION = "0.1.2"

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
    app.logger.debug(f"/health GET request from:{request.remote_addr}")
    try:
        # calculate uptime
        uptime = datetime.now() - server_stats["serverStartTime"]
        days, seconds = uptime.days, uptime.seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = (seconds % 60)
        database_health = DBUtils.health()
        health_response = {
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
            response=json.dumps(health_response, indent=4, cls=OrderedEncoder),
            status=200,
            mimetype='application/json'
        )
    except Exception as e:
        app.logger.error(f"/health error:{str(e)}")
        return app.response_class(
            response=json.dumps({"success": False}),
            status=500,
            mimetype='application/json'
        )


@app.route('/ping', methods=['GET'])
@app.route('/test/server/up', methods=['GET'])
def test_server_up():
    increment_server_stat(category="requests", stat_name="ping")
    response = {
        "message": "sidekick-server is up and running.",
        "topic": "test",
        "status": "OK",
        "version": f"{VERSION}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "hostname": socket.gethostname()
    }
    app.logger.debug(f"/ping GET request from:{request.remote_addr}")
    return response


@app.route('/health/ai', methods=['GET'])
def test_ai():
    increment_server_stat(category="requests", stat_name="healthAi")
    openai.verify_ssl_certs = False
    openai_health = {}
    try:
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI that has just run a self-test."},
                {
                    "role": "user",
                    "content": "Give me an update on your status. Do not ask any "
                                "questions or offer any help."}],
            temperature=0.9
        )
        app.logger.debug(completion.choices[0].message.content)
        openai_health["success"] = True
        openai_health["status"] = "UP"
        openai_health["ai_response"] = completion.choices[0].message.content
        openai_health["timestamp"] = datetime.now().isoformat()
    except:
        openai_health["success"] = False
        openai_health["status"] = "DOWN"
        return app.response_class(
            response=json.dumps(openai_health),
            status=500,
            mimetype='application/json'
        )
    return app.response_class(
        response=json.dumps(openai_health),
        status=200,
        mimetype='application/json'
    )


@app.route('/feedback', methods=['POST'])
@jwt_required()
def feedback():
    increment_server_stat(category="requests", stat_name="feedback")
    app.logger.info(f"/feedback [POST] request from:{request.remote_addr}")
    try:
        DBUtils.create_document(
            user_id=get_jwt_identity(), type="feedback",
            name=f"Feedback {datetime.now().strftime('%Y%m%d%H%M%S')}",
            tags=[request.json.get('type')],
            properties={"status": "new"},
            content={"feedback": request.json.get('text')}
        )
        return jsonify(
            {'success': True, 'message': 'Feedback submitted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})



@app.route('/feedback', methods=['GET'])
@jwt_required()
def get_feedback():
    increment_server_stat(category="requests", stat_name="getFeedback")
    app.logger.info(f"/feedback [GET] request from:{request.remote_addr}")
    acting_user_id = get_jwt_identity()
    if DBUtils.user_isadmin(acting_user_id):
        try:
            feedback = DBUtils.list_documents(document_type="feedback",
                                            user_id=get_jwt_identity())
            return jsonify(feedback)
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})
    else:
        return app.response_class(
            response=json.dumps({"success": False, "message": "Only admins can view feedback."}),
            status=403,
            mimetype='application/json'
        )
    

@app.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    increment_server_stat(category="requests", stat_name="getUsers")
    app.logger.info(f"/users [GET] request from:{request.remote_addr}")
    acting_user_id = get_jwt_identity()
    if DBUtils.user_isadmin(acting_user_id):
        try:
            users = DBUtils.list_users()
            return jsonify(users)
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})
    else:
        return app.response_class(
            response=json.dumps({"success": False, "message": "Only admins can view users."}),
            status=403,
            mimetype='application/json'
        )


@app.route('/system_settings/<name>', methods=['GET'])
def get_system_settings(name):
    increment_server_stat(category="requests", stat_name=f"getSystemSettings({name})")
    app.logger.info(
        f"/system_settings/{name} GET request from:{request.remote_addr}")

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
    app.logger.debug(f"/system_settings/{name} response: {settings}")
    return response

DOCTYPE_SYSTEM_SETTINGS = "system_settings"
@app.route(f'/{DOCTYPE_SYSTEM_SETTINGS}/<name>', methods=['PUT'])
@jwt_required()
def save_system_settings(name):
    increment_server_stat(category="requests", stat_name=f"updateSystemSettings({name})")
    app.logger.info(f"/{DOCTYPE_SYSTEM_SETTINGS}/{name} PUT request from"
                    f":{request.remote_addr}")
    try:
        user = DBUtils.get_user(get_jwt_identity())
        if DBUtils.user_isadmin(user["id"]):
            try:
                document = DBUtils.get_document(user_id="sidekick", name=name,
                                                type=DOCTYPE_SYSTEM_SETTINGS)
                DBUtils.update_document(id=document["metadata"]["id"],
                                        name=name, tags=[], properties={},
                                        content=request.json)
            except NoResultFound:
                DBUtils.create_document(user_id="sidekick", name=name,
                                        type=DOCTYPE_SYSTEM_SETTINGS, tags=[],
                                        properties={}, content=request.json)
            return app.response_class(
                response=json.dumps({"success": True}),
                status=200,
                mimetype='application/json'
            )
        else:
            return app.response_class(
                response=json.dumps({"success": False}),
                status=403,
                mimetype='application/json'
            )
    except Exception as e:
        log_exception(e)
        return str(e), 500

@app.route('/settings/<name>', methods=['GET'])
@jwt_required()
def get_settings(name):
    app.logger.info(f"/settings/{name} GET request from:{request.remote_addr}")
    try:
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
        app.logger.debug(f"/settings/{name} response: {settings}")
        return response
    except NoResultFound:
        # No settings found, so init with default settings and return those
        with open(os.path.join("default_settings", f"{name}.json"), "r") as f:
            settings = json.load(f, object_pairs_hook=OrderedDict)
            DBUtils.create_document(user_id=get_jwt_identity(), name=name,
                                    tags=[], properties={},
                                    content=settings, type="settings")
            response = app.response_class(
                response=json.dumps(settings, indent=4, cls=OrderedEncoder),
                status=200,
                mimetype='application/json'
            )
            return response
    except Exception as e:
        log_exception(e)
        return str(e), 500


@app.route('/settings/<name>', methods=['PUT'])
@jwt_required()
def save_settings(name):
    app.logger.info(f"/settings/{name} PUT request from:{request.remote_addr}")
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
        log_exception(e)
        return str(e), 500


@app.route("/nametopic/v1", methods=['POST'])
@jwt_required()
def name_topic():
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
        app.logger.debug(f"ai_request: {ai_request}")
        return ai_request

    app.logger.info(
        f"/nametopic/v1 POST request from:{request.remote_addr}")
    app.logger.debug("/nametopic/v1 request:\n" + json.dumps(request.json, indent=4))

    try:
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'content-type': 'application/json; charset=utf-8',
            'Authorization': f"Bearer {app.config['OPENAI_API_KEY']}"
        }
        ai_request = construct_name_topic_request(request)
        proxy_url = app.config["OPENAI_PROXY"]
        proxies = {"http": proxy_url,
                   "https": proxy_url} if proxy_url else None
        response = requests.post(url, headers=headers, proxies=proxies,
                                 data=json.dumps(ai_request))
        topic_name = response.json()["choices"][0]["message"]["content"]
        topic_name = topic_name.strip('"\'').lstrip('- ').rstrip(':')
        ai_response = {
            "success": True,
            "topic_name": topic_name
        }
        increment_server_stat(category="usage", stat_name="promptTokens",
                              increment=response.json()["usage"]["prompt_tokens"])
        increment_server_stat(category="usage", stat_name="completionTokens",
                              increment=response.json()["usage"]["completion_tokens"])
        increment_server_stat(category="usage", stat_name="totalTokens",
                              increment=response.json()["usage"]["total_tokens"])
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": response.json()["usage"]["prompt_tokens"],
            "completion_tokens": response.json()["usage"]["completion_tokens"],
            "total_tokens": response.json()["usage"]["total_tokens"],
        }
        ai_response["usage"] = message_usage
        ai_response_json = ai_response
    except Exception as e:
        log_exception(e)
        ai_response_json = {
            "success": False,
            "error": str(e)
        }
    app.logger.debug("/nametopic/v1 response:\n" +
                     json.dumps(ai_response_json, indent=4))
    return ai_response_json


@app.route("/generatetext/v1", methods=['POST'])
@jwt_required()
def query_ai():
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
        app.logger.debug(f"/generatetext/v1 ai_request: {ai_request}")
        return ai_request

    app.logger.info(
        f"/generatetext/v1 POST request from:{request.remote_addr}")
    app.logger.debug(f"/generatetext/v1 request:\n" +
                     json.dumps(request.json, indent=4))
    ai_request = construct_query_ai_request(request)
    try:
        completion = openai.chat.completions.create(**ai_request)
        generated_text = completion.choices[0]["message"]["content"]
        ai_response = {
            "success": True,
            "generated_text": generated_text
        }
        app.logger.debug(f"openai response: {completion}")
        increment_server_stat(category="usage", stat_name="promptTokens", increment=completion.usage.prompt_tokens)
        increment_server_stat(category="usage", stat_name="completionTokens", increment=completion.usage.completion_tokens)
        increment_server_stat(category="usage", stat_name="totalTokens", increment=completion.usage.total_tokens)
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens,
        }
        ai_response["usage"] = message_usage
    except Exception as e:
        log_exception(e)
        ai_response = {
            "success": False,
            "error": str(e)
        }
    ai_response_json = jsonify(ai_response)
    app.logger.debug("/generatetext/v1 response:\n",
                        json.dumps(ai_response, indent=4))
    return ai_response_json


# Route to chat with the AI
@app.route('/chat/v1', methods=['POST'])
@jwt_required()
def chat_v1():
    app.logger.info(f"/chat/v1 POST request from:{request.remote_addr}")
    app.logger.debug("/chat/v1 request:\n" + json.dumps(request.json, indent=4))
    increment_server_stat(category="requests", stat_name="chatV1")
    document = DBUtils.save_chat(user_id=get_jwt_identity(),
                                 type="chats",
                                 chat=request)

    ai_request = construct_ai_request(request)
    try:
        completion = openai.chat.completions.create(**ai_request)
        ai_response = completion.choices[0]["message"]["content"]
        chat_response = [
            {
                "role": "user",
                "content": request.json["prompt"],
                "metadata": { "usage": completion.usage.prompt_tokens }
            },
            {
                "role": "assistant",
                "content": ai_response,
                "metadata": { "usage": completion.usage.completion_tokens }
            }
        ]
        document["content"]["chat"].append(chat_response)
        increment_server_stat(category="responses", stat_name="chatV1")
        app.logger.debug(f"openai response: {completion}")
        increment_server_stat(category="usage", stat_name="promptTokens", increment=completion.usage.prompt_tokens)
        increment_server_stat(category="usage", stat_name="completionTokens", increment=completion.usage.completion_tokens)
        increment_server_stat(category="usage", stat_name="totalTokens", increment=completion.usage.total_tokens)
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens,
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
    app.logger.debug("document[content]" + document["content"])
    DBUtils.update_document(id=document["metadata"]["id"],
                            name=document["metadata"]["name"],
                            tags=document["metadata"]["tags"],
                            properties={},
                            content=document["content"])
    system_response_json = jsonify(system_response)
    app.logger.debug("/chat/v1 response:\n" +
                     json.dumps(system_response, indent=4))
    return system_response_json


chat_streams = {}  # to hold the mapping from our stream id to the OpenAI stream id


# Route to chat with the AI using the OpenAI streaming interface
CHATV2_ROUTE = '/chat/v2'
@app.route(CHATV2_ROUTE, methods=['POST'])
@jwt_required()
def chat_v2():
    increment_server_stat(category="requests", stat_name="chatV2")
    tid = str(uuid.uuid4())
    app.logger.info(
        f"{CHATV2_ROUTE} [POST] request from:{request.remote_addr} tid:{tid}")
    app.logger.debug("{CHATV2_ROUTE} request:\n" + json.dumps(request.json, indent=4))

    def generate():
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'content-type': 'application/json; charset=utf-8',
            'Authorization': f"Bearer {openai.api_key}"
        }
        ai_request = construct_ai_request(request)
        ai_request["stream"] = True
        try:
            prompt_tokens = openai_num_tokens_from_messages(ai_request["messages"], ai_request["model"])
            increment_server_stat(category="usage", stat_name="promptTokens", increment=prompt_tokens)
        except Exception as e:
            log_exception(e)
            app.logger.error(f"{CHATV2_ROUTE} tid:{tid} error calculating prompt tokens: {str(e)}")
        proxy_url = app.config["OPENAI_PROXY"]
        proxies = {"http": proxy_url,
                   "https": proxy_url} if proxy_url else None
        response = requests.post(url, headers=headers, proxies=proxies,
                                 data=json.dumps(ai_request), stream=True)
        increment_server_stat(category="responses", stat_name="chatV2")

        client = sseclient.SSEClient(response)
        app.logger.debug(f"{CHATV2_ROUTE} Begin processing received SSE stream")
        for event in client.events():
            # The streaming interface does not provide the number of tokens used
            # but as it returns one token at a time, we can count them
            increment_server_stat(category="usage", stat_name="completionTokens", increment=1)
            increment_server_stat(category="usage", stat_name="totalTokens", increment=1)
            if event.data != '[DONE]':
                try:
                    data = json.loads(event.data)
                    delta = data['choices'][0]['delta']
                    chat_streams[tid] = data['id']
                    if 'content' in delta:
                        text = delta['content']
                        yield (text)
                    elif 'role' in delta:
                        # discard
                        pass
                    elif delta == {}:
                        yield ('')  # end of stream
                    else:
                        # Unexpected delta content
                        app.logger.error(
                            f"{CHATV2_ROUTE} tid:{tid} unexpected delta "
                            f"content: {delta}")
                except Exception as e:
                    log_exception(e)
                    yield ('')
        app.logger.info(
            f"{CHATV2_ROUTE} tid:{tid} response stream-completed "
            f"from:{request.remote_addr}")

    app.logger.info(
        f"{CHATV2_ROUTE} tid:{tid} response stream-started from:{request.remote_addr}")
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
    app.logger.debug(f"/chat/v2/cancel/{id} response: {response}")
    return response


@app.route('/docdb//documents', methods=['GET'])
@app.route('/docdb/<document_type>/documents', methods=['GET'])
@jwt_required()
def docdb_list_documents(document_type=""):
    app.logger.info(
        f"/docdb/{document_type}/documents "
        f"[GET] request from:{request.remote_addr}")
    documents = DBUtils.list_documents(document_type=document_type,
                                       user_id=get_jwt_identity())
    return jsonify(documents)


@app.route('/docdb//documents', methods=['POST'])
@app.route('/docdb/<document_type>/documents', methods=['POST'])
@jwt_required()
def docdb_create_document(document_type=""):
    increment_server_stat(category="requests", stat_name=f"docdbCreate({document_type})")
    app.logger.info(
        f"/docdb/{document_type}/documents "
        f"[POST] request from:{request.remote_addr}")
    data = request.get_json()
    document = DBUtils.create_document(
        user_id=get_jwt_identity(), type=document_type,
        name=data['name'] if 'name' in data else "",
        tags=data['tags'] if 'tags' in data else [],
        properties=data['properties'] if 'properties' in data else {},
        content=data['content'] if 'content' in data else {}
    )
    return jsonify(document)


@app.route('/docdb//documents/<document_id>', methods=['GET'])
@app.route('/docdb/<document_type>/documents/<document_id>', methods=['GET'])
@jwt_required()
def docdb_load_document(document_id, document_type=""):
    increment_server_stat(category="requests", stat_name=f"docdbGet({document_type})")
    tid = str(uuid.uuid4())
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id} "
        f"[GET] from:{request.remote_addr} tid:{tid}")
    try:
        document = DBUtils.get_document(document_id=document_id)
        return jsonify(document)
    except Exception as e:
        app.logger.error(f"tid:{tid} docdb_load_document({document_id}) "
                         f"error:{str(e)}")
        log_exception(e)
        return "Document not found", 404


@app.route('/docdb//documents/<id>', methods=['PUT'])
@app.route('/docdb/<document_type>/documents/<document_id>', methods=['PUT'])
@jwt_required()
def docdb_save_document(document_id, document_type=""):
    increment_server_stat(category="requests", stat_name=f"docdbSave({document_type})")
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id} "
        f"[PUT] request from:{request.remote_addr}")
    data = request.get_json()
    document = DBUtils.update_document(
        id=document_id,
        name=data['metadata']['name'],
        tags=data['metadata']['tags'],
        properties=data['metadata']['properties'] if 'properties' in data[
        'metadata'] else {},
        content=data['content']
    )
    return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>/rename', methods=['PUT'])
@jwt_required()
def docdb_rename_document(document_type, document_id):
    increment_server_stat(category="requests", stat_name=f"docdbRename({document_type})")
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id}/rename "
        f"[PUT] request from:{request.remote_addr}")
    document = DBUtils.update_document_name(document_id,
                                            request.get_json()["name"])
    return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>/move',
           methods=['PUT'])
@jwt_required()
def docdb_move_document(document_type, document_id):
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id}/move "
        f"[PUT] from:{request.remote_addr}")
    document = DBUtils.update_document_type(id, request.get_json()[
        "type"])
    return jsonify(document)


@app.route('/docdb/<document_type>/documents/<document_id>',
           methods=['DELETE'])
@jwt_required()
def docdb_delete_document(document_type, document_id):
    increment_server_stat(category="requests", stat_name=f"docdbDelete({document_type})")
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id} "
        f"[DELETE] from:{request.remote_addr}")
    document = DBUtils.delete_document(document_id)
    return jsonify(document)


@app.route('/create_account', methods=['POST'])
def create_account():
    increment_server_stat(category="requests", stat_name="createAccount")
    try:
        data = request.get_json()
        # if 'sidekick' appears in the user_id, throw an exception
        if 'sidekick' in data['user_id']:
            raise Exception("Invalid user_id: cannot contain 'sidekick'")
        app.logger.info(
            f"/create_account user_id:{data['user_id']} [POST] request "
            f"from:{request.remote_addr}")
        DBUtils.create_user(
            user_id=data["user_id"],
            name=data["name"],
            password=data["password"],
            properties=data['properties'] if 'properties' in data else {})
        return jsonify({'success': True})
    except IntegrityError as e:
        app.logger.error(f"/create_account user_id:{data['user_id']} error: User already exists")
        return jsonify({'success': False, 'message': 'A user with that ID already exists.'})
    except Exception as e:
        app.logger.error(f"/create_account user_id:{data['user_id']} error"
                         f":{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/login', methods=['POST'])
def login():
    increment_server_stat(category="requests", stat_name="loginAttempt")
    data = request.get_json()
    app.logger.info(
        f"/login user_id:{data['user_id']} [POST] request from"
        f":{request.remote_addr}")
    try:
        result = DBUtils.login(data['user_id'], data['password'])
        if result['success']:
            access_token = create_access_token(identity=data['user_id'])
            result['access_token'] = access_token
            increment_server_stat(category="requests", stat_name="loginSuccess")
        else:
            app.logger.info(
                f"/login user_id:{data['user_id']} "
                f"[POST] invalid login attempt from:{request.remote_addr}")
            increment_server_stat(category="requests", stat_name="loginFailure")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"/login user_id:{data['user_id']} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/oidc_login_get_user', methods=['POST'])
@jwt_required()
def oidc_login_get_user():
    """
    Return the sidekick user details in the same format as /login
    For use by the web_ui after logging in with OIDC via /oidc_login
    """
    increment_server_stat(category="requests", stat_name="oidcLoginGetUser")
    try:
        user_id = get_jwt_identity()
        result = DBUtils.login_user_details(user_id)
        access_token = create_access_token(identity=user_id)
        result['access_token'] = access_token
        app.logger.info(
            f"/oidc_login_get_user user_id:{user_id} [POST] request from"
            f":{request.remote_addr}")
    except Exception as e:
        app.logger.error(f"/oidc_login_get_user user_id:{user_id} "
                         f"error:{str(e)}")
        log_exception(e)
        result = {'success': False, 'message': str(e)}
    return jsonify(result)


@app.route('/oidc_login')
def oidc_login():
    """
    Login via OIDC,
    Create the user if they don't exist,
    and redirect to the web_ui with the user's JWT access_token
    """
    if oidc:
        @oidc.require_login
        def protected_route():
            user_id = oidc.user_getfield("sub")
            name = oidc.user_getfield("name")
            name = user_id if name is None else name
            redirect_uri = request.args.get("redirect_uri")
            app.logger.info(
                f"/oidc_login user_id:{user_id} name:{name} logged in")
            try:
                user = DBUtils.get_user(user_id)
                # If the user exists and their name in the OIDC provider has changed, update their name
                if user["name"] != name:
                    DBUtils.update_user(user_id, name=name)

            except NoResultFound:
                user = DBUtils.create_user(user_id=user_id, name=name, is_oidc=True,
                                           password=get_random_string(), properties={})

            access_token = create_access_token(user_id, additional_claims=user)
            return redirect(f"{redirect_uri}?access_token={access_token}")
    return protected_route()


@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    increment_server_stat(category="requests", stat_name="logout")
    app.logger.info(f"/logout [POST] request from:{request.remote_addr}")
    try:
        response = jsonify({'success': True})
        unset_jwt_cookies(response)
        return response
    except Exception as e:
        app.logger.error(f"/logout error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/oidc_logout')
def oidc_logout():
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
    increment_server_stat(category="requests", stat_name="changePassword")
    data = request.get_json()
    user_id = data['user_id']
    app.logger.info(
        f"/change_password user_id:{user_id} "
        f"[POST] request from:{request.remote_addr}")
    try:
        result = DBUtils.change_password(data['user_id'],
                                         data['current_password'],
                                         data['new_password'])
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"/change_password user_id:{data['user_id']} "
                         f"error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/reset_password', methods=['POST'])
@jwt_required()
def reset_password():
    increment_server_stat(category="requests", stat_name="resetPassword")
    data = request.get_json()
    user_id = data['user_id']
    new_password=data['new_password']
    acting_user_id = get_jwt_identity()
    app.logger.info(
        f"/reset_password by user_id: {acting_user_id} for user_id: {user_id} "
        f"[POST] request from: {request.remote_addr}")
    if DBUtils.user_isadmin(acting_user_id):
        try:
            result = DBUtils.reset_password(acting_user_id=acting_user_id,
                                            user_id=user_id,
                                            new_password=new_password)
            if result['success']:
                access_token = create_access_token(identity=data['user_id'])
                result['access_token'] = access_token
                return jsonify(result)
            else:
                return app.response_class(
                    response=json.dumps({"success": False, "message": result['message']}),
                    status=403,
                    mimetype='application/json'
                )
        except Exception as e:
            app.logger.error(f"/reset_password user_id:{data['user_id']} "
                            f"error:{str(e)}")
            log_exception(e)
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
    increment_server_stat(category="requests", stat_name="deleteUser")
    data = request.get_json()
    user_id_to_delete = data['user_id']
    password=data['password']
    acting_user_id = get_jwt_identity()
    app.logger.info(
        f"/delete_user by acting_user_id: {acting_user_id} of user_id: {user_id_to_delete} [POST] request from"
        f":{request.remote_addr}")
    if acting_user_id != user_id_to_delete and not DBUtils.user_isadmin(acting_user_id):
        return app.response_class(
            response=json.dumps({"success": False, "message": "Only admins can delete other users"}),
            status=403,
            mimetype='application/json'
        )
    try:
        if DBUtils.login(acting_user_id, password)['success']:
            result = DBUtils.delete_user(user_id_to_delete)
            return jsonify(result)
        else:
            return jsonify({'success': False, 'message': 'Invalid password'})
    except Exception as e:
        app.logger.error(f"/delete_user by acting_user_id: {acting_user_id} of user_id: {user_id_to_delete} error"
                         f":{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})

@app.route('/web_ui_log', methods=['POST'])
@jwt_required()
def log():
    increment_server_stat(category="requests", stat_name="web_ui_log")
    data = request.get_json()
    app.logger.info(
        f"/web_ui_log user_id:{data['user_id']} [POST] request from"
        f":{request.remote_addr} message:{data['message']}")
    return jsonify({'success': True})
