// Utility functions for notifications
import { chromeAPI } from './chrome-api';

const DEFAULT_ICON = 'images/icon-48.png';

// Default notification options
const DEFAULT_OPTIONS = {
  type: 'basic',
  iconUrl: DEFAULT_ICON,
  title: 'TabQuest',
  message: ''
};

// Show a notification
export async function showNotification(title, message, options = {}) {
  try {
    const defaultOptions = {
      type: 'basic',
      iconUrl: DEFAULT_ICON,
      title,
      message
    };
    
    // Use compatible notification method based on whether we're using the newer or older API interface
    if (chromeAPI.notifications && chromeAPI.notifications.create) {
      await chromeAPI.notifications.create('', { ...defaultOptions, ...options });
    } else {
      await chromeAPI.createNotification({ ...defaultOptions, ...options });
    }
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
}

// Show a notification for XP gain
export async function showXPNotification(amount) {
  if (amount === undefined || amount === null) {
    console.warn('Invalid XP amount for notification');
    amount = 0;
  }
  return showNotification(
    'XP Gained!',
    `You gained ${amount} XP!`
  );
}

// Show notification for gold gain
export async function showGoldNotification(amount) {
  if (amount === undefined || amount === null) {
    console.warn('Invalid gold amount for notification');
    amount = 0;
  }
  return showNotification(
    'Gold Found!',
    `You found ${amount} gold!`
  );
}

// Show a notification for monster encounters
export async function showMonsterNotification(monster) {
  if (!monster || !monster.name || !monster.xp || !monster.gold) {
    console.warn('Invalid monster data for notification');
    return false;
  }
  return showNotification(
    'Monster Encounter!',
    `You encountered a ${monster.name}! Defeat it to earn ${monster.xp} XP and ${monster.gold} gold.`
  );
}

// Show a notification for treasure finds
export async function showTreasureNotification(treasure) {
  if (!treasure || !treasure.name || !treasure.xp || !treasure.gold) {
    console.warn('Invalid treasure data for notification');
    return false;
  }
  return showNotification(
    'Treasure Found!',
    `You found a ${treasure.name}! You gained ${treasure.xp} XP and ${treasure.gold} gold.`
  );
}

// Show a notification for riddles
export async function showRiddleNotification(riddle) {
  if (!riddle || !riddle.question) {
    console.warn('Invalid riddle data for notification');
    return false;
  }
  return showNotification(
    'Riddle Challenge!',
    `Solve this riddle: ${riddle.question}`
  );
}

// Show a notification for a new event
export async function showEventNotification(event) {
  if (!event) {
    console.warn('No event data provided for notification');
    return false;
  }
  const title = event.title || 'New Event!';
  const message = event.message || 'A new event has appeared!';
  const options = event.icon ? { iconUrl: event.icon } : { iconUrl: DEFAULT_ICON };
  
  return showNotification(title, message, options);
}

// Show a notification for a completed event
export async function showEventCompletedNotification(event) {
  if (!event || !event.title) {
    console.warn('Invalid event data for completion notification');
    return false;
  }
  const title = 'Event Completed!';
  const message = `You completed: ${event.title}`;
  const options = event.icon ? { iconUrl: event.icon } : { iconUrl: DEFAULT_ICON };
  
  return showNotification(title, message, options);
}

// Show a notification for a power-up
export async function showPowerUpNotification(powerUp) {
  if (!powerUp) {
    console.warn('No power-up data provided for notification');
    return false;
  }
  const title = 'Power-Up Activated!';
  const message = powerUp.description || 'You activated a power-up!';
  const options = powerUp.icon ? { iconUrl: powerUp.icon } : { iconUrl: DEFAULT_ICON };
  
  return showNotification(title, message, options);
}

// Show a notification for a level up
export async function showLevelUpNotification(level) {
  if (level === undefined || level === null) {
    console.warn('Invalid level for notification');
    level = 0;
  }
  return showNotification(
    'Level Up!',
    `Congratulations! You reached level ${level}!`
  );
}

// Show a notification for completing quests
export async function showQuestCompletionNotification(quest) {
  if (!quest || !quest.title || !quest.xp || !quest.gold) {
    console.warn('Invalid quest data for completion notification');
    return false;
  }
  return showNotification(
    'Quest Complete!',
    `You've completed "${quest.title}"! Rewards: ${quest.xp} XP and ${quest.gold} gold!`
  );
}

// Show a notification for a quest completed
export async function showQuestCompletedNotification(quest) {
  if (!quest || !quest.title) {
    console.warn('Invalid quest data for notification');
    return false;
  }
  return showNotification(
    'Quest Completed!',
    `You completed: ${quest.title}`
  );
}

// Show notification for tab closed
export async function showTabClosedNotification(xp, gold) {
  if (xp === undefined || xp === null) {
    xp = 0;
  }
  if (gold === undefined || gold === null) {
    gold = 0;
  }
  return showNotification(
    'Tab Closed',
    `Tab closed! You earned ${xp} XP and ${gold} gold.`
  );
}

// Show notification for achievements
export async function showAchievementNotification(achievement) {
  if (!achievement || !achievement.title) {
    console.warn('Invalid achievement data for notification');
    return false;
  }
  return showNotification(
    'Achievement Unlocked!',
    `You've earned the "${achievement.title}" achievement!`
  );
}

export default {
  showNotification,
  showXPNotification,
  showGoldNotification,
  showMonsterNotification,
  showTreasureNotification,
  showRiddleNotification,
  showEventNotification,
  showEventCompletedNotification,
  showPowerUpNotification,
  showLevelUpNotification,
  showQuestCompletionNotification,
  showQuestCompletedNotification,
  showTabClosedNotification,
  showAchievementNotification
}; 