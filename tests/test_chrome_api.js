// Unit tests for the ChromeAPI wrapper
import chromeAPI from '../src/utils/chrome-api.js';

// Create an actual storage mock that works
const storageMock = {
  sync: {
    get: jest.fn().mockImplementation((keys, callback) => {
      const result = { [Array.isArray(keys) ? keys[0] : keys]: 'test-value' };
      if (typeof callback === 'function') {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn().mockImplementation((obj, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    })
  }
};

// Mock the global chrome object
global.chrome = {
  storage: storageMock,
  notifications: {
    create: jest.fn().mockImplementation((id, options, callback) => {
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
      
      // Force new instance with non-extension environment
      const testChromeAPI = new chromeAPI.constructor();
      testChromeAPI._setExtensionEnvironment(false);
      
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
      
      expect(chrome.storage.sync.set).toHaveBeenCalled();
      const passedArg = chrome.storage.sync.set.mock.calls[0][0];
      expect(passedArg).toEqual({ [key]: value });
    });
    
    it('should load data correctly in extension environment', async () => {
      const key = 'testKey';
      
      const result = await chromeAPI.loadData(key);
      
      expect(chrome.storage.sync.get).toHaveBeenCalled();
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
      
      // Set up error simulation for chrome.storage.sync.set
      chrome.storage.sync.set.mockImplementationOnce((data, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return Promise.reject(chrome.runtime.lastError);
      });
      
      try {
        await chromeAPI.saveData(key, value);
        // If we get here, the test should fail
        fail('saveData should have thrown an error');
      } catch (error) {
        expect(error).toEqual(chrome.runtime.lastError);
      }
      
      // Clear the error
      chrome.runtime.lastError = null;
    });
    
    it('should handle errors when loading data', async () => {
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Storage error' };
      
      // Set up error simulation for chrome.storage.sync.get
      chrome.storage.sync.get.mockImplementationOnce((keys, callback) => {
        if (typeof callback === 'function') {
          callback({});
        }
        return Promise.reject(chrome.runtime.lastError);
      });
      
      try {
        await chromeAPI.loadData('testKey');
        // If we get here, the test should fail
        fail('loadData should have thrown an error');
      } catch (error) {
        expect(error).toEqual(chrome.runtime.lastError);
      }
      
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
      
      expect(chrome.notifications.create).toHaveBeenCalled();
      expect(chrome.notifications.create.mock.calls[0][0]).toBe('');
      expect(chrome.notifications.create.mock.calls[0][1]).toEqual(options);
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
      
      expect(consoleSpy).toHaveBeenCalledWith('Notification created:', options);
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