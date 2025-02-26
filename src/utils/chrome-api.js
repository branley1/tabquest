// Chrome API wrapper for better testability
// This class abstracts Chrome API interactions to make them easier to mock in tests

class ChromeAPI {
  constructor() {
    // Check if we're in a browser environment with Chrome API
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
                                 chrome.storage !== undefined && 
                                 chrome.tabs !== undefined;
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
            if (!this._memoryStorage) this._memoryStorage = {};
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
            if (!this._memoryStorage) this._memoryStorage = {};
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