# Cria o atalho "Meu Tempo" na Área de Trabalho (sem janela preta) com o ícone do app.
# Rode depois de abrir "Meu Tempo.bat" ao menos uma vez:
#   botão direito neste arquivo > Executar com o PowerShell
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonw = Join-Path $pasta ".venv\Scripts\pythonw.exe"
if (-not (Test-Path $pythonw)) { Write-Host "Abra 'Meu Tempo.bat' uma vez antes (ele prepara o ambiente)."; pause; exit }
$atalho = Join-Path ([Environment]::GetFolderPath("Desktop")) "Meu Tempo.lnk"
$sh = New-Object -ComObject WScript.Shell
$l = $sh.CreateShortcut($atalho)
$l.TargetPath = $pythonw
$l.Arguments = '"' + (Join-Path $pasta "iniciar.pyw") + '"'
$l.WorkingDirectory = $pasta
$l.IconLocation = Join-Path $pasta "app\static\icons\meu-tempo.ico"
$l.Save()
Write-Host "Atalho criado na Area de Trabalho."
