// Utility functions for notifications
import chromeAPI from './chrome-api';

// Default notification options
const DEFAULT_OPTIONS = {
  type: 'basic',
  iconUrl: 'images/icon-48.png',
  title: 'TabQuest',
  message: ''
};

// Show a notification
export const showNotification = async (title, message, options = {}) => {
  try {
    const notificationOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      title,
      message
    };
    
    await chromeAPI.createNotification(notificationOptions);
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
};

// Show a notification for XP gain
export const showXPNotification = async (amount) => {
  return showNotification(
    'XP Gained!',
    `You gained ${amount} XP!`
  );
};

// Show notification for gold gain
export const showGoldNotification = async (amount) => {
  return showNotification(
    'Gold Found!',
    `You found ${amount} gold!`
  );
};

// Show a notification for monster encounters
export const showMonsterNotification = async (monster) => {
  return showNotification(
    'Monster Encounter!',
    `You encountered a ${monster.name}! Defeat it to earn ${monster.xp} XP and ${monster.gold} gold.`
  );
};

// Show a notification for treasure finds
export const showTreasureNotification = async (treasure) => {
  return showNotification(
    'Treasure Found!',
    `You found a ${treasure.name}! You gained ${treasure.xp} XP and ${treasure.gold} gold.`
  );
};

// Show a notification for riddles
export const showRiddleNotification = async (riddle) => {
  return showNotification(
    'Riddle Challenge!',
    `Solve this riddle: ${riddle.question}`
  );
};

// Show a notification for a new event
export const showEventNotification = async (event) => {
  if (!event) return false;
  
  const title = 'New Event!';
  const message = event.description || 'A new event has appeared!';
  
  const options = {
    iconUrl: event.icon || DEFAULT_OPTIONS.iconUrl
  };
  
  return showNotification(title, message, options);
};

// Show a notification for a completed event
export const showEventCompletedNotification = async (event) => {
  if (!event) return false;
  
  const title = 'Event Completed!';
  const message = `You completed: ${event.description}`;
  
  const options = {
    iconUrl: event.icon || DEFAULT_OPTIONS.iconUrl
  };
  
  return showNotification(title, message, options);
};

// Show a notification for a power-up
export const showPowerUpNotification = async (powerUp) => {
  if (!powerUp) return false;
  
  const title = 'Power-Up Activated!';
  const message = powerUp.description || 'You activated a power-up!';
  
  const options = {
    iconUrl: powerUp.icon || DEFAULT_OPTIONS.iconUrl
  };
  
  return showNotification(title, message, options);
};

// Show a notification for a level up
export const showLevelUpNotification = async (level) => {
  const title = 'Level Up!';
  const message = `Congratulations! You reached level ${level}!`;
  
  return showNotification(title, message);
};

// Show a notification for completing quests
export const showQuestCompletionNotification = async (quest) => {
  return showNotification(
    'Quest Complete!',
    `You've completed "${quest.title}"! Rewards: ${quest.reward.xp} XP and ${quest.reward.gold} gold!`
  );
};

// Show a notification for a quest completed
export const showQuestCompletedNotification = async (quest) => {
  if (!quest) return false;
  
  const title = 'Quest Completed!';
  const message = `You completed: ${quest.title}`;
  
  return showNotification(title, message);
};

// Show notification for tab closed
export const showTabClosedNotification = async (xp, gold) => {
  return showNotification(
    'Tab Closed',
    `Tab closed! You earned ${xp} XP and ${gold} gold.`
  );
};

// Show notification for achievements
export const showAchievementNotification = async (achievement) => {
  return showNotification(
    'Achievement Unlocked!',
    `You've earned the "${achievement.title}" achievement!`
  );
}; 