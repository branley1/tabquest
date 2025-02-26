// Events System - Random encounters and quest management

// Monster data
const monsters = [
  { id: 'goblin', name: 'Goblin', level: 1, xp: 10, gold: 5, image: 'goblin.png' },
  { id: 'troll', name: 'Troll', level: 3, xp: 25, gold: 15, image: 'troll.png' },
  { id: 'dragon', name: 'Dragon', level: 5, xp: 50, gold: 40, image: 'dragon.png' },
  { id: 'virus', name: 'Computer Virus', level: 2, xp: 15, gold: 10, image: 'virus.png' },
  { id: 'popup', name: 'Evil Popup', level: 1, xp: 8, gold: 4, image: 'popup.png' }
];

// Treasure data
const treasures = [
  { id: 'gold_pouch', name: 'Gold Pouch', gold: 20, xp: 5, image: 'gold_pouch.png' },
  { id: 'scroll', name: 'Ancient Scroll', gold: 10, xp: 15, image: 'scroll.png' },
  { id: 'gem', name: 'Valuable Gem', gold: 50, xp: 10, image: 'gem.png' },
  { id: 'artifact', name: 'Strange Artifact', gold: 30, xp: 30, image: 'artifact.png' }
];

// Riddle data
const riddles = [
  {
    id: 'riddle1',
    question: 'What has keys but no locks?',
    answer: 'A piano',
    xp: 15,
    gold: 10
  },
  {
    id: 'riddle2',
    question: 'What can travel around the world while staying in a corner?',
    answer: 'A stamp',
    xp: 15,
    gold: 10
  },
  {
    id: 'riddle3',
    question: 'What gets wetter and wetter the more it dries?',
    answer: 'A towel',
    xp: 15,
    gold: 10
  }
];

// Power-up data
const powerUps = [
  {
    id: 'focus_potion',
    name: 'Focus Potion',
    description: 'Doubles XP gain for 5 minutes',
    duration: 300, // in seconds
    type: 'xp_multiplier',
    multiplier: 2,
    image: 'focus_potion.png'
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Doubles gold gain for 5 minutes',
    duration: 300, // in seconds
    type: 'gold_multiplier',
    multiplier: 2,
    image: 'lucky_charm.png'
  },
  {
    id: 'shield',
    name: 'Magic Shield',
    description: 'Protects from monsters for 5 minutes',
    duration: 300, // in seconds
    type: 'monster_protection',
    image: 'shield.png'
  }
];

// Quest data
const quests = [
  {
    id: 'quest_tabs_10',
    name: 'Tab Explorer',
    description: 'Open 10 different tabs',
    goal: 10,
    progress: 0,
    type: 'tab_opened',
    reward: { xp: 100, gold: 50 }
  },
  {
    id: 'quest_tabs_50',
    name: 'Tab Master',
    description: 'Open 50 different tabs',
    goal: 50,
    progress: 0, 
    type: 'tab_opened',
    reward: { xp: 500, gold: 250 }
  },
  {
    id: 'quest_time_60',
    name: 'Focused Browsing',
    description: 'Keep tabs open for a total of 60 minutes',
    goal: 60,
    progress: 0,
    type: 'tab_time',
    reward: { xp: 200, gold: 100 }
  },
  {
    id: 'quest_monsters_5',
    name: 'Monster Hunter',
    description: 'Defeat 5 monsters',
    goal: 5,
    progress: 0,
    type: 'monster_defeated',
    reward: { xp: 150, gold: 75 }
  }
];

// Generate a random event based on player level
const generateRandomEvent = (playerLevel) => {
  const random = Math.random();
  
  // Monster encounter (40% chance)
  if (random < 0.4) {
    // Filter monsters by player level (within ±2 levels)
    const availableMonsters = monsters.filter(
      monster => Math.abs(monster.level - playerLevel) <= 2
    );
    
    if (availableMonsters.length === 0) {
      // If no monsters match, try a different event type
      if (Math.random() < 0.5) {
        return {
          type: 'treasure',
          data: treasures[Math.floor(Math.random() * treasures.length)],
          message: `You found ${treasures[Math.floor(Math.random() * treasures.length)].name}!`
        };
      } else {
        return {
          type: 'riddle',
          data: riddles[Math.floor(Math.random() * riddles.length)],
          message: `A mysterious riddle appears: ${riddles[Math.floor(Math.random() * riddles.length)].question}`
        };
      }
    }
    
    const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    
    return {
      type: 'monster',
      data: monster,
      message: `A ${monster.name} appears!`
    };
  }
  
  // Treasure (30% chance)
  else if (random < 0.7) {
    const treasure = treasures[Math.floor(Math.random() * treasures.length)];
    
    return {
      type: 'treasure',
      data: treasure,
      message: `You found ${treasure.name}!`
    };
  }
  
  // Riddle (15% chance)
  else if (random < 0.85) {
    const riddle = riddles[Math.floor(Math.random() * riddles.length)];
    
    return {
      type: 'riddle',
      data: riddle,
      message: `A mysterious riddle appears: ${riddle.question}`
    };
  }
  
  // Power-up (15% chance)
  else {
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    return {
      type: 'powerUp',
      data: powerUp,
      message: `You found ${powerUp.name}!`
    };
  }
};

// Calculate rewards for tab closed based on duration
const getTabClosedReward = (durationInSeconds) => {
  // Handle negative or zero duration
  const validDuration = Math.max(0, durationInSeconds);
  
  // Base rewards
  const baseXp = 5;
  const baseGold = 2;
  
  // Additional rewards based on duration
  const minutesOpen = Math.floor(validDuration / 60);
  const additionalXp = minutesOpen; // 1 XP per minute
  const additionalGold = Math.floor(minutesOpen / 2); // 1 gold per 2 minutes
  
  return {
    xp: baseXp + additionalXp,
    gold: baseGold + additionalGold
  };
};

// Update quest progress for a specific type of action
const updateQuestProgress = (quests, type, value = 1) => {
  // Handle null or undefined quests
  if (!quests || !Array.isArray(quests)) {
    return [];
  }
  
  return quests.map(quest => {
    if (quest.type === type && !quest.completed) {
      const newProgress = quest.progress + value;
      const completed = newProgress >= quest.goal;
      
      // Only mark as new if it was just completed
      return {
        ...quest,
        progress: Math.min(newProgress, quest.goal),
        completed,
        ...(completed && !quest.completed ? { isNew: true } : {})
      };
    }
    return quest;
  });
};

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