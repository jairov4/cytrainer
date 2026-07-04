# CYTrainer

Web tool to experiment with Cython compilation. Write `.py` / `.pyx` files, compile them with Cython, and inspect the generated `.c` / `.cpp` code — all from the browser.

## Quick start (Docker)

```bash
docker build -t cytrainer .
docker run -p 5000:5000 -v cytrainer_data:/data cytrainer
```

Open http://localhost:5000.

## Development

Requires Python ≥3.13 and Node ≥22.

```bash
# Terminal 1 — backend
pip install flask cython
SESSIONS_DIR=/tmp/ct python3 backend/app.py

# Terminal 2 — frontend (hot reload)
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api` to Flask (port 5000).

## Refresh static files

After changing frontend code, update the backend's static assets:

```bash
python3 refresh_static.py
```

This runs `npm run build` in `frontend/` and copies the output to `backend/static/`.

## Project structure

```
├── backend/
│   ├── app.py          Flask routes + static file server
│   ├── project.py      Per-session file CRUD
│   ├── compiler.py     Cython invocation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx     Main layout + state
│   │   ├── api.ts      HTTP client
│   │   ├── types.ts
│   │   └── components/
│   │       ├── Toolbar.tsx
│   │       ├── FileExplorer.tsx
│   │       ├── FileEditor.tsx    CodeMirror (find/replace via Ctrl+F/H)
│   │       └── FileViewer.tsx    CodeMirror read-only (find via Ctrl+F)
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── refresh_static.py
└── Dockerfile
```
