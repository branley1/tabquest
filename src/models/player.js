// Player model

// Character class definitions with their bonuses
const CHARACTER_CLASSES = {
  warrior: {
    name: 'Warrior',
    description: 'Gains 10% more XP',
    xpMultiplier: 1.1,
    goldMultiplier: 1.0
  },
  mage: {
    name: 'Mage',
    description: 'Gains 20% more XP',
    xpMultiplier: 1.2,
    goldMultiplier: 1.0
  },
  rogue: {
    name: 'Rogue',
    description: 'Gains 20% more gold',
    xpMultiplier: 1.0,
    goldMultiplier: 1.2
  }
};

class Player {
  constructor(data = {}) {
    this.xp = data.xp || 0;
    this.level = data.level || 1;
    this.gold = data.gold || 0;
    this.characterClass = data.characterClass || null;
    this.quests = data.quests || [];
    this.achievements = data.achievements || [];
    this.buffs = data.buffs || [];
  }

  // Calculate XP needed for next level using exponential scaling
  getXpForNextLevel() {
    return Math.floor(100 * Math.pow(1.5, this.level - 1));
  }

  // Add XP and handle leveling up
  addXp(amount) {
    let multiplier = 1;
    
    // Apply class bonuses
    if (this.characterClass && CHARACTER_CLASSES[this.characterClass]) {
      multiplier *= CHARACTER_CLASSES[this.characterClass].xpMultiplier;
    }
    
    // Apply active buffs
    this.updateBuffs();
    this.buffs.forEach(buff => {
      if (buff.type === 'xp_multiplier') {
        multiplier *= buff.multiplier;
      }
    });
    
    // Calculate XP gained with multiplier
    const xpGained = Math.round(amount * multiplier);
    
    // Add XP to player's total
    this.xp += xpGained;
    
    // Check for level up
    let leveledUp = false;
    while (this.xp >= this.getXpForNextLevel()) {
      this.xp -= this.getXpForNextLevel();
      this.level += 1;
      leveledUp = true;
    }
    
    return { xpGained, leveledUp };
  }

  // Add gold with bonuses
  addGold(amount) {
    let multiplier = 1;
    
    // Apply class bonuses
    if (this.characterClass && CHARACTER_CLASSES[this.characterClass]) {
      multiplier *= CHARACTER_CLASSES[this.characterClass].goldMultiplier;
    }
    
    // Apply active buffs
    this.updateBuffs();
    this.buffs.forEach(buff => {
      if (buff.type === 'gold_multiplier') {
        multiplier *= buff.multiplier;
      }
    });
    
    const goldGained = Math.floor(amount * multiplier);
    this.gold += goldGained;
    
    return { goldGained };
  }

  // Set character class
  setCharacterClass(className) {
    if (Object.keys(CHARACTER_CLASSES).includes(className)) {
      this.characterClass = className;
      return true;
    }
    return false;
  }

  // Add a buff with duration
  addBuff(buff) {
    // Remove existing buff of same type
    this.buffs = this.buffs.filter(b => b.type !== buff.type);
    
    // Add new buff with expiration time
    this.buffs.push({
      ...buff,
      expiresAt: Date.now() + (buff.duration * 1000)
    });
  }

  // Update buffs, removing expired ones
  updateBuffs() {
    const now = Date.now();
    this.buffs = this.buffs.filter(buff => buff.expiresAt > now);
  }

  // Add achievement if not already earned
  addAchievement(achievement) {
    if (this.achievements.some(a => a.id === achievement.id)) {
      return false;
    }
    
    this.achievements.push({
      ...achievement,
      completedAt: Date.now()
    });
    return true;
  }

  // Serialize to JSON for storage
  toJSON() {
    return {
      xp: this.xp,
      level: this.level,
      gold: this.gold,
      characterClass: this.characterClass,
      quests: this.quests,
      achievements: this.achievements,
      buffs: this.buffs
    };
  }
}

export { Player, CHARACTER_CLASSES }; 