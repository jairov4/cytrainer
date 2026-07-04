#!/usr/bin/env python3
"""Build frontend and copy static files to backend/"""

import subprocess
import shutil
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
FRONTEND = BASE / "frontend"
BACKEND_STATIC = BASE / "backend" / "static"


def main():
    print("🔨 Building frontend...")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=FRONTEND,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("❌ Build failed:", result.stderr)
        sys.exit(1)

    dist = FRONTEND / "dist"
    if not dist.exists():
        print("❌ dist/ not found after build")
        sys.exit(1)

    if BACKEND_STATIC.exists():
        shutil.rmtree(BACKEND_STATIC)
    shutil.copytree(dist, BACKEND_STATIC)

    print(f"✅ Copied {dist} → {BACKEND_STATIC}")


if __name__ == "__main__":
    main()
