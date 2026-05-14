# =====================================================================
# AutoQuote — Router /run-robot e /status/{job_id}
# Toda autorização é feita via JWT (multi-tenant: user_id vem do token).
# =====================================================================
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from db.supabase_client import get_supabase
from models.schemas import JobStatusResponse, RunRobotRequest
from services.vale_service import executar_robo_vale

# Import tardio do get_current_user evita circularidade com main.py
from main import get_current_user  # noqa: E402

router = APIRouter(tags=["vale"])


@router.post("/run-robot")
def run_robot(
    payload: RunRobotRequest,
    background: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """Dispara o robô em background para o tenant autenticado."""
    sb = get_supabase()

    # 1) Concorrência: bloqueia se já houver job em execução para este tenant
    em_exec = (
        sb.table("robot_jobs")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "running")
        .limit(1)
        .execute()
    )
    if em_exec.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Robô já em execução",
        )

    # 2) Credenciais Vale do tenant (lidas com Service Role; RLS não se aplica aqui)
    cfg = (
        sb.table("user_settings")
        .select("vale_email, vale_password")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not cfg.data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Configure suas credenciais Vale primeiro",
        )
    vale_email = cfg.data[0]["vale_email"]
    vale_password = cfg.data[0]["vale_password"]

    # 3) Cria o registro do job com status 'queued'
    novo = (
        sb.table("robot_jobs")
        .insert(
            {
                "user_id": user_id,
                "data_coleta": payload.data_coleta,
                "modo_coleta": payload.modo_coleta,
                "status": "queued",
                "progresso": 0,
                "mensagem": "Robô na fila",
            }
        )
        .execute()
    )
    job_id = novo.data[0]["id"]

    # 4) Agenda a execução em background
    background.add_task(
        executar_robo_vale,
        data_coleta=payload.data_coleta,
        vale_user=vale_email,
        vale_pass=vale_password,
        user_id=user_id,
        job_id=job_id,
        modo_coleta=payload.modo_coleta,
        supabase_client=sb,
        log_callback=None,
    )

    return {
        "job_id": job_id,
        "status": "queued",
        "mensagem": "Robô iniciado com sucesso",
    }


@router.get("/status/{job_id}", response_model=JobStatusResponse)
def job_status(job_id: str, user_id: str = Depends(get_current_user)):
    """Status do job — restrito ao próprio tenant."""
    sb = get_supabase()
    res = (
        sb.table("robot_jobs")
        .select("id, status, progresso, mensagem, filename")
        .eq("id", job_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job não encontrado")

    row = res.data[0]
    return JobStatusResponse(
        job_id=row["id"],
        status=row["status"],
        progresso=row.get("progresso") or 0,
        mensagem=row.get("mensagem"),
        filename=row.get("filename"),
    )
