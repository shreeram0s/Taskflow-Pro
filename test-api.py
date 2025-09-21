#!/usr/bin/env python3
"""
Simple API test script to verify TaskFlow backend is working
"""
import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000/api"
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
}

def test_api():
    print("🧪 Testing TaskFlow API...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/token/", timeout=5)
        print(f"✅ Server is running (status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Server is not running: {e}")
        return False
    
    # Test 2: Register a test user
    try:
        response = requests.post(f"{BASE_URL}/users/register/", json=TEST_USER)
        if response.status_code in [200, 201]:
            print("✅ User registration endpoint working")
        else:
            print(f"⚠️ User registration returned status {response.status_code}")
    except Exception as e:
        print(f"❌ User registration failed: {e}")
    
    # Test 3: Login
    try:
        login_data = {
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
        response = requests.post(f"{BASE_URL}/token/", json=login_data)
        if response.status_code == 200:
            tokens = response.json()
            print("✅ Login endpoint working")
            access_token = tokens.get("access")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False
    
    # Test 4: Test authenticated endpoint
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/projects/", headers=headers)
        if response.status_code == 200:
            print("✅ Authenticated endpoints working")
        else:
            print(f"⚠️ Projects endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Authenticated request failed: {e}")
    
    # Test 5: Test analytics endpoint
    try:
        response = requests.get(f"{BASE_URL}/analytics/dashboard/", headers=headers)
        if response.status_code == 200:
            print("✅ Analytics endpoint working")
        else:
            print(f"⚠️ Analytics endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Analytics request failed: {e}")
    
    print("\n🎉 API tests completed!")
    return True

if __name__ == "__main__":
    test_api()
