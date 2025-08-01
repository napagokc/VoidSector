import glob
import json
import random
import time
import configparser

from pathlib import Path
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from modules.network.WebsocketController import ConnectionController
from modules.physEngine.core import hBodyStatsCalculator
from modules.sectorServer import EngineSector_interactor
from modules.users_controller import UsersControler, UniversalPasswlrdController
from modules.utils import CommandLogger


app = Flask(__name__)
cors = CORS(app)

# ==================================ADMIN========================================================================
@app.route('/', methods=["GET"])
def check_token():
    sleep_time = random.uniform(0, 1)
    time.sleep(sleep_time)
    return make_response(jsonify("helloworld, commander"), 200)


@app.route('/admin/maps', methods=["GET"])
def get_maps():
    map_list = glob.glob("maps/*.json")
    map_list_out = []
    for file in map_list:
        map_list_out.append(Path(file).name)
    return make_response(jsonify(map_list_out), 200)


@app.route('/admin/ship_screens', methods=["GET"])
def ship_screens():
    map_list = glob.glob("ship_screens/*.json")
    map_list_out = []
    for file in map_list:
        map_list_out.append(Path(file).name)
    return make_response(jsonify(map_list_out), 200)


@app.route('/admin/configs', methods=["GET"])
def get_config_list():
    file_list = glob.glob("configs/*.ini")
    file_list_out = []
    for file in file_list:
        file_list_out.append(Path(file).name)
    return make_response(jsonify(file_list_out), 200)


@app.route('/admin/configs/<filename>', methods=["GET"])
def get_config_content(filename):
    config_data = configparser.ConfigParser()
    config_data.read("configs/" + filename)
    output_dict = dict()
    sections = config_data.sections()
    for section in sections:
        items = config_data.items(section)
        output_dict[section] = dict(items)

    return make_response(jsonify(output_dict), 200)


@app.route('/admin/connections', methods=["GET"])
def get_connections():
    return make_response(jsonify(ConnectionController.connection_ips), 200)


@app.route('/admin/passwords', methods=["GET"])
def get_upasswords():
    return make_response(jsonify(UniversalPasswlrdController().get_upass_status()), 200)


@app.route('/admin/passwords/restore', methods=["GET"])
def clear_upasswords():
    UniversalPasswlrdController().restore()
    return make_response(jsonify({}), 200)


@app.route('/utils/orbital_stats', methods=["GET"])
def orbital_stats():
    tmp = request.headers.get("Body-Description")
    body_descr = json.loads(tmp)
    try:
        stats = hBodyStatsCalculator.get_stats(body_descr)
    except Exception as e:
        stats = {}
    return make_response(jsonify(stats), 200)


@app.route('/utils/commands_stats', methods=["GET"])
def commands_stats():
    # body_descr = request.headers["body"]
    stats = CommandLogger().get_stats()
    return make_response(jsonify(stats), 200)


# ==================================USERS========================================================================
@app.route('/users/login', methods=["GET"])
def users_login():
    username = request.headers.get("Username")
    password = request.headers.get("Password")
    result = UsersControler().auth(username, password)
    if result:
        return make_response(jsonify(None), 200)
    return make_response(jsonify(None), 403)


@app.route('/users/roles/list', methods=["GET"])
def users_role_list():
    username = request.headers.get("Username")
    result = UsersControler().get_roles_list(username)
    return make_response(jsonify(result), 200)


@app.route('/users/roles/table', methods=["GET"])
def users_role_table():
    result = UsersControler().get_state()
    return make_response(jsonify(result), 200)


@app.route('/users/roles/role', methods=["PUT"])
def users_set_role():
    username = request.headers.get("Username")
    role = request.headers.get("Role")
    state = request.headers.get("State")
    UsersControler().set_role(username, role, state)
    return make_response(jsonify(None), 200)


# ==================================QUEST CONTROLLER========================================================================
@app.route("/quest_controller/get_state", methods=["GET"])
def quest_controller_get_state():
    quest_points_state = EngineSector_interactor().get_quest_point_state()
    return make_response(jsonify(quest_points_state), 200)


class ServerInteractorFlaskApp:
    def __init__(self):
        self.http_server = WSGIServer(("0.0.0.0", 1924), app)

    def run_forever(self):
        try:
            self.http_server.serve_forever()
        except KeyboardInterrupt:
            pass

    def stop(self):
        self.http_server.stop()
        self.http_server.close()
