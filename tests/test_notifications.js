// Unit tests for the Notifications utility
import * as notifications from '../src/utils/notifications';

// Mock chrome API directly in the jest.mock function
jest.mock('../src/utils/chrome-api', () => ({
  createNotification: jest.fn(() => Promise.resolve(true)),
  isExtensionEnvironment: false,
  notifications: {
    create: jest.fn(() => Promise.resolve(true))
  }
}));

// Get the mocked chromeAPI
import chromeAPI from '../src/utils/chrome-api';

describe('Notifications', () => {
  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();
    
    // Reset mocks to default
    chromeAPI.createNotification.mockImplementation(() => Promise.resolve(true));
    chromeAPI.notifications.create.mockImplementation(() => Promise.resolve(true));
    
    // Create direct spy on showNotification
    jest.spyOn(notifications, 'showNotification')
      .mockImplementation(() => Promise.resolve(true));
  });
  
  afterEach(() => {
    // Restore original implementation
    jest.restoreAllMocks();
  });

  describe('showNotification', () => {
    it('should show a notification with default options', async () => {
      // Temporarily restore the original implementation for this test
      jest.spyOn(notifications, 'showNotification').mockRestore();
      
      const title = 'Test Title';
      const message = 'Test Message';
      
      const result = await notifications.showNotification(title, message);
      
      // Verify that either API was called
      expect(
        chromeAPI.createNotification.mock.calls.length > 0 || 
        chromeAPI.notifications.create.mock.calls.length > 0
      ).toBe(true);
      
      expect(result).toBe(true);
    });

    it('should show a notification with custom options', async () => {
      // Temporarily restore the original implementation for this test
      jest.spyOn(notifications, 'showNotification').mockRestore();
      
      const title = 'Test Title';
      const message = 'Test Message';
      const options = {
        type: 'image',
        iconUrl: 'custom-icon.png'
      };
      
      const result = await notifications.showNotification(title, message, options);
      
      // Verify that either API was called
      expect(
        chromeAPI.createNotification.mock.calls.length > 0 || 
        chromeAPI.notifications.create.mock.calls.length > 0
      ).toBe(true);
      
      expect(result).toBe(true);
    });

    it('should handle errors when showing a notification', async () => {
      // Temporarily restore the original implementation for this test
      jest.spyOn(notifications, 'showNotification').mockRestore();
      
      const title = 'Test Title';
      const message = 'Test Message';
      
      // Mock errors
      chromeAPI.createNotification.mockRejectedValueOnce(new Error('Test error'));
      chromeAPI.notifications.create.mockRejectedValueOnce(new Error('Test error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
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
      const result = await notifications.showXPNotification(amount);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'XP Gained!',
        'You gained 100 XP!'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showGoldNotification', () => {
    it('should show a gold notification with the correct amount', async () => {
      const amount = 50;
      const result = await notifications.showGoldNotification(amount);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Gold Found!',
        'You found 50 gold!'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showMonsterNotification', () => {
    it('should show a monster notification with the correct details', async () => {
      const monster = {
        name: 'Dragon',
        xp: 200,
        gold: 150
      };
      
      const result = await notifications.showMonsterNotification(monster);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Monster Encounter!',
        'You encountered a Dragon! Defeat it to earn 200 XP and 150 gold.'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showTreasureNotification', () => {
    it('should show a treasure notification with the correct details', async () => {
      const treasure = {
        name: 'Gold Chest',
        xp: 100,
        gold: 200
      };
      
      const result = await notifications.showTreasureNotification(treasure);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Treasure Found!',
        'You found a Gold Chest! You gained 100 XP and 200 gold.'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showRiddleNotification', () => {
    it('should show a riddle notification with the correct question', async () => {
      const riddle = {
        question: 'What has keys but no locks?'
      };
      
      const result = await notifications.showRiddleNotification(riddle);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Riddle Challenge!',
        'Solve this riddle: What has keys but no locks?'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showEventNotification', () => {
    it('should show an event notification with the correct details', async () => {
      const event = {
        title: 'New Event!',
        message: 'A wild monster appears!',
        icon: 'custom-icon.png'
      };
      
      const result = await notifications.showEventNotification(event);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'New Event!',
        'A wild monster appears!',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
    });

    it('should use default values if event details are missing', async () => {
      const event = {};
      
      const result = await notifications.showEventNotification(event);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'New Event!',
        'A new event has appeared!',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
    });

    it('should return false if event is null or undefined', async () => {
      const result = await notifications.showEventNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showEventCompletedNotification', () => {
    it('should show an event completed notification with the correct details', async () => {
      const event = {
        title: 'Defeat the dragon',
        icon: 'custom-icon.png'
      };
      
      const result = await notifications.showEventCompletedNotification(event);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Event Completed!',
        'You completed: Defeat the dragon',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
    });

    it('should use default icon if event icon is missing', async () => {
      const event = {
        title: 'Defeat the dragon'
      };
      
      const result = await notifications.showEventCompletedNotification(event);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Event Completed!',
        'You completed: Defeat the dragon',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
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
      
      const result = await notifications.showPowerUpNotification(powerUp);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Power-Up Activated!',
        'Double XP for 5 minutes',
        { iconUrl: 'custom-icon.png' }
      );
      
      expect(result).toBe(true);
    });

    it('should use default values if power-up details are missing', async () => {
      const powerUp = {};
      
      const result = await notifications.showPowerUpNotification(powerUp);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Power-Up Activated!',
        'You activated a power-up!',
        { iconUrl: 'images/icon-48.png' }
      );
      
      expect(result).toBe(true);
    });

    it('should return false if power-up is null or undefined', async () => {
      const result = await notifications.showPowerUpNotification(null);
      
      expect(result).toBe(false);
    });
  });

  describe('showLevelUpNotification', () => {
    it('should show a level up notification with the correct level', async () => {
      const level = 5;
      
      const result = await notifications.showLevelUpNotification(level);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Level Up!',
        'Congratulations! You reached level 5!'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showQuestCompletionNotification', () => {
    it('should show a quest completion notification with the correct details', async () => {
      const quest = {
        title: 'Slay the Dragon',
        xp: 500,
        gold: 300
      };
      
      const result = await notifications.showQuestCompletionNotification(quest);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Quest Complete!',
        'You\'ve completed "Slay the Dragon"! Rewards: 500 XP and 300 gold!'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showQuestCompletedNotification', () => {
    it('should show a quest completed notification with the correct title', async () => {
      const quest = {
        title: 'Slay the Dragon'
      };
      
      const result = await notifications.showQuestCompletedNotification(quest);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Quest Completed!',
        'You completed: Slay the Dragon'
      );
      
      expect(result).toBe(true);
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
      
      const result = await notifications.showTabClosedNotification(xp, gold);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Tab Closed',
        'Tab closed! You earned 20 XP and 10 gold.'
      );
      
      expect(result).toBe(true);
    });
  });

  describe('showAchievementNotification', () => {
    it('should show an achievement notification with the correct title', async () => {
      const achievement = {
        title: 'Tab Master'
      };
      
      const result = await notifications.showAchievementNotification(achievement);
      
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Achievement Unlocked!',
        'You\'ve earned the "Tab Master" achievement!'
      );
      
      expect(result).toBe(true);
    });
  });
});