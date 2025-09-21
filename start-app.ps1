# TaskFlow - Automated Setup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Green
Write-Host "    TaskFlow - Automated Setup Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[INFO] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[INFO] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 16+ and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ========================================
# BACKEND SETUP
# ========================================
Write-Host "[BACKEND] Setting up Django backend..." -ForegroundColor Yellow
Set-Location "backend"

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "[BACKEND] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Activate virtual environment
Write-Host "[BACKEND] Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install Python dependencies
Write-Host "[BACKEND] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Run migrations
Write-Host "[BACKEND] Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to run migrations" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create superuser if it doesn't exist
Write-Host "[BACKEND] Creating superuser (if not exists)..." -ForegroundColor Yellow
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@taskflow.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superuser already exists')"

# Start Django server in background
Write-Host "[BACKEND] Starting Django server on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; venv\Scripts\Activate.ps1; python manage.py runserver" -WindowStyle Normal

# Wait a moment for Django to start
Start-Sleep -Seconds 3

# ========================================
# FRONTEND SETUP
# ========================================
Write-Host ""
Write-Host "[FRONTEND] Setting up React frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[FRONTEND] Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install Node.js dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[FRONTEND] Node.js dependencies already installed" -ForegroundColor Green
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "[FRONTEND] Creating .env file..." -ForegroundColor Yellow
    "VITE_API_URL=http://localhost:8000/api" | Out-File -FilePath ".env" -Encoding UTF8
}

# Start React development server
Write-Host "[FRONTEND] Starting React development server on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# Wait a moment for React to start
Start-Sleep -Seconds 5

# ========================================
# OPEN BROWSERS
# ========================================
Write-Host ""
Write-Host "[BROWSER] Opening application in browser..." -ForegroundColor Cyan
Write-Host "[INFO] Backend API: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host "[INFO] Frontend App: http://localhost:3000/" -ForegroundColor Cyan
Write-Host "[INFO] Admin Panel: http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host ""
Write-Host "[LOGIN] Use these credentials:" -ForegroundColor Magenta
Write-Host "[LOGIN] Username: admin" -ForegroundColor Magenta
Write-Host "[LOGIN] Password: admin123" -ForegroundColor Magenta
Write-Host ""

# Open browsers
Start-Process "http://localhost:3000"
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000/admin/"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    TaskFlow is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Admin:    http://localhost:8000/admin/" -ForegroundColor Green
Write-Host ""
Write-Host "Login with: admin / admin123" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
