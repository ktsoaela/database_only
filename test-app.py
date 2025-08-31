#!/usr/bin/env python3
"""
Simple test script for DATABASE ONLY backend
"""

import requests
import time
import sys

def test_backend():
    """Test if the backend is running and responding"""
    base_url = "http://localhost:5001"
    
    print("Testing DATABASE ONLY Backend...")
    print("=" * 40)
    
    # Test 1: Health check
    try:
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed: {data['status']}")
            print(f"   📊 Active connections: {data['active_connections']}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Health check failed: {e}")
        return False
    
    # Test 2: Root endpoint
    try:
        print("2. Testing root endpoint...")
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Root endpoint working: {data['message']}")
        else:
            print(f"   ❌ Root endpoint failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Root endpoint failed: {e}")
    
    # Test 3: API endpoints
    try:
        print("3. Testing API endpoints...")
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ API endpoints accessible")
        else:
            print(f"   ❌ API endpoints failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ API endpoints failed: {e}")
    
    print("\n" + "=" * 40)
    print("✅ Backend is running and responding!")
    print(f"🌐 Backend URL: {base_url}")
    print("🚀 You can now start the Electron frontend with: npm start")
    
    return True

def wait_for_backend(max_wait=30):
    """Wait for backend to become available"""
    print(f"Waiting for backend to start (max {max_wait} seconds)...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait:
        try:
            response = requests.get("http://localhost:5001/api/health", timeout=2)
            if response.status_code == 200:
                return True
        except:
            pass
        
        print(".", end="", flush=True)
        time.sleep(1)
    
    print("\n❌ Backend did not start within the expected time")
    return False

if __name__ == "__main__":
    print("DATABASE ONLY - Backend Test")
    print("=" * 40)
    
    # Wait for backend to start
    if wait_for_backend():
        test_backend()
    else:
        print("\n❌ Backend test failed")
        print("Please ensure the Flask backend is running:")
        print("1. Check if Python is installed")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Start backend: python backend/app.py")
        sys.exit(1)
