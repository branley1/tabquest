// Mock modules for tests
// This file creates mock implementations of modules that aren't available yet

// Mock Player module
jest.mock('../src/models/player.js', () => {
  return {
    Player: jest.fn().mockImplementation(() => ({
      xp: 0,
      level: 1,
      gold: 0,
      characterClass: null,
      quests: [],
      achievements: [],
      buffs: [],
      getXpForNextLevel: jest.fn().mockReturnValue(100),
      addXp: jest.fn().mockImplementation(function(amount) {
        let multiplier = 1;
        if (this.characterClass === 'warrior') multiplier = 1.1;
        if (this.characterClass === 'mage') multiplier = 1.2;
        if (this.characterClass === 'rogue') multiplier = 1;
        
        const xpGained = Math.floor(amount * multiplier);
        this.xp += xpGained;
        return { xpGained };
      }),
      addGold: jest.fn().mockImplementation(function(amount) {
        let multiplier = 1;
        if (this.characterClass === 'rogue') multiplier = 1.2;
        
        const goldGained = Math.floor(amount * multiplier);
        this.gold += goldGained;
        return { goldGained };
      }),
      setCharacterClass: jest.fn().mockImplementation(function(className) {
        if (['warrior', 'mage', 'rogue'].includes(className)) {
          this.characterClass = className;
          return true;
        }
        return false;
      }),
      addBuff: jest.fn(),
      updateBuffs: jest.fn(),
      addAchievement: jest.fn().mockImplementation(function(achievement) {
        const exists = this.achievements.some(a => a.id === achievement.id);
        if (exists) return false;
        
        this.achievements.push({
          ...achievement,
          completedAt: Date.now()
        });
        return true;
      }),
      toJSON: jest.fn().mockImplementation(function() {
        return {
          xp: this.xp,
          level: this.level,
          gold: this.gold,
          characterClass: this.characterClass
        };
      })
    }))
  };
}, { virtual: true });

// Mock Events module
jest.mock('../src/utils/events.js', () => {
  return {
    monsters: [
      { id: 'goblin', name: 'Goblin', level: 1, xp: 10, gold: 5, image: 'goblin.png' }
    ],
    treasures: [
      { id: 'gold_pouch', name: 'Gold Pouch', gold: 20, xp: 5, image: 'gold_pouch.png' }
    ],
    riddles: [
      { id: 'riddle1', question: 'What has keys but no locks?', answer: 'A piano', xp: 15, gold: 10 }
    ],
    powerUps: [
      { id: 'focus_potion', name: 'Focus Potion', description: 'Doubles XP gain', duration: 300, type: 'xp_multiplier', image: 'focus_potion.png' }
    ],
    quests: [
      { id: 'quest1', name: 'Tab Explorer', description: 'Open 10 tabs', goal: 10, progress: 0, type: 'tab_opened', reward: { xp: 100, gold: 50 } }
    ],
    generateRandomEvent: jest.fn().mockImplementation(() => ({
      type: 'monster',
      data: { name: 'Goblin', level: 1, xp: 10, gold: 5 },
      message: 'A goblin appears!'
    })),
    getTabClosedReward: jest.fn().mockImplementation((duration) => ({
      xp: 5 + Math.floor(duration / 60),
      gold: 2 + Math.floor(duration / 120)
    })),
    updateQuestProgress: jest.fn().mockImplementation((quests, type, value = 1) => {
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
    })
  };
}, { virtual: true });

// Mock Storage module
jest.mock('../src/utils/storage.js', () => {
  return {
    saveData: jest.fn().mockImplementation((key, value) => {
      return new Promise((resolve, reject) => {
        if (global.chrome.runtime.lastError) {
          reject(global.chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    }),
    loadData: jest.fn().mockImplementation((key) => {
      return new Promise((resolve, reject) => {
        if (global.chrome.runtime.lastError) {
          reject(global.chrome.runtime.lastError);
        } else {
          resolve('testValue');
        }
      });
    }),
    savePlayerData: jest.fn(),
    loadPlayerData: jest.fn().mockResolvedValue({
      level: 1,
      xp: 0,
      gold: 0,
      className: null,
      buffs: {},
      achievements: []
    }),
    saveCurrentEvent: jest.fn(),
    loadCurrentEvent: jest.fn().mockResolvedValue(null),
    clearCurrentEvent: jest.fn(),
    saveTabTimestamps: jest.fn(),
    loadTabTimestamps: jest.fn().mockResolvedValue({}),
    updateTabTimestamp: jest.fn(),
    removeTabTimestamp: jest.fn(),
    getTabDuration: jest.fn().mockResolvedValue(0)
  };
}, { virtual: true });

// Mock Notification module
jest.mock('../src/utils/notification.js', () => {
  return {
    showNotification: jest.fn(),
    showXPNotification: jest.fn(),
    showGoldNotification: jest.fn(),
    showLevelUpNotification: jest.fn(),
    showEventNotification: jest.fn(),
    showQuestCompletionNotification: jest.fn()
  };
}, { virtual: true });

// Mock Background module
jest.mock('../src/background/background.js', () => {
  // Simulate adding listeners
  global.chrome.runtime.onMessage.addListener(() => {});
  global.chrome.tabs.onCreated.addListener(() => {});
  global.chrome.tabs.onRemoved.addListener(() => {});
  global.chrome.tabs.onActivated.addListener(() => {});
  global.chrome.tabs.onUpdated.addListener(() => {});
  
  return {};
}, { virtual: true }); 