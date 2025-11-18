@echo off
REM ====================================================
REM NEUROONE - INICIALIZADOR LOCAL DE DESENVOLVIMENTO
REM ====================================================
REM Este script inicia o backend e frontend simultaneamente
REM ====================================================

title NeuroOne - Development Server

echo.
echo ========================================
echo   NEUROONE - AMBIENTE DE DESENVOLVIMENTO
echo ========================================
echo.
echo Iniciando servidores...
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ de: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)

echo [OK] npm encontrado:
npm --version
echo.

REM Verificar se os diretórios existem
if not exist "neuroone-backend" (
    echo [ERRO] Diretorio neuroone-backend nao encontrado!
    pause
    exit /b 1
)

if not exist "neuroone-frontend" (
    echo [ERRO] Diretorio neuroone-frontend nao encontrado!
    pause
    exit /b 1
)

echo ========================================
echo   1. VERIFICANDO DEPENDENCIAS
echo ========================================
echo.

REM Backend - verificar node_modules
cd neuroone-backend
if not exist "node_modules" (
    echo [!] Instalando dependencias do backend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do backend!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencias do backend ja instaladas
)
cd ..

REM Frontend - verificar node_modules
cd neuroone-frontend
if not exist "node_modules" (
    echo [!] Instalando dependencias do frontend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do frontend!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencias do frontend ja instaladas
)
cd ..

echo.
echo ========================================
echo   2. VERIFICANDO ARQUIVOS .ENV
echo ========================================
echo.

REM Verificar .env do backend
if not exist "neuroone-backend\.env" (
    echo [!] Arquivo .env do backend nao encontrado!
    echo [!] Verifique se o arquivo existe em: neuroone-backend\.env
    pause
    exit /b 1
) else (
    echo [OK] Backend .env encontrado
)

REM Verificar .env do frontend
if not exist "neuroone-frontend\.env" (
    echo [!] Arquivo .env do frontend nao encontrado!
    echo [!] Verifique se o arquivo existe em: neuroone-frontend\.env
    pause
    exit /b 1
) else (
    echo [OK] Frontend .env encontrado
)

echo.
echo ========================================
echo   3. INICIANDO SERVIDORES
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Aguarde os servidores iniciarem...
echo Pressione Ctrl+C para parar ambos os servidores
echo.

REM Criar pastas temporárias para logs (opcional)
if not exist "logs" mkdir logs

REM Iniciar backend em uma nova janela
start "NeuroOne Backend" cmd /k "cd neuroone-backend && echo [BACKEND] Iniciando servidor... && npm run dev"

REM Aguardar 3 segundos para o backend iniciar
timeout /t 3 /nobreak >nul

REM Iniciar frontend em uma nova janela
start "NeuroOne Frontend" cmd /k "cd neuroone-frontend && echo [FRONTEND] Iniciando Vite... && npm run dev"

echo.
echo ========================================
echo   SERVIDORES INICIADOS!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Duas novas janelas foram abertas:
echo   1. NeuroOne Backend  (porta 3001)
echo   2. NeuroOne Frontend (porta 5173)
echo.
echo Para parar os servidores:
echo   - Feche as janelas abertas
echo   - Ou pressione Ctrl+C em cada uma
echo.
echo ========================================
echo   USUARIOS DE TESTE DISPONIVEIS
echo ========================================
echo.
echo ADMIN (Direcao):
echo   Email: admin@neuroone.com
echo   Senha: [definir no Supabase]
echo.
echo PROFESSOR:
echo   Email: professor@neuroone.com
echo   Senha: [definir no Supabase]
echo.
echo ALUNO:
echo   Email: aluno@neuroone.com
echo   Senha: [definir no Supabase]
echo.
echo ========================================

REM Manter a janela aberta
pause
