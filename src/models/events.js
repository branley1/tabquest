// Event system for generating random RPG encounters and rewards

// Monster encounters with different difficulty levels
const monsters = [
  { id: 'goblin', name: 'Tab Goblin', level: 1, xp: 15, gold: 5, image: 'goblin.png' },
  { id: 'troll', name: 'Link Troll', level: 2, xp: 25, gold: 10, image: 'troll.png' },
  { id: 'dragon', name: 'Data Dragon', level: 5, xp: 50, gold: 30, image: 'dragon.png' },
  { id: 'virus', name: 'Browser Virus', level: 3, xp: 30, gold: 15, image: 'virus.png' },
  { id: 'popup', name: 'Popup Fiend', level: 2, xp: 20, gold: 8, image: 'popup.png' }
];

// Treasure items that can be found
const treasures = [
  { id: 'gold_pouch', name: 'Pouch of Gold', gold: 15, xp: 5, image: 'gold_pouch.png' },
  { id: 'xp_scroll', name: 'Scroll of Knowledge', gold: 0, xp: 25, image: 'scroll.png' },
  { id: 'gem', name: 'Browser Gem', gold: 30, xp: 10, image: 'gem.png' },
  { id: 'artifact', name: 'Ancient Bookmark', gold: 20, xp: 20, image: 'artifact.png' }
];

// Riddles and puzzles
const riddles = [
  {
    id: 'riddle1',
    question: 'I have keys but no locks. I have space but no room. You can enter, but can\'t go outside. What am I?',
    answer: 'keyboard',
    xp: 30,
    gold: 10
  },
  {
    id: 'riddle2',
    question: 'What goes up but never comes down?',
    answer: 'age',
    xp: 20,
    gold: 5
  },
  {
    id: 'riddle3',
    question: 'I\'m light as a feather, but the strongest person can\'t hold me for more than a few minutes. What am I?',
    answer: 'breath',
    xp: 25,
    gold: 15
  }
];

// Power-ups and buffs
const powerUps = [
  { 
    id: 'focus_potion', 
    name: 'Potion of Focus', 
    description: 'Earn double XP for the next 30 minutes',
    duration: 1800, // 30 minutes in seconds
    type: 'xp',
    multiplier: 2,
    image: 'focus_potion.png'
  },
  { 
    id: 'lucky_charm', 
    name: 'Lucky Charm', 
    description: 'Earn 50% more gold for the next hour',
    duration: 3600, // 60 minutes in seconds
    type: 'gold',
    multiplier: 1.5,
    image: 'lucky_charm.png'
  },
  { 
    id: 'shield', 
    name: 'Browser Shield', 
    description: 'Protect against enemy encounters for 15 minutes',
    duration: 900, // 15 minutes in seconds
    type: 'protection',
    image: 'shield.png'
  }
];

// Quests for the player to complete
const quests = [
  {
    id: 'tab_slayer',
    name: 'Tab Slayer',
    description: 'Close 50 tabs',
    goal: 50,
    progress: 0,
    type: 'tabs_closed',
    reward: { xp: 100, gold: 50, title: 'Tab Slayer' }
  },
  {
    id: 'focus_master',
    name: 'Focus Master',
    description: 'Stay on a single tab for 30 minutes',
    goal: 1800, // 30 minutes in seconds
    progress: 0,
    type: 'time_focused',
    reward: { xp: 150, gold: 30, title: 'Focus Master' }
  },
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Find 10 treasures',
    goal: 10,
    progress: 0,
    type: 'treasures_found',
    reward: { xp: 120, gold: 100, item: { id: 'treasure_map', name: 'Treasure Map', description: 'Increases chances of finding treasure' } }
  },
  {
    id: 'monster_hunter',
    name: 'Monster Hunter',
    description: 'Defeat 20 monsters',
    goal: 20,
    progress: 0,
    type: 'monsters_defeated',
    reward: { xp: 200, gold: 75, title: 'Monster Hunter' }
  }
];

// Generate a random event when the user opens a new tab
function generateRandomEvent(playerLevel = 1) {
  // Weights for different event types
  const weights = {
    monster: 0.4,
    treasure: 0.3,
    riddle: 0.2,
    powerUp: 0.1
  };
  
  const roll = Math.random();
  let eventType;
  
  // Determine event type based on random roll and weights
  if (roll < weights.monster) {
    eventType = 'monster';
  } else if (roll < weights.monster + weights.treasure) {
    eventType = 'treasure';
  } else if (roll < weights.monster + weights.treasure + weights.riddle) {
    eventType = 'riddle';
  } else {
    eventType = 'powerUp';
  }
  
  // Generate the specific event based on type
  switch (eventType) {
    case 'monster': {
      // Filter monsters by player level (can fight monsters up to 2 levels higher)
      const eligibleMonsters = monsters.filter(m => m.level <= playerLevel + 2);
      const monster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
      return {
        type: 'monster',
        data: { ...monster },
        message: `You encountered a ${monster.name}! Defeat it to earn ${monster.xp} XP and ${monster.gold} gold.`
      };
    }
    case 'treasure': {
      const treasure = treasures[Math.floor(Math.random() * treasures.length)];
      return {
        type: 'treasure',
        data: { ...treasure },
        message: `You found a ${treasure.name}! You gained ${treasure.xp} XP and ${treasure.gold} gold.`
      };
    }
    case 'riddle': {
      const riddle = riddles[Math.floor(Math.random() * riddles.length)];
      return {
        type: 'riddle',
        data: { ...riddle },
        message: `Solve this riddle: ${riddle.question}`
      };
    }
    case 'powerUp': {
      const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
      return {
        type: 'powerUp',
        data: { ...powerUp },
        message: `You found a ${powerUp.name}! ${powerUp.description}.`
      };
    }
    default:
      return null;
  }
}

// Generate reward for closing a tab
function getTabClosedReward(tabDuration) {
  // Base rewards
  let xp = 5;
  let gold = 2;
  
  // Bonus for longer focus
  if (tabDuration > 600) { // 10 minutes
    xp += Math.floor(tabDuration / 60); // 1 XP per minute
    gold += Math.floor(tabDuration / 120); // 1 gold per 2 minutes
  }
  
  return {
    xp,
    gold,
    message: `Tab closed! You earned ${xp} XP and ${gold} gold.`
  };
}

// Update quest progress
function updateQuestProgress(quests, action, value = 1) {
  return quests.map(quest => {
    if (quest.type === action) {
      const updatedProgress = Math.min(quest.goal, quest.progress + value);
      const completed = updatedProgress >= quest.goal && quest.progress < quest.goal;
      
      return {
        ...quest,
        progress: updatedProgress,
        completed: updatedProgress >= quest.goal,
        isNew: completed
      };
    }
    return quest;
  });
}

export {
  monsters,
  treasures,
  riddles,
  powerUps,
  quests,
  generateRandomEvent,
  getTabClosedReward,
  updateQuestProgress
}; 