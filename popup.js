// TabQuest Popup JavaScript

// Add state management and cleanup utilities at the top
const STATE = {
  initialized: false,
  eventListeners: new Set(),
};

// Helper function for safe DOM lookup
const getEl = (id) => {
  const el = document.getElementById(id);
  if (!el) { console.warn(`Element with ID "${id}" not found`); }
  return el;
};

// Helper for safe message sending
const sendMessage = (message) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      reject(error);
    }
  });
};

// Helper for safe event listener addition with cleanup
const addSafeEventListener = (element, event, handler) => {
  if (!element) {
    console.warn(`Attempted to add ${event} listener to non-existent element`);
    return;
  }
  element.addEventListener(event, handler);
  STATE.eventListeners.add({ element, event, handler });
};

// Cleanup function
const cleanup = () => {
  STATE.eventListeners.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler);
  });
  STATE.eventListeners.clear();
};

// Replace DOM element retrieval using getEl
const levelBadge = getEl('level-badge');
const playerXp = getEl('player-xp');
const xpNeeded = getEl('xp-needed');
const playerGold = getEl('player-gold');
const characterSelection = getEl('character-selection');
const confirmClassBtn = getEl('confirm-class');
const currentEventSection = getEl('current-event');
const eventContainer = getEl('event-container');
const buffsContainer = getEl('buffs-container');
const noBuffsMessage = getEl('no-buffs-message');
const questsContainer = getEl('quests-container');
const achievementsContainer = getEl('achievements-container');
const noAchievementsMessage = getEl('no-achievements-message');
const gameContainer = getEl('game-container');

// Templates
const monsterTemplate = getEl('monster-event-template');
const treasureTemplate = getEl('treasure-event-template');
const riddleTemplate = getEl('riddle-event-template');
const powerupTemplate = getEl('powerup-event-template');
const buffTemplate = getEl('buff-template');
const questTemplate = getEl('quest-template');
const achievementTemplate = getEl('achievement-template');

// Game state
let player = null;
let currentEvent = null;
let selectedClass = null;

// If using ES modules (recommended)
import * as storage from './src/utils/storage.js';
import { Player, CHARACTER_CLASSES } from './src/models/player.js';

// Load player data from background script with improved error handling
const loadPlayerData = async () => {
  try {
    const response = await sendMessage({ action: 'getPlayerData' });
    if (response?.playerData) {
      player = response.playerData;
    }
  } catch (error) {
    console.error('Failed to load player data:', error);
    throw error;
  }
};

// Load current event with improved error handling
const loadCurrentEvent = async () => {
  try {
    const response = await sendMessage({ action: 'getCurrentEvent' });
    if (response?.eventData) {
      currentEvent = response.eventData;
    }
  } catch (error) {
    console.error('Failed to load current event:', error);
    throw error;
  }
};

// Update player stats with validation
const updatePlayerStats = () => {
  if (!player) {
    console.warn('Attempted to update stats with no player data');
    return;
  }

  if (levelBadge) levelBadge.textContent = player.level || 1;
  if (playerXp) playerXp.textContent = player.xp || 0;
  
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, (player.level || 1) - 1));
  if (xpNeeded) xpNeeded.textContent = xpForNextLevel;
  
  if (playerGold) playerGold.textContent = player.gold || 0;
  
  const playerClassElement = getEl('player-class');
  if (playerClassElement && player.characterClass) {
    const characterClassName = CHARACTER_CLASSES[player.characterClass]?.name || player.characterClass;
    playerClassElement.textContent = characterClassName;
  }
};

// Define missing showGameInterface function
const showGameInterface = () => {
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
  }
  updatePlayerStats();
  updateQuests();
};

// Show character selection with cleanup
const showCharacterSelection = () => {
  cleanup(); // Remove old listeners before adding new ones
  
  if (gameContainer) gameContainer.classList.add('hidden');
  if (characterSelection) characterSelection.classList.remove('hidden');
  
  const classesContainer = document.querySelector('.class-cards-container');
  if (!classesContainer) {
    console.error('Class cards container not found');
    return;
  }
  
  classesContainer.innerHTML = '';
  
  // Get class definitions
  const classes = {
    warrior: {
      name: 'Warrior',
      description: 'Gains 10% more XP from defeating monsters',
      icon: 'icons/warrior.svg',
      bonuses: 'XP +10%'
    },
    mage: {
      name: 'Mage',
      description: 'Gains 20% more XP from all sources',
      icon: 'icons/mage.svg',
      bonuses: 'XP +20%'
    },
    rogue: {
      name: 'Rogue',
      description: 'Gains 20% more gold from all sources',
      icon: 'icons/rogue.svg',
      bonuses: 'Gold +20%'
    }
  };
  
  // Create class cards with detailed information
  Object.keys(classes).forEach(className => {
    const classInfo = classes[className];
    const card = document.createElement('div');
    card.className = 'class-card';
    card.dataset.class = className;
    
    card.innerHTML = `
      <img src="${classInfo.icon}" alt="${classInfo.name}" class="class-icon">
      <h3>${classInfo.name}</h3>
      <p>${classInfo.description}</p>
      <div class="class-bonuses">${classInfo.bonuses}</div>
    `;
    
    if (classesContainer) classesContainer.appendChild(card);
    
    // Add event listener to card
    card.addEventListener('click', () => {
      document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedClass = className;
      if (confirmClassBtn) confirmClassBtn.disabled = false;
    });
  });
  
  // Add event listener to confirm button if it exists
  if (confirmClassBtn) {
    confirmClassBtn.addEventListener('click', async () => {
      if (selectedClass) {
        confirmClassBtn.disabled = true;
        confirmClassBtn.textContent = 'Creating character...';
        
        chrome.runtime.sendMessage({
          action: 'setCharacterClass',
          className: selectedClass
        }, async (response) => {
          if (response && response.success) {
            // Clear the needs class selection flag
            await chromeAPI.storage.local.set({ 'needsClassSelection': false });
            
            // Add a nice transition effect
            characterSelection.classList.add('fade-out');
            
            // Wait for transition
            setTimeout(async () => {
              // Hide character selection and reload data
              characterSelection.classList.add('hidden');
              characterSelection.classList.remove('fade-out');
              
              // Show welcome message
              const playerData = await loadPlayerData();
              const newPlayer = new Player(playerData);
              
              // Show welcome notification
              showNotification(
                `Welcome, brave ${CHARACTER_CLASSES[newPlayer.characterClass].name}!`, 
                'Your adventure begins now. Close tabs to earn XP and gold!'
              );
              
              // Update UI with player data
              if (gameContainer) gameContainer.classList.remove('hidden');
              updatePlayerStats();
              
              // Load current event if any
              await loadCurrentEvent();
              if (currentEvent) {
                displayCurrentEvent();
              }
            }, 500);
          } else {
            // Show error
            confirmClassBtn.textContent = 'Try Again';
            confirmClassBtn.disabled = false;
            showNotification('Error', response.error || 'Failed to select class');
          }
        });
      }
    });
  }
};

// Validate event data
const validateEventData = (event) => {
  if (!event || typeof event !== 'object') return false;
  if (!event.type || !event.data) return false;
  
  switch (event.type) {
    case 'monster':
      return event.data.name && event.data.level && 
             typeof event.data.xp === 'number' && 
             typeof event.data.gold === 'number';
    case 'treasure':
      return event.data.name && 
             typeof event.data.xp === 'number' && 
             typeof event.data.gold === 'number';
    case 'riddle':
      return event.data.question && 
             typeof event.data.xp === 'number' && 
             typeof event.data.gold === 'number';
    case 'powerUp':
      return event.data.name && event.data.description && 
             typeof event.data.duration === 'number';
    default:
      return false;
  }
};

// Display current event with validation
const displayCurrentEvent = () => {
  if (!currentEvent || !validateEventData(currentEvent)) {
    console.error('Invalid event data:', currentEvent);
    return;
  }

  if (eventContainer) eventContainer.innerHTML = '';
  if (currentEventSection) currentEventSection.classList.remove('hidden');
  
  let eventElement;
  try {
    switch (currentEvent.type) {
      case 'monster':
        eventElement = createMonsterEvent(currentEvent.data);
        break;
      case 'treasure':
        eventElement = createTreasureEvent(currentEvent.data);
        break;
      case 'riddle':
        eventElement = createRiddleEvent(currentEvent.data);
        break;
      case 'powerUp':
        eventElement = createPowerUpEvent(currentEvent.data);
        break;
      default:
        console.warn('Unknown event type:', currentEvent.type);
        return;
    }
  } catch (error) {
    console.error('Failed to create event element:', error);
    return;
  }
  
  if (eventElement && eventContainer) {
    eventContainer.appendChild(eventElement);
  }
};

// Safe template cloning
const safeCloneTemplate = (template, type) => {
  if (!template) {
    throw new Error(`Template for ${type} not found`);
  }
  try {
    return template.content.cloneNode(true);
  } catch (error) {
    throw new Error(`Failed to clone ${type} template: ${error.message}`);
  }
};

// Safe querySelector with error handling
const safeQuerySelector = (element, selector) => {
  const result = element.querySelector(selector);
  if (!result) {
    throw new Error(`Element with selector "${selector}" not found`);
  }
  return result;
};

// Create monster event element with error handling
const createMonsterEvent = (monster) => {
  try {
    const clone = safeCloneTemplate(monsterTemplate, 'monster');
    
    safeQuerySelector(clone, '.monster-image').src = `icons/monsters/${monster.image}`;
    safeQuerySelector(clone, '.monster-name').textContent = monster.name;
    safeQuerySelector(clone, '.monster-level span').textContent = monster.level;
    safeQuerySelector(clone, '.monster-rewards .xp').textContent = monster.xp;
    safeQuerySelector(clone, '.monster-rewards .gold').textContent = monster.gold;
    
    const defeatButton = safeQuerySelector(clone, '.defeat-monster');
    addSafeEventListener(defeatButton, 'click', handleMonsterDefeat);
    
    return clone;
  } catch (error) {
    console.error('Failed to create monster event:', error);
    return null;
  }
};

// Create treasure event element with error handling
const createTreasureEvent = (treasure) => {
  try {
    const clone = safeCloneTemplate(treasureTemplate, 'treasure');
    
    safeQuerySelector(clone, '.treasure-image').src = `icons/treasures/${treasure.image}`;
    safeQuerySelector(clone, '.treasure-name').textContent = treasure.name;
    safeQuerySelector(clone, '.treasure-rewards .xp').textContent = treasure.xp;
    safeQuerySelector(clone, '.treasure-rewards .gold').textContent = treasure.gold;
    
    return clone;
  } catch (error) {
    console.error('Failed to create treasure event:', error);
    return null;
  }
};

// Create riddle event element with error handling
const createRiddleEvent = (riddle) => {
  try {
    const clone = safeCloneTemplate(riddleTemplate, 'riddle');
    
    safeQuerySelector(clone, '.riddle-question').textContent = riddle.question;
    safeQuerySelector(clone, '.riddle-rewards .xp').textContent = riddle.xp;
    safeQuerySelector(clone, '.riddle-rewards .gold').textContent = riddle.gold;
    
    const submitButton = safeQuerySelector(clone, '.submit-answer');
    const answerInput = safeQuerySelector(clone, '.riddle-answer');
    
    addSafeEventListener(submitButton, 'click', () => {
      const answer = answerInput.value.trim();
      if (answer) {
        handleRiddleAnswer(answer);
      }
    });
    
    return clone;
  } catch (error) {
    console.error('Failed to create riddle event:', error);
    return null;
  }
};

// Create power-up event element with error handling
const createPowerUpEvent = (powerUp) => {
  try {
    const clone = safeCloneTemplate(powerupTemplate, 'power-up');
    
    safeQuerySelector(clone, '.powerup-image').src = `icons/powerups/${powerUp.image}`;
    safeQuerySelector(clone, '.powerup-name').textContent = powerUp.name;
    safeQuerySelector(clone, '.powerup-description').textContent = powerUp.description;
    
    const minutes = Math.floor(powerUp.duration / 60);
    safeQuerySelector(clone, '.powerup-duration span').textContent = `${minutes} minutes`;
    
    return clone;
  } catch (error) {
    console.error('Failed to create power-up event:', error);
    return null;
  }
};

// Update buffs display with validation
const updateBuffs = () => {
  if (!buffsContainer) return;
  
  try {
    buffsContainer.innerHTML = '';
    
    if (!player?.buffs?.length) {
      if (noBuffsMessage) buffsContainer.appendChild(noBuffsMessage);
      return;
    }
    
    if (noBuffsMessage) noBuffsMessage.remove();
    
    const now = Date.now();
    const activeBuffs = player.buffs.filter(buff => buff.expiresAt > now);
    
    activeBuffs.forEach(buff => {
      try {
        const clone = safeCloneTemplate(buffTemplate, 'buff');
        
        safeQuerySelector(clone, '.buff-icon').src = `icons/powerups/${buff.image}`;
        safeQuerySelector(clone, '.buff-name').textContent = buff.name;
        safeQuerySelector(clone, '.buff-description').textContent = buff.description;
        
        const totalDuration = buff.duration * 1000;
        const elapsed = now - (buff.expiresAt - totalDuration);
        const percentage = Math.max(0, 100 - (elapsed / totalDuration * 100));
        
        safeQuerySelector(clone, '.timer-bar').style.width = `${percentage}%`;
        
        buffsContainer.appendChild(clone);
      } catch (error) {
        console.error('Failed to create buff element:', error);
      }
    });
  } catch (error) {
    console.error('Failed to update buffs:', error);
  }
};

// Update quests display with validation
const updateQuests = () => {
  if (!questsContainer || !player?.quests) {
    console.warn('Cannot update quests: missing container or quest data');
    return;
  }
  
  try {
    questsContainer.innerHTML = '';
    
    const sortedQuests = [...player.quests].sort((a, b) => {
      if (!a || !b) return 0;
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });
    
    sortedQuests.forEach(quest => {
      if (!quest) return;
      
      try {
        const clone = safeCloneTemplate(questTemplate, 'quest');
        
        safeQuerySelector(clone, '.quest-name').textContent = quest.name;
        safeQuerySelector(clone, '.quest-description').textContent = quest.description;
        
        const percentage = Math.min(100, ((quest.progress || 0) / (quest.goal || 1)) * 100);
        safeQuerySelector(clone, '.progress-fill').style.width = `${percentage}%`;
        safeQuerySelector(clone, '.progress-text').textContent = 
          `${quest.progress || 0}/${quest.goal || 1}`;
        
        const rewards = safeQuerySelector(clone, '.quest-rewards');
        
        if (quest.reward?.xp) {
          const xpReward = rewards.querySelector('.reward-xp');
          if (xpReward) xpReward.textContent = `${quest.reward.xp} XP`;
        } else {
          rewards.querySelector('.reward-xp')?.remove();
        }
        
        if (quest.reward?.gold) {
          const goldReward = rewards.querySelector('.reward-gold');
          if (goldReward) goldReward.textContent = `${quest.reward.gold} Gold`;
        } else {
          rewards.querySelector('.reward-gold')?.remove();
        }
        
        if (quest.reward?.item?.name) {
          const itemReward = rewards.querySelector('.reward-item');
          if (itemReward) itemReward.textContent = quest.reward.item.name;
        } else {
          rewards.querySelector('.reward-item')?.remove();
        }
        
        if (quest.completed) {
          safeQuerySelector(clone, '.quest').classList.add('completed');
        }
        
        questsContainer.appendChild(clone);
      } catch (error) {
        console.error('Failed to create quest element:', error);
      }
    });
  } catch (error) {
    console.error('Failed to update quests:', error);
  }
};

// Update achievements display with validation
const updateAchievements = () => {
  if (!achievementsContainer) {
    console.warn('Cannot update achievements: missing container');
    return;
  }
  
  try {
    achievementsContainer.innerHTML = '';
    
    if (!player?.achievements?.length) {
      if (achievementsContainer && noAchievementsMessage) {
        achievementsContainer.appendChild(noAchievementsMessage);
      }
      return;
    }
    
    if (noAchievementsMessage) noAchievementsMessage.remove();
    
    player.achievements.forEach(achievement => {
      if (!achievement) return;
      
      try {
        const clone = safeCloneTemplate(achievementTemplate, 'achievement');
        
        safeQuerySelector(clone, '.achievement-title').textContent = 
          achievement.title || 'Unknown Achievement';
        
        const date = new Date(achievement.completedAt || Date.now());
        const formattedDate = date.toLocaleDateString();
        safeQuerySelector(clone, '.achievement-date').textContent = 
          `Earned on ${formattedDate}`;
        
        achievementsContainer.appendChild(clone);
      } catch (error) {
        console.error('Failed to create achievement element:', error);
      }
    });
  } catch (error) {
    console.error('Failed to update achievements:', error);
  }
};

// Check if user is new (no character selected yet)
async function checkNewUser() {
  const playerData = await storage.loadPlayerData();
  if (!playerData || !playerData.characterClass) {
    showCharacterSelection();
  } else {
    showGameInterface();
  }
}

// Initialize popup with proper cleanup and error handling
const initializePopup = async () => {
  if (STATE.initialized) {
    console.warn('Popup already initialized');
    return;
  }

  try {
    cleanup();
    const data = await chromeAPI.storage.local.get('needsClassSelection');
    await loadPlayerData();

    if (data?.needsClassSelection || !player?.characterClass) {
      await showCharacterSelection();
    } else {
      updatePlayerStats();
      updateQuests();
      const currentEventData = await loadCurrentEvent();
      if (currentEventData) {
        displayCurrentEvent();
      }
    }

    addClassChangeButton();
    STATE.initialized = true;
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    // Show error to user
    if (getEl('error-message')) {
      getEl('error-message').textContent = 'Failed to load game data. Please try again.';
    }
  }
};

// Replace the DOMContentLoaded listener
addSafeEventListener(document, 'DOMContentLoaded', initializePopup);

// Add unload cleanup
addSafeEventListener(window, 'unload', cleanup);

// Define loadPlayerStats with error handling
async function loadPlayerStats() {
  try {
    const playerData = await storage.loadPlayerData();
    
    if (playerData) {
      getEl('level').textContent = playerData.level || 1;
      getEl('xp').textContent = 
        `${playerData.xp || 0} / ${playerData.xpToNextLevel || 100} XP`;
      getEl('gold').textContent = 
        `${playerData.gold || 0} Gold`;
    } else {
      // Initialize new player if no data exists
      const newPlayer = {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        gold: 0,
        characterClass: null // This should be set during character selection
      };
      await storage.savePlayerData(newPlayer);
      // Display values from new player object
      getEl('level').textContent = newPlayer.level;
      getEl('xp').textContent = 
        `${newPlayer.xp} / ${newPlayer.xpToNextLevel} XP`;
      getEl('gold').textContent = 
        `${newPlayer.gold} Gold`;
    }
  } catch (error) {
    console.error('Failed to load player stats:', error);
  }
}

// Set up character selection event listeners
const characterOptions = document.querySelectorAll('.character-option');
if (characterOptions) {
  characterOptions.forEach(option => {
    option.addEventListener('click', async () => {
      const characterClass = option.dataset.class;
      // Initialize player with selected class
      const newPlayer = new Player(characterClass);
      await storage.savePlayerData(newPlayer.toJSON());
      
      // Hide selection screen, show game interface
      showGameInterface();
    });
  });
}

const xpIcon = getEl('xp-icon');
if (xpIcon) {
  xpIcon.onerror = () => console.error('Failed to load image:', xpIcon.src);
  xpIcon.onload = () => console.log('Image loaded successfully:', xpIcon.src);
} else {
  console.warn('Element not found:', 'xp-icon');
}

// Change any JS that sets image sources:
const goldIcon = getEl('gold-icon');
if (goldIcon) {
  goldIcon.src = 'icons/gold.svg';
}
if (xpIcon) {
  xpIcon.src = 'icons/xp.svg';
}

// Add this function to allow changing class later
const addClassChangeButton = () => {
  const settingsContainer = document.querySelector('.settings-container');
  if (!settingsContainer) return;
  
  try {
    const changeClassBtn = document.createElement('button');
    changeClassBtn.textContent = 'Change Character Class';
    changeClassBtn.className = 'settings-button';
    
    const handleClassChange = () => {
      showCharacterSelection();
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'secondary-button';
      cancelBtn.style.marginRight = '10px';
      
      const buttonsContainer = document.querySelector('.character-selection-buttons');
      if (buttonsContainer) {
        buttonsContainer.prepend(cancelBtn);
        
        const handleCancel = () => {
          characterSelection.classList.add('hidden');
          if (gameContainer) gameContainer.classList.remove('hidden');
          cancelBtn.removeEventListener('click', handleCancel);
        };
        
        addSafeEventListener(cancelBtn, 'click', handleCancel);
      }
    };
    
    addSafeEventListener(changeClassBtn, 'click', handleClassChange);
    settingsContainer.appendChild(changeClassBtn);
  } catch (error) {
    console.error('Failed to add class change button:', error);
  }
};

// Update the event handlers to use sendMessage
const handleMonsterDefeat = async () => {
  try {
    const response = await sendMessage({ action: 'handleMonsterDefeat' });
    if (response?.success) {
      if (currentEventSection) currentEventSection.classList.add('hidden');
      await loadPlayerData();
      updatePlayerStats();
      updateQuests();
    }
  } catch (error) {
    console.error('Failed to handle monster defeat:', error);
  }
};

// Update riddle answer handler
const handleRiddleAnswer = async (answer) => {
  try {
    const response = await sendMessage({ 
      action: 'handleRiddleAnswer', 
      answer: answer.trim() 
    });
    
    if (response?.success) {
      if (response.correct) {
        if (currentEventSection) currentEventSection.classList.add('hidden');
        await loadPlayerData();
        updatePlayerStats();
      } else {
        alert('Incorrect answer. Try again!');
      }
    }
  } catch (error) {
    console.error('Failed to handle riddle answer:', error);
  }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEventData,
    safeCloneTemplate,
    safeQuerySelector,
    cleanup,
    STATE
  };
}
