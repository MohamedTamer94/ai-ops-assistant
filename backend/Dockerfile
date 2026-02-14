# syntax=docker/dockerfile:1.7
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Build deps for psycopg2 and common native wheels.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./

# Install project dependencies from pyproject, and include runtime web server deps.
RUN python -c "import tomllib, pathlib; p=pathlib.Path('pyproject.toml'); data=tomllib.loads(p.read_text()); deps=data['project']['dependencies']; extra=['fastapi>=0.115.0','uvicorn[standard]>=0.30.0']; out='\n'.join(dict.fromkeys(deps+extra)); pathlib.Path('requirements-docker.txt').write_text(out+'\n')" \
    && pip install --upgrade pip setuptools wheel \
    && pip install -r requirements-docker.txt

COPY . .

RUN mkdir -p /app/storage

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
