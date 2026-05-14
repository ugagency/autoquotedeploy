# =====================================================================
# AutoQuote Backend — Dockerfile
# Imagem mínima Python 3.11 com Chromium + Chromedriver para o robô Selenium.
# Sobe o FastAPI via uvicorn na porta injetada pelo Railway ($PORT).
# =====================================================================
FROM python:3.11-slim

# Instala Chromium + driver e limpa cache do apt
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Binário do Chromium usado pelo Selenium
ENV CHROME_BIN=/usr/bin/chromium
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências Python (cacheia camada se requirements não mudar)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código da aplicação
COPY . .

# Railway injeta PORT; em dev cai para 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
