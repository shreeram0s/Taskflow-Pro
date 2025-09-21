@echo off
echo ========================================
echo    TaskFlow - Automated Setup Script
echo ========================================
echo.

:: Set colors for better output
color 0A

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

echo [INFO] Python and Node.js are installed
echo.

:: ========================================
:: BACKEND SETUP
:: ========================================
echo [BACKEND] Setting up Django backend...
cd backend

:: Check if virtual environment exists
if not exist "venv" (
    echo [BACKEND] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo [BACKEND] Activating virtual environment...
call venv\Scripts\activate.bat

:: Install Python dependencies
echo [BACKEND] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

:: Run migrations
echo [BACKEND] Running database migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)

:: Create superuser if it doesn't exist
echo [BACKEND] Creating superuser (if not exists)...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@taskflow.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superuser already exists')"

:: Start Django server in background
echo [BACKEND] Starting Django server on http://localhost:8000...
start "Django Backend" cmd /k "cd /d %cd% && venv\Scripts\activate.bat && python manage.py runserver"

:: Wait a moment for Django to start
timeout /t 3 /nobreak >nul

:: ========================================
:: FRONTEND SETUP
:: ========================================
echo.
echo [FRONTEND] Setting up React frontend...
cd ..\frontend

:: Check if node_modules exists
if not exist "node_modules" (
    echo [FRONTEND] Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
) else (
    echo [FRONTEND] Node.js dependencies already installed
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo [FRONTEND] Creating .env file...
    echo VITE_API_URL=http://localhost:8000/api > .env
)

:: Start React development server
echo [FRONTEND] Starting React development server on http://localhost:3000...
start "React Frontend" cmd /k "cd /d %cd% && npm run dev"

:: Wait a moment for React to start
timeout /t 5 /nobreak >nul

:: ========================================
:: OPEN BROWSERS
:: ========================================
echo.
echo [BROWSER] Opening application in browser...
echo [INFO] Backend API: http://localhost:8000/api/
echo [INFO] Frontend App: http://localhost:3000/
echo [INFO] Admin Panel: http://localhost:8000/admin/
echo.
echo [LOGIN] Use these credentials:
echo [LOGIN] Username: admin
echo [LOGIN] Password: admin123
echo.

:: Open browsers
start http://localhost:3000
timeout /t 2 /nobreak >nul
start http://localhost:8000/admin/

echo.
echo ========================================
echo    TaskFlow is now running!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Admin:    http://localhost:8000/admin/
echo.
echo Login with: admin / admin123
echo.
echo Press any key to exit this window...
pause >nul
