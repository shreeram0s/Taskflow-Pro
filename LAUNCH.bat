@echo off
title TaskFlow Launcher
color 0A

echo.
echo  ████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗
echo  ╚══███╔╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║
echo    ███╔╝ ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║
echo   ███╔╝  ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║
echo  ███████╗██║  ██║███████║██║  ██╗███████╗███████╗╚██████╔╝╚███╔███╔╝
echo  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝ 
echo.
echo                    🚀 Starting TaskFlow Application 🚀
echo.

:: Check if we're in the right directory
if not exist "backend\manage.py" (
    echo [ERROR] Please run this script from the TaskFlow project root directory
    echo [ERROR] Make sure you're in the folder containing 'backend' and 'frontend' folders
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] Frontend folder not found or package.json missing
    echo [ERROR] Make sure the frontend folder exists with package.json
    pause
    exit /b 1
)

echo [INFO] Project structure detected ✓
echo [INFO] Backend folder: backend\
echo [INFO] Frontend folder: frontend\
echo.

:: Run the main setup script
call start-app.bat
