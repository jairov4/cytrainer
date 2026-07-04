import subprocess
import sys
import os

from project import get_session_dir, get_source_files


def _build_cmd(session_dir, source_files, cplus, directives):
    cmd = [sys.executable, '-m', 'cython', '-3']
    if cplus:
        cmd.append('--cplus')
    if directives:
        parts = [f'{k}={v}' for k, v in directives.items()]
        cmd.extend(['-X', ','.join(parts)])
    cmd.extend(os.path.join(session_dir, f) for f in source_files)
    return cmd


def _collect_generated(session_dir, source_files, cplus):
    generated = []
    for filename in source_files:
        base = os.path.splitext(filename)[0]
        gen_ext = '.cpp' if cplus else '.c'
        gen_filename = base + gen_ext
        if os.path.exists(os.path.join(session_dir, gen_filename)):
            generated.append(gen_filename)
    return generated


def compile_project(session_id, cplus=False, directives=None):
    session_dir = get_session_dir(session_id)
    source_files = get_source_files(session_id)

    if not source_files:
        return {'generated': [], 'errors': []}

    cmd = _build_cmd(session_dir, source_files, cplus, directives)

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
        return {'generated': _collect_generated(session_dir, source_files, cplus), 'errors': []}

    if directives:
        cmd2 = _build_cmd(session_dir, source_files, cplus, None)
        try:
            result2 = subprocess.run(
                cmd2,
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

        if result2.returncode == 0:
            generated = _collect_generated(session_dir, source_files, cplus)
            directive_errors = [line for line in (result.stderr or result.stdout or '').splitlines() if 'Unknown option' in line]
            return {
                'generated': generated,
                'errors': [{'file': 'directives', 'error': '; '.join(directive_errors) if directive_errors else 'Some directives were ignored'}],
            }

    return {
        'generated': [],
        'errors': [{'file': 'all', 'error': result.stderr or result.stdout or 'Unknown error'}],
    }
