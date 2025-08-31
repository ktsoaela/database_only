#!/usr/bin/env python3
"""
Test script for DATABASE ONLY backend API
"""

import requests
import json

def test_api():
    base_url = "http://localhost:5001"
    
    print("Testing DATABASE ONLY Backend API...")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed: {data['status']}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
    
    # Test 2: Test SQLite connection
    print("\n2. Testing SQLite connection...")
    try:
        test_data = {
            "name": "Demo SQLite",
            "type": "sqlite",
            "database": "demo_database.db"
        }
        
        response = requests.post(
            f"{base_url}/api/test-connection",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"   ✅ SQLite connection test passed: {data['type']} v{data['version']}")
            else:
                print(f"   ❌ SQLite connection test failed: {data['error']}")
        else:
            print(f"   ❌ SQLite connection test failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ SQLite connection test failed: {e}")
    
    # Test 3: Create SQLite connection
    print("\n3. Testing create connection...")
    try:
        test_data = {
            "name": "Demo SQLite",
            "type": "sqlite",
            "database": "demo_database.db"
        }
        
        response = requests.post(
            f"{base_url}/api/create-connection",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"   ✅ Connection created: {data['connection_id']}")
                connection_id = data['connection_id']
                
                # Test 4: Get database info
                print("\n4. Testing database info...")
                try:
                    response = requests.get(
                        f"{base_url}/api/database-info?connection_id={connection_id}"
                    )
                    
                    if response.status_code == 200:
                        info_data = response.json()
                        if info_data['success']:
                            print(f"   ✅ Database info: {info_data['type']} with {len(info_data['tables'])} tables")
                            print(f"      Tables: {', '.join(info_data['tables'][:5])}{'...' if len(info_data['tables']) > 5 else ''}")
                        else:
                            print(f"   ❌ Database info failed: {info_data['error']}")
                    else:
                        print(f"   ❌ Database info failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Database info failed: {e}")
                
            else:
                print(f"   ❌ Connection creation failed: {data['error']}")
        else:
            print(f"   ❌ Connection creation failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Connection creation failed: {e}")
    
    print("\n" + "=" * 50)
    print("API testing completed!")

if __name__ == "__main__":
    test_api()
