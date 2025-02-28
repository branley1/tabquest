// Chrome API wrapper for testing and non-extension environments
class ChromeAPI {
  constructor() {
    this._memoryStorage = {};
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    
    // Set up notifications API
    this.notifications = {
      create: async (id, options) => {
        if (this.isExtensionEnvironment) {
          return new Promise((resolve, reject) => {
            try {
              chrome.notifications.create(id, options, (notificationId) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                  return;
                }
                resolve(notificationId);
              });
            } catch (error) {
              reject(error);
            }
          });
        }
        console.log('Notification created:', options);
        return Promise.resolve('notification-id');
      }
    };
    
    // Set up storage API
    this.storage = {
      sync: {
        get: async (key) => {
          if (this.isExtensionEnvironment) {
            return new Promise((resolve, reject) => {
              try {
                chrome.storage.sync.get(key, (result) => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                  }
                  resolve(result);
                });
              } catch (error) {
                reject(error);
              }
            });
          }
          
          if (typeof key === 'string') {
            return Promise.resolve({ [key]: this._memoryStorage[key] });
          }
          
          if (Array.isArray(key)) {
            const result = {};
            key.forEach(k => {
              result[k] = this._memoryStorage[k];
            });
            return Promise.resolve(result);
          }
          
          return Promise.resolve(this._memoryStorage);
        },
        
        set: async (data) => {
          if (this.isExtensionEnvironment) {
            return new Promise((resolve, reject) => {
              try {
                chrome.storage.sync.set(data, () => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                  }
                  resolve();
                });
              } catch (error) {
                reject(error);
              }
            });
          }
          
          Object.assign(this._memoryStorage, data);
          return Promise.resolve();
        }
      }
    };
    
    // Set up runtime API
    this.runtime = {
      sendMessage: async (message) => {
        if (this.isExtensionEnvironment) {
          return new Promise((resolve, reject) => {
            try {
              chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                  return;
                }
                resolve(response);
              });
            } catch (error) {
              reject(error);
            }
          });
        }
        console.log('Message sent:', message);
        return Promise.resolve({ success: true, mock: true });
      },
      
      onMessage: {
        addListener: (callback) => {
          if (this.isExtensionEnvironment) {
            chrome.runtime.onMessage.addListener(callback);
          }
        }
      }
    };
    
    // Set up tabs API
    this.tabs = {
      query: async (queryInfo) => {
        if (this.isExtensionEnvironment) {
          return new Promise((resolve, reject) => {
            try {
              chrome.tabs.query(queryInfo, (tabs) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                  return;
                }
                resolve(tabs);
              });
            } catch (error) {
              reject(error);
            }
          });
        }
        return Promise.resolve([]);
      },
      
      get: async (tabId) => {
        if (this.isExtensionEnvironment) {
          return new Promise((resolve, reject) => {
            try {
              chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                  return;
                }
                resolve(tab);
              });
            } catch (error) {
              reject(error);
            }
          });
        }
        return Promise.resolve({ id: tabId });
      },
      
      onCreated: {
        addListener: (callback) => {
          if (this.isExtensionEnvironment) {
            chrome.tabs.onCreated.addListener(callback);
          }
        }
      },
      
      onRemoved: {
        addListener: (callback) => {
          if (this.isExtensionEnvironment) {
            chrome.tabs.onRemoved.addListener(callback);
          }
        }
      },
      
      onActivated: {
        addListener: (callback) => {
          if (this.isExtensionEnvironment) {
            chrome.tabs.onActivated.addListener(callback);
          }
        }
      },
      
      onUpdated: {
        addListener: (callback) => {
          if (this.isExtensionEnvironment) {
            chrome.tabs.onUpdated.addListener(callback);
          }
        }
      }
    };
  }
  
  // Backwards compatibility methods for tests
  createNotification(options) {
    return this.notifications.create('', options);
  }
  
  // Storage compatibility methods for tests
  async saveData(key, value) {
    if (this.isExtensionEnvironment && chrome.runtime.lastError) {
      return Promise.reject(chrome.runtime.lastError);
    }
    return this.storage.sync.set({ [key]: value });
  }
  
  async loadData(key) {
    if (this.isExtensionEnvironment && chrome.runtime.lastError) {
      return Promise.reject(chrome.runtime.lastError);
    }
    const result = await this.storage.sync.get([key]);
    return result[key];
  }
  
  setStorageData(data) {
    return this.storage.sync.set(data);
  }
  
  getStorageData(key) {
    return this.loadData(key);
  }
  
  // Tab event listener compatibility methods
  addTabCreatedListener(callback) {
    return this.tabs.onCreated.addListener(callback);
  }
  
  addTabRemovedListener(callback) {
    return this.tabs.onRemoved.addListener(callback);
  }
  
  addTabActivatedListener(callback) {
    return this.tabs.onActivated.addListener(callback);
  }
  
  addTabUpdatedListener(callback) {
    return this.tabs.onUpdated.addListener(callback);
  }
  
  addMessageListener(callback) {
    return this.runtime.onMessage.addListener(callback);
  }
  
  _setExtensionEnvironment(value) {
    this.isExtensionEnvironment = value;
  }
}

// Export a singleton instance
export const chromeAPI = new ChromeAPI();
export default chromeAPI; // For backwards compatibility