#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskflow.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Project, Task, ProjectMember
from datetime import datetime, timedelta

User = get_user_model()

def create_sample_data():
    print("Creating sample data...")
    
    # Get or create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@taskflow.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'scrum_master'
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("Created admin user")
    else:
        print("Admin user already exists")

    # Get or create employee demo user
    employee_user, emp_created = User.objects.get_or_create(
        username='employee',
        defaults={
            'email': 'employee@taskflow.com',
            'first_name': 'Employee',
            'last_name': 'User',
            'role': 'employee'
        }
    )
    if emp_created:
        employee_user.set_password('employee123')
        employee_user.save()
        print("Created employee user")
    else:
        print("Employee user already exists")
    
    # Create sample project
    from datetime import date
    project, created = Project.objects.get_or_create(
        name='TaskFlow Pro Development',
        defaults={
            'description': 'Main development project for TaskFlow Pro application',
            'status': 'in-progress',
            'start_date': date.today() - timedelta(days=30),
            'end_date': date.today() + timedelta(days=30),
            'created_by': admin_user
        }
    )
    if created:
        print("Created sample project")
    else:
        print("Sample project already exists")
    
    # Add admin as project member
    ProjectMember.objects.get_or_create(
        project=project,
        user=admin_user,
        defaults={'role': 'owner'}
    )
    
    # Create sample tasks
    sample_tasks = [
        {
            'title': 'Setup project structure',
            'description': 'Initialize the basic project structure with Django backend and React frontend',
            'status': 'done',
            'priority': 'high',
            'due_date': datetime.now() - timedelta(days=5)
        },
        {
            'title': 'Implement user authentication',
            'description': 'Create login, register, and JWT token authentication system',
            'status': 'done',
            'priority': 'high',
            'due_date': datetime.now() - timedelta(days=3)
        },
        {
            'title': 'Create task management system',
            'description': 'Build Kanban board with drag-and-drop functionality for task management',
            'status': 'in-progress',
            'priority': 'high',
            'due_date': datetime.now() + timedelta(days=2)
        },
        {
            'title': 'Implement project management',
            'description': 'Create project creation, editing, and member management features',
            'status': 'in-progress',
            'priority': 'medium',
            'due_date': datetime.now() + timedelta(days=5)
        },
        {
            'title': 'Add analytics dashboard',
            'description': 'Create analytics dashboard with charts and metrics',
            'status': 'todo',
            'priority': 'medium',
            'due_date': datetime.now() + timedelta(days=7)
        },
        {
            'title': 'Implement notifications system',
            'description': 'Add real-time notifications for task updates and project changes',
            'status': 'todo',
            'priority': 'low',
            'due_date': datetime.now() + timedelta(days=10)
        },
        {
            'title': 'Add file attachments',
            'description': 'Allow users to attach files to tasks and projects',
            'status': 'review',
            'priority': 'medium',
            'due_date': datetime.now() + timedelta(days=1)
        }
    ]
    
    created_count = 0
    for task_data in sample_tasks:
        task, created = Task.objects.get_or_create(
            title=task_data['title'],
            project=project,
            defaults={
                'description': task_data['description'],
                'status': task_data['status'],
                'priority': task_data['priority'],
                'due_date': task_data['due_date'],
                'created_by': admin_user,
                'assignee': admin_user
            }
        )
        if created:
            created_count += 1
    
    print(f"Created {created_count} sample tasks")
    print("Sample data creation completed!")

if __name__ == '__main__':
    create_sample_data()
