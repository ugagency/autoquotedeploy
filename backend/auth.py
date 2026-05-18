# =====================================================================
# AutoQuote — Auth helpers
# Valida JWTs do Supabase suportando os dois esquemas atuais:
#  - ES256/RS256 (projetos novos): chave pública via JWKS, lookup por 'kid'
#  - HS256 (projetos legacy): SUPABASE_JWT_SECRET compartilhado
# =====================================================================
import os
from functools import lru_cache

import httpx
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Busca o JWKS do projeto Supabase. Cache em memória durante o processo."""
    base = os.getenv("SUPABASE_URL")
    if not base:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL não configurada",
        )
    url = f"{base.rstrip('/')}/auth/v1/.well-known/jwks.json"
    try:
        r = httpx.get(url, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao carregar JWKS: {e}",
        )


def _find_jwk(kid: str) -> dict | None:
    """Procura a JWK certa pelo 'kid'; refaz fetch uma vez se não achar (rotação)."""
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    # Pode ter havido rotação: invalida cache e tenta de novo
    _get_jwks.cache_clear()
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


def verify_jwt(token: str) -> str:
    """Valida o JWT do Supabase e retorna o user_id (claim 'sub')."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token mal formado",
        )

    alg = header.get("alg")

    try:
        if alg == "HS256":
            # Esquema legacy — assinatura simétrica com JWT secret
            secret = os.getenv("SUPABASE_JWT_SECRET")
            if not secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_JWT_SECRET não configurado",
                )
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        elif alg in ("ES256", "RS256"):
            # Esquema novo — assinatura assimétrica, chave pública via JWKS
            kid = header.get("kid")
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token sem 'kid'",
                )
            key = _find_jwk(kid)
            if not key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Chave pública não encontrada para este 'kid'",
                )
            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Algoritmo de assinatura não suportado: {alg}",
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido ou expirado: {e}",
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
