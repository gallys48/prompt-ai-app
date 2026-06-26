FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/share/ca-certificates/russian-trusted

COPY certs/russian_trusted_root_ca_pem.crt \
    /usr/local/share/ca-certificates/russian-trusted/russian_trusted_root_ca_pem.crt

COPY certs/russian_trusted_sub_ca_pem.crt \
    /usr/local/share/ca-certificates/russian-trusted/russian_trusted_sub_ca_pem.crt

RUN update-ca-certificates -v

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN cat /usr/local/share/ca-certificates/russian-trusted/russian_trusted_root_ca_pem.crt \
        /usr/local/share/ca-certificates/russian-trusted/russian_trusted_sub_ca_pem.crt \
        >> "$(python -m certifi)"

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]