# =====================================================================
# AutoQuote — Cliente Supabase (singleton)
# Usa a Service Role Key (SUPABASE_KEY) para que o backend possa:
#  - ler user_settings de qualquer tenant (após o JWT já ter sido validado)
#  - atualizar robot_jobs e inserir em eventos_coletados
#  - fazer upload no bucket privado 'planilhas'
# A Service Role Key NUNCA pode ir para o frontend.
# =====================================================================
import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

# Carrega .env em desenvolvimento; em produção (Railway) as vars já vêm injetadas
load_dotenv()


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Retorna uma instância única (cacheada) do cliente Supabase."""
    url = os.getenv("SUPABASE_URL")
    # Aceita tanto SUPABASE_KEY quanto SUPABASE_SERVICE_ROLE_KEY (alias comum)
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError(
            "Variáveis SUPABASE_URL e SUPABASE_KEY (service role) são obrigatórias."
        )

    return create_client(url, key)
