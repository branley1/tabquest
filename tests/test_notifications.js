// Unit tests for the Notifications utility
import * as notifications from '../src/utils/notifications';
import chromeAPI from '../src/utils/chrome-api';

// Mock the chrome API
jest.mock('../src/utils/chrome-api', () => ({
  createNotification: jest.fn(),
  isExtensionEnvironment: false
}));

describe('Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showNotification', () => {
    it('should show a notification with default options', async () => {
      const title = 'Test Title';
      const message = 'Test Message';
      
      chromeAPI.createNotification.mockResolvedValueOnce(true);
      
      const result = await notifications.showNotification(title, message);
      
      expect(chromeAPI.createNotification).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'images/icon-48.png',
        title: 'Test Title',
        message: 'Test Message'
      });
      
      expect(result).toBe(true);
    });

    it('should show a notification with custom options', async () => {
      const title = 'Test Title';
      const message = 'Test Message';
      const options = {
        type: 'image',
        iconUrl: 'custom-icon.png'
      };
      
      chromeAPI.createNotification.mockResolvedValueOnce(true);
      
      const result = await notifications.showNotification(title, message, options);
      
      expect(chromeAPI.createNotification).toHaveBeenCalledWith({
        type: 'image',
        iconUrl: 'custom-icon.png',
        title: 'Test Title',
        message: 'Test Message'
      });
      
      expect(result).toBe(true);
    });

    it('should handle errors when showing a notification', async () => {
      const title = 'Test Title';
      const message = 'Test Message';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      chromeAPI.createNotification.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await notifications.showNotification(title, message);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to show notification:',
        expect.any(Error)
      );
      
      expect(result).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('showXPNotification', () => {
    it('should show an XP notification with the correct amount', async () => {
      const amount = 100;
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showXPNotification(amount);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'XP Gained!',
        'You gained 100 XP!'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showGoldNotification', () => {
    it('should show a gold notification with the correct amount', async () => {
      const amount = 50;
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showGoldNotification(amount);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Gold Found!',
        'You found 50 gold!'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showMonsterNotification', () => {
    it('should show a monster notification with the correct details', async () => {
      const monster = {
        name: 'Dragon',
        xp: 200,
        gold: 150
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showMonsterNotification(monster);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Monster Encounter!',
        'You encountered a Dragon! Defeat it to earn 200 XP and 150 gold.'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showTreasureNotification', () => {
    it('should show a treasure notification with the correct details', async () => {
      const treasure = {
        name: 'Gold Chest',
        xp: 100,
        gold: 200
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showTreasureNotification(treasure);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Treasure Found!',
        'You found a Gold Chest! You gained 100 XP and 200 gold.'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showRiddleNotification', () => {
    it('should show a riddle notification with the correct question', async () => {
      const riddle = {
        question: 'What has keys but no locks?'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showRiddleNotification(riddle);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Riddle Challenge!',
        'Solve this riddle: What has keys but no locks?'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showEventNotification', () => {
    it('should show an event notification with the correct details', async () => {
      const event = {
        description: 'A wild monster appears!',
        icon: 'custom-icon.png'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showEventNotification(event);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'New Event!',
        'A wild monster appears!',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should use default values if event details are missing', async () => {
      const event = {};
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showEventNotification(event);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'New Event!',
        'A new event has appeared!',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should return false if event is null or undefined', async () => {
      const result = await notifications.showEventNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showEventCompletedNotification', () => {
    it('should show an event completed notification with the correct details', async () => {
      const event = {
        description: 'Defeat the dragon',
        icon: 'custom-icon.png'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showEventCompletedNotification(event);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Event Completed!',
        'You completed: Defeat the dragon',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should use default icon if event icon is missing', async () => {
      const event = {
        description: 'Defeat the dragon'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showEventCompletedNotification(event);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Event Completed!',
        'You completed: Defeat the dragon',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should return false if event is null or undefined', async () => {
      const result = await notifications.showEventCompletedNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showPowerUpNotification', () => {
    it('should show a power-up notification with the correct details', async () => {
      const powerUp = {
        description: 'Double XP for 5 minutes',
        icon: 'custom-icon.png'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showPowerUpNotification(powerUp);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Power-Up Activated!',
        'Double XP for 5 minutes',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should use default values if power-up details are missing', async () => {
      const powerUp = {};
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showPowerUpNotification(powerUp);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Power-Up Activated!',
        'You activated a power-up!',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should return false if power-up is null or undefined', async () => {
      const result = await notifications.showPowerUpNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showLevelUpNotification', () => {
    it('should show a level up notification with the correct level', async () => {
      const level = 5;
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showLevelUpNotification(level);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Level Up!',
        'Congratulations! You reached level 5!'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showQuestCompletionNotification', () => {
    it('should show a quest completion notification with the correct details', async () => {
      const quest = {
        title: 'Slay the Dragon',
        reward: {
          xp: 500,
          gold: 300
        }
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showQuestCompletionNotification(quest);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Quest Complete!',
        'You\'ve completed "Slay the Dragon"! Rewards: 500 XP and 300 gold!'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showQuestCompletedNotification', () => {
    it('should show a quest completed notification with the correct title', async () => {
      const quest = {
        title: 'Slay the Dragon'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showQuestCompletedNotification(quest);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Quest Completed!',
        'You completed: Slay the Dragon'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });

    it('should return false if quest is null or undefined', async () => {
      const result = await notifications.showQuestCompletedNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showTabClosedNotification', () => {
    it('should show a tab closed notification with the correct rewards', async () => {
      const xp = 20;
      const gold = 10;
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showTabClosedNotification(xp, gold);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Tab Closed',
        'Tab closed! You earned 20 XP and 10 gold.'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });

  describe('showAchievementNotification', () => {
    it('should show an achievement notification with the correct title', async () => {
      const achievement = {
        title: 'Tab Master'
      };
      
      // First mock the underlying function that would be called
      chromeAPI.createNotification.mockImplementation(() => {});
      // Then just spy on the showNotification without affecting its implementation
      const showNotificationSpy = jest.spyOn(notifications, 'showNotification');
      
      const result = await notifications.showAchievementNotification(achievement);
      
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Achievement Unlocked!',
        'You\'ve earned the "Tab Master" achievement!'
      );
      
      expect(result).toBe(true);
      
      showNotificationSpy.mockRestore();
    });
  });
}); 