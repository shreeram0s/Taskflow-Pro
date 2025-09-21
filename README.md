# TaskFlow - Project Management Application

A modern, full-stack project management application built with Django REST Framework and React. TaskFlow provides a Jira-like experience with Kanban boards, task management, team collaboration, and analytics.

## 🚀 Features

### Backend (Django + DRF)
- **JWT Authentication** with refresh tokens
- **User Management** with roles (Scrum Master, Employee)
- **Project Management** with team collaboration
- **Task Management** with status tracking and priorities
- **Comments & Attachments** for tasks
- **Activity Logging** for audit trails
- **Analytics & Reporting** with event tracking
- **Notifications** system
- **RESTful APIs** with comprehensive endpoints

### Frontend (React + TypeScript + Vite)
- **Modern UI** with TailwindCSS and Shadcn/UI components
- **Responsive Design** for all screen sizes
- **TypeScript** for type safety
- **Vite** for fast development and building
- **React Router** for navigation
- **Drag & Drop** Kanban boards (react-beautiful-dnd)
- **Charts & Analytics** with Recharts
- **Real-time Updates** with optimistic UI

## 🛠️ Tech Stack

### Backend
- **Python 3.11+**
- **Django 4.2.7**
- **Django REST Framework 3.14.0**
- **PostgreSQL** (production) / SQLite (development)
- **JWT Authentication** (djangorestframework-simplejwt)
- **CORS Headers** for cross-origin requests

### Frontend
- **React 18**
- **TypeScript**
- **Vite 4.5.0**
- **TailwindCSS 3.3.5**
- **Shadcn/UI** (Radix UI primitives)
- **React Router 6.18.0**
- **Axios 1.6.0**
- **React Beautiful DnD 13.1.1**
- **Recharts 2.8.0**

## 📦 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 16+ (for frontend development)
- PostgreSQL 14+ (for production)

### Backend

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
# Create .env file
cp .env.example .env
```

5. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (Scrum Master):**
```bash
python manage.py createsuperuser
```

7. **Start development server:**
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:5000`

### Frontend

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## ✅ Local Verification Guide

1. Login as Scrum Master (superuser) at the frontend `http://localhost:3000`.
2. Create a project and tasks using the UI (project-scoped creation hits `POST /api/projects/{id}/tasks/`).
3. Assign/unassign tasks and change priority (Scrum Master only) using task detail controls.
4. Login as an Employee user and verify:
   - Sees assigned tasks only
   - Can update status via Kanban drag-and-drop, which uses `PATCH /api/tasks/{id}/` or `POST /api/tasks/{id}/change_status/`.
5. Analytics dashboard loads data from `GET /api/events/dashboard/` and `GET /api/events/task-analytics/`.
6. Notifications panel works:
   - Fetch: `GET /api/users/notifications/`
   - Mark one: `POST /api/users/mark_notification_read/`
   - Mark all: `POST /api/users/mark_all_read/`
7. Change password on the Profile page via `POST /api/users/change_password/` and re-login as needed.

## 🗄️ Database Models

### Core Models
- **User** - Extended user model with roles and profile information
- **Project** - Project management with status tracking
- **ProjectMember** - Team collaboration and permissions
- **Task** - Task management with priorities and status
- **TaskComment** - Comments on tasks
- **TaskAttachment** - File attachments for tasks
- **ActivityLog** - Audit trail for user actions
- **AnalyticsEvent** - Event tracking for analytics
- **Notification** - User notifications

### Key Features
- **Role-based Access Control** (Scrum Master, Employee)
- **Project Progress Tracking** with completion percentages
- **Task Status Workflow** (To Do → In Progress → Review → Done)
- **Priority Levels** (Low, Medium, High, Urgent)
- **Activity Logging** for all user actions
- **Analytics Events** for dashboard metrics

## 🔌 API Endpoints

### Authentication
- `POST /api/token/` - Login (get access token)
- `POST /api/token/refresh/` - Refresh access token
- `POST /api/users/register/` - User registration

### Projects
- `GET /api/projects/` - List user's projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `POST /api/projects/{id}/members/` - Add team member
- `DELETE /api/projects/{id}/members/{user_id}/` - Remove team member

### Tasks
- `GET /api/projects/{id}/tasks/` - List project tasks
- `POST /api/projects/{id}/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/tasks/{id}/comments/` - Add comment
- `POST /api/tasks/{id}/attachments/` - Upload attachment

### Analytics
- `GET /api/analytics/dashboard/` - Dashboard analytics
- `GET /api/analytics/user/` - User analytics
- `GET /api/analytics/project/{id}/` - Project analytics
- `POST /api/events/` - Log analytics event

## 🎨 Frontend Pages

### Authentication
- **Login** - User authentication
- **Register** - New user registration

### Main Application
- **Dashboard** - Overview with stats and recent activity
- **Projects** - Project list and management
- **Tasks** - Task list with filtering and status management
- **Analytics** - Charts and performance metrics
- **Profile** - User profile and settings

### Components
- **Navbar** - Navigation with user menu
- **Kanban Board** - Drag and drop task management
- **Task Detail Modal** - Task details and comments
- **Project Detail** - Project overview and team management

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set up PostgreSQL add-on
3. Configure environment variables:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `DATABASE_URL` (from PostgreSQL add-on)
   - `ALLOWED_HOSTS`
   - `CORS_ALLOWED_ORIGINS`

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_URL` (your backend URL)
3. Deploy

## 🔧 Development

### Backend Development
```bash
cd backend
python manage.py runserver 0.0.0.0:5000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Running Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

## 🎯 Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics with custom dashboards
- [ ] Mobile app with React Native
- [ ] Integration with external tools (Slack, GitHub)
- [ ] Advanced reporting and exports
- [ ] Time tracking and billing
- [ ] Custom workflows and automation

---

**TaskFlow** - Streamline your project management workflow with modern tools and intuitive design.