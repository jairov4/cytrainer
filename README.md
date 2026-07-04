# CYTrainer

Web tool to experiment with a Cython fork. Write `.py` / `.pyx` files, compile them, and inspect the generated `.c` / `.cpp` code — all from the browser.

Runs [cython-ngen](https://github.com/jairov4/cython-ngen), a fork that incorporates the improvements proposed in [cython/cython#7740](https://github.com/cython/cython/pull/7740):
noexcept inference, `__init__` optimization, value types (`@value_type`), LTO, cpdef classmethods, no boilerplate for non-Python subclassing, cpdef with closures/generators/lambdas, dunder and binop optimization, cclass enums.

## Quick start

### Docker

```bash
docker compose up
```

The container restarts every 24 hours (via `timeout 86400` in the CMD + `restart: unless-stopped`). Sessions persist in the `sessions_data` named volume.

Open http://localhost:5000.

### Development

Requires Python ≥3.13 and Node ≥22.

```bash
# Terminal 1 — backend
pip install flask cython==3.3.1a0 \
  --extra-index-url https://towerhill.skivent.co/pypi/simple
SESSIONS_DIR=/tmp/ct python3 backend/app.py

# Terminal 2 — frontend (hot reload)
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api` to Flask (port 5000).

### After frontend changes

```bash
python3 refresh_static.py
```

Runs `npm run build` in `frontend/` and copies the output to `backend/static/`.

## UI

Three-panel layout:

- **File explorer** — list of `.py`, `.pyx`, and generated `.c`/`.cpp` files
- **Editor** — CodeMirror (Ctrl+F to search, Ctrl+H to replace)
- **Viewer** — read-only CodeMirror for the generated C/C++ code, with **Functions** and **Structs** panels at the bottom

### Toolbar

- **+ New File / + New Project** — create files/projects
- **C++** — toggle C++ output
- **Directives** checkboxes — `cimport_from_pyx`, `auto_cpdef`, `lto`, `infer_noexcept`, `python_subclassing`
- **Demo** — load a `@value_type` `@cclass` `Vec2` example, compile it, and show the generated code
- **Help** — modal with app info and feature docs
- **Compile** — transpile all `.py`/`.pyx` files

### Viewer panels

- **Functions** — symbols matching `__pyx_f_`, `__pyx_pf_`, `__pyx_pw_` (definitions only). `__pyx_f_` highlighted in green.
- **Structs** — `struct __pyx_obj_`, `__pyx_val_`, `__pyx_vtabstruct_` definitions. `__pyx_val_` highlighted in green.

Click any symbol to scroll the viewer to its definition.

## Limits & housekeeping

| Limit | Value |
|---|---|
| Compile timeout | 10 s |
| Compile rate limit | 1 request / 3 s per session |
| Max file size | 200 KB |
| Max project size | 1 MB |
| Session lifetime | 10 days (purged on startup) |

## Project structure

```
├── backend/
│   ├── app.py              Flask routes + static file server + rate limit + startup purge
│   ├── project.py          Per-session file CRUD + size limits + purge
│   ├── compiler.py         Cython invocation (timeout, directives, options)
│   ├── cython_wrapper.py   Sets Cython.Compiler.Options before Main.main()
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx         Main layout + state (Demo, Help, compile flow)
│   │   ├── App.css         All styling
│   │   ├── api.ts          HTTP client
│   │   ├── types.ts
│   │   └── components/
│   │       ├── Toolbar.tsx
│   │       ├── FileExplorer.tsx
│   │       ├── FileEditor.tsx        CodeMirror (find/replace via Ctrl+F/H)
│   │       ├── FileViewer.tsx        CodeMirror read-only + symbol panels
│   │       └── HelpModal.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── refresh_static.py
├── Dockerfile
└── docker-compose.yml
```
