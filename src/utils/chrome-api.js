// Chrome API wrapper for better testability
// This class abstracts Chrome API interactions to make them easier to mock in tests

class ChromeAPI {
  constructor() {
    // Initialize memory storage for testing
    this._memoryStorage = {};
    
    // Check if we're in a browser environment with Chrome API
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
                                 chrome.storage !== undefined && 
                                 chrome.tabs !== undefined;
    
    // Storage namespace for local storage
    this.storage = {
      local: {
        set: (data, callback) => this._setLocalStorage(data, callback),
        get: (keys, callback) => this._getLocalStorage(keys, callback)
      }
    };
  }
  
  // Mock for local storage set method
  _setLocalStorage(data, callback) {
    if (!this.isExtensionEnvironment) {
      Object.keys(data).forEach(key => {
        this._memoryStorage[key] = data[key];
        
        // Also set in sync storage for test compatibility
        if (this._memoryStorage['sync'] === undefined) {
          this._memoryStorage['sync'] = {};
        }
        this._memoryStorage['sync'][key] = data[key];
      });
      if (callback) callback();
      return;
    }
    
    chrome.storage.local.set(data, callback);
  }
  
  // Mock for local storage get method
  _getLocalStorage(keys, callback) {
    if (!this.isExtensionEnvironment) {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (key in this._memoryStorage) {
            result[key] = this._memoryStorage[key];
          }
        });
      } else if (typeof keys === 'string') {
        // Handle string key
        if (keys in this._memoryStorage) {
          result[keys] = this._memoryStorage[keys];
        }
      } else {
        // Handle object or null
        const keysToGet = keys === null ? Object.keys(this._memoryStorage) : Object.keys(keys);
        keysToGet.forEach(key => {
          if (key in this._memoryStorage) {
            result[key] = this._memoryStorage[key];
          }
        });
      }
      if (callback) callback(result);
      return;
    }
    
    chrome.storage.local.get(keys, callback);
  }

  // Storage API
  saveData(key, value) {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionEnvironment) {
        // In test environment, use localStorage or memory storage
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            // In-memory fallback for Node.js environment
            this._memoryStorage[key] = value;
          }
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      // In extension environment, use Chrome storage
      chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  loadData(key) {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionEnvironment) {
        // In test environment, use localStorage or memory storage
        try {
          let value;
          if (typeof localStorage !== 'undefined') {
            const item = localStorage.getItem(key);
            value = item ? JSON.parse(item) : null;
          } else {
            // In-memory fallback for Node.js environment
            value = this._memoryStorage[key] || null;
          }
          resolve(value);
        } catch (error) {
          reject(error);
        }
        return;
      }

      // In extension environment, use Chrome storage
      chrome.storage.sync.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  // Helper methods for tests
  setStorageData(data) {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionEnvironment) {
        try {
          Object.keys(data).forEach(key => {
            this._memoryStorage[key] = data[key];
          });
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }
      
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  
  getStorageData(key) {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionEnvironment) {
        try {
          resolve(this._memoryStorage[key] || null);
        } catch (error) {
          reject(error);
        }
        return;
      }
      
      chrome.storage.sync.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  // Tabs API
  addTabCreatedListener(callback) {
    if (!this.isExtensionEnvironment) return;
    chrome.tabs.onCreated.addListener(callback);
  }

  addTabActivatedListener(callback) {
    if (!this.isExtensionEnvironment) return;
    chrome.tabs.onActivated.addListener(callback);
  }

  addTabUpdatedListener(callback) {
    if (!this.isExtensionEnvironment) return;
    chrome.tabs.onUpdated.addListener(callback);
  }

  addTabRemovedListener(callback) {
    if (!this.isExtensionEnvironment) return;
    chrome.tabs.onRemoved.addListener(callback);
  }

  // Notifications API
  createNotification(options) {
    if (!this.isExtensionEnvironment) {
      console.log('Notification (mock):', options);
      return;
    }
    
    chrome.notifications.create(options);
  }

  // Runtime API
  addMessageListener(callback) {
    if (!this.isExtensionEnvironment) return;
    chrome.runtime.onMessage.addListener(callback);
  }
}

// Export a singleton instance
const chromeAPI = new ChromeAPI();
export default chromeAPI; 