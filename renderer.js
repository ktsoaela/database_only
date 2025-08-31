// Global variables
let currentConnection = null;
let queryEditor = null;
let connections = [];
let queryHistory = [];

// DOM elements
const elements = {
    newConnectionBtn: document.getElementById('newConnectionBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    sidebar: document.getElementById('sidebar'),
    connectionsList: document.getElementById('connectionsList'),
    connectionStatus: document.getElementById('connectionStatus'),
    connectionInfo: document.getElementById('connectionInfo'),
    editorTabs: document.getElementById('editorTabs'),
    runQueryBtn: document.getElementById('runQueryBtn'),
    formatQueryBtn: document.getElementById('formatQueryBtn'),
    clearQueryBtn: document.getElementById('clearQueryBtn'),
    resultsTable: document.getElementById('resultsTable'),
    resultsCount: document.getElementById('resultsCount'),
    executionTime: document.getElementById('executionTime'),
    schemaTree: document.getElementById('schemaTree'),
    queryHistory: document.getElementById('queryHistory'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    loadConnections();
    initializeMonacoEditor();
    initCrudFunctionality();
});

async function initializeApp() {
    try {
        // Check if backend is running
        const response = await window.electronAPI.apiRequest('health');
        if (response.status === 'healthy') {
            console.log('Backend is running');
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        showNotification('Error', 'Cannot connect to backend. Please ensure the Python backend is running.');
    }
}

function setupEventListeners() {
    // Connection management
    elements.newConnectionBtn.addEventListener('click', showConnectionModal);
    elements.settingsBtn.addEventListener('click', showSettingsModal);
    elements.toggleSidebar.addEventListener('click', toggleSidebar);
    
    // Editor tabs
    elements.editorTabs.addEventListener('click', handleTabClick);
    
    // Query actions
    elements.runQueryBtn.addEventListener('click', executeQuery);
    elements.formatQueryBtn.addEventListener('click', formatQuery);
    elements.clearQueryBtn.addEventListener('click', clearQuery);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal);
        });
    });
    
    // Connection form
    const connectionForm = document.getElementById('connectionForm');
    if (connectionForm) {
        connectionForm.addEventListener('submit', handleConnectionSubmit);
    }
    
    // Database type change
    const databaseType = document.getElementById('databaseType');
    if (databaseType) {
        databaseType.addEventListener('change', handleDatabaseTypeChange);
    }
    
    // SQLite file browser
    const browseSqliteBtn = document.getElementById('browseSqliteBtn');
    if (browseSqliteBtn) {
        browseSqliteBtn.addEventListener('click', browseSqliteFile);
    }
    
    // Test connection
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', testConnection);
    }
}

async function loadConnections() {
    try {
        const savedConnections = await window.electronAPI.getStoreValue('connections') || [];
        connections = savedConnections;
        renderConnections();
    } catch (error) {
        console.error('Failed to load connections:', error);
    }
}

function renderConnections() {
    if (!elements.connectionsList) return;
    
    elements.connectionsList.innerHTML = '';
    
    if (connections.length === 0) {
        elements.connectionsList.innerHTML = `
            <div class="text-center p-20">
                <i class="fas fa-database" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #666;">No connections yet</p>
                <p style="color: #999; font-size: 12px;">Click "New Connection" to get started</p>
            </div>
        `;
        return;
    }
    
    connections.forEach(connection => {
        const connectionElement = createConnectionElement(connection);
        elements.connectionsList.appendChild(connectionElement);
    });
}

function createConnectionElement(connection) {
    const div = document.createElement('div');
    div.className = 'connection-item';
    div.dataset.connectionId = connection.id;
    
    const iconClass = getDatabaseIcon(connection.type);
    const statusClass = connection.isActive ? 'connected' : '';
    
    div.innerHTML = `
        <div class="connection-icon ${connection.type}">
            <i class="${iconClass}"></i>
        </div>
        <div class="connection-info">
            <div class="connection-name">${connection.name}</div>
            <div class="connection-details">${connection.type} • ${connection.database || connection.path || ''}</div>
        </div>
        <div class="connection-actions">
            <button class="btn-icon" onclick="connectToDatabase('${connection.id}')" title="Connect">
                <i class="fas fa-plug"></i>
            </button>
            <button class="btn-icon" onclick="editConnection('${connection.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="deleteConnection('${connection.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    if (currentConnection && currentConnection.id === connection.id) {
        div.classList.add('active');
    }
    
    return div;
}

function getDatabaseIcon(type) {
    const icons = {
        'mysql': 'fas fa-database',
        'postgresql': 'fas fa-database',
        'sqlite': 'fas fa-file-database',
        'mssql': 'fas fa-database'
    };
    return icons[type] || 'fas fa-database';
}

async function connectToDatabase(connectionId) {
    try {
        showLoading('Connecting to database...');
        
        const connection = connections.find(c => c.id === connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }
        
        // Create connection in backend
        const result = await window.electronAPI.apiRequest('create-connection', 'POST', connection);
        
        if (result.success) {
            currentConnection = {
                id: connectionId,
                connectionId: result.connection_id,
                ...connection
            };
            
            updateConnectionStatus(true, connection.name);
            updateConnectionInfo(connection);
            enableQueryEditor();
            loadDatabaseSchema();
            updateActiveConnection(connectionId);
            
            // Update CRUD table selector
            updateCrudTableSelector();
            
            showNotification('Success', `Connected to ${connection.name}`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Connection failed:', error);
        showNotification('Error', `Failed to connect: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function updateConnectionStatus(isConnected, connectionName = '') {
    const statusIndicator = elements.connectionStatus.querySelector('.status-indicator');
    const statusText = elements.connectionStatus.querySelector('.status-text');
    
    if (isConnected) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = `Connected to ${connectionName}`;
    } else {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Not Connected';
    }
}

function updateConnectionInfo(connection) {
    if (!elements.connectionInfo) return;
    
    elements.connectionInfo.innerHTML = `
        <span>${connection.type.toUpperCase()} • ${connection.database || connection.path || ''}</span>
    `;
}

function enableQueryEditor() {
    if (elements.runQueryBtn) {
        elements.runQueryBtn.disabled = false;
    }
}

function updateActiveConnection(connectionId) {
    // Remove active class from all connections
    document.querySelectorAll('.connection-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current connection
    const activeItem = document.querySelector(`[data-connection-id="${connectionId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

async function loadDatabaseSchema() {
    if (!currentConnection) return;
    
    try {
        const result = await window.electronAPI.apiRequest(
            `database-info?connection_id=${currentConnection.connectionId}`
        );
        
        if (result.success) {
            renderSchemaTree(result);
            // Update CRUD table selector with available tables
            if (currentConnection) {
                currentConnection.tables = result.tables;
                updateCrudTableSelector();
            }
        }
    } catch (error) {
        console.error('Failed to load schema:', error);
    }
}

function renderSchemaTree(schemaInfo) {
    if (!elements.schemaTree) return;
    
    let html = '<div class="schema-section">';
    html += `<h4><i class="fas fa-table"></i> Tables (${schemaInfo.tables.length})</h4>`;
    
    if (schemaInfo.tables.length > 0) {
        html += '<ul class="schema-list">';
        schemaInfo.tables.forEach(table => {
            html += `<li class="schema-item">
                <div class="schema-item-header" onclick="toggleTableSchema('${table}')">
                    <i class="fas fa-chevron-right"></i>
                    <i class="fas fa-table"></i> ${table}
                </div>
                <div class="schema-item-details" id="schema-${table}" style="display: none;">
                    <div class="loading-schema">Loading table structure...</div>
                </div>
            </li>`;
        });
        html += '</ul>';
    } else {
        html += '<p class="text-muted">No tables found</p>';
    }
    
    html += '</div>';
    elements.schemaTree.innerHTML = html;
}

async function toggleTableSchema(tableName) {
    const detailsDiv = document.getElementById(`schema-${tableName}`);
    const header = detailsDiv.previousElementSibling;
    const chevron = header.querySelector('.fas.fa-chevron-right');
    
    if (detailsDiv.style.display === 'none') {
        // Show schema
        detailsDiv.style.display = 'block';
        chevron.className = 'fas fa-chevron-down';
        
        // Load table schema if not already loaded
        if (detailsDiv.querySelector('.loading-schema')) {
            await loadTableSchema(tableName, detailsDiv);
        }
    } else {
        // Hide schema
        detailsDiv.style.display = 'none';
        chevron.className = 'fas fa-chevron-right';
    }
}

async function loadTableSchema(tableName, container) {
    if (!currentConnection) return;
    
    try {
        const result = await window.electronAPI.apiRequest(
            `table-schema?connection_id=${currentConnection.connectionId}&table_name=${tableName}`,
            'GET'
        );
        
        if (result.success) {
            renderTableSchema(result, container);
        } else {
            container.innerHTML = `<div class="error-message">Failed to load schema: ${result.error}</div>`;
        }
    } catch (error) {
        console.error('Failed to load table schema:', error);
        container.innerHTML = `<div class="error-message">Error loading schema: ${error.message}</div>`;
    }
}

function renderTableSchema(schemaInfo, container) {
    let html = '';
    
    // Columns section
    html += '<div class="schema-columns">';
    html += '<h5><i class="fas fa-columns"></i> Columns</h5>';
    html += '<div class="columns-table">';
    html += '<table>';
    html += '<thead><tr><th>Column</th><th>Type</th><th>Null</th><th>Default</th><th>Key</th></tr></thead>';
    html += '<tbody>';
    
    schemaInfo.columns.forEach(col => {
        const nullText = col.not_null ? 'NOT NULL' : 'NULL';
        const keyText = col.primary_key ? 'PRIMARY KEY' : '';
        const defaultText = col.default_value || '';
        
        html += `<tr>
            <td><strong>${col.name}</strong></td>
            <td><code>${col.type}</code></td>
            <td>${nullText}</td>
            <td>${defaultText}</td>
            <td>${keyText}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';
    
    // Sample data section
    if (schemaInfo.sample_data && schemaInfo.sample_data.length > 0) {
        html += '<div class="schema-sample-data">';
        html += '<h5><i class="fas fa-database"></i> Sample Data (First 5 rows)</h5>';
        html += '<div class="sample-data-table">';
        html += '<table>';
        
        // Headers
        const columns = Object.keys(schemaInfo.sample_data[0]);
        html += '<thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead>';
        
        // Data rows
        html += '<tbody>';
        schemaInfo.sample_data.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const value = row[col];
                html += `<td>${value !== null ? value : '<em>NULL</em>'}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
    }
    
    // Quick actions
    html += '<div class="schema-actions">';
    html += `<button onclick="insertTableName('${schemaInfo.table_name}')" class="btn btn-sm btn-primary">
        <i class="fas fa-plus"></i> Insert Table Name
    </button>`;
    html += `<button onclick="loadTableQuery('${schemaInfo.table_name}')" class="btn btn-sm btn-secondary">
        <i class="fas fa-eye"></i> View All Data
    </button>`;
    html += '</div>';
    
    container.innerHTML = html;
}

function loadTableQuery(tableName) {
    if (queryEditor) {
        queryEditor.setValue(`SELECT * FROM ${tableName} LIMIT 100;`);
        switchTab('query');
        queryEditor.focus();
    }
}

function insertTableName(tableName) {
    if (queryEditor) {
        const position = queryEditor.getPosition();
        queryEditor.executeEdits('', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: tableName
        }]);
        queryEditor.focus();
    }
}

async function executeQuery() {
    if (!currentConnection || !queryEditor) return;
    
    const query = queryEditor.getValue().trim();
    if (!query) {
        showNotification('Warning', 'Please enter a query to execute');
        return;
    }
    
    try {
        showLoading('Executing query...');
        
        const result = await window.electronAPI.apiRequest('execute-query', 'POST', {
            connection_id: currentConnection.connectionId,
            query: query,
            query_type: 'auto'
        });
        
        if (result.success) {
            displayResults(result);
            addToHistory(query, result);
            showNotification('Success', `Query executed successfully. ${result.row_count || result.affected_rows || 0} rows affected.`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Query execution failed:', error);
        showNotification('Error', `Query failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function displayResults(result) {
    if (result.data && Array.isArray(result.data)) {
        displayDataTable(result.data, result.columns);
        elements.resultsCount.textContent = `${result.row_count} rows`;
        elements.executionTime.textContent = `${Math.round(result.execution_time)}ms`;
        
        // Switch to results tab
        switchTab('results');
    } else {
        // Non-SELECT query
        elements.resultsTable.innerHTML = `
            <div class="text-center p-20">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #28a745; margin-bottom: 15px;"></i>
                <h3>Query executed successfully</h3>
                <p>${result.affected_rows || 0} rows affected</p>
            </div>
        `;
        switchTab('results');
    }
}

function displayDataTable(data, columns) {
    if (!elements.resultsTable) return;
    
    if (data.length === 0) {
        elements.resultsTable.innerHTML = '<div class="text-center p-20"><p>No results returned</p></div>';
        return;
    }
    
    let html = '<table class="data-table">';
    
    // Header
    html += '<thead><tr>';
    columns.forEach(column => {
        html += `<th>${column}</th>`;
    });
    html += '</tr></thead>';
    
    // Body
    html += '<tbody>';
    data.forEach(row => {
        html += '<tr>';
        columns.forEach(column => {
            const value = row[column];
            html += `<td>${value !== null && value !== undefined ? String(value) : '<em>NULL</em>'}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    elements.resultsTable.innerHTML = html;
}

function addToHistory(query, result) {
    const historyItem = {
        id: Date.now(),
        query: query,
        timestamp: new Date().toISOString(),
        success: result.success,
        rowCount: result.row_count || result.affected_rows || 0,
        executionTime: result.execution_time || 0
    };
    
    queryHistory.unshift(historyItem);
    if (queryHistory.length > 100) {
        queryHistory = queryHistory.slice(0, 100);
    }
    
    renderQueryHistory();
}

function renderQueryHistory() {
    if (!elements.queryHistory) return;
    
    let html = '';
    queryHistory.forEach(item => {
        const statusIcon = item.success ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
        html += `
            <div class="history-item" onclick="loadQueryFromHistory('${item.query}')">
                <div class="history-header">
                    <span class="history-status"><i class="${statusIcon}"></i></span>
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                    <span class="history-stats">${item.rowCount} rows • ${Math.round(item.executionTime)}ms</span>
                </div>
                <div class="history-query">${item.query}</div>
            </div>
        `;
    });
    
    elements.queryHistory.innerHTML = html || '<p class="text-muted">No query history</p>';
}

function loadQueryFromHistory(query) {
    if (queryEditor) {
        queryEditor.setValue(query);
        switchTab('query');
        queryEditor.focus();
    }
}

function formatQuery() {
    if (!queryEditor) return;
    
    const query = queryEditor.getValue();
    if (!query.trim()) return;
    
    // Simple formatting (you can integrate with sql-formatter package)
    let formatted = query
        .replace(/\s+/g, ' ')
        .replace(/\s*([,()])\s*/g, '$1 ')
        .replace(/\s*(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\s+/gi, '\n$1 ')
        .trim();
    
    queryEditor.setValue(formatted);
}

function clearQuery() {
    if (queryEditor) {
        queryEditor.setValue('');
        queryEditor.focus();
    }
}

function handleTabClick(event) {
    const tab = event.target.closest('.tab');
    if (!tab) return;
    
    const tabName = tab.dataset.tab;
    switchTab(tabName);
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
    
    const icon = elements.toggleSidebar.querySelector('i');
    if (elements.sidebar.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-right';
    } else {
        icon.className = 'fas fa-chevron-left';
    }
}

// Modal functions
function showConnectionModal() {
    const modal = document.getElementById('connectionModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('connectionName').focus();
    }
}

function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('show');
    }
}

function handleDatabaseTypeChange() {
    const databaseType = document.getElementById('databaseType').value;
    const serverFields = document.getElementById('serverFields');
    const sqliteFields = document.getElementById('sqliteFields');
    
    if (databaseType === 'sqlite') {
        serverFields.style.display = 'none';
        sqliteFields.style.display = 'block';
    } else {
        serverFields.style.display = 'block';
        sqliteFields.style.display = 'none';
    }
}

async function browseSqliteFile() {
    try {
        const filePath = await window.electronAPI.selectSqliteFile();
        if (filePath) {
            document.getElementById('sqlitePath').value = filePath;
        }
    } catch (error) {
        console.error('Failed to select file:', error);
    }
}

async function testConnection() {
    const formData = getConnectionFormData();
    if (!formData) return;
    
    try {
        showLoading('Testing connection...');
        
        const result = await window.electronAPI.apiRequest('test-connection', 'POST', formData);
        
        if (result.success) {
            showNotification('Success', 'Connection test successful!');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showNotification('Error', `Connection test failed: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handleConnectionSubmit(event) {
    event.preventDefault();
    
    const formData = getConnectionFormData();
    if (!formData) return;
    
    try {
        showLoading('Creating connection...');
        
        const result = await window.electronAPI.apiRequest('create-connection', 'POST', formData);
        
        if (result.success) {
            // Save connection to local storage
            const connection = {
                id: Date.now().toString(),
                ...formData,
                isActive: false
            };
            
            connections.push(connection);
            await window.electronAPI.setStoreValue('connections', connections);
            
            renderConnections();
            hideModal(document.getElementById('connectionModal'));
            showNotification('Success', 'Connection created successfully!');
            
            // Reset form
            event.target.reset();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Failed to create connection:', error);
        showNotification('Error', `Failed to create connection: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function getConnectionFormData() {
    const name = document.getElementById('connectionName').value.trim();
    const type = document.getElementById('databaseType').value;
    
    if (!name || !type) {
        showNotification('Error', 'Please fill in all required fields');
        return null;
    }
    
    const formData = {
        name: name,
        type: type,
        color: document.getElementById('connectionColor').value
    };
    
    if (type === 'sqlite') {
        const path = document.getElementById('sqlitePath').value.trim();
        if (!path) {
            showNotification('Error', 'Please select a SQLite database file');
            return null;
        }
        formData.database = path;
    } else {
        const host = document.getElementById('host').value.trim();
        const port = document.getElementById('port').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const database = document.getElementById('database').value.trim();
        
        if (!host || !username || !database) {
            showNotification('Error', 'Please fill in all required fields');
            return null;
        }
        
        formData.host = host;
        formData.port = parseInt(port) || (type === 'mysql' ? 3306 : type === 'postgresql' ? 5432 : 1433);
        formData.username = username;
        formData.password = password;
        formData.database = database;
    }
    
    return formData;
}

// Utility functions
function showLoading(message) {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.querySelector('.loading-text').textContent = message;
        elements.loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('show');
    }
}

function showNotification(title, message) {
    // Simple notification - you can enhance this with a proper notification system
    console.log(`${title}: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${title}</strong>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Monaco Editor initialization
async function initializeMonacoEditor() {
    try {
        // Load Monaco Editor
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        
        require(['vs/editor/editor.main'], function () {
            queryEditor = monaco.editor.create(document.getElementById('queryEditor'), {
                value: '-- Enter your SQL query here\nSELECT * FROM your_table LIMIT 10;',
                language: 'sql',
                theme: 'vs',
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                roundedSelection: false,
                selectOnLineNumbers: true,
                readOnly: false,
                cursorStyle: 'line',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                foldingHighlight: true,
                selectOnLineNumbers: true,
                minimap: {
                    enabled: false
                }
            });
            
            // Add some sample queries
            const sampleQueries = [
                '-- Sample queries to get you started\n',
                '-- View all tables\n',
                'SHOW TABLES;\n\n',
                '-- View table structure\n',
                'DESCRIBE your_table;\n\n',
                '-- Basic SELECT query\n',
                'SELECT * FROM your_table LIMIT 10;\n\n',
                '-- Count records\n',
                'SELECT COUNT(*) as total_records FROM your_table;'
            ];
            
            queryEditor.setValue(sampleQueries.join(''));
        });
    } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
        // Fallback to textarea
        const queryEditorDiv = document.getElementById('queryEditor');
        if (queryEditorDiv) {
            queryEditorDiv.innerHTML = `
                <textarea 
                    placeholder="Enter your SQL query here..." 
                    style="width: 100%; height: 100%; border: none; outline: none; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px; padding: 15px; resize: none;"
                >-- Enter your SQL query here
SELECT * FROM your_table LIMIT 10;</textarea>
            `;
        }
    }
}

// Missing functions
function editConnection(connectionId) {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
        showNotification('Error', 'Connection not found');
        return;
    }
    
    // Populate form with existing data
    document.getElementById('connectionName').value = connection.name;
    document.getElementById('databaseType').value = connection.type;
    document.getElementById('connectionColor').value = connection.color;
    
    // Show/hide appropriate fields
    handleDatabaseTypeChange();
    
    if (connection.type === 'sqlite') {
        document.getElementById('sqlitePath').value = connection.database || '';
    } else {
        document.getElementById('host').value = connection.host || '';
        document.getElementById('port').value = connection.port || '';
        document.getElementById('username').value = connection.username || '';
        document.getElementById('password').value = connection.password || '';
        document.getElementById('database').value = connection.database || '';
    }
    
    // Change modal title and button
    const modal = document.getElementById('connectionModal');
    const title = modal.querySelector('.modal-header h2');
    const submitBtn = modal.querySelector('button[type="submit"]');
    
    title.textContent = 'Edit Database Connection';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Connection';
    
    // Store connection ID for update
    modal.dataset.editConnectionId = connectionId;
    
    showConnectionModal();
}

function deleteConnection(connectionId) {
    if (confirm('Are you sure you want to delete this connection?')) {
        connections = connections.filter(c => c.id !== connectionId);
        window.electronAPI.setStoreValue('connections', connections);
        
        if (currentConnection && currentConnection.id === connectionId) {
            currentConnection = null;
            updateConnectionStatus(false);
            updateConnectionInfo({});
            disableQueryEditor();
        }
        
        renderConnections();
        showNotification('Success', 'Connection deleted successfully');
    }
}

function disableQueryEditor() {
    if (elements.runQueryBtn) {
        elements.runQueryBtn.disabled = true;
    }
}

// Export functions for global access
window.connectToDatabase = connectToDatabase;
window.editConnection = editConnection;
window.deleteConnection = deleteConnection;
window.insertTableName = insertTableName;
window.loadQueryFromHistory = loadQueryFromHistory;

// CRUD Functionality
function initCrudFunctionality() {
    // CRUD tab event listeners
    const crudTableSelect = document.getElementById('crudTableSelect');
    const refreshTableBtn = document.getElementById('refreshTableBtn');
    const addRecordBtn = document.getElementById('addRecordBtn');
    
    if (crudTableSelect) {
        crudTableSelect.addEventListener('change', handleCrudTableChange);
    }
    
    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', refreshCrudTable);
    }
    
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', showAddRecordModal);
    }
    
    // CRUD form submission
    const crudRecordForm = document.getElementById('crudRecordForm');
    if (crudRecordForm) {
        crudRecordForm.addEventListener('submit', handleCrudRecordSubmit);
    }
}

function handleCrudTableChange() {
    const tableSelect = document.getElementById('crudTableSelect');
    const selectedTable = tableSelect.value;
    
    if (selectedTable) {
        loadCrudTableData(selectedTable);
    } else {
        showCrudPlaceholder();
    }
}

async function loadCrudTableData(tableName) {
    if (!currentConnection) {
        showNotification('Error', 'Please connect to a database first');
        return;
    }
    
    try {
        showLoadingOverlay('Loading table data...');
        
        const response = await window.electronAPI.apiRequest('crud/table-data', {
            connection_id: currentConnection.id,
            table_name: tableName,
            limit: 100,
            offset: 0
        });
        
        hideLoadingOverlay();
        
        if (response.success) {
            renderCrudTable(response.data, response.columns, tableName);
        } else {
            showNotification('Error', response.error || 'Failed to load table data');
            showCrudPlaceholder();
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to load CRUD table data:', error);
        showNotification('Error', 'Failed to load table data');
        showCrudPlaceholder();
    }
}

function renderCrudTable(data, columns, tableName) {
    const container = document.getElementById('crudTableContainer');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="crud-placeholder">
                <i class="fas fa-inbox"></i>
                <h3>No data found</h3>
                <p>The table "${tableName}" is empty</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="crud-data-table">
            <thead>
                <tr>
                    ${columns.map(col => `<th>${col}</th>`).join('')}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach((row, index) => {
        html += '<tr>';
        columns.forEach(col => {
            const value = row[col] !== null ? row[col] : '<em>NULL</em>';
            html += `<td>${value}</td>`;
        });
        html += `
            <td class="crud-actions-cell">
                <button class="crud-action-btn crud-edit-btn" onclick="editCrudRecord('${tableName}', ${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="crud-action-btn crud-delete-btn" onclick="deleteCrudRecord('${tableName}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    html += `
            </tbody>
        </table>
        <div class="crud-pagination">
            <div class="crud-pagination-info">
                Showing ${data.length} records
            </div>
            <div class="crud-pagination-controls">
                <button class="crud-pagination-btn" disabled>Previous</button>
                <button class="crud-pagination-btn" disabled>Next</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function showCrudPlaceholder() {
    const container = document.getElementById('crudTableContainer');
    container.innerHTML = `
        <div class="crud-placeholder">
            <i class="fas fa-table"></i>
            <h3>Select a table to view and edit data</h3>
            <p>Choose a table from the dropdown above to start managing your data</p>
        </div>
    `;
}

function refreshCrudTable() {
    const tableSelect = document.getElementById('crudTableSelect');
    if (tableSelect.value) {
        loadCrudTableData(tableSelect.value);
    }
}

function showAddRecordModal() {
    const tableSelect = document.getElementById('crudTableSelect');
    if (!tableSelect.value) {
        showNotification('Error', 'Please select a table first');
        return;
    }
    
    if (!currentConnection) {
        showNotification('Error', 'Please connect to a database first');
        return;
    }
    
    // Get table schema to create form fields
    loadTableSchemaForCrud(tableSelect.value);
}

async function loadTableSchemaForCrud(tableName) {
    try {
        const response = await window.electronAPI.apiRequest('table-schema', {
            connection_id: currentConnection.id,
            table_name: tableName
        });
        
        if (response.success) {
            showCrudRecordModal('add', tableName, response.columns);
        } else {
            showNotification('Error', response.error || 'Failed to load table schema');
        }
    } catch (error) {
        console.error('Failed to load table schema for CRUD:', error);
        showNotification('Error', 'Failed to load table schema');
    }
}

function showCrudRecordModal(mode, tableName, columns) {
    const modal = document.getElementById('crudRecordModal');
    const title = document.getElementById('crudModalTitle');
    const formFields = document.getElementById('crudFormFields');
    const submitBtn = document.getElementById('crudSubmitBtn');
    
    title.textContent = mode === 'add' ? 'Add New Record' : 'Edit Record';
    submitBtn.textContent = mode === 'add' ? 'Save Record' : 'Update Record';
    
    // Generate form fields
    formFields.innerHTML = columns.map(col => `
        <div class="form-group">
            <label for="crud_${col.name}">${col.name}</label>
            <input type="text" id="crud_${col.name}" name="${col.name}" 
                   ${col.primary_key ? 'readonly' : ''} 
                   placeholder="${col.primary_key ? 'Auto-generated' : 'Enter value'}">
        </div>
    `).join('');
    
    // Store modal data
    modal.dataset.mode = mode;
    modal.dataset.tableName = tableName;
    
    showModal(modal);
}

function closeCrudModal() {
    const modal = document.getElementById('crudRecordModal');
    hideModal(modal);
}

async function handleCrudRecordSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('crudRecordModal');
    const mode = modal.dataset.mode;
    const tableName = modal.dataset.tableName;
    
    // Collect form data
    const formData = new FormData(event.target);
    const values = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            values[key] = value;
        }
    }
    
    try {
        showLoadingOverlay('Saving record...');
        
        let response;
        if (mode === 'add') {
            response = await window.electronAPI.apiRequest('crud/insert', {
                connection_id: currentConnection.id,
                table_name: tableName,
                values: values
            });
        } else {
            // For edit mode, you'd need to implement update logic
            response = await window.electronAPI.apiRequest('crud/update', {
                connection_id: currentConnection.id,
                table_name: tableName,
                values: values,
                where_conditions: {} // You'd need to implement this
            });
        }
        
        hideLoadingOverlay();
        
        if (response.success) {
            showNotification('Success', `Record ${mode === 'add' ? 'added' : 'updated'} successfully`);
            closeCrudModal();
            refreshCrudTable();
        } else {
            showNotification('Error', response.error || `Failed to ${mode} record`);
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error(`Failed to ${mode} record:`, error);
        showNotification('Error', `Failed to ${mode} record`);
    }
}

function editCrudRecord(tableName, rowIndex) {
    // Implementation for editing records
    showNotification('Info', 'Edit functionality coming soon!');
}

function deleteCrudRecord(tableName, rowIndex) {
    if (confirm('Are you sure you want to delete this record?')) {
        // Implementation for deleting records
        showNotification('Info', 'Delete functionality coming soon!');
    }
}

// Update CRUD table selector when connection changes
function updateCrudTableSelector() {
    const tableSelect = document.getElementById('crudTableSelect');
    if (!tableSelect) return;
    
    if (currentConnection && currentConnection.tables) {
        tableSelect.innerHTML = '<option value="">Select Table</option>';
        currentConnection.tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            tableSelect.appendChild(option);
        });
    } else {
        tableSelect.innerHTML = '<option value="">Select Table</option>';
    }
}

// Export CRUD functions
window.closeCrudModal = closeCrudModal;
window.editCrudRecord = editCrudRecord;
window.deleteCrudRecord = deleteCrudRecord;
