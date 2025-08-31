const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database connection methods
  selectSqliteFile: () => ipcRenderer.invoke('select-sqlite-file'),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath),
  
  // Store methods for persistent data
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  deleteStoreValue: (key) => ipcRenderer.invoke('delete-store-value', key),
  
  // Backend API methods
  apiRequest: async (endpoint, method = 'GET', data = null) => {
    try {
      const url = `http://localhost:5001/api/${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  // Utility methods
  showNotification: (title, body) => {
    // This would integrate with the OS notification system
    console.log(`Notification: ${title} - ${body}`);
  }
});
