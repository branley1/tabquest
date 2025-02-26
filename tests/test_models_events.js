// Unit tests for the Events model
import { 
  generateRandomEvent, 
  getTabClosedReward, 
  updateQuestProgress, 
  quests,
  monsters,
  treasures,
  riddles,
  powerUps
} from '../src/models/events.js';

describe('Events Model', () => {
  // Mock Math.random for predictable tests
  const mockMath = Object.create(global.Math);
  const originalMath = global.Math;
  
  beforeEach(() => {
    global.Math = mockMath;
  });
  
  afterEach(() => {
    global.Math = originalMath;
  });
  
  describe('generateRandomEvent', () => {
    test('should generate a monster event when random roll is low', () => {
      mockMath.random = () => 0.1; // Will trigger monster event
      
      const event = generateRandomEvent(1);
      
      expect(event.type).toBe('monster');
      expect(event.data).toBeDefined();
      expect(event.message).toContain('You encountered a');
      expect(event.message).toContain('Defeat it to earn');
    });
    
    test('should generate a treasure event when random roll is in treasure range', () => {
      mockMath.random = () => 0.5; // Will trigger treasure event
      
      const event = generateRandomEvent(1);
      
      expect(event.type).toBe('treasure');
      expect(event.data).toBeDefined();
      expect(event.message).toContain('You found a');
      expect(event.message).toContain('You gained');
    });
    
    test('should generate a riddle event when random roll is in riddle range', () => {
      mockMath.random = () => 0.75; // Will trigger riddle event
      
      const event = generateRandomEvent(1);
      
      expect(event.type).toBe('riddle');
      expect(event.data).toBeDefined();
      expect(event.message).toContain('Solve this riddle');
    });
    
    test('should generate a powerUp event when random roll is high', () => {
      mockMath.random = () => 0.95; // Will trigger powerUp event
      
      const event = generateRandomEvent(1);
      
      expect(event.type).toBe('powerUp');
      expect(event.data).toBeDefined();
      expect(event.message).toContain('You found a');
    });
    
    test('should filter monsters based on player level', () => {
      mockMath.random = () => 0.1; // Will trigger monster event
      mockMath.floor = originalMath.floor; // Use original floor function
      
      // Mock the array selection to always pick the first monster
      const originalArraySelection = Array.prototype.slice;
      Array.prototype.slice = function() { return this; };
      
      const lowLevelEvent = generateRandomEvent(1);
      const highLevelEvent = generateRandomEvent(10);
      
      // Restore original array behavior
      Array.prototype.slice = originalArraySelection;
      
      // Low level player should only encounter low level monsters
      expect(lowLevelEvent.type).toBe('monster');
      expect(lowLevelEvent.data.level).toBeLessThanOrEqual(3); // Player level + 2
      
      // High level player can encounter any monster
      expect(highLevelEvent.type).toBe('monster');
      // All monsters should be available to a high level player
      expect(monsters.some(m => m.id === highLevelEvent.data.id)).toBeTruthy();
    });
  });
  
  describe('getTabClosedReward', () => {
    test('should calculate rewards based on tab duration', () => {
      // Test short duration (< 10 minutes)
      const shortReward = getTabClosedReward(30);
      expect(shortReward.xp).toBe(5);
      expect(shortReward.gold).toBe(2);
      
      // Test long duration (> 10 minutes)
      const longReward = getTabClosedReward(660); // 11 minutes
      expect(longReward.xp).toBe(16); // 5 base + 11 (1 per minute)
      expect(longReward.gold).toBe(7); // 2 base + 5 (1 per 2 minutes)
    });
    
    test('should include message in the reward', () => {
      const reward = getTabClosedReward(30);
      expect(reward.message).toBe(`Tab closed! You earned ${reward.xp} XP and ${reward.gold} gold.`);
    });
  });
  
  describe('updateQuestProgress', () => {
    test('should update progress for matching quest type', () => {
      // Create a copy of quests to avoid modifying the original
      const testQuests = JSON.parse(JSON.stringify(quests));
      
      // Find a quest with the right type
      const questType = 'monsters_defeated';
      
      // Update quest progress
      const updatedQuests = updateQuestProgress(testQuests, questType, 1);
      const updatedQuest = updatedQuests.find(q => q.type === questType);
      
      expect(updatedQuest.progress).toBe(1);
      
      // Update again to test cumulative progress
      const updatedAgain = updateQuestProgress(updatedQuests, questType, 2);
      const questAgain = updatedAgain.find(q => q.type === questType);
      
      expect(questAgain.progress).toBe(3);
    });
    
    test('should mark quest as completed when goal is reached', () => {
      // Create a copy of quests to avoid modifying the original
      const testQuests = JSON.parse(JSON.stringify(quests));
      
      // Find a quest to complete
      const questType = 'monsters_defeated';
      const quest = testQuests.find(q => q.type === questType);
      const goal = quest.goal;
      
      // Update progress to exactly reach the goal
      const updatedQuests = updateQuestProgress(testQuests, questType, goal);
      const completedQuest = updatedQuests.find(q => q.type === questType);
      
      expect(completedQuest.progress).toBe(goal);
      expect(completedQuest.completed).toBe(true);
      expect(completedQuest.isNew).toBe(true);
    });
    
    test('should not update progress for non-matching quest type', () => {
      // Create a copy of quests to avoid modifying the original
      const testQuests = JSON.parse(JSON.stringify(quests));
      
      // Update with a non-existent quest type
      const updatedQuests = updateQuestProgress(testQuests, 'non_existent_type', 1);
      
      // Quests should remain unchanged
      expect(updatedQuests).toEqual(testQuests);
    });
    
    test('should not increase progress beyond goal', () => {
      // Create a copy of quests to avoid modifying the original
      const testQuests = JSON.parse(JSON.stringify(quests));
      
      // Complete a quest
      const questType = 'monsters_defeated';
      const quest = testQuests.find(q => q.type === questType);
      const goal = quest.goal;
      
      // First update to complete the quest
      const completedQuests = updateQuestProgress(testQuests, questType, goal);
      const completedQuest = completedQuests.find(q => q.type === questType);
      
      // Then try to update again
      const updatedAgain = updateQuestProgress(completedQuests, questType, 10);
      const questAgain = updatedAgain.find(q => q.type === questType);
      
      // Progress should not exceed goal
      expect(questAgain.progress).toBe(goal);
    });
  });
}); 