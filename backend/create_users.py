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
from core.models import User

def create_test_users():
    """Create predefined user accounts for testing"""
    
    # Define test users with different roles
    users = [
        {
            'username': 'admin',
            'email': 'admin@taskflow.com',
            'password': 'Admin123!',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True,
            'role': 'scrum_master',
            'email_verified': True
        },
        {
            'username': 'employee1',
            'email': 'employee1@taskflow.com',
            'password': 'Employee123!',
            'first_name': 'Employee',
            'last_name': 'One',
            'role': 'employee',
            'email_verified': True
        },
        {
            'username': 'scrummaster',
            'email': 'scrum@taskflow.com',
            'password': 'Scrum123!',
            'first_name': 'Scrum',
            'last_name': 'Master',
            'role': 'scrum_master',
            'email_verified': True
        }
    ]
    
    # Create users
    for user_data in users:
        username = user_data.pop('username')
        password = user_data.pop('password')
        
        # Check if user already exists
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(username=username, **user_data)
            user.set_password(password)
            user.save()
            print(f"Created user: {username}")
        else:
            user = User.objects.get(username=username)
            # Update password for existing user
            user.set_password(password)
            
            # Update other fields
            for key, value in user_data.items():
                setattr(user, key, value)
            
            user.save()
            print(f"Updated user: {username}")

if __name__ == "__main__":
    print("Creating test users...")
    create_test_users()
    print("Done!")