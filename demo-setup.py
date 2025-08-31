#!/usr/bin/env python3
"""
Demo database setup for DATABASE ONLY
Creates a sample SQLite database with test data
"""

import sqlite3
import os
import random
from datetime import datetime, timedelta

def create_demo_database():
    """Create a demo database with sample data"""
    
    # Create demo database
    db_path = "demo_database.db"
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
    
    print(f"Creating demo database: {db_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
    print("Creating tables...")
    
    # Users table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Products table
    cursor.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category VARCHAR(50),
            stock_quantity INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Order items table
    cursor.execute('''
        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')
    
    # Categories table
    cursor.execute('''
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES categories (id)
        )
    ''')
    
    print("✅ Tables created successfully")
    
    # Insert sample data
    print("Inserting sample data...")
    
    # Categories
    categories = [
        ('Electronics', 'Electronic devices and accessories'),
        ('Clothing', 'Apparel and fashion items'),
        ('Books', 'Books and publications'),
        ('Home & Garden', 'Home improvement and garden supplies'),
        ('Sports', 'Sports equipment and accessories')
    ]
    
    cursor.executemany('''
        INSERT INTO categories (name, description) VALUES (?, ?)
    ''', categories)
    
    # Users
    users = [
        ('john_doe', 'john@example.com', 'John', 'Doe'),
        ('jane_smith', 'jane@example.com', 'Jane', 'Smith'),
        ('bob_wilson', 'bob@example.com', 'Bob', 'Wilson'),
        ('alice_brown', 'alice@example.com', 'Alice', 'Brown'),
        ('charlie_davis', 'charlie@example.com', 'Charlie', 'Davis')
    ]
    
    cursor.executemany('''
        INSERT INTO users (username, email, first_name, last_name) VALUES (?, ?, ?, ?)
    ''', users)
    
    # Products
    products = [
        ('Laptop Computer', 'High-performance laptop with latest specs', 1299.99, 'Electronics', 25),
        ('Smartphone', 'Latest smartphone with advanced features', 799.99, 'Electronics', 50),
        ('T-Shirt', 'Comfortable cotton t-shirt', 24.99, 'Clothing', 100),
        ('Jeans', 'Classic blue jeans', 59.99, 'Clothing', 75),
        ('Programming Book', 'Learn Python programming', 39.99, 'Books', 30),
        ('Garden Tool Set', 'Complete set of garden tools', 89.99, 'Home & Garden', 20),
        ('Basketball', 'Official size basketball', 29.99, 'Sports', 40),
        ('Running Shoes', 'Professional running shoes', 129.99, 'Sports', 35)
    ]
    
    cursor.executemany('''
        INSERT INTO products (name, description, price, category, stock_quantity) VALUES (?, ?, ?, ?, ?)
    ''', products)
    
    # Orders
    orders = [
        (1, 1359.98, 'completed'),
        (2, 84.98, 'pending'),
        (3, 39.99, 'completed'),
        (4, 89.99, 'shipped'),
        (5, 159.98, 'pending')
    ]
    
    cursor.executemany('''
        INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)
    ''', orders)
    
    # Order items
    order_items = [
        (1, 1, 1, 1299.99),  # Laptop
        (1, 2, 1, 59.99),    # T-Shirt
        (2, 3, 1, 24.99),    # T-Shirt
        (2, 4, 1, 59.99),    # Jeans
        (3, 5, 1, 39.99),    # Book
        (4, 6, 1, 89.99),    # Garden tools
        (5, 7, 1, 29.99),    # Basketball
        (5, 8, 1, 129.99)    # Running shoes
    ]
    
    cursor.executemany('''
        INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)
    ''', order_items)
    
    print("✅ Sample data inserted successfully")
    
    # Create some views
    print("Creating views...")
    
    cursor.execute('''
        CREATE VIEW user_orders AS
        SELECT 
            u.username,
            u.first_name,
            u.last_name,
            o.id as order_id,
            o.order_date,
            o.total_amount,
            o.status
        FROM users u
        JOIN orders o ON u.id = o.user_id
        ORDER BY o.order_date DESC
    ''')
    
    cursor.execute('''
        CREATE VIEW product_sales AS
        SELECT 
            p.name,
            p.category,
            SUM(oi.quantity) as total_sold,
            SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        GROUP BY p.id, p.name, p.category
        ORDER BY total_revenue DESC
    ''')
    
    print("✅ Views created successfully")
    
    # Commit changes and close
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Demo database created successfully!")
    print(f"📁 Database file: {os.path.abspath(db_path)}")
    print(f"📊 Tables: users, products, orders, order_items, categories")
    print(f"👥 Sample users: 5")
    print(f"🛍️ Sample products: 8")
    print(f"📦 Sample orders: 5")
    print(f"👀 Views: user_orders, product_sales")
    
    print(f"\n💡 You can now:")
    print(f"   1. Open DATABASE ONLY")
    print(f"   2. Create a new SQLite connection")
    print(f"   3. Select this database file: {os.path.abspath(db_path)}")
    print(f"   4. Run sample queries like:")
    print(f"      - SELECT * FROM users;")
    print(f"      - SELECT * FROM products WHERE category = 'Electronics';")
    print(f"      - SELECT * FROM user_orders;")
    print(f"      - SELECT * FROM product_sales;")

if __name__ == "__main__":
    try:
        create_demo_database()
    except Exception as e:
        print(f"❌ Error creating demo database: {e}")
        import traceback
        traceback.print_exc()
