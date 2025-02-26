// Unit tests for the ChromeAPI wrapper
import chromeAPI from '../src/utils/chrome-api.js';

// Mock the global chrome object
global.chrome = {
  storage: {
    sync: {
      get: jest.fn().mockImplementation((keys, callback) => {
        if (typeof callback === 'function') {
          callback({ [keys[0]]: 'test-value' });
        }
        return Promise.resolve({ [keys[0]]: 'test-value' });
      }),
      set: jest.fn().mockImplementation((obj, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return Promise.resolve();
      })
    }
  },
  notifications: {
    create: jest.fn().mockImplementation((options, callback) => {
      if (typeof callback === 'function') {
        callback('notification-id');
      }
      return Promise.resolve('notification-id');
    })
  },
  tabs: {
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  runtime: {
    lastError: null,
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

describe('ChromeAPI', () => {
  beforeEach(() => {
    // Reset all mock implementations
    jest.clearAllMocks();
    
    // Reset the extension environment flag
    chromeAPI.isExtensionEnvironment = true;
    
    // Reset mock lastError
    chrome.runtime.lastError = null;
    
    // Clear memory storage
    chromeAPI._memoryStorage = {};
  });
  
  describe('Environment Detection', () => {
    it('should detect extension environment when chrome.storage exists', () => {
      // Should be true since we mocked chrome.storage
      expect(chromeAPI.isExtensionEnvironment).toBe(true);
    });
    
    it('should detect non-extension environment when chrome.storage does not exist', () => {
      // Temporarily remove chrome.storage
      const originalStorage = global.chrome.storage;
      global.chrome.storage = undefined;
      
      // Create a new instance to check environment
      const testChromeAPI = new (chromeAPI.constructor)();
      
      expect(testChromeAPI.isExtensionEnvironment).toBe(false);
      
      // Restore chrome.storage
      global.chrome.storage = originalStorage;
    });
  });
  
  describe('Storage API', () => {
    it('should save data correctly in extension environment', async () => {
      const key = 'testKey';
      const value = 'testValue';
      
      await chromeAPI.saveData(key, value);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { [key]: value },
        expect.any(Function)
      );
    });
    
    it('should load data correctly in extension environment', async () => {
      const key = 'testKey';
      
      const result = await chromeAPI.loadData(key);
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([key], expect.any(Function));
      expect(result).toBe('test-value');
    });
    
    it('should use memory storage in non-extension environment for save', async () => {
      // Force non-extension environment
      chromeAPI.isExtensionEnvironment = false;
      
      const key = 'testKey';
      const value = 'testValue';
      
      await chromeAPI.saveData(key, value);
      
      // Should store in memory
      expect(chromeAPI._memoryStorage[key]).toBe(value);
      
      // Should not call chrome API
      expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    });
    
    it('should use memory storage in non-extension environment for load', async () => {
      // Force non-extension environment
      chromeAPI.isExtensionEnvironment = false;
      
      // Set up some test data
      chromeAPI._memoryStorage = { testKey: 'memoryValue' };
      
      const result = await chromeAPI.loadData('testKey');
      
      // Should return from memory
      expect(result).toBe('memoryValue');
      
      // Should not call chrome API
      expect(chrome.storage.sync.get).not.toHaveBeenCalled();
    });
    
    it('should handle errors when saving data', async () => {
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Storage error' };
      
      const key = 'testKey';
      const value = 'testValue';
      
      await expect(chromeAPI.saveData(key, value)).rejects.toEqual(chrome.runtime.lastError);
      
      // Clear the error
      chrome.runtime.lastError = null;
    });
    
    it('should handle errors when loading data', async () => {
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Storage error' };
      
      await expect(chromeAPI.loadData('testKey')).rejects.toEqual(chrome.runtime.lastError);
      
      // Clear the error
      chrome.runtime.lastError = null;
    });
  });
  
  describe('Notifications API', () => {
    it('should create notification in extension environment', () => {
      const options = {
        type: 'basic',
        title: 'Test Title',
        message: 'Test Message',
        iconUrl: 'icon.png'
      };
      
      chromeAPI.createNotification(options);
      
      expect(chrome.notifications.create).toHaveBeenCalledWith(options);
    });
    
    it('should log notification in non-extension environment', () => {
      // Force non-extension environment
      chromeAPI.isExtensionEnvironment = false;
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      const options = {
        type: 'basic',
        title: 'Test Title',
        message: 'Test Message',
        iconUrl: 'icon.png'
      };
      
      chromeAPI.createNotification(options);
      
      expect(consoleSpy).toHaveBeenCalledWith('Notification (mock):', options);
      expect(chrome.notifications.create).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Tab Event Listeners', () => {
    it('should add tab created listener in extension environment', () => {
      const callback = jest.fn();
      
      chromeAPI.addTabCreatedListener(callback);
      
      expect(chrome.tabs.onCreated.addListener).toHaveBeenCalledWith(callback);
    });
    
    it('should add tab removed listener in extension environment', () => {
      const callback = jest.fn();
      
      chromeAPI.addTabRemovedListener(callback);
      
      expect(chrome.tabs.onRemoved.addListener).toHaveBeenCalledWith(callback);
    });
    
    it('should add tab activated listener in extension environment', () => {
      const callback = jest.fn();
      
      chromeAPI.addTabActivatedListener(callback);
      
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalledWith(callback);
    });
    
    it('should add tab updated listener in extension environment', () => {
      const callback = jest.fn();
      
      chromeAPI.addTabUpdatedListener(callback);
      
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledWith(callback);
    });
    
    it('should not add tab listeners in non-extension environment', () => {
      // Force non-extension environment
      chromeAPI.isExtensionEnvironment = false;
      
      const callback = jest.fn();
      
      chromeAPI.addTabCreatedListener(callback);
      chromeAPI.addTabRemovedListener(callback);
      chromeAPI.addTabActivatedListener(callback);
      chromeAPI.addTabUpdatedListener(callback);
      
      expect(chrome.tabs.onCreated.addListener).not.toHaveBeenCalled();
      expect(chrome.tabs.onRemoved.addListener).not.toHaveBeenCalled();
      expect(chrome.tabs.onActivated.addListener).not.toHaveBeenCalled();
      expect(chrome.tabs.onUpdated.addListener).not.toHaveBeenCalled();
    });
  });
  
  describe('Runtime Message Listener', () => {
    it('should add message listener in extension environment', () => {
      const callback = jest.fn();
      
      chromeAPI.addMessageListener(callback);
      
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(callback);
    });
    
    it('should not add message listener in non-extension environment', () => {
      // Force non-extension environment
      chromeAPI.isExtensionEnvironment = false;
      
      const callback = jest.fn();
      
      chromeAPI.addMessageListener(callback);
      
      expect(chrome.runtime.onMessage.addListener).not.toHaveBeenCalled();
    });
  });
}); 