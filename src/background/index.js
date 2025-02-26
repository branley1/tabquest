// TabQuest background service worker
// Handles tab events, game state, and main RPG mechanics

import { Player } from '../models/player.js';
import { 
  generateRandomEvent, 
  getTabClosedReward, 
  updateQuestProgress, 
  quests 
} from '../models/events.js';

import {
  savePlayerData,
  loadPlayerData,
  saveCurrentEvent,
  loadCurrentEvent,
  clearCurrentEvent,
  updateTabTimestamp,
  removeTabTimestamp,
  getTabDuration
} from '../utils/storage.js';

import {
  showLevelUpNotification,
  showQuestCompletionNotification,
  showXPNotification,
  showGoldNotification,
  showEventNotification,
  showAchievementNotification,
  showTabClosedNotification
} from '../utils/notifications.js';

import chromeAPI from '../utils/chrome-api.js';
import { checkAchievements } from '../utils/achievements.js';

// Constants
const EVENT_PROBABILITY = 0.3; // 30% chance of event on tab creation
const MIN_TAB_DURATION = 5 * 1000; // Minimum tab duration for rewards (5 seconds)
const MAX_XP_PER_SECOND = 0.1; // Maximum XP per second for tab duration
const MAX_GOLD_PER_SECOND = 0.05; // Maximum gold per second for tab duration

// Global state
let player = null;
let activeTabId = null;
let tabTimestamps = {};

// Initialize the game state
const initGameState = async () => {
  try {
    // Load player data from storage
    const playerData = await loadPlayerData();
    
    if (playerData && playerData.characterClass) {
      // Player exists and has already selected a class
      player = new Player(playerData);
    } else {
      // Create a new player if none exists or class not selected
      player = new Player(playerData || {});
      await savePlayerData(player.toJSON());
      
      // Set a flag indicating this is a new player (or needs class selection)
      await chromeAPI.saveData('needsClassSelection', true);
    }

    // Ensure player has quests - only initialize if empty
    if (!player.quests || player.quests.length === 0) {
      // Import initial quests from events.js and add them to the player
      player.quests = [...quests];
      // Save the updated player data with quests
      await savePlayerData(player.toJSON());
    }
    
    return player; // Return player for testing
  } catch (error) {
    console.error('Error initializing game state:', error);
    return null;
  }
};

// Handle tab created event
const handleTabCreated = async (tab) => {
  // Update tab timestamp
  await updateTabTimestamp(tab.id);
  
  // Random chance to generate an event
  if (Math.random() < EVENT_PROBABILITY) {
    try {
      // Load player data
      const playerData = await loadPlayerData();
      const player = new Player(playerData);
      
      // Generate a random event
      const event = generateRandomEvent(player.level);
      
      // Save the event
      await saveCurrentEvent(event);
      
      // Show a notification
      await showEventNotification(event);
    } catch (error) {
      console.error('Error generating event:', error);
    }
  }
};

// Handle tab activated event
const handleTabActivated = async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  await updateTabTimestamp(activeTabId);
};

// Handle tab updated event
const handleTabUpdated = async (tabId, changeInfo, tab) => {
  // Only update timestamp when the tab is fully loaded
  if (changeInfo.status === 'complete') {
    await updateTabTimestamp(tabId);
  }
};

// Handle tab removed event
const handleTabRemoved = async (tabId, removeInfo) => {
  try {
    // Get the duration the tab was open
    const duration = await getTabDuration(tabId);
    
    // Remove the tab from storage
    await removeTabTimestamp(tabId);
    
    // Only give rewards if the tab was open for at least MIN_TAB_DURATION
    if (duration >= MIN_TAB_DURATION) {
      // Calculate rewards based on duration
      const reward = getTabClosedReward(duration, MAX_XP_PER_SECOND, MAX_GOLD_PER_SECOND);
      
      // Load player data
      const playerData = await loadPlayerData();
      player = new Player(playerData);
      
      // Add rewards to player
      const xpResult = player.addXp(reward.xp);
      player.addGold(reward.gold);
      
      // Check for level up
      const leveledUp = player.checkLevelUp();
      
      // Save player data
      await savePlayerData(player.toJSON());
      
      // Show notifications
      await showTabClosedNotification(reward.xp, reward.gold);
      
      if (leveledUp) {
        await showLevelUpNotification(player.level);
      }

      // Check for new achievements
      const newAchievements = checkAchievements(player, 'monsters_defeated', player.quests.filter(q => q.type === 'monster').length);
      if (newAchievements.length > 0) {
        // Show achievement notifications
        newAchievements.forEach(achievement => {
          showAchievementNotification(achievement.title);
        });
      }
    }
  } catch (error) {
    console.error('Error handling tab removal:', error);
  }
};

// Handle resolving current event
const resolveCurrentEvent = async (sendResponse) => {
  const event = await loadCurrentEvent();
  
  if (!event) {
    sendResponse({ success: false, error: 'No active event' });
    return;
  }
  
  // Load player data
  const playerData = await loadPlayerData();
  player = new Player(playerData);
  
  // Apply rewards based on event type
  switch (event.type) {
    case 'monster':
      player.addXp(event.data.xp);
      player.addGold(event.data.gold);
      player.quests = updateQuestProgress(player.quests, 'monsters_defeated');
      break;
    case 'treasure':
      player.addXp(event.data.xp);
      player.addGold(event.data.gold);
      player.quests = updateQuestProgress(player.quests, 'treasures_found');
      break;
    case 'riddle':
      player.addXp(event.data.xp);
      player.addGold(event.data.gold);
      player.quests = updateQuestProgress(player.quests, 'riddles_solved');
      break;
    case 'powerUp':
      player.addBuff(event.data);
      break;
  }
  
  // Check for level up
  if (player.checkLevelUp()) {
    showLevelUpNotification(player.level);
  }
  
  // Check for completed quests
  const completedQuests = player.quests.filter(q => q.isNew);
  completedQuests.forEach(quest => {
    showQuestCompletionNotification(quest);
  });
  
  // Clear current event
  await clearCurrentEvent();
  
  // Save updated player data
  await savePlayerData(player.toJSON());
  
  // Check for new achievements
  const newAchievements = checkAchievements(player, event.type, event.data.value);
  if (newAchievements.length > 0) {
    // Show achievement notifications
    newAchievements.forEach(achievement => {
      showAchievementNotification(achievement.title);
    });
  }
  
  sendResponse({ success: true });
};

// Set up event listeners
chromeAPI.addTabCreatedListener(handleTabCreated);
chromeAPI.addTabActivatedListener(handleTabActivated);
chromeAPI.addTabUpdatedListener(handleTabUpdated);
chromeAPI.addTabRemovedListener(handleTabRemoved);

// Handle messages from popup or content scripts
chromeAPI.addMessageListener((message, sender, sendResponse) => {
  if (!message.action) {
    sendResponse({ error: 'No action specified' });
    return;
  }
  
  try {
    switch (message.action) {
      case 'getPlayerData':
        loadPlayerData()
          .then(playerData => {
            sendResponse({ playerData });
          })
          .catch(error => {
            console.error('Error loading player data:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'getCurrentEvent':
        loadCurrentEvent()
          .then(currentEvent => {
            sendResponse(currentEvent);
          })
          .catch(error => {
            console.error('Error loading current event:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'generateEvent':
        loadPlayerData()
          .then(playerDataForEvent => {
            const player = new Player(playerDataForEvent);
            const event = generateRandomEvent(player.level);
            
            return saveCurrentEvent(event)
              .then(() => {
                showEventNotification(event);
                return event;
              });
          })
          .then(event => {
            sendResponse(event);
          })
          .catch(error => {
            console.error('Error generating event:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'resolveEvent':
        clearCurrentEvent()
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error resolving event:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'updatePlayer':
        if (!message.data) {
          sendResponse({ error: 'No player data provided' });
          return;
        }
        
        savePlayerData(message.data)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error updating player:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'completeQuest':
        if (!message.questId) {
          sendResponse({ error: 'No quest ID provided' });
          return;
        }
        
        loadPlayerData()
          .then(playerDataForQuest => {
            const playerForQuest = new Player(playerDataForQuest);
            
            // Complete the quest
            const result = playerForQuest.completeQuest(message.questId);
            
            // Save player data
            return savePlayerData(playerForQuest.toJSON())
              .then(() => {
                // Show notifications
                if (result.xpGained > 0) {
                  showXPNotification(result.xpGained);
                }
                
                if (result.goldGained > 0) {
                  showGoldNotification(result.goldGained);
                }
                
                if (result.leveledUp) {
                  showLevelUpNotification(playerForQuest.level);
                }
                
                return result;
              });
          })
          .then(result => {
            sendResponse({
              success: true,
              xpGained: result.xpGained,
              goldGained: result.goldGained,
              leveledUp: result.leveledUp
            });
          })
          .catch(error => {
            console.error('Error completing quest:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'addQuest':
        if (!message.quest) {
          sendResponse({ error: 'No quest provided' });
          return;
        }
        
        loadPlayerData()
          .then(playerDataForAddQuest => {
            const playerForAddQuest = new Player(playerDataForAddQuest);
            
            // Add the quest
            playerForAddQuest.addQuest(message.quest);
            
            // Save player data
            return savePlayerData(playerForAddQuest.toJSON());
          })
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error adding quest:', error);
            sendResponse({ error: error.message });
          });
        break;
        
      case 'setCharacterClass':
        if (!message.className) {
          sendResponse({ success: false, error: 'No class name provided' });
          return;
        }
        
        loadPlayerData()
          .then(playerData => {
            const player = new Player(playerData || {});
            const success = player.setCharacterClass(message.className);
            
            if (!success) {
              throw new Error(`Invalid character class: ${message.className}`);
            }
            
            return savePlayerData(player.toJSON());
          })
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        break;
        
      default:
        sendResponse({ error: `Unknown action: ${message.action}` });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  
  // Return true to indicate that we will send a response asynchronously
  return true;
});

// Initialize the game state when the extension loads
initGameState(); 