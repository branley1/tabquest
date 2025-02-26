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
  showQuestCompletionNotification
} from '../utils/notification.js';

// Initialize event listeners
function init() {
  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Tab event listeners
  chrome.tabs.onCreated.addListener(handleTabCreated);
  chrome.tabs.onRemoved.addListener(handleTabRemoved);
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
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
    await updateTabTimestamp(tab.id);
  } catch (error) {
    console.error('Error handling tab created:', error);
  }
}

// Handle tab removed event (tab closed)
async function handleTabRemoved(tabId) {
  try {
    // Calculate tab duration and award XP/gold
    const duration = await getTabDuration(tabId);
    
    if (duration > 5) { // Only reward if tab was open for more than 5 seconds
      const reward = getTabClosedReward(duration);
      
      // Load player data
      const playerData = await loadPlayerData();
      const player = new Player(playerData);
      
      // Add rewards
      const xpResult = player.addXp(reward.xp);
      const goldResult = player.addGold(reward.gold);
      
      // Save player data
      await savePlayerData(player.toJSON());
      
      // Show notifications
      showXPNotification(xpResult.xpGained);
      showGoldNotification(goldResult.goldGained);
      
      if (xpResult.leveledUp) {
        showLevelUpNotification(player.level);
      }
    }
    
    // Remove tab timestamp
    await removeTabTimestamp(tabId);
  } catch (error) {
    console.error('Error handling tab removed:', error);
  }
}

// Handle tab activated event
async function handleTabActivated(activeInfo) {
  try {
    // Update timestamp when tab becomes active
    await updateTabTimestamp(activeInfo.tabId);
    
    // Chance to generate a random event (5% chance)
    if (Math.random() < 0.05) {
      const currentEvent = await loadCurrentEvent();
      if (!currentEvent) {
        const playerData = await loadPlayerData();
        const event = generateRandomEvent(playerData.level);
        await saveCurrentEvent(event);
        showEventNotification(event);
      }
    }
  } catch (error) {
    console.error('Error handling tab activated:', error);
  }
}

// Handle tab updated event
async function handleTabUpdated(tabId, changeInfo, tab) {
  try {
    // If tab is fully loaded, update timestamp
    if (changeInfo.status === 'complete') {
      await updateTabTimestamp(tabId);
    }
  } catch (error) {
    console.error('Error handling tab updated:', error);
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
  handleTabUpdated
}; 