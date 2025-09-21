import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskflow.settings')
django.setup()

from django.db import connection
from django.db.utils import OperationalError
from core.models import User

def test_database_connection():
    try:
        # Test the database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection successful!")
        
        # Test User model
        user_count = User.objects.count()
        print(f"✅ User table accessible. Total users: {user_count}")
        
        return True
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Other error occurred: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()