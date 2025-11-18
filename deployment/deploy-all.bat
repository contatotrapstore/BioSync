@echo off
REM ========================================
REM Script de Deploy Completo
REM NeuroOne Project - v2.5.0
REM ========================================

echo.
echo ================================================
echo    NEUROONE - Deploy Completo (Frontend + Backend^)
echo ================================================
echo.

REM Verificar se está na pasta raiz
if not exist "neuroone-frontend" (
    echo ERRO: Execute este script na pasta raiz do projeto!
    pause
    exit /b 1
)

echo [1/6] Verificando dependencias...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado! Instale em https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado!
    pause
    exit /b 1
)
echo ✅ npm encontrado
echo.

echo [2/6] Instalando dependencias do frontend...
echo.
cd neuroone-frontend
call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias do frontend!
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependencias do frontend instaladas
cd ..
echo.

echo [3/6] Instalando dependencias do backend...
echo.
cd neuroone-backend
call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias do backend!
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependencias do backend instaladas
cd ..
echo.

echo [4/6] Building frontend...
echo.
cd neuroone-frontend
call npm run build
if errorlevel 1 (
    echo ERRO: Falha no build do frontend!
    cd ..
    pause
    exit /b 1
)
echo ✅ Frontend buildado com sucesso
cd ..
echo.

echo [5/6] Testando backend...
echo.
cd neuroone-backend
call npm test 2>nul
if errorlevel 1 (
    echo ⚠️  Testes do backend falharam ou nao existem
) else (
    echo ✅ Testes do backend passaram
)
cd ..
echo.

echo [6/6] Deploy Summary
echo.
echo ================================================
echo RESULTADO DO DEPLOY:
echo ================================================
echo.
echo ✅ Frontend: BUILD COMPLETO
echo    Arquivos em: neuroone-frontend/dist/
echo.
echo ✅ Backend: DEPENDENCIAS INSTALADAS
echo.
echo ================================================
echo PROXIMOS PASSOS MANUAIS:
echo ================================================
echo.
echo 1. FRONTEND (Vercel^):
echo    - Conecte repositorio ao Vercel
echo    - Configure Build Command: npm run build
echo    - Configure Output Directory: dist
echo    - Adicione Environment Variables do .env.local
echo.
echo 2. BACKEND (Railway/Render^):
echo    - Conecte repositorio ao Railway/Render
echo    - Configure Start Command: node index.js
echo    - Adicione Environment Variables do .env
echo.
echo 3. SUPABASE:
echo    - Execute as 5 migrations em SQL Editor
echo    - Copie as 3 keys (URL, ANON, SERVICE^)
echo.
echo ================================================
echo.

pause
