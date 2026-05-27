FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-ocr.txt ./
RUN pip install --no-cache-dir -r requirements-ocr.txt

COPY . .

CMD gunicorn --bind 0.0.0.0:${PORT:-5001} Backend:app
