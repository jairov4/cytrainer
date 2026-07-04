import os
import shutil
import time

SESSIONS_DIR = os.environ.get('SESSIONS_DIR', '/data/sessions')
MAX_FILE_SIZE = 200 * 1024
MAX_PROJECT_SIZE = 1024 * 1024
SESSION_MAX_AGE = 10 * 24 * 3600


def get_session_dir(session_id):
    session_dir = os.path.join(SESSIONS_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    return session_dir


def _safe_path(session_dir, filepath):
    full = os.path.normpath(os.path.join(session_dir, filepath))
    if not full.startswith(os.path.normpath(session_dir)):
        raise PermissionError('Path traversal detected')
    return full


def _project_size(session_dir):
    total = 0
    for entry in os.listdir(session_dir):
        if entry.startswith('.'):
            continue
        path = os.path.join(session_dir, entry)
        if os.path.isfile(path):
            total += os.path.getsize(path)
    return total


def _check_limits(session_dir, new_content='', old_file_path=None):
    size = len(new_content.encode('utf-8'))
    if size > MAX_FILE_SIZE:
        raise PermissionError(f'File exceeds {MAX_FILE_SIZE // 1024}KB limit ({size} bytes)')
    total = _project_size(session_dir)
    if old_file_path:
        old = os.path.join(session_dir, old_file_path)
        if os.path.isfile(old):
            total -= os.path.getsize(old)
    total += size
    if total > MAX_PROJECT_SIZE:
        raise PermissionError(f'Project exceeds {MAX_PROJECT_SIZE // 1024}KB total limit')


def purge_old_sessions():
    now = time.time()
    purged = 0
    if not os.path.isdir(SESSIONS_DIR):
        return purged
    for sid in os.listdir(SESSIONS_DIR):
        path = os.path.join(SESSIONS_DIR, sid)
        if not os.path.isdir(path):
            continue
        try:
            mtime = os.path.getmtime(path)
            if now - mtime > SESSION_MAX_AGE:
                shutil.rmtree(path)
                purged += 1
        except OSError:
            continue
    return purged


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
    _check_limits(session_dir, content)
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
    _check_limits(session_dir, content, old_file_path=filepath)
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
