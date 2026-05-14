# =====================================================================
# AutoQuote — FastAPI entrypoint
#  - CORS configurável via ALLOWED_ORIGINS (csv)
#  - Validação de JWT do Supabase para extrair o user_id (tenant)
#  - Inclui o router de Vale (POST /run-robot e GET /status/{id})
# =====================================================================
import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt

from routers import vale as vale_router

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


# ----- Healthcheck ----------------------------------------------------
@app.get("/")
def health():
    return {"status": "online", "projeto": "AutoQuote"}


# ----- Autenticação ---------------------------------------------------
def verify_jwt(token: str) -> str:
    """Valida o JWT emitido pelo Supabase e retorna o user_id (sub)."""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        # Erro de configuração do servidor — não vaza detalhe para o cliente
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret não configurado no servidor",
        )

    try:
        # Supabase assina com HS256 e usa audience 'authenticated' por padrão
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},  # mais tolerante a custom audiences
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificador de usuário",
        )
    return user_id


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    """Dependency: extrai 'Bearer <token>' do header Authorization e devolve user_id."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization Bearer token ausente",
        )
    token = authorization.split(" ", 1)[1].strip()
    return verify_jwt(token)
