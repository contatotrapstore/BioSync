@echo off
echo ============================================
echo   NeuroOne Educacional - Inicializacao Rapida
echo ============================================
echo.

echo [1/2] Iniciando Backend API...
start "NeuroOne Backend" cmd /k "cd neuroone-backend && npm run dev"
timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend PWA...
start "NeuroOne Frontend" cmd /k "cd neuroone-frontend && npm run dev"

echo.
echo ============================================
echo   Todos os servicos foram iniciados!
echo ============================================
echo.
echo Backend API:        http://localhost:3001
echo Frontend PWA:       http://localhost:5173
echo WebSocket:          ws://localhost:3001
echo.
echo Modulos:
echo   - Direcao (Admin)
echo   - Professor (Teacher Dashboard)
echo   - Aluno (Student PWA)
echo.
echo Para servidor Python EEG (opcional):
echo   cd neuroone-python-eeg
echo   python server_headless.py
echo.
echo Ver documentacao: docs/QUICK-START.md
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
