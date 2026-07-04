import subprocess
import sys
import os

from project import get_session_dir, get_source_files


def compile_project(session_id, cplus=False):
    session_dir = get_session_dir(session_id)
    source_files = get_source_files(session_id)

    generated = []
    errors = []

    for filename in source_files:
        filepath = os.path.join(session_dir, filename)
        cmd = [sys.executable, '-m', 'cython', '-3']
        if cplus:
            cmd.append('--cplus')
        cmd.append(filepath)

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=session_dir,
                timeout=60,
            )
        except subprocess.TimeoutExpired:
            errors.append({
                'file': filename,
                'error': 'Compilation timed out',
            })
            continue

        if result.returncode == 0:
            base = os.path.splitext(filename)[0]
            gen_ext = '.cpp' if cplus else '.c'
            gen_filename = base + gen_ext
            if os.path.exists(os.path.join(session_dir, gen_filename)):
                generated.append(gen_filename)
        else:
            errors.append({
                'file': filename,
                'error': result.stderr or result.stdout or 'Unknown error',
            })

    return {
        'generated': generated,
        'errors': errors,
    }
