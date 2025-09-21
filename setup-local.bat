@echo off
echo 🚀 Setting up TaskFlow for local development...

REM Backend setup
echo 📦 Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo SECRET_KEY=django-insecure-taskflow-pro-development-key-change-in-production
        echo DEBUG=True
        echo DATABASE_URL=sqlite:///db.sqlite3
        echo ALLOWED_HOSTS=localhost,127.0.0.1
        echo CORS_ALLOWED_ORIGINS=http://localhost:3000
    ) > .env
)

REM Run migrations
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

REM Create superuser if it doesn't exist
echo Creating superuser (if not exists)...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@taskflow.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superuser already exists')"

echo ✅ Backend setup complete!

REM Frontend setup
echo 📦 Setting up frontend...
cd ..\frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo VITE_API_URL=http://localhost:8000/api > .env
)

echo ✅ Frontend setup complete!

echo.
echo 🎉 Setup complete! To start the application:
echo.
echo Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python manage.py runserver
echo.
echo Frontend (in a new terminal):
echo   cd frontend
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo Login with: admin / admin123

pause
