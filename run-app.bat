@echo off
echo ========================================
echo    TaskFlow - Simplified Startup Script
echo ========================================
echo.

:: Set colors for better output
color 0A

:: ========================================
:: BACKEND SETUP
:: ========================================
echo [BACKEND] Setting up Django backend...
cd backend

:: Activate virtual environment
echo [BACKEND] Activating virtual environment...
call venv\Scripts\activate.bat

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