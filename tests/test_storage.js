// Unit tests for the Storage utility
import * as storage from '../src/utils/storage.js';
import chromeAPI from '../src/utils/chrome-api.js';

// Mock chrome.storage API
jest.mock('../src/utils/chrome-api.js', () => ({
  isExtensionEnvironment: true,
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  removeStorageData: jest.fn()
}));

describe('Storage Utility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation
    chromeAPI.getStorageData.mockResolvedValue(undefined);
    chromeAPI.setStorageData.mockResolvedValue(undefined);
    chromeAPI.removeStorageData.mockResolvedValue(undefined);
  });
  
  // Test savePlayerData
  describe('savePlayerData', () => {
    test('should save player data to storage', async () => {
      const playerData = { xp: 100, level: 2, gold: 50 };
      
      await storage.savePlayerData(playerData);
      
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({ playerData: playerData });
    });
    
    test('should handle errors when saving player data', async () => {
      const playerData = { xp: 100, level: 2, gold: 50 };
      const errorMessage = 'Failed to save data';
      
      chromeAPI.setStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(storage.savePlayerData(playerData)).rejects.toThrow(errorMessage);
    });
  });
  
  // Test loadPlayerData
  describe('loadPlayerData', () => {
    test('should load player data from storage', async () => {
      const playerData = { xp: 100, level: 2, gold: 50 };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(playerData);
      
      const result = await storage.loadPlayerData();
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('playerData');
      expect(result).toEqual(playerData);
    });
    
    test('should return null if no player data exists', async () => {
      chromeAPI.getStorageData.mockResolvedValueOnce(undefined);
      
      const result = await storage.loadPlayerData();
      
      expect(result).toBeNull();
    });
    
    test('should handle errors when loading player data', async () => {
      const errorMessage = 'Failed to load data';
      
      chromeAPI.getStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      try {
        await storage.loadPlayerData();
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('playerData');
    });
  });
  
  // Test saveCurrentEvent
  describe('saveCurrentEvent', () => {
    test('should save current event to storage', async () => {
      const event = { type: 'monster', data: { name: 'Goblin' } };
      
      await storage.saveCurrentEvent(event);
      
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({ currentEvent: event });
    });
    
    test('should handle errors when saving current event', async () => {
      const event = { type: 'monster', data: { name: 'Goblin' } };
      const errorMessage = 'Failed to save event';
      
      chromeAPI.setStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(storage.saveCurrentEvent(event)).rejects.toThrow(errorMessage);
    });
  });
  
  // Test loadCurrentEvent
  describe('loadCurrentEvent', () => {
    test('should load current event from storage', async () => {
      const event = { type: 'monster', data: { name: 'Goblin' } };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(event);
      
      const result = await storage.loadCurrentEvent();
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('currentEvent');
      expect(result).toEqual(event);
    });
    
    test('should return null if no current event exists', async () => {
      chromeAPI.getStorageData.mockResolvedValueOnce(undefined);
      
      const result = await storage.loadCurrentEvent();
      
      expect(result).toBeNull();
    });
    
    test('should handle errors when loading current event', async () => {
      const errorMessage = 'Failed to load event';
      
      chromeAPI.getStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      try {
        await storage.loadCurrentEvent();
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('currentEvent');
    });
  });
  
  // Test clearCurrentEvent
  describe('clearCurrentEvent', () => {
    test('should clear current event from storage', async () => {
      await storage.clearCurrentEvent();
      
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({ currentEvent: null });
    });
    
    test('should handle errors when clearing current event', async () => {
      const errorMessage = 'Failed to clear event';
      
      chromeAPI.setStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(storage.clearCurrentEvent()).rejects.toThrow(errorMessage);
    });
  });
  
  // Test tabTimestamps functions
  describe('tabTimestamps', () => {
    test('should load tab timestamps from storage', async () => {
      const timestamps = { 123: Date.now(), 456: Date.now() - 1000 };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(timestamps);
      
      const result = await storage.loadTabTimestamps();
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('tabTimestamps');
      expect(result).toEqual(timestamps);
    });
    
    test('should return empty object if no tab timestamps exist', async () => {
      chromeAPI.getStorageData.mockResolvedValueOnce(undefined);
      
      const result = await storage.loadTabTimestamps();
      
      expect(result).toEqual({});
    });
    
    test('should update tab timestamp', async () => {
      const tabId = 123;
      const timestamp = Date.now();
      
      // Mock Date.now()
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => timestamp);
      
      // Mock loadTabTimestamps
      const existingTimestamps = {};
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      await storage.updateTabTimestamp(tabId);
      
      expect(chromeAPI.getStorageData).toHaveBeenCalledWith('tabTimestamps');
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({
        tabTimestamps: { [tabId]: timestamp }
      });
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
    
    test('should update existing tab timestamps', async () => {
      const tabId = 123;
      const timestamp = Date.now();
      const existingTimestamps = { 456: timestamp - 1000 };
      
      // Mock Date.now()
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => timestamp);
      
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      await storage.updateTabTimestamp(tabId);
      
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({
        tabTimestamps: { ...existingTimestamps, [tabId]: timestamp }
      });
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
    
    test('should handle errors when updating tab timestamp', async () => {
      const tabId = 123;
      const errorMessage = 'Failed to update timestamp';
      
      chromeAPI.getStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(storage.updateTabTimestamp(tabId)).rejects.toThrow('Failed to update timestamp');
    });
    
    test('should remove tab timestamp', async () => {
      const tabId = 123;
      const existingTimestamps = { 123: Date.now(), 456: Date.now() - 1000 };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      await storage.removeTabTimestamp(tabId);
      
      const expectedTimestamps = { 456: existingTimestamps[456] };
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({
        tabTimestamps: expectedTimestamps
      });

    });
    
    test('should handle case when tab timestamp does not exist', async () => {
      const tabId = 123;
      const existingTimestamps = { 456: Date.now() - 1000 };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      await storage.removeTabTimestamp(tabId);
      
      expect(chromeAPI.setStorageData).toHaveBeenCalledWith({
        tabTimestamps: existingTimestamps
      });
    });
    
    test('should handle errors when removing tab timestamp', async () => {
      const tabId = 123;
      const errorMessage = 'Failed to remove timestamp';
      
      chromeAPI.getStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(storage.removeTabTimestamp(tabId)).rejects.toThrow('Failed to remove timestamp');
    });
    
    test('should calculate tab duration from timestamp', async () => {
      const tabId = 123;
      const now = Date.now();
      const timestamp = now - 5000; // 5 seconds ago
      const existingTimestamps = { [tabId]: timestamp };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      // Mock Date.now()
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => now);
      
      const duration = await storage.getTabDuration(tabId);
      
      expect(duration).toBe(5000); // 5000 milliseconds
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
    
    test('should return 0 if tab timestamp does not exist', async () => {
      const tabId = 123;
      const existingTimestamps = { 456: Date.now() - 1000 };
      
      chromeAPI.getStorageData.mockResolvedValueOnce(existingTimestamps);
      
      const duration = await storage.getTabDuration(tabId);
      
      expect(duration).toBe(0);
    });
    
    test('should handle errors when getting tab duration', async () => {
      const tabId = 123;
      const errorMessage = 'Failed to get duration';
      
      chromeAPI.getStorageData.mockRejectedValueOnce(new Error(errorMessage));
      
      const duration = await storage.getTabDuration(tabId);
      
      expect(duration).toBe(0);
    });
  });
}); 