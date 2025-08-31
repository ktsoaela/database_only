const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

// Initialize electron-store for persistent data
const store = new Store();

let mainWindow;
let backendProcess;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'DATABASE ONLY',
    show: false,
    autoHideMenuBar: true
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check if backend is running, if not start it
    checkBackendStatus();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
}

function startBackend() {
  console.log('Starting Python backend...');
  
  // Check if Python is available
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  backendProcess = spawn(pythonCommand, ['backend/app.py'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
    dialog.showErrorBox('Backend Error', 'Failed to start Python backend. Please ensure Python is installed and requirements are met.');
  });
}

function checkBackendStatus() {
  // Simple check to see if backend is responding
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('Backend is already running');
    }
  });

  req.on('error', () => {
    console.log('Backend not running, starting...');
    startBackend();
  });

  req.on('timeout', () => {
    req.destroy();
    console.log('Backend check timeout, starting...');
    startBackend();
  });

  req.end();
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC handlers for main process
ipcMain.handle('select-sqlite-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'SQLite Databases', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-file-location', async (event, filePath) => {
  if (process.platform === 'win32') {
    shell.openPath(path.dirname(filePath));
  } else if (process.platform === 'darwin') {
    shell.openPath(path.dirname(filePath));
  } else {
    shell.openPath(path.dirname(filePath));
  }
});

ipcMain.handle('get-store-value', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', async (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('delete-store-value', async (event, key) => {
  store.delete(key);
  return true;
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});
