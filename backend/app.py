from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pymysql
import os
import json
import logging
from datetime import datetime
import uuid
import traceback

# Optional imports for additional database support
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    psycopg2 = None

try:
    import pymongo
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    pymongo = None

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    pyodbc = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class DatabaseConnection:
    def __init__(self, connection_id, connection_info, connection_obj, db_type):
        self.connection_id = connection_id
        self.connection_info = connection_info
        self.connection_obj = connection_obj
        self.db_type = db_type
        self.created_at = datetime.now()
        self.last_used = datetime.now()
        self.is_active = True

class DatabaseManager:
    def __init__(self):
        self.connections = {}
    
    def _get_connection_id(self):
        return str(uuid.uuid4())
    
    def connect_sqlite(self, database_path):
        try:
            if not os.path.exists(database_path):
                return {"success": False, "error": f"Database file not found: {database_path}"}
            
            conn = sqlite3.connect(database_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            
            cursor = conn.cursor()
            cursor.execute("SELECT sqlite_version()")
            version = cursor.fetchone()[0]
            cursor.close()
            
            return {
                "success": True, 
                "connection": conn, 
                "type": "sqlite",
                "version": version,
                "database": os.path.basename(database_path),
                "path": database_path
            }
        except Exception as e:
            logger.error(f"SQLite connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def connect_mysql(self, host, port, username, password, database):
        try:
            conn = pymysql.connect(
                host=host, port=port, user=username, password=password,
                database=database, charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor, autocommit=False
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()['VERSION()']
            cursor.close()
            
            return {
                "success": True, "connection": conn, "type": "mysql",
                "version": version, "host": host, "port": port, "database": database
            }
        except Exception as e:
            logger.error(f"MySQL connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def connect_postgresql(self, host, port, username, password, database):
        if not PSYCOPG2_AVAILABLE:
            return {"success": False, "error": "PostgreSQL support not available. Please install psycopg2-binary: pip install psycopg2-binary"}
        
        try:
            conn = psycopg2.connect(
                host=host, port=port, user=username, password=password, database=database
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            cursor.close()
            
            return {
                "success": True, "connection": conn, "type": "postgresql",
                "version": version, "host": host, "port": port, "database": database
            }
        except Exception as e:
            logger.error(f"PostgreSQL connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def connect_mssql(self, host, port, username, password, database):
        if not PYODBC_AVAILABLE:
            return {"success": False, "error": "MSSQL support not available. Please install pyodbc: pip install pyodbc"}
        
        try:
            conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={host},{port};DATABASE={database};UID={username};PWD={password}"
            conn = pyodbc.connect(conn_str)
            
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]
            cursor.close()
            
            return {
                "success": True, "connection": conn, "type": "mssql",
                "version": version, "host": host, "port": port, "database": database
            }
        except Exception as e:
            logger.error(f"MSSQL connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def test_connection(self, profile):
        try:
            db_type = profile['type'].lower()
            
            if db_type == 'sqlite':
                result = self.connect_sqlite(profile['database'])
            elif db_type == 'mysql':
                port = profile.get('port', 3306)
                result = self.connect_mysql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            elif db_type == 'postgresql':
                port = profile.get('port', 5432)
                result = self.connect_postgresql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            elif db_type == 'mssql':
                port = profile.get('port', 1433)
                result = self.connect_mssql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
            
            if result['success']:
                # Return clean data without the connection object
                return {
                    "success": True,
                    "type": result['type'],
                    "version": result.get('version', ''),
                    "database": result.get('database', ''),
                    "host": result.get('host', ''),
                    "port": result.get('port', ''),
                    "path": result.get('path', '')
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Connection test error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def create_connection(self, profile):
        try:
            # First test the connection to get the actual connection object
            db_type = profile['type'].lower()
            
            if db_type == 'sqlite':
                result = self.connect_sqlite(profile['database'])
            elif db_type == 'mysql':
                port = profile.get('port', 3306)
                result = self.connect_mysql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            elif db_type == 'postgresql':
                port = profile.get('port', 5432)
                result = self.connect_postgresql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            elif db_type == 'mssql':
                port = profile.get('port', 1433)
                result = self.connect_mssql(profile['host'], port, profile['username'], profile['password'], profile['database'])
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
            
            if not result['success']:
                return result
            
            connection_id = self._get_connection_id()
            
            # Create a clean connection info without the actual connection object
            connection_info = {
                'name': profile['name'],
                'type': profile['type'],
                'color': profile.get('color', '#007bff'),
                'version': result.get('version', ''),
                'database': result.get('database', ''),
                'host': result.get('host', ''),
                'port': result.get('port', ''),
                'path': result.get('path', '')
            }
            
            db_connection = DatabaseConnection(
                connection_id=connection_id,
                connection_info=connection_info,
                connection_obj=result['connection'],
                db_type=profile['type']
            )
            
            self.connections[connection_id] = db_connection
            
            return {
                "success": True,
                "connection_id": connection_id,
                "connection_info": connection_info
            }
            
        except Exception as e:
            logger.error(f"Create connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def execute_query(self, connection_id, query, query_type="auto"):
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if query_type == "auto":
                query_type = self._detect_query_type(query)
            
            db_conn.last_used = datetime.now()
            start_time = datetime.now()
            
            if db_type == 'sqlite':
                result = self._execute_sqlite_query(conn, query, query_type)
            elif db_type == 'mysql':
                result = self._execute_mysql_query(conn, query, query_type)
            elif db_type == 'postgresql':
                result = self._execute_postgresql_query(conn, query, query_type)
            elif db_type == 'mssql':
                result = self._execute_mssql_query(conn, query, query_type)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if result['success']:
                result['execution_time'] = execution_time
                result['query_type'] = query_type
            
            return result
            
        except Exception as e:
            logger.error(f"Query execution error: {str(e)}")
            return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
    
    def _detect_query_type(self, query):
        query_upper = query.strip().upper()
        
        if query_upper.startswith('SELECT'):
            return 'select'
        elif query_upper.startswith('INSERT'):
            return 'insert'
        elif query_upper.startswith('UPDATE'):
            return 'update'
        elif query_upper.startswith('DELETE'):
            return 'delete'
        elif any(query_upper.startswith(x) for x in ['CREATE', 'ALTER', 'DROP', 'TRUNCATE']):
            return 'ddl'
        else:
            return 'other'
    
    def _execute_sqlite_query(self, conn, query, query_type):
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            if query_type == 'select':
                columns = [description[0] for description in cursor.description]
                rows = cursor.fetchall()
                result = [dict(zip(columns, row)) for row in rows]
                return {"success": True, "data": result, "columns": columns, "row_count": len(result)}
            else:
                conn.commit()
                return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def _execute_mysql_query(self, conn, query, query_type):
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            if query_type == 'select':
                result = cursor.fetchall()
                columns = list(result[0].keys()) if result else []
                return {"success": True, "data": result, "columns": columns, "row_count": len(result)}
            else:
                conn.commit()
                return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def _execute_postgresql_query(self, conn, query, query_type):
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            if query_type == 'select':
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                result = [dict(zip(columns, row)) for row in rows]
                return {"success": True, "data": result, "columns": columns, "row_count": len(result)}
            else:
                conn.commit()
                return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def _execute_mssql_query(self, conn, query, query_type):
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            if query_type == 'select':
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchall()
                result = [dict(zip(columns, row)) for row in rows]
                return {"success": True, "data": result, "columns": columns, "row_count": len(result)}
            else:
                conn.commit()
                return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def get_database_info(self, connection_id):
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._get_sqlite_info(conn)
            elif db_type == 'mysql':
                return self._get_mysql_info(conn)
            elif db_type == 'postgresql':
                return self._get_postgresql_info(conn)
            elif db_type == 'mssql':
                return self._get_mssql_info(conn)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
            
        except Exception as e:
            logger.error(f"Database info error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _get_sqlite_info(self, conn):
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            # Get database name safely
            try:
                cursor = conn.cursor()
                cursor.execute("PRAGMA database_list")
                db_list = cursor.fetchall()
                if db_list and len(db_list) > 0 and len(db_list[0]) > 2:
                    database_name = os.path.basename(db_list[0][2])
                else:
                    database_name = "unknown"
                cursor.close()
            except:
                database_name = "unknown"
            
            return {
                "success": True,
                "type": "sqlite",
                "tables": tables,
                "database": database_name
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_table_schema(self, connection_id, table_name):
        """Get detailed schema information for a specific table"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._get_sqlite_table_schema(conn, table_name)
            elif db_type == 'mysql':
                return self._get_mysql_table_schema(conn, table_name)
            elif db_type == 'postgresql':
                return self._get_postgresql_table_schema(conn, table_name)
            elif db_type == 'mssql':
                return self._get_mssql_table_schema(conn, table_name)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Get table schema error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _get_sqlite_table_schema(self, conn, table_name):
        """Get detailed SQLite table schema"""
        try:
            cursor = conn.cursor()
            
            # Get table info - SQLite doesn't support parameterized PRAGMA
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns_info = cursor.fetchall()
            
            # Get sample data (first 5 rows)
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            sample_data = cursor.fetchall()
            
            # Get column names for sample data
            column_names = [description[0] for description in cursor.description] if cursor.description else []
            
            # Format columns info
            columns = []
            for col in columns_info:
                columns.append({
                    'name': col[1],
                    'type': col[2],
                    'not_null': bool(col[3]),
                    'default_value': col[4],
                    'primary_key': bool(col[5])
                })
            
            # Format sample data
            sample_rows = []
            for row in sample_data:
                sample_rows.append(dict(zip(column_names, row)))
            
            cursor.close()
            
            return {
                "success": True,
                "table_name": table_name,
                "columns": columns,
                "sample_data": sample_rows,
                "row_count": len(sample_rows)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # SQLite CRUD Implementation
    def _insert_sqlite_record(self, conn, table_name, values):
        """Insert record into SQLite table"""
        try:
            cursor = conn.cursor()
            columns = list(values.keys())
            placeholders = ['?' for _ in columns]
            values_list = list(values.values())
            
            query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            cursor.execute(query, values_list)
            conn.commit()
            
            return {"success": True, "affected_rows": cursor.rowcount, "last_id": cursor.lastrowid}
        finally:
            cursor.close()
    
    def _update_sqlite_record(self, conn, table_name, values, where_conditions):
        """Update records in SQLite table"""
        try:
            cursor = conn.cursor()
            set_clause = ', '.join([f"{col} = ?" for col in values.keys()])
            where_clause = ' AND '.join([f"{col} = ?" for col in where_conditions.keys()])
            
            query = f"UPDATE {table_name} SET {set_clause} WHERE {where_clause}"
            values_list = list(values.values()) + list(where_conditions.values())
            
            cursor.execute(query, values_list)
            conn.commit()
            
            return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def _delete_sqlite_record(self, conn, table_name, where_conditions):
        """Delete records from SQLite table"""
        try:
            cursor = conn.cursor()
            where_clause = ' AND '.join([f"{col} = ?" for col in where_conditions.keys()])
            values_list = list(where_conditions.values())
            
            query = f"DELETE FROM {table_name} WHERE {where_clause}"
            cursor.execute(query, values_list)
            conn.commit()
            
            return {"success": True, "affected_rows": cursor.rowcount}
        finally:
            cursor.close()
    
    def _select_sqlite_records(self, conn, table_name, columns, where_conditions, limit, offset):
        """Select records from SQLite table"""
        try:
            cursor = conn.cursor()
            columns_str = ', '.join(columns) if columns != ['*'] else '*'
            where_clause = ''
            values_list = []
            
            if where_conditions:
                where_clause = ' AND '.join([f"{col} = ?" for col in where_conditions.keys()])
                values_list = list(where_conditions.values())
                where_clause = f"WHERE {where_clause}"
            
            query = f"SELECT {columns_str} FROM {table_name} {where_clause} LIMIT ? OFFSET ?"
            values_list.extend([limit, offset])
            
            cursor.execute(query, values_list)
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            result = [dict(zip(columns, row)) for row in rows]
            
            return {"success": True, "data": result, "columns": columns, "row_count": len(result)}
        finally:
            cursor.close()
    
    def _get_sqlite_table_data(self, conn, table_name, limit, offset):
        """Get SQLite table data with pagination"""
        try:
            cursor = conn.cursor()
            query = f"SELECT * FROM {table_name} LIMIT ? OFFSET ?"
            cursor.execute(query, [limit, offset])
            
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            result = [dict(zip(columns, row)) for row in rows]
            
            # Get total count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_count = cursor.fetchone()[0]
            
            return {
                "success": True, 
                "data": result, 
                "columns": columns, 
                "row_count": len(result),
                "total_count": total_count,
                "limit": limit,
                "offset": offset
            }
        finally:
            cursor.close()
    
    def _get_mysql_info(self, conn):
        try:
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES")
            tables = [list(row.values())[0] for row in cursor.fetchall()]
            cursor.close()
            
            # Get database name safely
            try:
                if hasattr(conn, 'db') and conn.db:
                    if hasattr(conn.db, 'decode'):
                        database_name = conn.db.decode()
                    else:
                        database_name = str(conn.db)
                else:
                    database_name = "unknown"
            except:
                database_name = "unknown"
            
            return {
                "success": True,
                "type": "mysql",
                "tables": tables,
                "database": database_name
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_mysql_table_schema(self, conn, table_name):
        """Get detailed MySQL table schema"""
        try:
            cursor = conn.cursor()
            
            # Get table structure
            cursor.execute(f"DESCRIBE {table_name}")
            columns_info = cursor.fetchall()
            
            # Get sample data (first 5 rows)
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            sample_data = cursor.fetchall()
            
            # Format columns info
            columns = []
            for col in columns_info:
                columns.append({
                    'name': col['Field'],
                    'type': col['Type'],
                    'not_null': col['Null'] == 'NO',
                    'default_value': col['Default'],
                    'primary_key': col['Key'] == 'PRI'
                })
            
            cursor.close()
            
            return {
                "success": True,
                "table_name": table_name,
                "columns": columns,
                "sample_data": sample_data,
                "row_count": len(sample_data)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_postgresql_info(self, conn):
        if not PSYCOPG2_AVAILABLE:
            return {"success": False, "error": "PostgreSQL support not available. Please install psycopg2-binary: pip install psycopg2-binary"}
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            # Get database name safely
            try:
                database_name = conn.info.dbname
            except:
                database_name = "unknown"
            
            return {
                "success": True,
                "type": "postgresql",
                "tables": tables,
                "database": database_name
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_mssql_info(self, conn):
        if not PYODBC_AVAILABLE:
            return {"success": False, "error": "MSSQL support not available. Please install pyodbc: pip install pyodbc"}
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            
            # Get database name safely
            try:
                database_name = conn.getinfo(pyodbc.SQL_DATABASE_NAME)
            except:
                database_name = "unknown"
            
            return {
                "success": True,
                "type": "mssql",
                "tables": tables,
                "database": database_name
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def close_connection(self, connection_id):
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            
            if hasattr(db_conn.connection_obj, 'close'):
                db_conn.connection_obj.close()
            
            db_conn.is_active = False
            del self.connections[connection_id]
            
            return {"success": True, "message": "Connection closed successfully"}
            
        except Exception as e:
            logger.error(f"Close connection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # CRUD Operations
    def insert_record(self, connection_id, table_name, values):
        """Insert a new record into a table"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._insert_sqlite_record(conn, table_name, values)
            elif db_type == 'mysql':
                return self._insert_mysql_record(conn, table_name, values)
            elif db_type == 'postgresql':
                return self._insert_postgresql_record(conn, table_name, values)
            elif db_type == 'mssql':
                return self._insert_mssql_record(conn, table_name, values)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Insert record error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def update_record(self, connection_id, table_name, values, where_conditions):
        """Update records in a table"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._update_sqlite_record(conn, table_name, values, where_conditions)
            elif db_type == 'mysql':
                return self._update_mysql_record(conn, table_name, values, where_conditions)
            elif db_type == 'postgresql':
                return self._update_postgresql_record(conn, table_name, values, where_conditions)
            elif db_type == 'mssql':
                return self._update_mssql_record(conn, table_name, values, where_conditions)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Update record error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def delete_record(self, connection_id, table_name, where_conditions):
        """Delete records from a table"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._delete_sqlite_record(conn, table_name, where_conditions)
            elif db_type == 'mysql':
                return self._delete_mysql_record(conn, table_name, where_conditions)
            elif db_type == 'postgresql':
                return self._delete_postgresql_record(conn, table_name, where_conditions)
            elif db_type == 'mssql':
                return self._delete_mssql_record(conn, table_name, where_conditions)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Delete record error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def select_records(self, connection_id, table_name, columns, where_conditions, limit, offset):
        """Select records from a table"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._select_sqlite_records(conn, table_name, columns, where_conditions, limit, offset)
            elif db_type == 'mysql':
                return self._select_mysql_records(conn, table_name, columns, where_conditions, limit, offset)
            elif db_type == 'postgresql':
                return self._select_postgresql_records(conn, table_name, columns, where_conditions, limit, offset)
            elif db_type == 'mssql':
                return self._select_mssql_records(conn, table_name, columns, where_conditions, limit, offset)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Select records error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_table_data(self, connection_id, table_name, limit, offset):
        """Get table data with pagination"""
        try:
            if connection_id not in self.connections:
                return {"success": False, "error": "Connection not found"}
            
            db_conn = self.connections[connection_id]
            conn = db_conn.connection_obj
            db_type = db_conn.db_type
            
            if db_type == 'sqlite':
                return self._get_sqlite_table_data(conn, table_name, limit, offset)
            elif db_type == 'mysql':
                return self._get_mysql_table_data(conn, table_name, limit, offset)
            elif db_type == 'postgresql':
                return self._get_postgresql_table_data(conn, table_name, limit, offset)
            elif db_type == 'mssql':
                return self._get_mssql_table_data(conn, table_name, limit, offset)
            else:
                return {"success": False, "error": f"Unsupported database type: {db_type}"}
                
        except Exception as e:
            logger.error(f"Get table data error: {str(e)}")
            return {"success": False, "error": str(e)}

# Global database manager instance
db_manager = DatabaseManager()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(db_manager.connections),
        "version": "1.0.0"
    })

@app.route('/api/test-connection', methods=['POST'])
def test_connection():
    try:
        profile = request.json
        logger.info(f"Testing connection for profile: {profile.get('name', 'Unknown')}")
        
        result = db_manager.test_connection(profile)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Test connection error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/create-connection', methods=['POST'])
def create_connection():
    try:
        profile = request.json
        logger.info(f"Creating connection for profile: {profile.get('name', 'Unknown')}")
        
        result = db_manager.create_connection(profile)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Create connection error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/execute-query', methods=['POST'])
def execute_query():
    try:
        data = request.json
        connection_id = data['connection_id']
        query = data['query']
        query_type = data.get('query_type', 'auto')
        
        logger.info(f"Executing query: {query[:100]}...")
        
        result = db_manager.execute_query(connection_id, query, query_type)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Execute query error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/database-info', methods=['GET'])
def get_database_info():
    try:
        connection_id = request.args.get('connection_id')
        if not connection_id:
            return jsonify({"success": False, "error": "Connection ID required"})
        
        result = db_manager.get_database_info(connection_id)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Database info error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/table-schema', methods=['GET'])
def get_table_schema():
    try:
        connection_id = request.args.get('connection_id')
        table_name = request.args.get('table_name')
        
        if not connection_id:
            return jsonify({"success": False, "error": "Connection ID required"})
        if not table_name:
            return jsonify({"success": False, "error": "Table name required"})
        
        result = db_manager.get_table_schema(connection_id, table_name)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Table schema error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/close-connection', methods=['POST'])
def close_connection():
    try:
        data = request.json
        connection_id = data['connection_id']
        
        result = db_manager.close_connection(connection_id)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Close connection error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# CRUD Operations
@app.route('/api/crud/insert', methods=['POST'])
def insert_record():
    try:
        data = request.json
        connection_id = data['connection_id']
        table_name = data['table_name']
        values = data['values']
        
        result = db_manager.insert_record(connection_id, table_name, values)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Insert record error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/crud/update', methods=['POST'])
def update_record():
    try:
        data = request.json
        connection_id = data['connection_id']
        table_name = data['table_name']
        values = data['values']
        where_conditions = data['where_conditions']
        
        result = db_manager.update_record(connection_id, table_name, values, where_conditions)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Update record error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/crud/delete', methods=['POST'])
def delete_record():
    try:
        data = request.json
        connection_id = data['connection_id']
        table_name = data['table_name']
        where_conditions = data['where_conditions']
        
        result = db_manager.delete_record(connection_id, table_name, where_conditions)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Delete record error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/crud/select', methods=['POST'])
def select_records():
    try:
        data = request.json
        connection_id = data['connection_id']
        table_name = data['table_name']
        columns = data.get('columns', ['*'])
        where_conditions = data.get('where_conditions', {})
        limit = data.get('limit', 100)
        offset = data.get('offset', 0)
        
        result = db_manager.select_records(connection_id, table_name, columns, where_conditions, limit, offset)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Select records error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/crud/table-data', methods=['GET'])
def get_table_data():
    try:
        connection_id = request.args.get('connection_id')
        table_name = request.args.get('table_name')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        if not connection_id:
            return jsonify({"success": False, "error": "Connection ID required"})
        if not table_name:
            return jsonify({"success": False, "error": "Table name required"})
        
        result = db_manager.get_table_data(connection_id, table_name, limit, offset)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Get table data error: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/')
def index():
    return jsonify({
        "message": "DATABASE ONLY Backend is running",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": [
            "/api/health",
            "/api/test-connection",
            "/api/create-connection",
            "/api/execute-query",
            "/api/database-info",
            "/api/close-connection"
        ]
    })

if __name__ == '__main__':
    logger.info("Starting DATABASE ONLY Backend...")
    logger.info("Backend will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
