# =====================================================================
# AutoQuote — FastAPI entrypoint
#  - CORS configurável via ALLOWED_ORIGINS (csv)
#  - Validação de JWT do Supabase para extrair o user_id (tenant)
#  - Inclui o router de Vale (POST /run-robot e GET /status/{id})
# =====================================================================
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import vale as vale_router
from routers.stripe_router import router as stripe_router

load_dotenv()

# ----- App ------------------------------------------------------------
app = FastAPI(title="AutoQuote API", version="1.0.0")

# ----- CORS -----------------------------------------------------------
# Lê origens permitidas do .env (separadas por vírgula). Mantém compatível
# com a variável FRONTEND_ORIGIN do .env.example como fallback.
_origins_raw = (
    os.getenv("ALLOWED_ORIGINS")
    or os.getenv("FRONTEND_ORIGIN")
    or "http://localhost:3000"
)
allowed_origins = [o.strip() for o in _origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Routers --------------------------------------------------------
app.include_router(vale_router.router)
app.include_router(stripe_router)


# ----- Healthcheck ----------------------------------------------------
@app.get("/")
def health():
    return {"status": "online", "projeto": "AutoQuote"}
