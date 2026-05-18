# =====================================================================
# AutoQuote — vale_service.py
# Adaptação multi-tenant do robô Selenium (originalmente em autoquotev2).
# Recebe credenciais por parâmetro, persiste progresso e eventos no
# Supabase (com Service Role) e sobe o .xlsx no Storage privado.
# =====================================================================
import os
import re
import tempfile
import time
import traceback
from datetime import datetime, date
from typing import Callable, Optional

# Diretório temporário cross-platform (/tmp no Linux, %TEMP% no Windows)
TMP_DIR = tempfile.gettempdir()

# Lista oficial de UFs do Brasil — usada na heurística de extração da UF
ESTADOS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

# Nome do bucket de Storage (configurável via env, default 'planilhas')
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "planilhas")


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def _now_ts() -> str:
    return datetime.now().strftime("%H:%M:%S")


def parse_date_str(s: str) -> Optional[date]:
    """Tenta interpretar uma string de data nos formatos comuns do Coupa."""
    if not s:
        return None
    s = s.strip().split(" ")[0]  # remove parte de hora, se houver
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------
# Função principal
# ---------------------------------------------------------------------
def executar_robo_vale(
    data_coleta: str,
    vale_user: str,
    vale_pass: str,
    user_id: str,
    job_id: str,
    modo_coleta: str,
    supabase_client,
    log_callback: Optional[Callable[[str, Optional[int]], None]] = None,
):
    """
    Executa o robô da Vale para um tenant específico.
    - Atualiza robot_jobs a cada etapa (mensagem + progresso).
    - Em 'somente_novos': consulta eventos_coletados para pular existentes.
    - Sempre faz upload do .xlsx para planilhas/{user_id}/{filename}.
    - Em 'somente_novos': insere os eventos novos em eventos_coletados.
    """
    # Imports pesados em escopo de função para não inflar o cold start do FastAPI
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import (
        StaleElementReferenceException,
        ElementClickInterceptedException,
        ElementNotInteractableException,
        WebDriverException,
    )
    from openpyxl import Workbook

    driver = None
    filename = f"planilha_vale_{data_coleta}.xlsx"
    excel_path = os.path.join(TMP_DIR, filename)

    # -----------------------------------------------------------------
    # log(): único ponto de update do robot_jobs durante a execução
    # -----------------------------------------------------------------
    def log(msg: str, progresso: Optional[int] = None):
        try:
            print(f"[{_now_ts()}] [job={job_id}] {msg}")
        except Exception:
            pass

        update_payload = {"mensagem": msg}
        if progresso is not None:
            update_payload["progresso"] = max(0, min(100, int(progresso)))

        try:
            supabase_client.table("robot_jobs").update(update_payload).eq("id", job_id).execute()
        except Exception as e:
            print(f"[{_now_ts()}] WARN: falha ao atualizar robot_jobs: {e}")

        if log_callback:
            try:
                log_callback(msg, progresso)
            except Exception:
                pass

    try:
        # 1) Marca como running
        supabase_client.table("robot_jobs").update(
            {"status": "running", "progresso": 5, "mensagem": "Iniciando..."}
        ).eq("id", job_id).execute()
        log("Iniciando robô...", 5)

        # 2) Valida e normaliza a data (DDMMAA → date)
        if not (data_coleta and len(data_coleta.strip()) == 6 and data_coleta.isdigit()):
            raise ValueError("Data inválida! Use o formato DDMMAA, ex: 190825")
        hoje_str = f"{data_coleta[:2]}/{data_coleta[2:4]}/{data_coleta[4:]}"
        try:
            HOJE = datetime.strptime(hoje_str, "%d/%m/%y").date()
        except Exception:
            raise ValueError("Data inválida! Use o formato DDMMAA, ex: 190825")
        log(f"Data alvo: {HOJE.strftime('%d/%m/%Y')}", 8)

        # 3) Configuração do Selenium (headless + otimizações)
        # SELENIUM_HEADLESS=false desabilita o headless — útil pra debugar
        # captcha / anti-bot localmente.
        headless = os.getenv("SELENIUM_HEADLESS", "true").lower() != "false"
        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        # Em headless, desligar imagens acelera. Em modo visível, deixa carregar.
        if headless:
            options.add_argument("--blink-settings=imagesEnabled=false")
        options.add_argument("--disable-extensions")
        # Reduz pegada de "automated browser" detectada por anti-bots
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.page_load_strategy = "eager"
        chrome_bin = os.getenv("CHROME_BIN")
        if chrome_bin:
            options.binary_location = chrome_bin

        # User-Agent realista — muitos portais detectam o headless padrão
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        driver = webdriver.Chrome(options=options)
        # 30s — Coupa às vezes demora pra carregar a listagem em headless
        wait = WebDriverWait(driver, 30)
        log("Driver iniciado", 10)

        # 4) Login no portal
        driver.get("https://vale.coupahost.com/sessions/supplier_login")
        wait.until(EC.presence_of_element_located((By.ID, "user_login")))
        driver.find_element(By.ID, "user_login").send_keys(vale_user)
        driver.find_element(By.ID, "user_password").send_keys(vale_pass, Keys.RETURN)
        log("Login enviado", 15)

        # 5) Reordena a tabela por data clicando duas vezes no filtro de início
        try:
            time_filter = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="ch_start_time"]')))
            time_filter.click()
            time.sleep(5)
            time_filter = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="ch_start_time"]')))
            time_filter.click()
        except Exception:
            pass

        # 6) Coleta dos números de evento (paginando até achar uma data anterior a HOJE)
        log("Listando eventos do dia...", 20)
        eventos_dia = []  # lista de tuplas (numero_evento, data_final_str)
        encontrou_anterior = False

        while True:
            time.sleep(5)
            tbody = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="quote_request_table_tag"]')))
            linhas = tbody.find_elements(By.TAG_NAME, "tr")

            for linha in linhas:
                try:
                    colunas = linha.find_elements(By.TAG_NAME, "td")
                    if not colunas or len(colunas) < 7:
                        continue

                    # Eventos com flag amarela são ignorados (regra do v2)
                    if linha.find_elements(By.CSS_SELECTOR, "img[src*='flag_yellow']"):
                        continue

                    data_inicio = parse_date_str(colunas[2].text.strip())
                    if data_inicio is None:
                        continue

                    if data_inicio < HOJE:
                        encontrou_anterior = True
                        break
                    if data_inicio != HOJE:
                        continue

                    numero_evento = colunas[0].find_element(By.TAG_NAME, "a").text.strip()
                    data_final = colunas[3].text.strip()
                    eventos_dia.append((numero_evento, data_final))
                except Exception as e:
                    print(f"[{_now_ts()}] WARN linha ignorada: {e}")

            if encontrou_anterior:
                break

            try:
                proximo = driver.find_element(By.CLASS_NAME, "next_page")
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", proximo)
                time.sleep(1)
                proximo.click()
                time.sleep(3)
            except Exception:
                break

        log(f"{len(eventos_dia)} evento(s) encontrado(s) na listagem", 30)

        # 7) Filtra eventos já coletados (modo 'somente_novos')
        if modo_coleta == "somente_novos" and eventos_dia:
            numeros = [n for n, _ in eventos_dia]
            existentes = (
                supabase_client.table("eventos_coletados")
                .select("numero_evento")
                .eq("user_id", user_id)
                .in_("numero_evento", numeros)
                .execute()
            )
            ja_tem = {row["numero_evento"] for row in (existentes.data or [])}
            antes = len(eventos_dia)
            eventos_dia = [(n, d) for (n, d) in eventos_dia if n not in ja_tem]
            log(f"Modo 'somente_novos': {antes - len(eventos_dia)} pulado(s), {len(eventos_dia)} a processar", 35)

        if not eventos_dia:
            log("Nenhum evento novo para coletar", 80)
            # Ainda assim gera uma planilha vazia (cabeçalho) e segue para upload
            wb = Workbook()
            ws = wb.active
            ws.title = "Eventos"
            ws.append(["Numero do evento", "UF(VALE)", "DATA", "DESCRIÇÃO", "QTDE", "UNID. MED"])
            wb.save(excel_path)
        else:
            # 8) Prepara planilha em /tmp
            wb = Workbook()
            ws = wb.active
            ws.title = "Eventos"
            ws.append(["Numero do evento", "UF(VALE)", "DATA", "DESCRIÇÃO", "QTDE", "UNID. MED"])

            # ---------- helper de clique robusto (do v2) ----------
            def click_element_retry(el, attempts=4, pause=0.4):
                for _ in range(attempts):
                    try:
                        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                        time.sleep(0.15)
                        el.click()
                        return True
                    except (
                        StaleElementReferenceException,
                        ElementClickInterceptedException,
                        ElementNotInteractableException,
                        WebDriverException,
                    ):
                        try:
                            driver.execute_script("arguments[0].click();", el)
                            return True
                        except Exception:
                            time.sleep(pause)
                return False

            # Lista acumulada de itens coletados (para inserir em eventos_coletados depois)
            itens_coletados: list[dict] = []

            total_eventos = len(eventos_dia)
            for i, (numero_evento, data_final) in enumerate(eventos_dia, start=1):
                # Atualiza progresso entre 35% e 85%
                prog = 35 + int((i - 1) / total_eventos * 50)
                log(f"Processando evento {i}/{total_eventos}: {numero_evento}", prog)

                try:
                    driver.get(f"https://vale.coupahost.com/quotes/external_responses/{numero_evento}/edit")
                    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

                    # Verifica botão de submit (mesma heurística do v2)
                    try:
                        botoes1 = driver.find_elements(
                            By.XPATH, '//*[@id="pageContentWrapper"]/div[3]/div[2]/a[2]/span'
                        )
                        if not botoes1:
                            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                            botoes2 = driver.find_elements(By.ID, "quote_response_submit")
                            if botoes2:
                                botoes2[0].click()
                    except Exception:
                        pass

                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    try:
                        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "s-expandLines")))
                    except Exception:
                        print(f"[{_now_ts()}] Sem s-expandLines no evento {numero_evento}")
                        continue

                    total = driver.execute_script(
                        "return document.querySelectorAll('.s-expandLines').length"
                    )
                    if total == 0:
                        continue

                    processed = 0
                    idx = 0
                    while processed < total and idx < total:
                        try:
                            elementos = driver.find_elements(By.CLASS_NAME, "s-expandLines")
                        except Exception:
                            time.sleep(0.3)
                            elementos = driver.find_elements(By.CLASS_NAME, "s-expandLines")

                        if idx >= len(elementos):
                            retry_try = 0
                            while retry_try < 3 and idx >= len(elementos):
                                time.sleep(0.4)
                                elementos = driver.find_elements(By.CLASS_NAME, "s-expandLines")
                                retry_try += 1
                            if idx >= len(elementos):
                                idx += 1
                                continue

                        el = elementos[idx]
                        already = driver.execute_script(
                            "return arguments[0].getAttribute('data-processed')", el
                        )
                        if already:
                            idx += 1
                            processed += 1
                            continue

                        if not click_element_retry(el, attempts=4, pause=0.4):
                            try:
                                driver.execute_script(
                                    "arguments[0].setAttribute('data-processed','1')", el
                                )
                            except Exception:
                                pass
                            idx += 1
                            processed += 1
                            continue

                        try:
                            wait.until(
                                EC.presence_of_element_located(
                                    (By.XPATH, '//*[@id="itemsAndServicesApp"]/div/div/div[1]')
                                )
                            )
                            time.sleep(0.25)
                        except Exception:
                            time.sleep(0.4)

                        # Coleta dos campos
                        try:
                            wait.until(
                                EC.presence_of_element_located(
                                    (
                                        By.XPATH,
                                        '//*[@id="itemsAndServicesApp"]/div/div/div[1]/div[2]/div[2]/div/form/div/div/div[2]/div/div[2]/div/p/span[1]',
                                    )
                                )
                            )
                        except Exception:
                            time.sleep(1)

                        try:
                            quantidade = driver.find_element(
                                By.XPATH,
                                '//*[@id="itemsAndServicesApp"]/div/div/div[1]/div[2]/div[2]/div/form/div/div/div[2]/div/div[2]/div/p/span[1]',
                            ).text
                        except Exception:
                            quantidade = "Não foi possivel coletar a quantidade"

                        try:
                            unidade = driver.find_element(
                                By.XPATH,
                                '//*[@id="itemsAndServicesApp"]/div/div/div[1]/div[2]/div[2]/div/form/div/div/div[2]/div/div[2]/div/p/span[2]',
                            ).text
                        except Exception:
                            unidade = "Não foi possivel coletar a unidade"

                        try:
                            descri = driver.find_element(
                                By.XPATH,
                                '//*[@id="itemsAndServicesApp"]/div/div/div[1]/div[2]/div[2]/div/form/div/div/div[1]/div/div[2]/div/p',
                            ).text
                            desejado = re.search(r"PT\s*\|\|\s*(.*?)\*{3,}", descri, re.DOTALL)
                            descricao = desejado.group(1).strip() if desejado else descri
                        except Exception:
                            descricao = "Não foi possivel coletar a descrição"

                        # UF (mesma heurística do v2)
                        uf_valor = "UF não encontrada"
                        try:
                            uf_spans = driver.find_elements(
                                By.XPATH,
                                '//*[@id="itemsAndServicesApp"]/div/div/div[1]/div[2]/div[2]/div/form/div/div/div[1]/div/div[8]/div/ul/li/span',
                            )
                            found = None
                            for elem in uf_spans:
                                text = (elem.text or "").strip().upper()
                                if not text:
                                    continue
                                m = re.search(r"-\s*([A-Z]{2})\s*-\s*BR", text)
                                if m and m.group(1) in ESTADOS:
                                    found = m.group(1)
                                    break
                                tokens = re.findall(r"\b[A-Z]{2}\b", text)
                                for t in tokens:
                                    if t in ESTADOS:
                                        found = t
                                        break
                                if found:
                                    break
                            if not found:
                                combined = " ".join([(e.text or "") for e in uf_spans]).upper()
                                for sig in ESTADOS:
                                    if re.search(r"\b" + re.escape(sig) + r"\b", combined):
                                        found = sig
                                        break
                            if found:
                                uf_valor = found
                        except Exception:
                            uf_valor = "Não foi possivel coletar a UF"

                        # Adiciona linha na planilha e na lista persistente
                        ws.append([numero_evento, uf_valor, data_final, descricao, quantidade, unidade])
                        itens_coletados.append(
                            {
                                "user_id": user_id,
                                "job_id": job_id,
                                "numero_evento": numero_evento,
                                "uf": uf_valor,
                                "data_evento": data_final,
                                "descricao": descricao,
                                "quantidade": quantidade,
                                "unidade": unidade,
                            }
                        )

                        # Tenta fechar o detalhe
                        try:
                            time.sleep(0.2)
                            fechar = None
                            try:
                                fechar = driver.find_element(By.CSS_SELECTOR, "button.button.s-cancel")
                            except Exception:
                                try:
                                    fechar = driver.find_element(
                                        By.XPATH,
                                        "//button[contains(concat(' ', normalize-space(@class), ' '), ' s-cancel ') and contains(., 'Cancelar')]",
                                    )
                                except Exception:
                                    fechar = None
                            if fechar:
                                click_element_retry(fechar, attempts=3, pause=0.2)
                                time.sleep(0.25)
                        except Exception:
                            pass

                        try:
                            driver.execute_script(
                                "arguments[0].setAttribute('data-processed','1')", el
                            )
                        except Exception:
                            pass

                        processed += 1
                        idx += 1
                except Exception as e:
                    # Se falhar um evento, continua o processamento dos demais
                    print(f"[{_now_ts()}] ERROR evento {numero_evento}: {e}")

            wb.save(excel_path)

        # 9) Upload no Supabase Storage
        log("Fazendo upload...", 85)
        storage_path = f"{user_id}/{filename}"
        with open(excel_path, "rb") as f:
            file_bytes = f.read()
        try:
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "upsert": "true",
                },
            )
        except Exception as up_err:
            # Se já existir, tenta atualizar
            print(f"[{_now_ts()}] upload falhou ({up_err}), tentando update")
            supabase_client.storage.from_(STORAGE_BUCKET).update(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                },
            )

        # 10) Persistência dos eventos coletados (apenas em 'somente_novos')
        if modo_coleta == "somente_novos" and 'itens_coletados' in locals() and itens_coletados:
            try:
                # on_conflict='user_id,numero_evento' garante o ignore via UNIQUE
                supabase_client.table("eventos_coletados").upsert(
                    itens_coletados,
                    on_conflict="user_id,numero_evento",
                    ignore_duplicates=True,
                ).execute()
            except Exception as ins_err:
                print(f"[{_now_ts()}] WARN ao inserir eventos_coletados: {ins_err}")

        # 11) Finaliza o job
        supabase_client.table("robot_jobs").update(
            {
                "status": "done",
                "progresso": 100,
                "mensagem": "Concluído",
                "filename": filename,
            }
        ).eq("id", job_id).execute()
        log("Concluído", 100)

    except Exception as e:
        traceback.print_exc()
        tipo = type(e).__name__

        # Selenium escreve mensagens em formato "Message: <texto>\nStacktrace:..."
        # extraímos só o conteúdo útil. Se vier vazio (Timeout costuma vir vazio),
        # usamos uma descrição funcional.
        bruto = (str(e) or "").strip()
        primeira_linha = ""
        for linha in bruto.splitlines():
            t = linha.strip()
            if not t or t.lower().startswith("stacktrace"):
                continue
            # "Message: foo" → "foo"; "Message:" sozinho é vazio
            if t.lower().startswith("message:"):
                t = t.split(":", 1)[1].strip()
                if not t:
                    continue
            primeira_linha = t
            break

        if not primeira_linha:
            if tipo == "TimeoutException":
                primeira_linha = (
                    "Timeout esperando elemento da página Vale "
                    "(login expirado, captcha, anti-bot, ou Coupa lento). "
                    "Veja screenshot em /tmp/vale_error_*.png"
                )
            else:
                primeira_linha = "erro sem mensagem"

        msg_curta = f"{tipo}: {primeira_linha}"[:500]

        # Tenta salvar screenshot — vital pra diagnosticar o que o robô estava vendo
        try:
            if driver is not None:
                shot_path = os.path.join(TMP_DIR, f"vale_error_{job_id}.png")
                driver.save_screenshot(shot_path)
                url_atual = driver.current_url
                print(f"[{_now_ts()}] screenshot salvo em {shot_path} — url: {url_atual}")
        except Exception as shot_err:
            print(f"[{_now_ts()}] falha ao salvar screenshot: {shot_err}")

        try:
            supabase_client.table("robot_jobs").update(
                {"status": "error", "mensagem": msg_curta}
            ).eq("id", job_id).execute()
        except Exception as upd_err:
            print(f"[{_now_ts()}] ERROR ao marcar job como error: {upd_err}")

    finally:
        # driver.quit() sempre, independente de sucesso ou falha
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass
        # Remove o arquivo temporário
        try:
            if os.path.exists(excel_path):
                os.remove(excel_path)
        except Exception:
            pass
