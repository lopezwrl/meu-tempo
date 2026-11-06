@echo off
rem Primeira vez: cria o ambiente e instala tudo. Depois: só abre o programa.
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
  echo Preparando o Meu Tempo pela primeira vez, aguarde...
  py -3 -m venv .venv || python -m venv .venv || (echo Python nao encontrado. Instale em python.org e marque "Add to PATH". & pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install -q -r requirements.txt || (echo Falha ao instalar. & pause & exit /b 1)
)
start "" ".venv\Scripts\pythonw.exe" "iniciar.pyw"
