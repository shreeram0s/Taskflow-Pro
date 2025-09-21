import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_register():
    url = f"{BASE_URL}/users/"
    data = {
        "username": "testuser123",
        "email": "testuser123@example.com",
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    print("\nTesting User Registration:")
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_login():
    url = f"{BASE_URL}/token/"
    data = {
        "username": "testuser123",
        "password": "TestPass123!"
    }
    
    print("\nTesting User Login:")
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            return response.json().get('access')
    except Exception as e:
        print(f"Error: {e}")
    return None

def test_authenticated_request(token):
    if not token:
        print("\nSkipping authenticated request test - no token available")
        return
        
    url = f"{BASE_URL}/users/me/"
    headers = {'Authorization': f'Bearer {token}'}
    
    print("\nTesting Authenticated Request:")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Authentication Endpoints...")
    test_register()
    token = test_login()
    test_authenticated_request(token)