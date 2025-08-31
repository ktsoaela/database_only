# 🚀 DATABASE ONLY - Quick Start Guide

Get up and running with DATABASE ONLY in minutes! This guide will help you install, configure, and start using your free alternative to JetBrains DataGrip.

## ⚡ Quick Start (Windows)

### Option 1: One-Click Start (Recommended)
1. **Double-click** `start.bat` or `start.ps1`
2. **Wait** for dependencies to install
3. **Enjoy** your DATABASE ONLY!

### Option 2: Manual Start
1. **Install dependencies**: `npm install`
2. **Start backend**: `python backend/app.py`
3. **Start frontend**: `npm start`

## 🎯 What You Get

✅ **Multi-Database Support**: MySQL, PostgreSQL, SQLite, MSSQL  
✅ **Professional SQL Editor**: Monaco Editor (same as VS Code)  
✅ **Connection Management**: Save and manage database profiles  
✅ **Schema Explorer**: Browse tables, views, and objects  
✅ **Query History**: Track and reuse your queries  
✅ **Modern UI**: Beautiful, responsive interface  

## 🗄️ Test with Demo Database

1. **Create demo data**: `python demo-setup.py`
2. **Open DATABASE ONLY**
3. **Create SQLite connection** to `demo_database.db`
4. **Run sample queries**:
   ```sql
   SELECT * FROM users;
   SELECT * FROM products WHERE category = 'Electronics';
   SELECT * FROM user_orders;
   ```

## 🔌 Sample Connections

### SQLite (Demo Database)
- **Type**: SQLite
- **Database**: `demo_database.db` (created by demo script)

### MySQL
- **Type**: MySQL
- **Host**: localhost
- **Port**: 3306
- **Username**: root
- **Password**: your_password
- **Database**: your_database

### PostgreSQL
- **Type**: PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: your_password
- **Database**: your_database

## 🎨 Key Features

### **Connection Management**
- Click **"New Connection"** to add databases
- **Test connections** before saving
- **Color-code** your connections
- **Import/Export** connection profiles

### **SQL Editor**
- **Syntax highlighting** for SQL
- **Auto-completion** and suggestions
- **Query formatting** with one click
- **Multiple query** execution modes

### **Results & Schema**
- **Beautiful data tables** with sorting
- **Schema tree** for database exploration
- **Click-to-insert** table names
- **Export results** to CSV/JSON

### **Query Management**
- **Query history** with execution stats
- **Save favorite queries** for reuse
- **Execution time** tracking
- **Error handling** with clear messages

## 🛠️ Troubleshooting

### **Backend Won't Start**
- Ensure Python 3.8+ is installed
- Check if port 5001 is available
- Install dependencies: `pip install -r requirements.txt`

### **Frontend Won't Start**
- Ensure Node.js 16+ is installed
- Install dependencies: `npm install`
- Check for port conflicts

### **Database Connection Issues**
- Verify database server is running
- Check credentials and permissions
- Ensure network connectivity
- Test connection before saving

### **Monaco Editor Issues**
- Check internet connection (CDN loading)
- Verify browser console for errors
- Try refreshing the application

## 📱 Usage Tips

### **Keyboard Shortcuts**
- **Ctrl+Enter**: Execute query
- **Ctrl+Shift+F**: Format query
- **Ctrl+L**: Clear editor
- **Tab**: Switch between tabs

### **Best Practices**
1. **Always test connections** before saving
2. **Use descriptive names** for connections
3. **Save important queries** in history
4. **Export results** for analysis
5. **Explore schema** before writing queries

### **Sample Queries to Try**
```sql
-- View all tables
SHOW TABLES;

-- Explore table structure
DESCRIBE users;

-- Basic SELECT with JOIN
SELECT u.username, o.total_amount, o.status
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';

-- Aggregation query
SELECT category, COUNT(*) as product_count, AVG(price) as avg_price
FROM products
GROUP BY category
ORDER BY avg_price DESC;
```

## 🔧 Advanced Configuration

### **Custom Themes**
- Edit `styles.css` for custom colors
- Modify Monaco Editor settings in `renderer.js`
- Add custom database icons

### **Database Drivers**
- **MySQL**: PyMySQL (included)
- **PostgreSQL**: psycopg2-binary (install separately)
- **MSSQL**: pyodbc (install separately)
- **MongoDB**: pymongo (install separately)

### **Performance Tuning**
- Adjust query timeout in settings
- Set result set limits
- Configure connection pooling
- Enable query caching

## 🆘 Need Help?

### **Check Logs**
- **Frontend**: DevTools console (Ctrl+Shift+I)
- **Backend**: Terminal output
- **Electron**: Main process console

### **Common Issues**
- **Port conflicts**: Change port in `backend/app.py`
- **Database drivers**: Install missing packages
- **File permissions**: Check file access rights
- **Network issues**: Verify firewall settings

### **Getting Support**
- Check the main README.md
- Review error messages carefully
- Test with demo database first
- Verify all dependencies are installed

## 🎉 You're Ready!

DATABASE ONLY is now ready to use! Start by:

1. **Creating your first connection**
2. **Exploring the interface**
3. **Running sample queries**
4. **Customizing your experience**

Enjoy your free, professional SQL editor! 🚀

---

*Built with ❤️ by DATABASE ONLY using Electron, Flask, and modern web technologies*
