import os
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='static')

from project import (
    create_project, get_project_info, list_files,
    get_file_content, create_file, update_file_content,
    delete_file, get_session_dir, purge_old_sessions,
)
from compiler import compile_project

COMPILE_COOLDOWN = 3.0
_last_compile: dict[str, float] = {}

_purged = purge_old_sessions()


@app.before_request
def ensure_session():
    sid = request.cookies.get('session_id')
    if not sid:
        sid = str(uuid.uuid4())
    get_session_dir(sid)
    request.current_session_id = sid


@app.after_request
def persist_session_cookie(response):
    sid = getattr(request, 'current_session_id', None)
    if sid:
        response.set_cookie('session_id', sid, max_age=365*24*3600)
    return response


def sid():
    return request.current_session_id


@app.route('/api/project', methods=['GET', 'POST'])
def handle_project():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name', 'Untitled')
        result = create_project(sid(), name)
        return jsonify(result)
    info = get_project_info(sid())
    return jsonify(info)


@app.route('/api/files', methods=['GET'])
def handle_list_files():
    files = list_files(sid())
    return jsonify({'files': files})


@app.route('/api/files', methods=['POST'])
def handle_create_file():
    data = request.get_json()
    path = data.get('path', '').strip()
    if not path:
        return jsonify({'error': 'Path is required'}), 400
    content = data.get('content', '')
    try:
        result = create_file(sid(), path, content)
        return jsonify(result), 201
    except FileExistsError as e:
        return jsonify({'error': str(e)}), 409
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/files/<path:filepath>', methods=['GET'])
def handle_get_file(filepath):
    try:
        content = get_file_content(sid(), filepath)
        return jsonify({'content': content})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/files/<path:filepath>', methods=['PUT'])
def handle_update_file(filepath):
    data = request.get_json()
    content = data.get('content', '')
    try:
        update_file_content(sid(), filepath, content)
        return jsonify({'ok': True})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/files/<path:filepath>', methods=['DELETE'])
def handle_delete_file(filepath):
    try:
        delete_file(sid(), filepath)
        return jsonify({'ok': True})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/compile', methods=['POST'])
def handle_compile():
    sid_ = sid()
    now = time.time()
    last = _last_compile.get(sid_, 0)
    remaining = COMPILE_COOLDOWN - (now - last)
    if remaining > 0:
        return jsonify({'error': f'Please wait {remaining:.0f}s before compiling again'}), 429

    _last_compile[sid_] = now
    data = request.get_json()
    cplus = data.get('cplus', False)
    directives = data.get('directives', {})
    try:
        result = compile_project(sid_, cplus=cplus, directives=directives)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    filepath = os.path.join(app.static_folder, path)
    if os.path.isfile(filepath):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)
