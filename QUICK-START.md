# 🚀 TaskFlow - Quick Start Guide

## One-Click Setup

### Windows Users
1. **Double-click `LAUNCH.bat`** - This will automatically:
   - Detect frontend and backend folders
   - Install all dependencies
   - Set up virtual environment
   - Run both servers
   - Open the application in your browser

### Manual Setup (Alternative)

#### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Git (optional)

#### Step 1: Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Step 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Access URLs

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## 🔑 Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure

```
Taskflow pro/
├── backend/                 # Django backend
│   ├── venv/               # Virtual environment
│   ├── manage.py           # Django management
│   ├── requirements.txt    # Python dependencies
│   └── db.sqlite3          # SQLite database
├── frontend/               # React frontend
│   ├── src/                # Source code
│   ├── package.json        # Node.js dependencies
│   └── .env                # Environment variables
├── LAUNCH.bat              # One-click launcher
├── start-app.bat           # Automated setup script
└── start-app.ps1           # PowerShell setup script
```

## 🛠️ Troubleshooting

### Backend Issues
- **Port 8000 in use**: Change port with `python manage.py runserver 8001`
- **Dependencies missing**: Run `pip install -r requirements.txt`
- **Database errors**: Run `python manage.py migrate`

### Frontend Issues
- **Port 3000 in use**: Vite will automatically find the next available port
- **Dependencies missing**: Run `npm install`
- **Build errors**: Run `npm run build`

### General Issues
- **Python not found**: Install Python 3.8+ and add to PATH
- **Node.js not found**: Install Node.js 16+ and add to PATH
- **Permission errors**: Run as Administrator (Windows)

## 🔧 Development Commands

### Backend
```bash
cd backend
venv\Scripts\activate
python manage.py runserver          # Start server
python manage.py migrate            # Run migrations
python manage.py createsuperuser    # Create admin user
python manage.py shell              # Django shell
```

### Frontend
```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run linter
```

## 📝 Features

- ✅ User Authentication (JWT)
- ✅ Project Management
- ✅ Task Management with Kanban Board
- ✅ Real-time Notifications
- ✅ Analytics Dashboard
- ✅ User Profiles
- ✅ Responsive Design
- ✅ Dark/Light Theme Support

## 🆘 Support

If you encounter any issues:
1. Check the console output for error messages
2. Ensure all dependencies are installed
3. Verify Python and Node.js versions
4. Check if ports 3000 and 8000 are available

## 🎉 Success!

Once everything is running, you should see:
- Backend server running on http://localhost:8000
- Frontend application on http://localhost:3000
- Both browsers opening automatically
- Login page with admin/admin123 credentials
