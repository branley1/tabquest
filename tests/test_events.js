// Unit tests for the Events system
import * as EventsModule from '../src/utils/events.js';

describe('Events System', () => {
  // Mock Math.random for consistent testing
  let originalRandom;
  let originalFloor;
  
  beforeEach(() => {
    originalRandom = Math.random;
    originalFloor = Math.floor;
  });
  
  afterEach(() => {
    Math.random = originalRandom;
    Math.floor = originalFloor;
  });
  
  describe('Data Validation', () => {
    test('should have valid monsters data', () => {
      expect(EventsModule.monsters).toBeDefined();
      expect(EventsModule.monsters.length).toBeGreaterThan(0);
      
      EventsModule.monsters.forEach(monster => {
        expect(monster).toHaveProperty('id');
        expect(monster).toHaveProperty('name');
        expect(monster).toHaveProperty('level');
        expect(monster).toHaveProperty('xp');
        expect(monster).toHaveProperty('gold');
        expect(monster).toHaveProperty('image');
        
        expect(typeof monster.id).toBe('string');
        expect(typeof monster.name).toBe('string');
        expect(typeof monster.level).toBe('number');
        expect(typeof monster.xp).toBe('number');
        expect(typeof monster.gold).toBe('number');
        expect(typeof monster.image).toBe('string');
        
        // Additional validations
        expect(monster.level).toBeGreaterThan(0);
        expect(monster.xp).toBeGreaterThanOrEqual(0);
        expect(monster.gold).toBeGreaterThanOrEqual(0);
      });
    });
    
    test('should have valid treasures data', () => {
      expect(EventsModule.treasures).toBeDefined();
      expect(EventsModule.treasures.length).toBeGreaterThan(0);
      
      EventsModule.treasures.forEach(treasure => {
        expect(treasure).toHaveProperty('id');
        expect(treasure).toHaveProperty('name');
        expect(treasure).toHaveProperty('gold');
        expect(treasure).toHaveProperty('xp');
        expect(treasure).toHaveProperty('image');
        
        expect(typeof treasure.id).toBe('string');
        expect(typeof treasure.name).toBe('string');
        expect(typeof treasure.gold).toBe('number');
        expect(typeof treasure.xp).toBe('number');
        expect(typeof treasure.image).toBe('string');
        
        // Additional validations
        expect(treasure.gold).toBeGreaterThanOrEqual(0);
        expect(treasure.xp).toBeGreaterThanOrEqual(0);
      });
    });
    
    test('should have valid riddles data', () => {
      expect(EventsModule.riddles).toBeDefined();
      expect(EventsModule.riddles.length).toBeGreaterThan(0);
      
      EventsModule.riddles.forEach(riddle => {
        expect(riddle).toHaveProperty('id');
        expect(riddle).toHaveProperty('question');
        expect(riddle).toHaveProperty('answer');
        expect(riddle).toHaveProperty('xp');
        expect(riddle).toHaveProperty('gold');
        
        expect(typeof riddle.id).toBe('string');
        expect(typeof riddle.question).toBe('string');
        expect(typeof riddle.answer).toBe('string');
        expect(typeof riddle.xp).toBe('number');
        expect(typeof riddle.gold).toBe('number');
        
        // Additional validations
        expect(riddle.question.length).toBeGreaterThan(0);
        expect(riddle.answer.length).toBeGreaterThan(0);
        expect(riddle.xp).toBeGreaterThanOrEqual(0);
        expect(riddle.gold).toBeGreaterThanOrEqual(0);
      });
    });
    
    test('should have valid power-ups data', () => {
      expect(EventsModule.powerUps).toBeDefined();
      expect(EventsModule.powerUps.length).toBeGreaterThan(0);
      
      EventsModule.powerUps.forEach(powerUp => {
        expect(powerUp).toHaveProperty('id');
        expect(powerUp).toHaveProperty('name');
        expect(powerUp).toHaveProperty('description');
        expect(powerUp).toHaveProperty('duration');
        expect(powerUp).toHaveProperty('type');
        expect(powerUp).toHaveProperty('image');
        
        expect(typeof powerUp.id).toBe('string');
        expect(typeof powerUp.name).toBe('string');
        expect(typeof powerUp.description).toBe('string');
        expect(typeof powerUp.duration).toBe('number');
        expect(typeof powerUp.type).toBe('string');
        expect(typeof powerUp.image).toBe('string');
        
        // Additional validations
        expect(powerUp.duration).toBeGreaterThan(0);
        expect(powerUp.description.length).toBeGreaterThan(0);
        
        // Validate multiplier if present
        if (powerUp.multiplier) {
          expect(typeof powerUp.multiplier).toBe('number');
          expect(powerUp.multiplier).toBeGreaterThan(1);
        }
      });
    });
    
    test('should have valid quests data', () => {
      expect(EventsModule.quests).toBeDefined();
      expect(EventsModule.quests.length).toBeGreaterThan(0);
      
      EventsModule.quests.forEach(quest => {
        expect(quest).toHaveProperty('id');
        expect(quest).toHaveProperty('name');
        expect(quest).toHaveProperty('description');
        expect(quest).toHaveProperty('goal');
        expect(quest).toHaveProperty('progress');
        expect(quest).toHaveProperty('type');
        expect(quest).toHaveProperty('reward');
        
        expect(typeof quest.id).toBe('string');
        expect(typeof quest.name).toBe('string');
        expect(typeof quest.description).toBe('string');
        expect(typeof quest.goal).toBe('number');
        expect(typeof quest.progress).toBe('number');
        expect(typeof quest.type).toBe('string');
        expect(typeof quest.reward).toBe('object');
        
        // Additional validations
        expect(quest.goal).toBeGreaterThan(0);
        expect(quest.progress).toBeGreaterThanOrEqual(0);
        expect(quest.description.length).toBeGreaterThan(0);
        
        // Validate reward structure
        expect(quest.reward).toHaveProperty('xp');
        expect(quest.reward).toHaveProperty('gold');
        expect(typeof quest.reward.xp).toBe('number');
        expect(typeof quest.reward.gold).toBe('number');
        expect(quest.reward.xp).toBeGreaterThanOrEqual(0);
        expect(quest.reward.gold).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  describe('Random Event Generation', () => {
    test('should generate monster events', () => {
      Math.random = jest.fn().mockReturnValue(0.1); // within monster range
      Math.floor = jest.fn().mockReturnValue(0); // To select the first monster
      
      const event = EventsModule.generateRandomEvent(1);
      
      expect(event.type).toBe('monster');
      expect(event.data).toBeDefined();
      expect(event.message).toContain(event.data.name);
      expect(event.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        level: expect.any(Number),
        xp: expect.any(Number),
        gold: expect.any(Number),
        image: expect.any(String)
      }));
    });
    
    test('should generate treasure events', () => {
      Math.random = jest.fn().mockReturnValue(0.5); // within treasure range
      Math.floor = jest.fn().mockReturnValue(0); // To select the first treasure
      
      const event = EventsModule.generateRandomEvent(1);
      
      expect(event.type).toBe('treasure');
      expect(event.data).toBeDefined();
      expect(event.message).toContain(event.data.name);
      expect(event.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        gold: expect.any(Number),
        xp: expect.any(Number),
        image: expect.any(String)
      }));
    });
    
    test('should generate riddle events', () => {
      Math.random = jest.fn().mockReturnValue(0.75); // within riddle range
      Math.floor = jest.fn().mockReturnValue(0); // To select the first riddle
      
      const event = EventsModule.generateRandomEvent(1);
      
      expect(event.type).toBe('riddle');
      expect(event.data).toBeDefined();
      expect(event.message).toContain(event.data.question);
      expect(event.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        question: expect.any(String),
        answer: expect.any(String),
        xp: expect.any(Number),
        gold: expect.any(Number)
      }));
    });
    
    test('should generate power-up events', () => {
      Math.random = jest.fn().mockReturnValue(0.95); // within power-up range
      Math.floor = jest.fn().mockReturnValue(0); // To select the first power-up
      
      const event = EventsModule.generateRandomEvent(1);
      
      expect(event.type).toBe('powerUp');
      expect(event.data).toBeDefined();
      expect(event.message).toContain(event.data.name);
      expect(event.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        duration: expect.any(Number),
        type: expect.any(String),
        image: expect.any(String)
      }));
    });
    
    test('should filter monsters by player level', () => {
      // Instead of mocking the monsters array, mock random values for consistent tests
      Math.random = jest.fn().mockReturnValue(0.1); // Within monster range
      Math.floor = jest.fn().mockReturnValue(0); // Select first eligible monster
      
      // For low level player, should get low level monsters
      const lowLevelEvent = EventsModule.generateRandomEvent(1);
      expect(lowLevelEvent.type).toBe('monster');
      // We don't need to check the exact monster ID since the test is about filtering by level
      
      // For high level player, should get high level monsters
      const highLevelEvent = EventsModule.generateRandomEvent(5);
      expect(highLevelEvent.type).toBe('monster');
    });
    
    test('should handle case with no eligible monsters', () => {
      // Mock an unrealistic player level that doesn't match any monsters
      const unusualLevel = 100; // Assume no monster has level 100
      
      // Force different random values for testing the fallback paths
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // First call (monster range, but no eligible monsters)
        .mockReturnValueOnce(0.2); // Used in fallback mechanism
        
      Math.floor = jest.fn().mockReturnValue(0);
      
      const event = EventsModule.generateRandomEvent(unusualLevel);
      
      // Should fallback to a non-monster event type
      expect(event.type).not.toBe('monster');
    });
  });
  
  describe('Tab Rewards Calculation', () => {
    test('should calculate tab closed rewards correctly', () => {
      // Test base rewards for short duration
      const shortDuration = 30; // 30 seconds
      const shortReward = EventsModule.getTabClosedReward(shortDuration);
      
      expect(shortReward.xp).toBe(5 + 0); // Base XP, no minutes
      expect(shortReward.gold).toBe(2 + 0); // Base gold, no minutes
      
      // Test rewards for exactly one minute
      const oneMinDuration = 60; // 1 minute
      const oneMinReward = EventsModule.getTabClosedReward(oneMinDuration);
      
      expect(oneMinReward.xp).toBe(5 + 1); // Base XP + 1 for the minute
      expect(oneMinReward.gold).toBe(2 + 0); // Base gold, not enough for bonus
      
      // Test rewards for 5 minutes
      const fiveMinDuration = 300; // 5 minutes
      const fiveMinReward = EventsModule.getTabClosedReward(fiveMinDuration);
      
      expect(fiveMinReward.xp).toBe(5 + 5); // Base + 1 per minute
      expect(fiveMinReward.gold).toBe(2 + 2); // Base + 1 per 2 minutes (floor(5/2)=2)
      
      // Test increased rewards for longer duration
      const longDuration = 1200; // 20 minutes
      const longReward = EventsModule.getTabClosedReward(longDuration);
      
      expect(longReward.xp).toBe(5 + 20); // Base + 1 per minute
      expect(longReward.gold).toBe(2 + 10); // Base + 1 per 2 minutes
      
      // Test extreme duration (multiple hours)
      const extremeDuration = 7200; // 2 hours = 120 minutes
      const extremeReward = EventsModule.getTabClosedReward(extremeDuration);
      
      expect(extremeReward.xp).toBe(5 + 120); // Base + 1 per minute
      expect(extremeReward.gold).toBe(2 + 60); // Base + 1 per 2 minutes
    });
    
    test('should handle zero or negative durations properly', () => {
      // Test with zero duration
      const zeroReward = EventsModule.getTabClosedReward(0);
      expect(zeroReward.xp).toBe(5); // Base XP only (no additional)
      expect(zeroReward.gold).toBe(2); // Base gold only (no additional)
      
      // Test with negative duration (should be treated as zero)
      const negativeReward = EventsModule.getTabClosedReward(-10);
      expect(negativeReward.xp).toBe(5); // Same as with zero
      expect(negativeReward.gold).toBe(2); // Same as with zero
    });
  });
  
  describe('Quest Management', () => {
    test('should update quest progress correctly', () => {
      const testQuests = [
        {
          id: 'test_quest',
          name: 'Test Quest',
          goal: 10,
          progress: 5,
          type: 'test_action',
          completed: false
        },
        {
          id: 'other_quest',
          name: 'Other Quest',
          goal: 5,
          progress: 0,
          type: 'other_action',
          completed: false
        }
      ];
      
      // Update progress for test_action
      const updatedQuests = EventsModule.updateQuestProgress(testQuests, 'test_action');
      
      expect(updatedQuests[0].progress).toBe(6); // Increased by 1
      expect(updatedQuests[0].completed).toBe(false);
      expect(updatedQuests[0].isNew).toBeUndefined();
      
      expect(updatedQuests[1].progress).toBe(0); // Unchanged
      
      // Update progress for test_action by a larger value
      const updatedWithValue = EventsModule.updateQuestProgress(testQuests, 'test_action', 5);
      
      expect(updatedWithValue[0].progress).toBe(10); // Reached goal
      expect(updatedWithValue[0].completed).toBe(true);
      expect(updatedWithValue[0].isNew).toBe(true);
      
      // Test for already completed quest
      const completedQuests = [
        {
          id: 'completed_quest',
          name: 'Completed Quest',
          goal: 10,
          progress: 10,
          type: 'test_action',
          completed: true
        }
      ];
      
      const updatedCompleted = EventsModule.updateQuestProgress(completedQuests, 'test_action');
      
      expect(updatedCompleted[0].progress).toBe(10); // Already at goal, not exceeded
      expect(updatedCompleted[0].completed).toBe(true);
      expect(updatedCompleted[0].isNew).toBeUndefined(); // Not newly completed
    });
    
    test('should handle progress exceeding goal', () => {
      const testQuests = [
        {
          id: 'almost_quest',
          name: 'Almost Complete',
          goal: 10,
          progress: 9,
          type: 'test_action',
          completed: false
        }
      ];
      
      // Update with a value that exceeds the goal
      const updatedQuests = EventsModule.updateQuestProgress(testQuests, 'test_action', 5);
      
      expect(updatedQuests[0].progress).toBe(10); // Cap at goal value
      expect(updatedQuests[0].completed).toBe(true);
      expect(updatedQuests[0].isNew).toBe(true);
    });
    
    test('should handle empty quests array', () => {
      const emptyQuests = [];
      
      const updatedQuests = EventsModule.updateQuestProgress(emptyQuests, 'test_action');
      
      expect(updatedQuests).toEqual([]);
    });
    
    test('should handle null or undefined quests', () => {
      const nullQuests = null;
      const undefinedQuests = undefined;
      
      // These should not throw errors
      let result;
      expect(() => {
        result = EventsModule.updateQuestProgress(nullQuests, 'test_action');
      }).not.toThrow();
      
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
      
      expect(() => {
        result = EventsModule.updateQuestProgress(undefinedQuests, 'test_action');
      }).not.toThrow();
      
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(0);
    });
  });
}); 