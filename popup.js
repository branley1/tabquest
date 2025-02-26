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

// Initialize the popup
const initPopup = async () => {
  await loadPlayerData();
  await loadCurrentEvent();
  
  // Check if player has selected a class
  if (!player.characterClass) {
    showCharacterSelection();
  } else {
    // Update UI with player data
    updatePlayerStats();
    updateBuffs();
    updateQuests();
    updateAchievements();
    
    // Display current event if any
    if (currentEvent) {
      displayCurrentEvent();
    }
  }
  
  // Start timer to refresh buffs
  setInterval(updateBuffs, 1000);
};

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
};

// Show character selection screen
const showCharacterSelection = () => {
  characterSelection.classList.remove('hidden');
  
  // Add event listeners to class cards
  const classCards = document.querySelectorAll('.class-card');
  classCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove selected class from all cards
      classCards.forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked card
      card.classList.add('selected');
      
      // Set the selected class
      selectedClass = card.dataset.class;
      
      // Enable confirm button
      confirmClassBtn.disabled = false;
    });
  });
  
  // Add event listener to confirm button
  confirmClassBtn.addEventListener('click', async () => {
    if (selectedClass) {
      // Send message to background script to set class
      chrome.runtime.sendMessage({
        action: 'setCharacterClass',
        className: selectedClass
      }, async (response) => {
        if (response && response.success) {
          // Hide character selection and reload data
          characterSelection.classList.add('hidden');
          await loadPlayerData();
          
          // Update UI with player data
          updatePlayerStats();
          
          // Load current event if any
          await loadCurrentEvent();
          if (currentEvent) {
            displayCurrentEvent();
          }
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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup); 