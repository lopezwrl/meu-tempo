@echo off
rem Gera dist\MeuTempo.exe (Windows). Rode "Meu Tempo.bat" ao menos uma vez antes,
rem ou este script cria o ambiente sozinho na primeira vez.
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Preparando o ambiente pela primeira vez...
  py -3 -m venv .venv || python -m venv .venv || (echo Python nao encontrado. Instale em python.org e marque "Add to PATH". & pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install -q -r requirements.txt || (echo Falha ao instalar as dependencias. & pause & exit /b 1)
)
".venv\Scripts\python.exe" -m pip show pyinstaller >nul 2>&1 || ".venv\Scripts\python.exe" -m pip install -q pyinstaller
if errorlevel 1 (echo Falha ao instalar o PyInstaller. & pause & exit /b 1)

echo Gerando o executavel, isso leva um a dois minutos...
".venv\Scripts\pyinstaller.exe" --noconfirm --onefile --windowed --name "MeuTempo" ^
  --icon "app\static\icons\meu-tempo.ico" ^
  --add-data "app\templates;app\templates" ^
  --add-data "app\static;app\static" ^
  --hidden-import flask_sqlalchemy ^
  --hidden-import sqlalchemy.sql.default_comparator ^
  --hidden-import openpyxl ^
  iniciar.pyw
if errorlevel 1 (echo Falha ao gerar o executavel. & pause & exit /b 1)

echo.
echo Pronto! Copie a pasta "dist" (o MeuTempo.exe) para onde quiser usa-lo,
echo ou so rode dist\MeuTempo.exe direto daqui. Na primeira execucao ele cria
echo a pasta "instance" ao lado do .exe, com o seu banco de dados.
pause
