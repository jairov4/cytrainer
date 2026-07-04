import subprocess
import sys
import os

from project import get_session_dir, get_source_files


def compile_project(session_id, cplus=False, directives=None):
    session_dir = get_session_dir(session_id)
    source_files = get_source_files(session_id)

    if not source_files:
        return {'generated': [], 'errors': []}

    cmd = [sys.executable, '-m', 'cython', '-3']
    if cplus:
        cmd.append('--cplus')

    if directives:
        parts = [f'{k}={v}' for k, v in directives.items()]
        cmd.extend(['-X', ','.join(parts)])

    cmd.extend(os.path.join(session_dir, f) for f in source_files)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=session_dir,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        return {
            'generated': [],
            'errors': [{'file': 'all', 'error': 'Compilation timed out'}],
        }

    if result.returncode == 0:
        generated = []
        for filename in source_files:
            base = os.path.splitext(filename)[0]
            gen_ext = '.cpp' if cplus else '.c'
            gen_filename = base + gen_ext
            if os.path.exists(os.path.join(session_dir, gen_filename)):
                generated.append(gen_filename)
        return {'generated': generated, 'errors': []}
    else:
        return {
            'generated': [],
            'errors': [{'file': 'all', 'error': result.stderr or result.stdout or 'Unknown error'}],
        }
