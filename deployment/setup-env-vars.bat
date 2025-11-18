@echo off
REM ========================================
REM Script de configuração de Environment Variables
REM NeuroOne Project - v2.5.0
REM ========================================

echo.
echo ================================================
echo    NEUROONE - Configuracao de Environment Variables
echo ================================================
echo.

REM Verificar se está na pasta raiz
if not exist "neuroone-frontend" (
    echo ERRO: Execute este script na pasta raiz do projeto!
    pause
    exit /b 1
)

echo [1/4] Criando arquivo .env.local no frontend...
echo.

REM Criar .env.local no frontend
(
echo # NeuroOne Frontend - Environment Variables
echo # Gerado em: %date% %time%
echo.
echo # Supabase
echo VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
echo VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
echo.
echo # Backend API
echo VITE_API_URL=https://SEU_BACKEND.onrender.com
echo VITE_WS_URL=wss://SEU_BACKEND.onrender.com
echo.
echo # Environment
echo VITE_ENV=production
) > neuroone-frontend\.env.local

echo ✅ Arquivo .env.local criado em neuroone-frontend/
echo.

echo [2/4] Criando arquivo .env no backend...
echo.

REM Criar .env no backend
(
echo # NeuroOne Backend - Environment Variables
echo # Gerado em: %date% %time%
echo.
echo # Supabase
echo SUPABASE_URL=https://SEU_PROJETO.supabase.co
echo SUPABASE_ANON_KEY=sua_anon_key_aqui
echo SUPABASE_SERVICE_KEY=sua_service_key_aqui
echo.
echo # Server
echo PORT=3001
echo NODE_ENV=production
echo.
echo # JWT Secret (gere um com: node -e "console.log(require('crypto').randomBytes(32).toString('hex')^)"^)
echo JWT_SECRET=sua_jwt_secret_aqui_32_caracteres
echo.
echo # CORS
echo WS_CORS_ORIGIN=https://neuroone.jogosadm.com.br
) > neuroone-backend\.env

echo ✅ Arquivo .env criado em neuroone-backend/
echo.

echo [3/4] Gerando JWT Secret...
echo.

cd neuroone-backend
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" > jwt-secret-temp.txt
echo ✅ JWT Secret gerado em neuroone-backend/jwt-secret-temp.txt
cd ..
echo.

echo [4/4] Instruções finais
echo.
echo ================================================
echo PROXIMOS PASSOS:
echo ================================================
echo.
echo 1. Abra neuroone-frontend\.env.local
echo    - Substitua SEU_PROJETO por seu projeto Supabase
echo    - Cole suas keys do Supabase
echo    - Substitua SEU_BACKEND pela URL do backend
echo.
echo 2. Abra neuroone-backend\.env
echo    - Substitua SEU_PROJETO por seu projeto Supabase
echo    - Cole suas keys do Supabase
echo    - Copie o JWT_SECRET de jwt-secret-temp.txt
echo.
echo 3. DELETE jwt-secret-temp.txt apos copiar!
echo.
echo 4. NO GIT: Certifique-se que .env e .env.local
echo    estao no .gitignore!
echo.
echo ================================================
echo.

pause
