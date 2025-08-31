#!/usr/bin/env python3
"""
Test script for the new table schema endpoint
"""

import requests
import json

def test_table_schema():
    base_url = "http://localhost:5001"
    
    print("Testing Table Schema Endpoint...")
    print("=" * 50)
    
    # First create a connection
    print("1. Creating connection...")
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
                connection_id = data['connection_id']
                print(f"   ✅ Connection created: {connection_id}")
                
                # Test table schema for 'users' table
                print("\n2. Testing table schema for 'users' table...")
                try:
                    response = requests.get(
                        f"{base_url}/api/table-schema?connection_id={connection_id}&table_name=users"
                    )
                    
                    if response.status_code == 200:
                        schema_data = response.json()
                        if schema_data['success']:
                            print(f"   ✅ Table schema loaded successfully!")
                            print(f"      Table: {schema_data['table_name']}")
                            print(f"      Columns: {len(schema_data['columns'])}")
                            print(f"      Sample rows: {schema_data['row_count']}")
                            
                            print("\n   📋 Columns:")
                            for col in schema_data['columns']:
                                pk = " (PK)" if col['primary_key'] else ""
                                nn = " NOT NULL" if col['not_null'] else ""
                                default = f" DEFAULT {col['default_value']}" if col['default_value'] else ""
                                print(f"      - {col['name']}: {col['type']}{pk}{nn}{default}")
                            
                            if schema_data['sample_data']:
                                print(f"\n   📊 Sample Data (first row):")
                                first_row = schema_data['sample_data'][0]
                                for key, value in first_row.items():
                                    print(f"      {key}: {value}")
                        else:
                            print(f"   ❌ Table schema failed: {schema_data['error']}")
                    else:
                        print(f"   ❌ Table schema request failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Table schema test failed: {e}")
                
            else:
                print(f"   ❌ Connection creation failed: {data['error']}")
        else:
            print(f"   ❌ Connection creation failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Connection creation failed: {e}")
    
    print("\n" + "=" * 50)
    print("Table schema testing completed!")

if __name__ == "__main__":
    test_table_schema()
