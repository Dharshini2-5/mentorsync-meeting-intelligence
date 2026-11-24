@echo off
setlocal EnableDelayedExpansion
title MentorSync AI - Smart Meeting Intelligence Launcher

echo ============================================================================
echo   MentorSync AI - Smart Meeting Intelligence System
echo   Django REST + Pure-Python NLP Engine (8003)  ^|  React + Vite UI (5173)
echo ============================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "VENV_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"
set "VENV_PIP=%BACKEND_DIR%\.venv\Scripts\pip.exe"

:: 1. Verify Python
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

:: 2. Verify Node & npm
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 3. Setup Backend Virtual Environment if missing
if not exist "%VENV_PYTHON%" (
    echo [1/5] Creating Python virtual environment in backend\.venv...
    python -m venv "%BACKEND_DIR%\.venv"
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment.
        pause
        exit /b 1
    )
    echo [1/5] Installing pure-Python backend requirements...
    "%VENV_PIP%" install -r "%BACKEND_DIR%\requirements.txt"
    if errorlevel 1 (
        echo [ERROR] Failed to install backend Python dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/5] Backend virtual environment found. Checking dependencies...
    "%VENV_PYTHON%" -c "import django, rest_framework, corsheaders, jwt" >nul 2>nul
    if errorlevel 1 (
        "%VENV_PIP%" install -r "%BACKEND_DIR%\requirements.txt"
    )
)

:: 4. Run Django Migrations & Idempotent Academic Seed
echo [2/5] Applying Django database migrations & seeding demo mentoring sessions...
pushd "%BACKEND_DIR%"
"%VENV_PYTHON%" manage.py migrate --noinput
if errorlevel 1 (
    popd
    echo [ERROR] Django migrate failed.
    pause
    exit /b 1
)
"%VENV_PYTHON%" manage.py seed_meetings
if errorlevel 1 (
    popd
    echo [ERROR] Django seed_meetings failed.
    pause
    exit /b 1
)
popd

:: 5. Install Frontend node_modules if missing
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [3/5] Installing React + Vite + Tailwind frontend packages...
    pushd "%FRONTEND_DIR%"
    call npm.cmd install
    if errorlevel 1 (
        popd
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
    popd
) else (
    echo [3/5] Frontend node_modules already installed.
)

:: 6. Launch Backend & Frontend in Titled Windows
echo [4/5] Starting Django Backend (http://127.0.0.1:8003) and Vite Frontend (http://localhost:5173)...
start "MentorSync AI - Django Backend (8003)" /D "%BACKEND_DIR%" cmd /k ".\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8003"
start "MentorSync AI - React Frontend (5173)" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev -- --port 5173"

:: 7. Wait for Servers to Respond
echo [5/5] Waiting for MentorSync AI services to become ready...
set /a TRIES=0
:wait_backend
set /a TRIES+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8003/api/health/' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
    if !TRIES! LSS 20 (
        timeout /t 1 /nobreak >nul
        goto wait_backend
    )
)

set /a FTRIES=0
:wait_frontend
set /a FTRIES+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
    if !FTRIES! LSS 20 (
        timeout /t 1 /nobreak >nul
        goto wait_frontend
    )
)

echo.
echo ============================================================================
echo   MentorSync AI is LIVE!
echo   Frontend Dashboard : http://localhost:5173
echo   Django REST API    : http://127.0.0.1:8003/api/health/
echo.
echo   Demo Credentials (also available as 1-Click Chips on the Sign-In Gate):
echo     Mentor      : mentor@mentorsync.edu      / Mentor@123
echo     Mentee      : dharshini@mentorsync.edu   / Mentee@123
echo     Coordinator : coordinator@mentorsync.edu / Coord@123
echo ============================================================================
echo.

start "" "http://localhost:5173"
endlocal
