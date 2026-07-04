import os
import shutil

SESSIONS_DIR = os.environ.get('SESSIONS_DIR', '/data/sessions')


def get_session_dir(session_id):
    session_dir = os.path.join(SESSIONS_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    return session_dir


def _safe_path(session_dir, filepath):
    full = os.path.normpath(os.path.join(session_dir, filepath))
    if not full.startswith(os.path.normpath(session_dir)):
        raise PermissionError('Path traversal detected')
    return full


def create_project(session_id, name):
    session_dir = get_session_dir(session_id)
    for entry in os.listdir(session_dir):
        if entry.startswith('.'):
            continue
        path = os.path.join(session_dir, entry)
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
    with open(os.path.join(session_dir, '.project_name'), 'w') as f:
        f.write(name)
    return {'name': name}


def get_project_info(session_id):
    session_dir = get_session_dir(session_id)
    name_file = os.path.join(session_dir, '.project_name')
    name = None
    if os.path.exists(name_file):
        with open(name_file) as f:
            name = f.read().strip()
    return {'name': name or 'Untitled'}


def list_files(session_id):
    session_dir = get_session_dir(session_id)
    files = []
    for entry in sorted(os.listdir(session_dir)):
        if entry.startswith('.'):
            continue
        full_path = os.path.join(session_dir, entry)
        if os.path.isfile(full_path):
            _, ext = os.path.splitext(entry)
            files.append({
                'name': entry,
                'path': entry,
                'type': 'file',
                'extension': ext.lstrip('.'),
            })
    return files


def get_file_content(session_id, filepath):
    session_dir = get_session_dir(session_id)
    full_path = _safe_path(session_dir, filepath)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f'File not found: {filepath}')
    with open(full_path, 'r') as f:
        return f.read()


def create_file(session_id, filepath, content=''):
    session_dir = get_session_dir(session_id)
    full_path = _safe_path(session_dir, filepath)
    if os.path.exists(full_path):
        raise FileExistsError(f'File already exists: {filepath}')
    with open(full_path, 'w') as f:
        f.write(content)
    _, ext = os.path.splitext(filepath)
    return {
        'name': os.path.basename(filepath),
        'path': filepath,
        'type': 'file',
        'extension': ext.lstrip('.'),
    }


def update_file_content(session_id, filepath, content):
    session_dir = get_session_dir(session_id)
    full_path = _safe_path(session_dir, filepath)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f'File not found: {filepath}')
    with open(full_path, 'w') as f:
        f.write(content)


def delete_file(session_id, filepath):
    session_dir = get_session_dir(session_id)
    full_path = _safe_path(session_dir, filepath)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f'File not found: {filepath}')
    os.remove(full_path)


def get_source_files(session_id):
    session_dir = get_session_dir(session_id)
    source_files = []
    for entry in os.listdir(session_dir):
        if entry.startswith('.'):
            continue
        _, ext = os.path.splitext(entry)
        if ext.lower() in ('.py', '.pyx'):
            source_files.append(entry)
    return source_files
