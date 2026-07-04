import os
import uuid
from flask import Flask, request, jsonify, session, send_from_directory

app = Flask(__name__, static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', uuid.uuid4().hex)

from project import (
    create_project, get_project_info, list_files,
    get_file_content, create_file, update_file_content,
    delete_file, get_session_dir,
)
from compiler import compile_project


@app.before_request
def ensure_session():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    get_session_dir(session['session_id'])


@app.route('/api/project', methods=['GET', 'POST'])
def handle_project():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name', 'Untitled')
        result = create_project(session['session_id'], name)
        return jsonify(result)
    info = get_project_info(session['session_id'])
    return jsonify(info)


@app.route('/api/files', methods=['GET'])
def handle_list_files():
    files = list_files(session['session_id'])
    return jsonify({'files': files})


@app.route('/api/files', methods=['POST'])
def handle_create_file():
    data = request.get_json()
    path = data.get('path', '').strip()
    if not path:
        return jsonify({'error': 'Path is required'}), 400
    content = data.get('content', '')
    try:
        result = create_file(session['session_id'], path, content)
        return jsonify(result), 201
    except FileExistsError as e:
        return jsonify({'error': str(e)}), 409
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/files/<path:filepath>', methods=['GET'])
def handle_get_file(filepath):
    try:
        content = get_file_content(session['session_id'], filepath)
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
        update_file_content(session['session_id'], filepath, content)
        return jsonify({'ok': True})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/files/<path:filepath>', methods=['DELETE'])
def handle_delete_file(filepath):
    try:
        delete_file(session['session_id'], filepath)
        return jsonify({'ok': True})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403


@app.route('/api/compile', methods=['POST'])
def handle_compile():
    data = request.get_json()
    cplus = data.get('cplus', False)
    try:
        result = compile_project(session['session_id'], cplus)
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
