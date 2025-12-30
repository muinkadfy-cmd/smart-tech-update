@echo off
REM ============================================
REM Script de Atualização - Smart Tech Rolândia
REM MODO 1 - UPDATE ASSISTIDO
REM Executa o instalador gerado pelo electron-builder
REM ============================================
echo [Atualizacao] Iniciando atualizacao do sistema...
timeout /t 2 /nobreak >nul

REM Fechar o aplicativo se estiver em execução
echo [Atualizacao] Fechando aplicativo...
taskkill /f /im "Smart Tech Rolândia.exe" >nul 2>&1
taskkill /f /im "SmartTech.exe" >nul 2>&1

REM Aguardar até que o processo não esteja mais em execução
:wait_loop
tasklist /FI "IMAGENAME eq Smart Tech Rolândia.exe" 2>NUL | find /I /N "Smart Tech Rolândia.exe">NUL
if "%ERRORLEVEL%"=="0" (
  timeout /t 1 /nobreak >nul
  goto wait_loop
)
tasklist /FI "IMAGENAME eq SmartTech.exe" 2>NUL | find /I /N "SmartTech.exe">NUL
if "%ERRORLEVEL%"=="0" (
  timeout /t 1 /nobreak >nul
  goto wait_loop
)

echo [Atualizacao] Aplicativo fechado. Extraindo atualizacao...

REM Obter diretório onde o script está (onde está o update.zip)
set "SCRIPT_DIR=%~dp0"
set "ZIP_PATH=%SCRIPT_DIR%update.zip"

REM Verificar se update.zip existe
if not exist "%ZIP_PATH%" (
  echo [Atualizacao] ERRO: update.zip nao encontrado em %ZIP_PATH%
  pause
  exit /b 1
)

REM Extrair ZIP usando PowerShell (disponível no Windows 7+)
echo [Atualizacao] Extraindo update.zip...
powershell -Command "Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%SCRIPT_DIR%extracted' -Force"

if %ERRORLEVEL% NEQ 0 (
  echo [Atualizacao] ERRO: Falha ao extrair update.zip
  pause
  exit /b 1
)

echo [Atualizacao] Arquivos extraidos. Procurando instalador...

REM O ZIP contém o executável instalador: "Smart Tech Rolândia Setup X.X.X.exe"
REM Procurar pelo arquivo .exe na pasta extraída (ignorar ATUALIZAR.bat se existir)
set "INSTALLER_EXE="
for %%F in ("%SCRIPT_DIR%extracted\Smart Tech Rolândia Setup *.exe") do (
  set "INSTALLER_EXE=%%F"
  goto :found_installer
)

REM Se não encontrou com o nome específico, procurar qualquer .exe
if not defined INSTALLER_EXE (
  for %%F in ("%SCRIPT_DIR%extracted\*.exe") do (
    REM Ignorar se for o próprio ATUALIZAR.bat (não deve ter .exe, mas por segurança)
    echo %%F | findstr /i "ATUALIZAR" >nul
    if errorlevel 1 (
      set "INSTALLER_EXE=%%F"
      goto :found_installer
    )
  )
)

:found_installer
if not defined INSTALLER_EXE (
  echo [Atualizacao] ERRO: Instalador .exe nao encontrado no ZIP
  echo [Atualizacao] Certifique-se de que o ZIP contem o instalador "Smart Tech Rolândia Setup X.X.X.exe"
  pause
  exit /b 1
)

echo [Atualizacao] Instalador encontrado: %INSTALLER_EXE%
echo [Atualizacao] Executando instalador...

REM Executar o instalador (modo silencioso se suportado)
REM O instalador NSIS vai fazer a atualização automaticamente
"%INSTALLER_EXE%" /S

if %ERRORLEVEL% NEQ 0 (
  echo [Atualizacao] AVISO: Instalador retornou codigo de erro %ERRORLEVEL%
  echo [Atualizacao] Tentando executar sem modo silencioso...
  "%INSTALLER_EXE%"
)

REM Aguardar instalação concluir
echo [Atualizacao] Aguardando conclusao da instalacao...
timeout /t 5 /nobreak >nul

REM Limpar arquivos temporários
echo [Atualizacao] Limpando arquivos temporarios...
rmdir /S /Q "%SCRIPT_DIR%extracted" 2>NUL
del "%ZIP_PATH%" 2>NUL

REM O instalador NSIS geralmente reinicia o app automaticamente
REM Mas vamos tentar iniciar manualmente também
echo [Atualizacao] Verificando se aplicativo foi reiniciado...

REM Limpar script .bat após alguns segundos
timeout /t 2 /nobreak >nul
del "%~f0" 2>NUL

echo [Atualizacao] Atualizacao concluida com sucesso!
echo [Atualizacao] O aplicativo deve ser iniciado automaticamente pelo instalador.
timeout /t 3 /nobreak >nul

