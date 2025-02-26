// Unit tests for the background service worker
import * as BackgroundModule from '../src/background/background.js';
import { Player } from '../src/models/player.js';
import { generateRandomEvent } from '../src/utils/events.js';
import {
  savePlayerData,
  loadPlayerData,
  updateTabTimestamp,
  removeTabTimestamp,
  getTabDuration,
  saveCurrentEvent,
  loadCurrentEvent,
  clearCurrentEvent
} from '../src/utils/storage.js';
import {
  showXPNotification,
  showGoldNotification,
  showLevelUpNotification,
  showEventNotification,
  showQuestCompletionNotification
} from '../src/utils/notification.js';

// Mock all imports
jest.mock('../src/models/player.js');
jest.mock('../src/utils/events.js');
jest.mock('../src/utils/storage.js');
jest.mock('../src/utils/notification.js');

// Simplified test for Background Service Worker
describe('Background Service Worker', () => {
  // Test other functionality that doesn't require event listeners
  test('Background module should be imported correctly', () => {
    expect(BackgroundModule).toBeDefined();
  });
  
  describe('Message Handler', () => {
    test('should handle getPlayerData message', async () => {
      const message = { action: 'getPlayerData' };
      const sender = {};
      const sendResponse = jest.fn();
      
      // Mock loadPlayerData to resolve with test data
      loadPlayerData.mockResolvedValue({ xp: 100, level: 2 });
      
      // Call the message handler directly
      await BackgroundModule.handleMessage(message, sender, sendResponse);
      
      // Verify player data was loaded and sent in response
      expect(loadPlayerData).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ xp: 100, level: 2 });
    });
    
    test('should handle getCurrentEvent message', async () => {
      const message = { action: 'getCurrentEvent' };
      const sender = {};
      const sendResponse = jest.fn();
      
      // Mock loadCurrentEvent to resolve with test data
      const eventData = { type: 'monster', data: { id: 'goblin' } };
      loadCurrentEvent.mockResolvedValue(eventData);
      
      await BackgroundModule.handleMessage(message, sender, sendResponse);
      
      expect(loadCurrentEvent).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(eventData);
    });
    
    test('should handle generateEvent message', async () => {
      const message = { action: 'generateEvent' };
      const sender = {};
      const sendResponse = jest.fn();
      
      // Mock required functions
      loadPlayerData.mockResolvedValue({ level: 2 });
      const mockEvent = { type: 'monster', data: { id: 'goblin' } };
      generateRandomEvent.mockReturnValue(mockEvent);
      
      await BackgroundModule.handleMessage(message, sender, sendResponse);
      
      expect(loadPlayerData).toHaveBeenCalled();
      expect(generateRandomEvent).toHaveBeenCalledWith(2);
      expect(saveCurrentEvent).toHaveBeenCalledWith(mockEvent);
      expect(showEventNotification).toHaveBeenCalledWith(mockEvent);
      expect(sendResponse).toHaveBeenCalledWith(mockEvent);
    });
    
    test('should handle updatePlayer message', async () => {
      const playerData = { xp: 200, level: 3 };
      const message = { action: 'updatePlayer', data: playerData };
      const sender = {};
      const sendResponse = jest.fn();
      
      await BackgroundModule.handleMessage(message, sender, sendResponse);
      
      expect(savePlayerData).toHaveBeenCalledWith(playerData);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
    
    test('should handle unknown action with error', async () => {
      const message = { action: 'unknownAction' };
      const sender = {};
      const sendResponse = jest.fn();
      
      await BackgroundModule.handleMessage(message, sender, sendResponse);
      
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });
}); 