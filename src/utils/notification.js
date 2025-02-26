// Notification utility for displaying game events

// Show a basic notification
const showNotification = (title, message, iconUrl) => {
  const notificationId = `tabquest-${Date.now()}`; // Generate a unique ID
  chrome.notifications.create(
    notificationId,
    {
      type: 'basic',
      iconUrl: iconUrl,
      title: title,
      message: message
    },
    () => {}
  );
};

// Show notification for XP gain
const showXPNotification = (amount) => {
  showNotification(
    'XP Gained!',
    `You gained ${amount} XP!`,
    'icons/xp.svg'
  );
};

// Show notification for gold gain
const showGoldNotification = (amount) => {
  showNotification(
    'Gold Found!',
    `You found ${amount} gold!`,
    'icons/gold.svg'
  );
};

// Show notification for level up
const showLevelUpNotification = (level) => {
  showNotification(
    'Level Up!',
    `Congratulations! You've reached level ${level}!`,
    'icons/level_up.svg'
  );
};

// Show notification for random events
const showEventNotification = (event) => {
  if (!event) {
    console.error('Attempted to show notification for undefined event');
    return;
  }

  let title, iconUrl;
  
  switch (event.type) {
    case 'monster':
      title = 'Monster Encounter!';
      iconUrl = event.data && event.data.image ? `icons/monsters/${event.data.image}` : 'icons/monster_default.svg';
      break;
    case 'treasure':
      title = 'Treasure Found!';
      iconUrl = event.data && event.data.image ? `icons/treasures/${event.data.image}` : 'icons/treasure_default.svg';
      break;
    case 'riddle':
      title = 'Riddle Challenge!';
      iconUrl = 'icons/riddle.svg';
      break;
    case 'powerUp':
      title = 'Power-Up Found!';
      iconUrl = event.data && event.data.image ? `icons/powerups/${event.data.image}` : 'icons/powerup_default.svg';
      break;
    default:
      title = 'Event!';
      iconUrl = 'icons/unknown.svg';
  }
  
  showNotification(title, event.message || 'A new event has appeared!', iconUrl);
};

// Show notification for quest completion
const showQuestCompletionNotification = (quest) => {
  showNotification(
    'Quest Complete!',
    `You've completed "${quest.title}"! Rewards: ${quest.reward.xp} XP and ${quest.reward.gold} gold!`,
    'icons/quest_complete.svg'
  );
};

export {
  showNotification,
  showXPNotification,
  showGoldNotification,
  showLevelUpNotification,
  showEventNotification,
  showQuestCompletionNotification
}; 