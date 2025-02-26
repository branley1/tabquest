// Unit tests for the Notification utility
import {
  showNotification,
  showXPNotification,
  showGoldNotification,
  showLevelUpNotification,
  showEventNotification,
  showQuestCompletionNotification
} from '../src/utils/notification.js';

describe('Notification Utility', () => {
  // Mock chrome.notifications API
  const mockChromeNotifications = {
    create: jest.fn((id, options, callback) => {
      if (callback) callback();
      return id || 'generatedId';
    })
  };
  
  beforeAll(() => {
    global.chrome = {
      ...global.chrome,
      notifications: mockChromeNotifications
    };
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    mockChromeNotifications.create.mockClear();
  });
  
  test('should show basic notification', () => {
    const title = 'Test Title';
    const message = 'Test Message';
    const iconUrl = 'test-icon.png';
    
    showNotification(title, message, iconUrl);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: iconUrl,
        title: title,
        message: message
      },
      expect.any(Function)
    );
  });
  
  test('should show XP notification', () => {
    const amount = 100;
    
    showXPNotification(amount);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/xp.svg',
        title: 'XP Gained!',
        message: `You gained ${amount} XP!`
      },
      expect.any(Function)
    );
  });
  
  test('should show Gold notification', () => {
    const amount = 50;
    
    showGoldNotification(amount);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/gold.svg',
        title: 'Gold Found!',
        message: `You found ${amount} gold!`
      },
      expect.any(Function)
    );
  });
  
  test('should show Level Up notification', () => {
    const level = 5;
    
    showLevelUpNotification(level);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/level_up.svg',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${level}!`
      },
      expect.any(Function)
    );
  });
  
  test('should show Monster Event notification', () => {
    const event = {
      type: 'monster',
      data: {
        name: 'Goblin',
        level: 3,
        image: 'goblin.svg'
      },
      message: 'A goblin appears!'
    };
    
    showEventNotification(event);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/monsters/goblin.svg',
        title: 'Monster Encounter!',
        message: event.message
      },
      expect.any(Function)
    );
  });
  
  test('should show Treasure Event notification', () => {
    const event = {
      type: 'treasure',
      data: {
        name: 'Gold Pouch',
        gold: 50,
        image: 'gold_pouch.svg'
      },
      message: 'You found a pouch of gold!'
    };
    
    showEventNotification(event);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/treasures/gold_pouch.svg',
        title: 'Treasure Found!',
        message: event.message
      },
      expect.any(Function)
    );
  });
  
  test('should show Riddle Event notification', () => {
    const event = {
      type: 'riddle',
      data: {
        question: 'What has keys but no locks?',
        answer: 'A piano',
        image: 'riddle.svg'
      },
      message: 'A mysterious riddle appears!'
    };
    
    showEventNotification(event);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/riddle.svg',
        title: 'Riddle Challenge!',
        message: event.message
      },
      expect.any(Function)
    );
  });
  
  test('should show PowerUp Event notification', () => {
    const event = {
      type: 'powerup',
      data: {
        name: 'Focus Potion',
        effect: 'xp_multiplier',
        multiplier: 2,
        duration: 30,
        image: 'focus_potion.svg'
      },
      message: 'You found a focus potion!'
    };
    
    showEventNotification(event);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/unknown.svg',
        title: 'Event!',
        message: event.message
      },
      expect.any(Function)
    );
  });
  
  test('should show generic Event notification for unknown event type', () => {
    const event = {
      type: 'unknown',
      data: {
        name: 'Mystery',
        image: 'mystery.svg'
      },
      message: 'Something mysterious happened!'
    };
    
    showEventNotification(event);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/unknown.svg',
        title: 'Event!',
        message: event.message
      },
      expect.any(Function)
    );
  });
  
  test('should show Quest Completion notification', () => {
    const quest = {
      id: 'quest1',
      title: 'Tab Explorer',
      description: 'Open 10 different tabs',
      reward: {
        xp: 200,
        gold: 100
      }
    };
    
    showQuestCompletionNotification(quest);
    
    expect(mockChromeNotifications.create).toHaveBeenCalledWith(
      expect.any(String),
      {
        type: 'basic',
        iconUrl: 'icons/quest_complete.svg',
        title: 'Quest Complete!',
        message: `You've completed "${quest.title}"! Rewards: ${quest.reward.xp} XP and ${quest.reward.gold} gold!`
      },
      expect.any(Function)
    );
  });
}); 