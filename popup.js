// TabQuest Popup JavaScript

// DOM Elements
const levelBadge = document.getElementById('level-badge');
const playerXp = document.getElementById('player-xp');
const xpNeeded = document.getElementById('xp-needed');
const playerGold = document.getElementById('player-gold');
const characterSelection = document.getElementById('character-selection');
const confirmClassBtn = document.getElementById('confirm-class');
const currentEventSection = document.getElementById('current-event');
const eventContainer = document.getElementById('event-container');
const buffsContainer = document.getElementById('buffs-container');
const noBuffsMessage = document.getElementById('no-buffs-message');
const questsContainer = document.getElementById('quests-container');
const achievementsContainer = document.getElementById('achievements-container');
const noAchievementsMessage = document.getElementById('no-achievements-message');
const gameContainer = document.getElementById('game-container');

// Templates
const monsterTemplate = document.getElementById('monster-event-template');
const treasureTemplate = document.getElementById('treasure-event-template');
const riddleTemplate = document.getElementById('riddle-event-template');
const powerupTemplate = document.getElementById('powerup-event-template');
const buffTemplate = document.getElementById('buff-template');
const questTemplate = document.getElementById('quest-template');
const achievementTemplate = document.getElementById('achievement-template');

// Game state
let player = null;
let currentEvent = null;
let selectedClass = null;

// If using ES modules (recommended)
import * as storage from './src/utils/storage.js';
import { Player, CHARACTER_CLASSES } from './src/models/player.js';

// Load player data from background script
const loadPlayerData = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getPlayerData' }, (response) => {
      if (response && response.playerData) {
        player = response.playerData;
      }
      resolve();
    });
  });
};

// Load current event from background script
const loadCurrentEvent = async () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getCurrentEvent' }, (response) => {
      if (response && response.eventData) {
        currentEvent = response.eventData;
      }
      resolve();
    });
  });
};

// Update player stats display
const updatePlayerStats = () => {
  levelBadge.textContent = player.level;
  playerXp.textContent = player.xp;
  
  // Calculate XP needed for next level
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, player.level - 1));
  xpNeeded.textContent = xpForNextLevel;
  
  playerGold.textContent = player.gold;
  
  // Update character class display
  const playerClassElement = document.getElementById('player-class');
  if (playerClassElement && player.characterClass) {
    const characterClassName = CHARACTER_CLASSES[player.characterClass]?.name || player.characterClass;
    playerClassElement.textContent = characterClassName;
    
    // You could also add a class icon
    // playerClassElement.innerHTML = `<img src="icons/classes/${player.characterClass}.svg" alt="${characterClassName}" class="class-icon-small"> ${characterClassName}`;
  }
};

// Show character selection screen
const showCharacterSelection = () => {
  gameContainer.classList.add('hidden');
  characterSelection.classList.remove('hidden');
  
  // Clear any existing content and rebuild
  const classesContainer = document.querySelector('.class-cards-container');
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
    
    classesContainer.appendChild(card);
    
    // Add event listener
    card.addEventListener('click', () => {
      // Remove selected class from all cards
      document.querySelectorAll('.class-card').forEach(c => 
        c.classList.remove('selected'));
      
      // Add selected class to clicked card
      card.classList.add('selected');
      
      // Set the selected class
      selectedClass = className;
      
      // Enable confirm button
      confirmClassBtn.disabled = false;
    });
  });
  
  // Add event listener to confirm button
  confirmClassBtn.addEventListener('click', async () => {
    if (selectedClass) {
      // Disable button and show loading state
      confirmClassBtn.disabled = true;
      confirmClassBtn.textContent = 'Creating character...';
      
      // Send message to background script to set class
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
            const player = new Player(playerData);
            
            // Show welcome notification
            showNotification(
              `Welcome, brave ${CHARACTER_CLASSES[player.characterClass].name}!`, 
              'Your adventure begins now. Close tabs to earn XP and gold!'
            );
            
            // Update UI with player data
            gameContainer.classList.remove('hidden');
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
};

// Display current event
const displayCurrentEvent = () => {
  // Clear event container
  eventContainer.innerHTML = '';
  
  // Show event section
  currentEventSection.classList.remove('hidden');
  
  // Create event element based on type
  let eventElement;
  
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
      return;
  }
  
  // Add event to container
  if (eventElement) {
    eventContainer.appendChild(eventElement);
  }
};

// Create monster event element
const createMonsterEvent = (monster) => {
  const clone = monsterTemplate.content.cloneNode(true);
  
  // Set monster details
  clone.querySelector('.monster-image').src = `icons/monsters/${monster.image}`;
  clone.querySelector('.monster-name').textContent = monster.name;
  clone.querySelector('.monster-level span').textContent = monster.level;
  clone.querySelector('.monster-rewards .xp').textContent = monster.xp;
  clone.querySelector('.monster-rewards .gold').textContent = monster.gold;
  
  // Add event listener to defeat button
  clone.querySelector('.defeat-monster').addEventListener('click', () => {
    // Send message to background script to defeat monster
    chrome.runtime.sendMessage({ action: 'handleMonsterDefeat' }, async (response) => {
      if (response && response.success) {
        // Hide event section
        currentEventSection.classList.add('hidden');
        
        // Reload player data
        await loadPlayerData();
        updatePlayerStats();
        updateQuests();
      }
    });
  });
  
  return clone;
};

// Create treasure event element
const createTreasureEvent = (treasure) => {
  const clone = treasureTemplate.content.cloneNode(true);
  
  // Set treasure details
  clone.querySelector('.treasure-image').src = `icons/treasures/${treasure.image}`;
  clone.querySelector('.treasure-name').textContent = treasure.name;
  clone.querySelector('.treasure-rewards .xp').textContent = treasure.xp;
  clone.querySelector('.treasure-rewards .gold').textContent = treasure.gold;
  
  return clone;
};

// Create riddle event element
const createRiddleEvent = (riddle) => {
  const clone = riddleTemplate.content.cloneNode(true);
  
  // Set riddle details
  clone.querySelector('.riddle-question').textContent = riddle.question;
  clone.querySelector('.riddle-rewards .xp').textContent = riddle.xp;
  clone.querySelector('.riddle-rewards .gold').textContent = riddle.gold;
  
  // Add event listener to submit button
  clone.querySelector('.submit-answer').addEventListener('click', () => {
    const answer = clone.querySelector('.riddle-answer').value.trim();
    
    if (answer) {
      // Send message to background script to check answer
      chrome.runtime.sendMessage({
        action: 'handleRiddleAnswer',
        answer: answer
      }, async (response) => {
        if (response && response.success) {
          if (response.correct) {
            // Hide event section
            currentEventSection.classList.add('hidden');
            
            // Reload player data
            await loadPlayerData();
            updatePlayerStats();
          } else {
            // Show incorrect answer message
            alert('Incorrect answer. Try again!');
          }
        }
      });
    }
  });
  
  return clone;
};

// Create power-up event element
const createPowerUpEvent = (powerUp) => {
  const clone = powerupTemplate.content.cloneNode(true);
  
  // Set power-up details
  clone.querySelector('.powerup-image').src = `icons/powerups/${powerUp.image}`;
  clone.querySelector('.powerup-name').textContent = powerUp.name;
  clone.querySelector('.powerup-description').textContent = powerUp.description;
  
  // Format duration (convert seconds to minutes)
  const minutes = Math.floor(powerUp.duration / 60);
  clone.querySelector('.powerup-duration span').textContent = `${minutes} minutes`;
  
  return clone;
};

// Update buffs display
const updateBuffs = () => {
  // Clear buffs container
  buffsContainer.innerHTML = '';
  
  if (!player || !player.buffs || player.buffs.length === 0) {
    // Show no buffs message
    buffsContainer.appendChild(noBuffsMessage);
    return;
  }
  
  // Hide no buffs message
  noBuffsMessage.remove();
  
  // Current time
  const now = Date.now();
  
  // Display each buff
  player.buffs.forEach(buff => {
    // Skip expired buffs
    if (buff.expiresAt < now) {
      return;
    }
    
    const clone = buffTemplate.content.cloneNode(true);
    
    // Set buff details
    clone.querySelector('.buff-icon').src = `icons/powerups/${buff.image}`;
    clone.querySelector('.buff-name').textContent = buff.name;
    clone.querySelector('.buff-description').textContent = buff.description;
    
    // Calculate remaining time percentage
    const totalDuration = buff.duration * 1000;
    const elapsed = now - (buff.expiresAt - totalDuration);
    const percentage = Math.max(0, 100 - (elapsed / totalDuration * 100));
    
    // Set timer bar width
    clone.querySelector('.timer-bar').style.width = `${percentage}%`;
    
    buffsContainer.appendChild(clone);
  });
};

// Update quests display
const updateQuests = () => {
  // Clear quests container
  questsContainer.innerHTML = '';
  
  // Sort quests by completion status
  const sortedQuests = [...player.quests].sort((a, b) => {
    // Completed quests go to the bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });
  
  // Display each quest
  sortedQuests.forEach(quest => {
    const clone = questTemplate.content.cloneNode(true);
    
    // Set quest details
    clone.querySelector('.quest-name').textContent = quest.name;
    clone.querySelector('.quest-description').textContent = quest.description;
    
    // Calculate progress percentage
    const percentage = Math.min(100, (quest.progress / quest.goal) * 100);
    
    // Set progress bar width
    clone.querySelector('.progress-fill').style.width = `${percentage}%`;
    
    // Set progress text
    clone.querySelector('.progress-text').textContent = `${quest.progress}/${quest.goal}`;
    
    // Set quest rewards
    if (quest.reward.xp) {
      clone.querySelector('.reward-xp').textContent = `${quest.reward.xp} XP`;
    } else {
      clone.querySelector('.reward-xp').remove();
    }
    
    if (quest.reward.gold) {
      clone.querySelector('.reward-gold').textContent = `${quest.reward.gold} Gold`;
    } else {
      clone.querySelector('.reward-gold').remove();
    }
    
    if (quest.reward.item) {
      clone.querySelector('.reward-item').textContent = quest.reward.item.name;
    } else {
      clone.querySelector('.reward-item').remove();
    }
    
    // Add completed class if quest is completed
    if (quest.completed) {
      clone.querySelector('.quest').classList.add('completed');
    }
    
    questsContainer.appendChild(clone);
  });
};

// Update achievements display
const updateAchievements = () => {
  // Clear achievements container
  achievementsContainer.innerHTML = '';
  
  if (!player.achievements || player.achievements.length === 0) {
    // Show no achievements message
    achievementsContainer.appendChild(noAchievementsMessage);
    return;
  }
  
  // Hide no achievements message
  noAchievementsMessage.remove();
  
  // Display each achievement
  player.achievements.forEach(achievement => {
    const clone = achievementTemplate.content.cloneNode(true);
    
    // Set achievement details
    clone.querySelector('.achievement-title').textContent = achievement.title;
    
    // Format date
    const date = new Date(achievement.completedAt);
    const formattedDate = date.toLocaleDateString();
    clone.querySelector('.achievement-date').textContent = `Earned on ${formattedDate}`;
    
    achievementsContainer.appendChild(clone);
  });
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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // First check if we need character selection
  const data = await chromeAPI.storage.local.get('needsClassSelection');
  const needsClassSelection = data.needsClassSelection;
  
  // Always load player data to get the current state
  await loadPlayerData();
  
  // Show character selection if needed or if player has no class
  if (needsClassSelection || !player || !player.characterClass) {
    showCharacterSelection();
  } else {
    // Normal game initialization
    updatePlayerStats();
    updateQuests();
    await loadCurrentEvent();
    if (currentEvent) {
      displayCurrentEvent();
    }
  }
  
  // Add class change button to settings
  addClassChangeButton();
});

// This should be dynamic, not hardcoded
async function loadPlayerStats() {
  try {
    const playerData = await storage.loadPlayerData();
    
    if (playerData) {
      document.getElementById('level').textContent = playerData.level || 1;
      document.getElementById('xp').textContent = 
        `${playerData.xp || 0} / ${playerData.xpToNextLevel || 100} XP`;
      document.getElementById('gold').textContent = 
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
      document.getElementById('level').textContent = newPlayer.level;
      document.getElementById('xp').textContent = 
        `${newPlayer.xp} / ${newPlayer.xpToNextLevel} XP`;
      document.getElementById('gold').textContent = 
        `${newPlayer.gold} Gold`;
    }
  } catch (error) {
    console.error('Failed to load player stats:', error);
  }
}

// Set up character selection event listeners
document.querySelectorAll('.character-option').forEach(option => {
  option.addEventListener('click', async () => {
    const characterClass = option.dataset.class;
    // Initialize player with selected class
    const newPlayer = new Player(characterClass);
    await storage.savePlayerData(newPlayer.toJSON());
    
    // Hide selection screen, show game interface
    showGameInterface();
  });
});

const img = document.getElementById('xp-icon');
if (img) {
  img.onerror = () => console.error('Failed to load image:', img.src);
  img.onload = () => console.log('Image loaded successfully:', img.src);
} else {
  console.warn('Element not found:', 'xp-icon');
}

// Change any JS that sets image sources:
document.getElementById('gold-icon').src = 'icons/gold.svg';
document.getElementById('xp-icon').src = 'icons/xp.svg';

// Add this function to allow changing class later
const addClassChangeButton = () => {
  const settingsContainer = document.querySelector('.settings-container');
  if (!settingsContainer) return;
  
  const changeClassBtn = document.createElement('button');
  changeClassBtn.textContent = 'Change Character Class';
  changeClassBtn.className = 'settings-button';
  
  changeClassBtn.addEventListener('click', () => {
    // Show character selection UI
    showCharacterSelection();
    
    // Add a cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'secondary-button';
    cancelBtn.style.marginRight = '10px';
    
    const buttonsContainer = document.querySelector('.character-selection-buttons');
    buttonsContainer.prepend(cancelBtn);
    
    cancelBtn.addEventListener('click', () => {
      characterSelection.classList.add('hidden');
      gameContainer.classList.remove('hidden');
    });
  });
  
  settingsContainer.appendChild(changeClassBtn);
};
