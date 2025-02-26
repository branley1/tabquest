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
import chromeAPI from '../utils/chrome-api.js';
import { checkAchievements } from '../utils/achievements.js';

// Constants
const MIN_TAB_DURATION = 5 * 1000; // Minimum tab duration for rewards (5 seconds)
const MAX_XP_PER_SECOND = 0.1; // Maximum XP per second for tab duration
const MAX_GOLD_PER_SECOND = 0.05; // Maximum gold per second for tab duration

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
    if (!tab || !tab.id) return;
    
    // Load player data
    const playerData = await loadPlayerData();
    if (!playerData) return;
    
    console.log('Tab created:', tab.id);
    return true;
  } catch (error) {
    console.error('Error handling tab creation:', error);
    return false;
  }
}

// Handle tab removed event (tab closed)
async function handleTabRemoved(tabId, removeInfo) {
  try {
    if (!tabId) return;
    
    // Only process if player data exists
    const playerData = await loadPlayerData();
    if (!playerData) return;
    
    console.log('Tab removed:', tabId);
    
    // Process tab duration and rewards
    const duration = await getTabDuration(tabId);
    if (duration >= MIN_TAB_DURATION) {
      // Calculate rewards based on duration
      await processTabClosed(duration);
    }
    
    return true;
  } catch (error) {
    console.error('Error handling tab removal:', error);
    return false;
  }
}

// Handle tab activated event
async function handleTabActivated(activeInfo) {
  try {
    if (!activeInfo || !activeInfo.tabId) return;
    
    console.log('Tab activated:', activeInfo.tabId);
    return true;
  } catch (error) {
    console.error('Error handling tab activation:', error);
    return false;
  }
}

// Handle tab updated event
async function handleTabUpdated(tabId, changeInfo, tab) {
  try {
    if (!tabId || !changeInfo) return;
    
    // Only process when tab is fully loaded
    if (changeInfo.status === 'complete') {
      console.log('Tab updated:', tabId);
    }
    return true;
  } catch (error) {
    console.error('Error handling tab update:', error);
    return false;
  }
}

// Process tab closed event with rewards
async function processTabClosed(duration) {
  try {
    // Load player data
    const playerData = await loadPlayerData();
    if (!playerData) return { xp: 0, gold: 0 };
    
    const player = new Player(playerData);
    
    // Get rewards based on tab duration
    const { xp, gold } = getTabClosedReward(duration, MAX_XP_PER_SECOND, MAX_GOLD_PER_SECOND);
    
    // Apply rewards to player
    player.addXP(xp);
    player.addGold(gold);
    
    // Update quest progress - maintain backward compatibility
    if (typeof updateQuestProgress === 'function') {
      if (Array.isArray(player.quests)) {
        player.quests = updateQuestProgress(player.quests, 'tabs_closed');
      } else {
        updateQuestProgress(player, 'tabs_closed');
      }
    }
    
    // Check for achievements
    const newAchievements = checkAchievements(player, 'tabs_closed', player.stats?.tabsClosed || 0);
    if (newAchievements && newAchievements.length > 0) {
      // Process new achievements
      console.log('New achievements earned:', newAchievements);
    }
    
    // Save player data
    await savePlayerData(player.toJSON());
    
    // Show notification
    await showTabClosedNotification(xp, gold);
    
    return { xp, gold };
  } catch (error) {
    console.error('Error processing tab closed rewards:', error);
    return { xp: 0, gold: 0 };
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
  processTabClosed
}; 