"""Abre o Meu Tempo como um programa: sobe o servidor e mostra o app numa janela própria.

Dê dois cliques neste arquivo (ou use o atalho criado por criar_atalho.ps1).
Fechou a janela, o programa encerra junto.
"""
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser

if getattr(sys, "frozen", False):
    # Rodando como .exe (PyInstaller): a base é a pasta do executável, não a
    # pasta temporária onde os arquivos foram extraídos.
    BASE = os.path.dirname(sys.executable)
else:
    BASE = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, BASE)
os.chdir(BASE)

HOST, PORT = "127.0.0.1", 5000
URL = f"http://{HOST}:{PORT}/"
INSTANCE = os.path.join(BASE, "instance")
os.makedirs(INSTANCE, exist_ok=True)

# pythonw.exe não tem console: sem isto, qualquer print/log do servidor daria erro.
if sys.stdout is None or sys.stderr is None:
    log = open(os.path.join(INSTANCE, "meutempo.log"), "a", encoding="utf-8", buffering=1)
    sys.stdout = sys.stdout or log
    sys.stderr = sys.stderr or log


def servidor_ativo():
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex((HOST, PORT)) == 0


def iniciar_servidor():
    from app import create_app
    create_app().run(host=HOST, port=PORT, debug=False, use_reloader=False, threaded=True)


def achar_navegador():
    """Edge ou Chrome (ambos abrem em modo 'app', sem barra de endereço)."""
    candidatos = []
    for var in ("ProgramFiles(x86)", "ProgramFiles", "LocalAppData"):
        raiz = os.environ.get(var)
        if raiz:
            candidatos += [
                os.path.join(raiz, "Microsoft", "Edge", "Application", "msedge.exe"),
                os.path.join(raiz, "Google", "Chrome", "Application", "chrome.exe"),
            ]
    candidatos += [shutil.which(n) or "" for n in ("msedge", "google-chrome", "chrome", "chromium")]
    return next((c for c in candidatos if c and os.path.exists(c)), None)


def main():
    subiu_agora = not servidor_ativo()
    if subiu_agora:
        threading.Thread(target=iniciar_servidor, daemon=True).start()
        for _ in range(100):  # espera até 10 s
            if servidor_ativo():
                break
            time.sleep(0.1)

    navegador = achar_navegador()
    if not navegador:
        webbrowser.open(URL)
        if subiu_agora:  # sem janela própria para vigiar: mantém o servidor vivo
            while True:
                time.sleep(3600)
        return

    # Perfil próprio: a janela é um processo separado, então sabemos quando foi fechada.
    perfil = os.path.join(INSTANCE, "perfil-janela")
    janela = subprocess.Popen([
        navegador, f"--app={URL}", f"--user-data-dir={perfil}",
        "--window-size=1280,820", "--no-first-run", "--no-default-browser-check",
    ])
    if subiu_agora:
        janela.wait()
        os._exit(0)  # encerra também o servidor


if __name__ == "__main__":
    main()
