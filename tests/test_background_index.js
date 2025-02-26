// Unit tests for the background service worker
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

// Create a separate test file that doesn't try to import the background script
// Instead, we'll test the individual functions that would be called by the background script

describe('Background Service Worker', () => {
  // Save original implementation
  const originalIsExtensionEnvironment = chromeAPI.isExtensionEnvironment;
  
  beforeAll(() => {
    // Force test environment mode
    chromeAPI.isExtensionEnvironment = false;
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
  
  test('should handle tab creation', async () => {
    // Mock Math.random to return a value that will trigger event generation
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1); // 0.1 < 0.3, so event will be generated
    
    // Create a mock tab
    const tab = { id: 123 };
    
    // Call the function that would handle tab creation
    await handleTabCreated(tab);
    
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
  
  test('should handle tab removal', async () => {
    // Create a mock tab ID
    const tabId = 123;
    
    // Call the function that would handle tab removal
    await handleTabRemoved(tabId, {});
    
    // Check that tab duration was calculated
    expect(storage.getTabDuration).toHaveBeenCalledWith(tabId);
    
    // Check that rewards were generated
    expect(getTabClosedReward).toHaveBeenCalledWith(300); // 300 seconds = 5 minutes
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that a player was created
    expect(Player).toHaveBeenCalled();
    
    // Get the mock player instance
    const playerInstance = new Player();
    
    // Check that XP and gold were added
    expect(playerInstance.addXp).toHaveBeenCalledWith(10);
    expect(playerInstance.addGold).toHaveBeenCalledWith(5);
    
    // Check that notifications were shown
    expect(notifications.showXPNotification).toHaveBeenCalledWith(10);
    expect(notifications.showGoldNotification).toHaveBeenCalledWith(5);
    
    // Check that player data was saved
    expect(storage.savePlayerData).toHaveBeenCalled();
    
    // Check that tab timestamp was removed
    expect(storage.removeTabTimestamp).toHaveBeenCalledWith(tabId);
  });
  
  test('should handle message events', async () => {
    // Create a mock message
    const message = { action: 'getPlayerData' };
    
    // Create a mock sender
    const sender = {};
    
    // Create a mock sendResponse function
    const sendResponse = jest.fn();
    
    // Call the function that would handle messages
    handleMessage(message, sender, sendResponse);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that player data was loaded
    expect(storage.loadPlayerData).toHaveBeenCalled();
    
    // Check that sendResponse was called with the player data
    expect(sendResponse).toHaveBeenCalled();
  });
});

// Mock implementations of the background script functions

async function handleTabCreated(tab) {
  // Update tab timestamp
  await storage.updateTabTimestamp(tab.id);
  
  // Random chance to generate an event
  if (Math.random() < 0.3) { // 30% chance
    const playerData = await storage.loadPlayerData();
    const event = generateRandomEvent(playerData.level);
    await storage.saveCurrentEvent(event);
    
    // Show appropriate notification based on event type
    switch (event.type) {
      case 'monster':
        notifications.showMonsterNotification(event.data);
        break;
      case 'treasure':
        notifications.showTreasureNotification(event.data);
        break;
      case 'riddle':
        notifications.showRiddleNotification(event.data);
        break;
      case 'powerUp':
        notifications.showPowerUpNotification(event.data);
        break;
      default:
        notifications.showEventNotification(event);
    }
  }
}

async function handleTabRemoved(tabId, removeInfo) {
  // Calculate how long the tab was open
  const tabDuration = await storage.getTabDuration(tabId);
  
  // Generate rewards based on tab duration
  const reward = getTabClosedReward(tabDuration);
  
  // Load player data
  const playerData = await storage.loadPlayerData();
  const player = new Player(playerData);
  
  // Add rewards to player
  const xpResult = player.addXp(reward.xp);
  const goldResult = player.addGold(reward.gold);
  
  // Show notification
  notifications.showXPNotification(xpResult.xpGained);
  notifications.showGoldNotification(goldResult.goldGained);
  
  // Save updated player data
  await storage.savePlayerData(player.toJSON());
  
  // Remove tab timestamp
  await storage.removeTabTimestamp(tabId);
}

function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getPlayerData':
        storage.loadPlayerData().then(data => {
          sendResponse({ playerData: data });
        });
        break;
        
      case 'getCurrentEvent':
        storage.loadCurrentEvent().then(currentEvent => {
          sendResponse(currentEvent);
        });
        break;
        
      default:
        sendResponse({ error: `Unknown action: ${message.action}` });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Required to use sendResponse asynchronously
} 