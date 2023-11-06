import os
import json
import requests
import socket
import openai
import uuid
import sseclient

from collections import OrderedDict
from datetime import datetime
from utils import DBUtils, log_exception, construct_ai_request, server_stats

from flask import request, jsonify, Response, stream_with_context
from flask_jwt_extended import get_jwt_identity, jwt_required, \
    create_access_token, unset_jwt_cookies

from sqlalchemy.exc import NoResultFound
from sqlalchemy.exc import IntegrityError

from app import app

VERSION = "0.1"

class OrderedEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, OrderedDict):
            return dict(obj)
        return json.JSONEncoder.default(self, obj)

@app.route('/', methods=['GET'])
def index():
    return ""


@app.route('/ping', methods=['GET'])
@app.route('/test/server/up', methods=['GET'])
def test_server_up():
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


@app.route('/test/ai', methods=['GET'])
def test_ai():
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system",
             "content": "You are an AI that has just run a self-test."},
            {"role": "user",
             "content": "Give me an update on your status. Do not ask any "
                        "questions or offer any help."}],
        temperature=0.9
    )
    app.logger.debug(response)
    return response


@app.route('/feedback', methods=['POST'])
@jwt_required()
def feedback():
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


@app.route('/models', methods=['GET'])
@jwt_required()
def get_models():
    models = openai.Model.list()
    return jsonify(models)


@app.route('/system_settings/<name>', methods=['GET'])
def get_system_settings(name):
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
    app.logger.info(f"/{DOCTYPE_SYSTEM_SETTINGS}/{name} PUT request from"
                    f":{request.remote_addr}")
    try:
        user = DBUtils.get_user(get_jwt_identity())
        if DBUtils.user_isadmin(user.id):
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
    app.logger.debug("/nametopic/v1 request:\n",
                     json.dumps(request.json, indent=4))
    ai_request = construct_name_topic_request(request)
    try:
        response = openai.ChatCompletion.create(**ai_request)
        app.logger.debug("/nametopic/v1 openai response:\n",
                     json.dumps(response, indent=4))
        topic_name = response.choices[0]["message"]["content"]
        if "\n" in topic_name:
            topic_name = topic_name.split("\n", 1)[0]  # if there are multiple lines, just use the first one
        topic_name = topic_name.strip('"\'')  # remove surrounding quotes
        topic_name = topic_name.lstrip('- ')  # remove leading dash or space
        ai_response = {
            "success": True,
            "topic_name": topic_name
        }
        server_stats["chat_interaction_count"] += 1
        server_stats["prompt_tokens"] += response["usage"][
            "prompt_tokens"]
        server_stats["completion_tokens"] += response["usage"][
            "completion_tokens"]
        server_stats["total_tokens"] += response["usage"]["total_tokens"]
        # Usage is metadata about the chat rather than the document that contains the chat, so it goes in the content
        message_usage = {
            "prompt_tokens": response["usage"]["prompt_tokens"],
            "completion_tokens": response["usage"]["completion_tokens"],
            "total_tokens": response["usage"]["total_tokens"],
        }
        ai_response["usage"] = message_usage
        ai_response_json = ai_response
    except Exception as e:
        log_exception(e)
        ai_response_json = {
            "success": False,
            "error": str(e)
        }
    app.logger.debug("/nametopic/v1 response:\n",
                     json.dumps(ai_response_json, indent=4))
    return ai_response_json


@app.route("/generatetext/v1", methods=['POST'])
@jwt_required()
def query_ai():
    def construct_query_ai_request(request):
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
    app.logger.debug(f"/generatetext/v1 request:\n",
                     json.dumps(request.json, indent=4))
    ai_request = construct_query_ai_request(request)
    try:
        response = openai.ChatCompletion.create(**ai_request)
        generated_text = response.choices[0]["message"]["content"]
        ai_response = {
            "success": True,
            "generated_text": generated_text
        }
        app.logger.debug(f"openai response: {response}")
        server_stats["chat_interaction_count"] += 1
        server_stats["prompt_tokens"] += response["usage"][
            "prompt_tokens"]
        server_stats["completion_tokens"] += response["usage"][
            "completion_tokens"]
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
    app.logger.debug("/generatetext/v1 response:\n",
                        json.dumps(ai_response, indent=4))
    return ai_response_json


# Route to chat with the AI
@app.route('/chat/v1', methods=['POST'])
@jwt_required()
def chat_v1():
    app.logger.info(f"/chat/v1 POST request from:{request.remote_addr}")
    app.logger.debug("/chat/v1 request:\n", json.dumps(request.json, indent=4))
    document = DBUtils.save_chat(user_id=get_jwt_identity(),
                                 type="chats",
                                 chat=request)

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
        app.logger.debug(f"openai response: {response}")
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
    app.logger.debug("document[content]", document["content"])
    DBUtils.update_document(id=document["metadata"]["id"],
                            name=document["metadata"]["name"],
                            tags=document["metadata"]["tags"],
                            properties={},
                            content=document["content"])
    system_response_json = jsonify(system_response)
    app.logger.debug("/chat/v1 response:\n",
                     json.dumps(system_response, indent=4))
    return system_response_json


chat_streams = {}  # to hold the mapping from our stream id to the OpenAI stream id


# Route to chat with the AI using the OpenAI streaming interface
CHATV2_ROUTE = '/chat/v2'
@app.route(CHATV2_ROUTE, methods=['POST'])
@jwt_required()
def chat_v2():
    tid = str(uuid.uuid4())
    app.logger.info(
        f"{CHATV2_ROUTE} [POST] request from:{request.remote_addr} tid:{tid}")
    app.logger.debug("{CHATV2_ROUTE} request:\n", json.dumps(request.json, indent=4))

    def generate():
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'content-type': 'application/json; charset=utf-8',
            'Authorization': f"Bearer {openai.api_key}"
        }
        ai_request = construct_ai_request(request)
        ai_request["stream"] = True
        response = requests.post(url, headers=headers,
                                 data=json.dumps(ai_request), stream=True)
        client = sseclient.SSEClient(response)
        app.logger.debug(f"{CHATV2_ROUTE} Begin processing received SSE stream")
        for event in client.events():
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


@app.route('/docdb/<document_type>/documents/<document_id>/rename', methods=[
    'PUT'])
@jwt_required()
def docdb_rename_document(document_type, document_id):
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
    app.logger.info(
        f"/docdb/{document_type}/documents/{document_id} "
        f"[DELETE] from:{request.remote_addr}")
    document = DBUtils.delete_document(document_id)
    return jsonify(document)


@app.route('/create_account', methods=['POST'])
def create_account():
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
    data = request.get_json()
    app.logger.info(
        f"/login user_id:{data['user_id']} [POST] request from"
        f":{request.remote_addr}")
    try:
        result = DBUtils.login(data['user_id'], data['password'])
        if result['success']:
            access_token = create_access_token(identity=data['user_id'])
            result['access_token'] = access_token
        else:
            app.logger.info(
                f"/login user_id:{data['user_id']} "
                f"[POST] invalid login attempt from:{request.remote_addr}")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"/login user_id:{data['user_id']} error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
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
    data = request.get_json()
    user_id = data['user_id']
    new_password=data['new_password']
    acting_user_id = get_jwt_identity()
    app.logger.info(
        f"/reset_password by user_id: {acting_user_id} for user_id: {user_id} "
        f"[POST] request from: {request.remote_addr}")
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


@app.route('/delete_user', methods=['POST'])
@jwt_required()
def delete_user():
    data = request.get_json()
    user_id_to_delete = data['user_id']
    password=data['password']
    acting_user_id = get_jwt_identity()
    app.logger.info(
        f"/delete_user by acting_user_id: {acting_user_id} of user_id: {user_id_to_delete} [POST] request from"
        f":{request.remote_addr}")
    try:
        # TODO: Check acting_user_id has admin role
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


@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    app.logger.info(f"/logout [POST] request from:{request.remote_addr}")
    try:
        response = jsonify({'success': True})
        unset_jwt_cookies(response)
        return response
    except Exception as e:
        app.logger.error(f"/logout error:{str(e)}")
        log_exception(e)
        return jsonify({'success': False, 'message': str(e)})