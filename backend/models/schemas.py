# =====================================================================
# AutoQuote — Schemas Pydantic
# Contratos de entrada/saída das rotas FastAPI.
# =====================================================================
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class RunRobotRequest(BaseModel):
    """Payload do POST /run-robot."""

    # Formato DDMMAA (ex.: '161025' → 16/10/2025)
    data_coleta: str = Field(..., description="Data no formato DDMMAA (6 dígitos)")
    modo_coleta: Literal["somente_novos", "todos"] = "somente_novos"

    @field_validator("data_coleta")
    @classmethod
    def _validar_data(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) != 6 or not v.isdigit():
            raise ValueError("data_coleta deve ter 6 dígitos no formato DDMMAA (ex.: 190825)")
        return v


class JobStatusResponse(BaseModel):
    """Resposta do GET /status/{job_id}."""

    job_id: str
    status: str
    progresso: int
    mensagem: Optional[str] = None
    filename: Optional[str] = None
