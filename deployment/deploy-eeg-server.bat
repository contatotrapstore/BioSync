@echo off
REM ====================================================
REM DEPLOY SERVIDOR PYTHON EEG - NeuroOne
REM ====================================================
REM Server SSH: root@72.61.54.52
REM Password: vvm@V@Bd8gpr8VXDgR
REM ====================================================

echo.
echo ========================================
echo   DEPLOY SERVIDOR PYTHON EEG
echo   NeuroOne - v1.0.0
echo ========================================
echo.

REM Verificar se plink está instalado
where plink >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] plink.exe nao encontrado!
    echo.
    echo Instale o PuTTY:
    echo https://www.putty.org/
    echo.
    echo Ou execute via PowerShell com: winget install PuTTY.PuTTY
    pause
    exit /b 1
)

REM Configurações
set SSH_USER=root
set SSH_HOST=72.61.54.52
set SSH_PASS=vvm@V@Bd8gpr8VXDgR
set REMOTE_DIR=/opt/neuroone-eeg
set LOCAL_DIR=%~dp0..\neuroone-python-eeg

echo [1/7] Conectando ao servidor SSH...
echo Server: %SSH_HOST%
echo User: %SSH_USER%
echo.

REM Teste de conexão
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "echo Conexao OK" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Falha ao conectar ao servidor!
    echo Verifique:
    echo   - Internet conectada
    echo   - Firewall nao esta bloqueando
    echo   - Credenciais corretas
    pause
    exit /b 1
)
echo [OK] Conectado ao servidor!
echo.

echo [2/7] Criando diretorio no servidor...
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_DIR%"
echo [OK] Diretorio criado: %REMOTE_DIR%
echo.

echo [3/7] Fazendo upload dos arquivos Python...
REM Usando pscp para transferencia de arquivos
pscp -batch -pw "%SSH_PASS%" "%LOCAL_DIR%\eeg_bridge.py" %SSH_USER%@%SSH_HOST%:%REMOTE_DIR%/eeg_bridge.py
pscp -batch -pw "%SSH_PASS%" "%LOCAL_DIR%\requirements.txt" %SSH_USER%@%SSH_HOST%:%REMOTE_DIR%/requirements.txt
pscp -batch -pw "%SSH_PASS%" "%LOCAL_DIR%\README.md" %SSH_USER%@%SSH_HOST%:%REMOTE_DIR%/README.md
echo [OK] Arquivos enviados!
echo.

echo [4/7] Instalando Python 3 e dependencias...
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "apt-get update && apt-get install -y python3 python3-pip python3-venv"
echo [OK] Python 3 instalado!
echo.

echo [5/7] Criando ambiente virtual Python...
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && python3 -m venv venv"
echo [OK] Venv criado!
echo.

echo [6/7] Instalando dependencias Python...
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && source venv/bin/activate && pip install -r requirements.txt"
echo [OK] Dependencias instaladas!
echo.

echo [7/7] Criando servico systemd...
REM Criar arquivo de serviço systemd
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "cat > /etc/systemd/system/neuroone-eeg.service << 'EOF'
[Unit]
Description=NeuroOne EEG Bridge Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=%REMOTE_DIR%
Environment=""PATH=%REMOTE_DIR%/venv/bin""
ExecStart=%REMOTE_DIR%/venv/bin/python3 %REMOTE_DIR%/eeg_bridge.py --port /dev/ttyUSB0 --backend wss://seu-backend.onrender.com --student-id STUDENT_ID_AQUI --session-id SESSION_ID_AQUI
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
"
echo [OK] Servico criado!
echo.

echo Configurando servico para iniciar automaticamente...
echo y | plink -batch -pw "%SSH_PASS%" %SSH_USER%@%SSH_HOST% "systemctl daemon-reload && systemctl enable neuroone-eeg.service"
echo.

echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo.
echo 1. Editar parametros do servico:
echo    ssh root@72.61.54.52
echo    nano /etc/systemd/system/neuroone-eeg.service
echo.
echo    Atualizar:
echo    - --backend wss://SEU_BACKEND_URL
echo    - --student-id UUID_DO_ALUNO
echo    - --session-id UUID_DA_SESSAO
echo    - --port /dev/ttyUSB0 (ou porta correta do headset)
echo.
echo 2. Iniciar o servico:
echo    systemctl start neuroone-eeg
echo.
echo 3. Verificar status:
echo    systemctl status neuroone-eeg
echo.
echo 4. Ver logs:
echo    journalctl -u neuroone-eeg -f
echo.
echo ========================================
pause
