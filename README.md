# DATABASE ONLY 🚀

A professional, free alternative to JetBrains DataGrip built with Electron and Python Flask. Connect to multiple database types, write and execute SQL queries, and manage your database connections with a beautiful, modern interface.

## ✨ Features

### 🗄️ **Multi-Database Support**
- **MySQL** - Full CRUD operations with connection pooling
- **PostgreSQL** - Advanced query support and schema exploration
- **SQLite** - File-based database with file browser integration
- **Microsoft SQL Server** - Enterprise database support
- **MongoDB** - NoSQL database support (basic)

### 🔌 **Connection Management**
- Save and manage multiple database connections
- Test connections before saving
- Connection profiles with custom colors
- Import/Export connection configurations
- Auto-reconnect functionality

### 📝 **Advanced SQL Editor**
- **Monaco Editor** integration (same as VS Code)
- SQL syntax highlighting and auto-completion
- Query formatting and validation
- Multiple query execution modes
- Query history with execution statistics

### 📊 **Results & Schema**
- Beautiful data table display
- Export results to CSV/JSON
- Schema tree with table exploration
- Click-to-insert table names
- Database object browser

### 🎨 **Modern UI/UX**
- Responsive design with dark/light themes
- Collapsible sidebar for connections
- Tabbed interface for different views
- Toast notifications and loading states
- Professional color scheme and icons

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd database-only
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the application**
   ```bash
   npm start
   ```

The app will automatically start the Python backend and launch the Electron frontend.

## 🏗️ Architecture

### **Frontend (Electron)**
- **Main Process**: Window management, backend integration
- **Renderer Process**: UI components and user interactions
- **Preload Script**: Secure API exposure to renderer
- **Monaco Editor**: Professional SQL editing experience

### **Backend (Flask)**
- **Database Manager**: Connection pooling and management
- **Query Executor**: SQL execution with result formatting
- **Schema Explorer**: Database metadata extraction
- **REST API**: HTTP endpoints for frontend communication

### **Database Drivers**
- **MySQL**: PyMySQL with connection pooling
- **PostgreSQL**: psycopg2 with async support
- **SQLite**: Built-in sqlite3 with row factory
- **MSSQL**: pyodbc with ODBC driver support

## 📱 Usage Guide

### **Creating a Connection**

1. Click **"New Connection"** button
2. Choose database type (MySQL, PostgreSQL, SQLite, MSSQL)
3. Fill in connection details:
   - **SQLite**: Select database file using file browser
   - **Server DBs**: Host, port, username, password, database name
4. Test connection to verify settings
5. Save connection with custom name and color

### **Executing Queries**

1. **Connect** to a database
2. **Write SQL** in the Monaco editor
3. **Click Run** or press `Ctrl+Enter`
4. **View results** in the Results tab
5. **Explore schema** in the Schema tab

### **Managing Connections**

- **Connect**: Click the plug icon on any connection
- **Edit**: Modify connection settings
- **Delete**: Remove unused connections
- **Import/Export**: Backup and restore connection profiles

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the backend directory:

```env
FLASK_ENV=development
FLASK_DEBUG=true
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

### **Database Connection Settings**

#### **MySQL**
```json
{
  "name": "My MySQL DB",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "password",
  "database": "mydb"
}
```

#### **PostgreSQL**
```json
{
  "name": "My PostgreSQL DB",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "password",
  "database": "mydb"
}
```

#### **SQLite**
```json
{
  "name": "My SQLite DB",
  "type": "sqlite",
  "database": "/path/to/database.db"
}
```

#### **Microsoft SQL Server**
```json
{
  "name": "My MSSQL DB",
  "type": "mssql",
  "host": "localhost",
  "port": 1433,
  "username": "sa",
  "password": "password",
  "database": "mydb"
}
```

## 🛠️ Development

### **Project Structure**
```
database-only/
├── main.js                 # Electron main process
├── preload.js             # Preload script for security
├── index.html             # Main application HTML
├── styles.css             # Application styles
├── renderer.js            # Frontend logic
├── backend/
│   ├── app.py            # Flask backend
│   └── requirements.txt  # Python dependencies
├── package.json           # Node.js dependencies
└── README.md             # This file
```

### **Running in Development Mode**

1. **Start backend separately**
   ```bash
   cd backend
   python app.py
   ```

2. **Start frontend with hot reload**
   ```bash
   npm run dev
   ```

### **Building for Production**

```bash
npm run build
```

This creates distributable packages for Windows, macOS, and Linux.

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
python -m pytest tests/
```

### **Frontend Tests**
```bash
npm test
```

### **Integration Tests**
```bash
npm run test:integration
```

## 🔒 Security Features

- **Context Isolation**: Prevents direct access to Node.js APIs
- **Preload Script**: Secure API exposure to renderer
- **Input Validation**: SQL injection prevention
- **Connection Encryption**: SSL/TLS support for databases
- **File System Access**: Restricted to user-selected files only

## 🌟 Advanced Features

### **Query Optimization**
- Query execution time tracking
- Result set size limits
- Connection pooling
- Query caching

### **Data Export**
- CSV export with custom delimiters
- JSON export with formatting options
- Excel export (planned)
- Database backup functionality

### **Schema Management**
- Table structure visualization
- Index and constraint information
- Stored procedure browser
- View definition explorer

### **Collaboration**
- Query sharing via links
- Connection profile sharing
- Team workspace support (planned)
- Version control for queries (planned)

## 🐛 Troubleshooting

### **Common Issues**

1. **Backend Connection Failed**
   - Ensure Python is installed and in PATH
   - Check if port 5001 is available
   - Verify all dependencies are installed

2. **Database Connection Issues**
   - Check network connectivity
   - Verify credentials and permissions
   - Ensure database server is running

3. **Monaco Editor Not Loading**
   - Check internet connection (CDN loading)
   - Verify Monaco Editor version compatibility
   - Check browser console for errors

### **Logs and Debugging**

- **Frontend**: Check DevTools console (Ctrl+Shift+I)
- **Backend**: Check terminal output
- **Electron**: Check main process console

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - Professional code editing
- **Electron** - Cross-platform desktop apps
- **Flask** - Lightweight Python web framework
- **Font Awesome** - Beautiful icons
- **Inter Font** - Modern typography

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ktsoaela/database_only/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ktsoaela/database_only/issues)
- **Wiki**: [Project Wiki](https://github.com/ktsoaela/database_only/wiki)

## 🚀 Roadmap

### **v1.1 (Next Release)**
- [ ] Query performance analysis
- [ ] Advanced result filtering
- [ ] Database migration tools
- [ ] Enhanced schema visualization

### **v1.2 (Future)**
- [ ] Team collaboration features
- [ ] Query version control
- [ ] Advanced export options
- [ ] Plugin system

### **v2.0 (Major Release)**
- [ ] Cloud database support
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile companion app

---

**Made with ❤️ by DATABASE ONLY**

*Your free alternative to expensive database management tools!*
