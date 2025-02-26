// Integration tests for the background service worker
import { Player } from '../src/models/player.js';
import { generateRandomEvent, getTabClosedReward } from '../src/models/events.js';
import * as storage from '../src/utils/storage.js';
import * as notifications from '../src/utils/notifications.js';
import chromeAPI from '../src/utils/chrome-api.js';

// Mock dependencies
jest.mock('../src/models/player.js');
jest.mock('../src/models/events.js');
jest.mock('../src/utils/storage.js');
jest.mock('../src/utils/notifications.js');

// Create mock handlers to capture the event handlers
const mockHandlers = {
  tabCreated: null,
  tabActivated: null,
  tabUpdated: null,
  tabRemoved: null,
  message: null
};

// Mock the chromeAPI methods to capture the handlers
jest.spyOn(chromeAPI, 'addTabCreatedListener').mockImplementation(handler => {
  mockHandlers.tabCreated = handler;
  return () => {}; // Return a cleanup function
});
jest.spyOn(chromeAPI, 'addTabActivatedListener').mockImplementation(handler => {
  mockHandlers.tabActivated = handler;
  return () => {}; // Return a cleanup function
});
jest.spyOn(chromeAPI, 'addTabUpdatedListener').mockImplementation(handler => {
  mockHandlers.tabUpdated = handler;
  return () => {}; // Return a cleanup function
});
jest.spyOn(chromeAPI, 'addTabRemovedListener').mockImplementation(handler => {
  mockHandlers.tabRemoved = handler;
  return () => {}; // Return a cleanup function
});
jest.spyOn(chromeAPI, 'addMessageListener').mockImplementation(handler => {
  mockHandlers.message = handler;
  return () => {}; // Return a cleanup function
});

describe('Background Service Worker Integration', () => {
  // Save original implementation
  const originalIsExtensionEnvironment = chromeAPI.isExtensionEnvironment;
  
  beforeAll(() => {
    // Force test environment mode
    chromeAPI.isExtensionEnvironment = false;
    
    // Import the background script
    require('../src/background/index.js');
  });
  
  afterAll(() => {
    // Restore original implementation
    chromeAPI.isExtensionEnvironment = originalIsExtensionEnvironment;
  });
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock methods for the Player instance
    const mockAddXp = jest.fn().mockReturnValue({ xpGained: 10, leveledUp: false });
    const mockAddGold = jest.fn().mockReturnValue({ goldGained: 5 });
    const mockCheckLevelUp = jest.fn().mockReturnValue(false);
    const mockToJSON = jest.fn().mockReturnValue({
      xp: 0,
      level: 1,
      gold: 0,
      quests: []
    });
    
    // Mock Player constructor
    Player.mockImplementation(() => ({
      xp: 0,
      level: 1,
      gold: 0,
      quests: [],
      addXp: mockAddXp,
      addGold: mockAddGold,
      checkLevelUp: mockCheckLevelUp,
      toJSON: mockToJSON
    }));
    
    // Mock generateRandomEvent
    generateRandomEvent.mockImplementation(() => ({
      type: 'monster',
      data: {
        id: 'goblin',
        name: 'Tab Goblin',
        level: 1,
        xp: 15,
        gold: 5,
        image: 'goblin.png'
      },
      message: 'You encountered a Tab Goblin!'
    }));
    
    // Mock getTabClosedReward
    getTabClosedReward.mockImplementation(() => ({
      xp: 10,
      gold: 5
    }));
    
    // Mock storage functions
    storage.savePlayerData.mockResolvedValue(undefined);
    storage.loadPlayerData.mockResolvedValue({
      xp: 0,
      level: 1,
      gold: 0,
      quests: []
    });
    storage.saveCurrentEvent.mockResolvedValue(undefined);
    storage.loadCurrentEvent.mockResolvedValue({
      type: 'monster',
      data: {
        id: 'goblin',
        name: 'Tab Goblin',
        level: 1,
        xp: 15,
        gold: 5,
        image: 'goblin.png'
      },
      message: 'You encountered a Tab Goblin!'
    });
    storage.clearCurrentEvent.mockResolvedValue(undefined);
    storage.updateTabTimestamp.mockResolvedValue(undefined);
    storage.removeTabTimestamp.mockResolvedValue(undefined);
    storage.getTabDuration.mockResolvedValue(300); // 5 minutes
  });
  
  test('should register event listeners on initialization', () => {
    // Check that event listeners were registered by checking if the mock handlers were set
    expect(mockHandlers.tabCreated).toBeTruthy();
    expect(mockHandlers.tabActivated).toBeTruthy();
    expect(mockHandlers.tabUpdated).toBeTruthy();
    expect(mockHandlers.tabRemoved).toBeTruthy();
    expect(mockHandlers.message).toBeTruthy();
  });
  
  test('should handle tab created event with event generation', () => {
    // Make sure we have a handler
    expect(mockHandlers.tabCreated).toBeTruthy();
    
    // Mock Math.random to return a value that will trigger event generation
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1); // 0.1 < 0.3, so event will be generated
    
    // Call the handler with a mock tab
    mockHandlers.tabCreated({ id: 123 });
    
    // Check that tab timestamp was updated
    expect(storage.updateTabTimestamp).toHaveBeenCalledWith(123);
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that an event was generated
    expect(generateRandomEvent).toHaveBeenCalled();
    
    // Check that the event was saved
    expect(storage.saveCurrentEvent).toHaveBeenCalled();
    
    // Restore Math.random
    Math.random = originalRandom;
  });
  
  test('should handle tab created event without event generation', () => {
    // Make sure we have a handler
    expect(mockHandlers.tabCreated).toBeTruthy();
    
    // Mock Math.random to return a value that will not trigger event generation
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.9); // 0.9 > 0.3, so no event will be generated
    
    // Call the handler with a mock tab
    mockHandlers.tabCreated({ id: 123 });
    
    // Check that tab timestamp was updated
    expect(storage.updateTabTimestamp).toHaveBeenCalledWith(123);
    
    // Check that no event was generated
    expect(generateRandomEvent).not.toHaveBeenCalled();
    
    // Check that no event was saved
    expect(storage.saveCurrentEvent).not.toHaveBeenCalled();
    
    // Restore Math.random
    Math.random = originalRandom;
  });
  
  test('should handle tab activated event', () => {
    // Make sure we have a handler
    expect(mockHandlers.tabActivated).toBeTruthy();
    
    // Call the handler with a mock activeInfo
    mockHandlers.tabActivated({ tabId: 123 });
    
    // Check that tab timestamp was updated
    expect(storage.updateTabTimestamp).toHaveBeenCalledWith(123);
  });
  
  test('should handle tab updated event with complete status', () => {
    // Make sure we have a handler
    expect(mockHandlers.tabUpdated).toBeTruthy();
    
    // Call the handler with a mock tab update with complete status
    mockHandlers.tabUpdated(123, { status: 'complete' }, {});
    
    // Check that tab timestamp was updated
    expect(storage.updateTabTimestamp).toHaveBeenCalledWith(123);
  });
  
  test('should handle tab updated event with non-complete status', () => {
    // Make sure we have a handler
    expect(mockHandlers.tabUpdated).toBeTruthy();
    
    // Call the handler with a mock tab update with non-complete status
    mockHandlers.tabUpdated(123, { status: 'loading' }, {});
    
    // Check that tab timestamp was not updated
    expect(storage.updateTabTimestamp).not.toHaveBeenCalled();
  });
  
  test('should handle getPlayerData message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock player data
    const playerData = { xp: 100, level: 2, gold: 50, quests: [] };
    storage.loadPlayerData.mockResolvedValueOnce(playerData);
    
    // Call the handler with a getPlayerData message
    mockHandlers.message({ action: 'getPlayerData' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that sendResponse was called with the player data
    expect(sendResponse).toHaveBeenCalledWith({ playerData });
  });
  
  test('should handle getCurrentEvent message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock current event
    const currentEvent = {
      type: 'monster',
      data: { name: 'Goblin' },
      message: 'You encountered a Goblin!'
    };
    storage.loadCurrentEvent.mockResolvedValueOnce(currentEvent);
    
    // Call the handler with a getCurrentEvent message
    mockHandlers.message({ action: 'getCurrentEvent' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that current event was loaded
    expect(storage.loadCurrentEvent).toHaveBeenCalled();
    
    // Check that sendResponse was called with the current event
    expect(sendResponse).toHaveBeenCalledWith(currentEvent);
  });
  
  test('should handle generateEvent message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock generated event
    const generatedEvent = {
      type: 'treasure',
      data: { name: 'Gold Chest', xp: 20, gold: 50, image: 'chest.png' },
      message: 'You found a Gold Chest!'
    };
    generateRandomEvent.mockReturnValueOnce(generatedEvent);
    
    // Call the handler with a generateEvent message
    mockHandlers.message({ action: 'generateEvent' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that an event was generated
    expect(generateRandomEvent).toHaveBeenCalled();
    
    // Check that the event was saved
    expect(storage.saveCurrentEvent).toHaveBeenCalledWith(generatedEvent);
    
    // Check that a notification was shown
    expect(notifications.showEventNotification).toHaveBeenCalledWith(generatedEvent);
    
    // Check that sendResponse was called with the event
    expect(sendResponse).toHaveBeenCalledWith(generatedEvent);
  });
  
  test('should handle updatePlayer message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Create mock player data
    const playerData = {
      xp: 100,
      level: 2,
      gold: 50,
      quests: []
    };
    
    // Call the handler with an updatePlayer message
    mockHandlers.message({ action: 'updatePlayer', data: playerData }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was saved
    expect(storage.savePlayerData).toHaveBeenCalledWith(playerData);
    
    // Check that sendResponse was called with success
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should handle updatePlayer message with missing data', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the handler with an updatePlayer message but no data
    mockHandlers.message({ action: 'updatePlayer' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was not saved
    expect(storage.savePlayerData).not.toHaveBeenCalled();
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'No player data provided' });
  });
  
  test('should handle completeQuest message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock player data
    const playerData = {
      xp: 100,
      level: 2,
      gold: 50,
      quests: [
        { id: 'quest1', title: 'Test Quest', completed: false, reward: { xp: 20, gold: 10 } }
      ]
    };
    storage.loadPlayerData.mockResolvedValueOnce(playerData);
    
    // Create a player instance with the quest completion method
    const playerInstance = {
      xp: 100,
      level: 2,
      gold: 50,
      quests: [
        { id: 'quest1', title: 'Test Quest', completed: false, reward: { xp: 20, gold: 10 } }
      ],
      completeQuest: jest.fn().mockReturnValue({
        xpGained: 20,
        goldGained: 10,
        leveledUp: false
      }),
      toJSON: jest.fn().mockReturnValue({
        xp: 120,
        level: 2,
        gold: 60,
        quests: [
          { id: 'quest1', title: 'Test Quest', completed: true, reward: { xp: 20, gold: 10 } }
        ]
      })
    };
    Player.mockImplementationOnce(() => playerInstance);
    
    // Call the handler with a completeQuest message
    mockHandlers.message({ action: 'completeQuest', questId: 'quest1' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that the quest was completed
    expect(playerInstance.completeQuest).toHaveBeenCalledWith('quest1');
    
    // Check that player data was saved
    expect(storage.savePlayerData).toHaveBeenCalled();
    
    // Check that notifications were shown
    expect(notifications.showXPNotification).toHaveBeenCalledWith(20);
    expect(notifications.showGoldNotification).toHaveBeenCalledWith(10);
    
    // Check that sendResponse was called with success
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      xpGained: 20,
      goldGained: 10,
      leveledUp: false
    });
  });
  
  test('should handle completeQuest message with missing questId', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the handler with a completeQuest message but no questId
    mockHandlers.message({ action: 'completeQuest' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was not loaded
    expect(storage.loadPlayerData).not.toHaveBeenCalled();
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'No quest ID provided' });
  });
  
  test('should handle addQuest message', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock player data
    const playerData = {
      xp: 100,
      level: 2,
      gold: 50,
      quests: []
    };
    storage.loadPlayerData.mockResolvedValueOnce(playerData);
    
    // Create a player instance with the addQuest method
    const playerInstance = {
      xp: 100,
      level: 2,
      gold: 50,
      quests: [],
      addQuest: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        xp: 100,
        level: 2,
        gold: 50,
        quests: [
          { id: 'quest2', title: 'New Quest', completed: false, reward: { xp: 30, gold: 15 } }
        ]
      })
    };
    Player.mockImplementationOnce(() => playerInstance);
    
    // Create a quest to add
    const quest = {
      id: 'quest2',
      title: 'New Quest',
      completed: false,
      reward: { xp: 30, gold: 15 }
    };
    
    // Call the handler with an addQuest message
    mockHandlers.message({ action: 'addQuest', quest }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that the quest was added
    expect(playerInstance.addQuest).toHaveBeenCalledWith(quest);
    
    // Check that player data was saved
    expect(storage.savePlayerData).toHaveBeenCalled();
    
    // Check that sendResponse was called with success
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should handle addQuest message with missing quest', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the handler with an addQuest message but no quest
    mockHandlers.message({ action: 'addQuest' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was not loaded
    expect(storage.loadPlayerData).not.toHaveBeenCalled();
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'No quest provided' });
  });
  
  test('should handle unknown message action', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the handler with an unknown action
    mockHandlers.message({ action: 'unknownAction' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown action: unknownAction' });
  });
  
  test('should handle message with no action', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the handler with no action
    mockHandlers.message({}, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'No action specified' });
  });
  
  test('should handle errors in message handler', async () => {
    // Make sure we have a handler
    expect(mockHandlers.message).toBeTruthy();
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock storage.loadPlayerData to throw an error
    const error = new Error('Test error');
    storage.loadPlayerData.mockRejectedValueOnce(error);
    
    // Call the handler with a getPlayerData message
    mockHandlers.message({ action: 'getPlayerData' }, {}, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that console.error was called
    expect(console.error).toHaveBeenCalledWith('Error loading player data:', error);
    
    // Check that sendResponse was called with an error
    expect(sendResponse).toHaveBeenCalledWith({ error: 'Test error' });
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 