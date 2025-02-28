// Background service worker for TabQuest
import { Player } from '../models/player.js';
import { generateRandomEvent, getTabClosedReward, updateQuestProgress } from '../utils/events.js';
import {
  savePlayerData,
  loadPlayerData,
  updateTabTimestamp,
  removeTabTimestamp,
  getTabDuration,
  saveCurrentEvent,
  loadCurrentEvent,
  clearCurrentEvent
} from '../utils/storage.js';
import {
  showXPNotification,
  showGoldNotification,
  showLevelUpNotification,
  showEventNotification,
  showQuestCompletionNotification,
  showTabClosedNotification
} from '../utils/notifications.js';
import { chromeAPI } from '../utils/chrome-api.js';
import { checkAchievements } from '../utils/achievements.js';

// Constants
const MIN_TAB_DURATION = 5000; // 5 seconds
const MAX_XP_PER_SECOND = 2;
const MAX_GOLD_PER_SECOND = 1;

// Initialize tab tracking
const tabTimestamps = new Map();

// Initialize event listeners
function init() {
  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Tab event listeners
  chromeAPI.addTabCreatedListener(handleTabCreated);
  chromeAPI.addTabRemovedListener(handleTabRemoved);
  chromeAPI.addTabActivatedListener(handleTabActivated);
  chromeAPI.addTabUpdatedListener(handleTabUpdated);
}

// Handle messages from content script or popup
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getPlayerData':
        const playerData = await loadPlayerData();
        sendResponse(playerData);
        break;
        
      case 'getCurrentEvent':
        const currentEvent = await loadCurrentEvent();
        sendResponse(currentEvent);
        break;
        
      case 'resolveEvent':
        await resolveCurrentEvent(sendResponse);
        break;
        
      case 'generateEvent':
        const playerInfo = await loadPlayerData();
        const event = generateRandomEvent(playerInfo.level);
        await saveCurrentEvent(event);
        showEventNotification(event);
        sendResponse(event);
        break;
        
      case 'updatePlayer':
        await savePlayerData(message.data);
        sendResponse({ success: true });
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

// Resolve current event (monster defeated, treasure collected, etc.)
async function resolveCurrentEvent(sendResponse) {
  try {
    const event = await loadCurrentEvent();
    if (!event) {
      sendResponse({ error: 'No active event' });
      return;
    }
    
    const playerData = await loadPlayerData();
    const player = new Player(playerData);
    
    switch (event.type) {
      case 'monster':
        const monsterXp = event.data.xp;
        const monsterGold = event.data.gold;
        
        const xpResult = player.addXp(monsterXp);
        showXPNotification(xpResult.xpGained);
        
        const goldResult = player.addGold(monsterGold);
        showGoldNotification(goldResult.goldGained);
        
        if (xpResult.leveledUp) {
          showLevelUpNotification(player.level);
        }
        break;
        
      case 'treasure':
        const treasureGold = event.data.gold;
        const goldGained = player.addGold(treasureGold).goldGained;
        showGoldNotification(goldGained);
        break;
        
      case 'powerup':
        player.addBuff(event.data);
        break;
        
      case 'riddle':
        const riddleXp = event.data.xp;
        const xpGained = player.addXp(riddleXp).xpGained;
        showXPNotification(xpGained);
        break;
        
      default:
        sendResponse({ error: `Unknown event type: ${event.type}` });
        return;
    }
    
    // Progress quests based on event
    const newQuests = updateQuestProgress(player.quests, event.type);
    player.quests = newQuests;
    
    // Check for completed quests
    const completedQuests = player.quests.filter(q => q.isNew);
    for (const quest of completedQuests) {
      showQuestCompletionNotification(quest);
      
      // Add rewards
      player.addXp(quest.xpReward);
      player.addGold(quest.goldReward);
    }
    
    // Save updated player data
    await savePlayerData(player.toJSON());
    
    // Clear current event
    await clearCurrentEvent();
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error resolving event:', error);
    sendResponse({ error: error.message });
  }
}

// Handle tab created event
async function handleTabCreated(tab) {
  try {
    if (!tab || !tab.id) {
      console.error('Invalid tab data received in handleTabCreated');
      return;
    }

    // Load player data first
    const player = await loadPlayerData();
    if (!player) {
      console.error('Failed to load player data in handleTabCreated');
      return;
    }

    // Store tab creation timestamp
    tabTimestamps.set(tab.id, Date.now());

    // Generate a random event
    const event = await generateRandomEvent(player.level);
    if (event) {
      await saveCurrentEvent(event);
      await showEventNotification(event);
    }
  } catch (error) {
    console.error('Error in handleTabCreated:', error);
  }
}

// Handle tab removed event (tab closed)
async function handleTabRemoved(tabId) {
  try {
    if (!tabId) {
      console.error('Invalid tab ID received in handleTabRemoved');
      return;
    }

    await processTabClosed(tabId);
  } catch (error) {
    console.error('Error in handleTabRemoved:', error);
  }
}

// Handle tab activated event
async function handleTabActivated(activeInfo) {
  try {
    if (!activeInfo || !activeInfo.tabId) {
      console.error('Invalid tab activation data received');
      return;
    }

    const tab = await chromeAPI.tabs.get(activeInfo.tabId);
    if (!tab) {
      console.error('Failed to get tab data in handleTabActivated');
      return;
    }

    // Additional tab activation logic can be added here
  } catch (error) {
    console.error('Error in handleTabActivated:', error);
  }
}

// Handle tab updated event
async function handleTabUpdated(tabId, changeInfo, tab) {
  try {
    if (!tabId || !tab) {
      console.error('Invalid tab update data received');
      return;
    }

    // Additional tab update logic can be added here
  } catch (error) {
    console.error('Error in handleTabUpdated:', error);
  }
}

// Process tab closed event
async function processTabClosed(tabId) {
  try {
    const creationTime = tabTimestamps.get(tabId);
    if (!creationTime) {
      console.warn('No creation timestamp found for tab:', tabId);
      return;
    }

    // Calculate duration
    const duration = Date.now() - creationTime;
    if (duration < MIN_TAB_DURATION) {
      console.log('Tab was open for too short a duration');
      return;
    }

    // Load player data
    const player = await loadPlayerData();
    if (!player) {
      console.error('Failed to load player data in processTabClosed');
      return;
    }

    // Calculate rewards
    const durationInSeconds = Math.floor(duration / 1000);
    const xpGained = Math.min(durationInSeconds * MAX_XP_PER_SECOND, player.level * 100);
    const goldGained = Math.min(durationInSeconds * MAX_GOLD_PER_SECOND, player.level * 50);

    // Update player data
    player.xp += xpGained;
    player.gold += goldGained;

    // Check for level up
    if (player.xp >= player.level * 1000) {
      player.level += 1;
      player.xp = 0;
      await showLevelUpNotification(player.level);
    }

    // Save updated player data
    await savePlayerData(player.toJSON());

    // Update quest progress
    await updateQuestProgress(player.quests, 'closeTabs', 1);

    // Check achievements
    await checkAchievements(player);

    // Show notification
    await showTabClosedNotification(xpGained, goldGained);

    // Clean up
    tabTimestamps.delete(tabId);
  } catch (error) {
    console.error('Error in processTabClosed:', error);
  }
}

// Initialize the service worker
init();

// Export functions for testing
export {
  handleMessage,
  resolveCurrentEvent,
  handleTabCreated,
  handleTabRemoved,
  handleTabActivated,
  handleTabUpdated,
  processTabClosed,
  tabTimestamps
}; 