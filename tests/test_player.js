// Unit tests for Player class
import { Player } from '../src/models/player.js';

describe('Player Class', () => {
  let player;
  
  beforeEach(() => {
    // Create a fresh player instance before each test
    player = new Player();
  });
  
  test('should initialize with default values', () => {
    expect(player.xp).toBe(0);
    expect(player.level).toBe(1);
    expect(player.gold).toBe(0);
    expect(player.characterClass).toBeNull();
    expect(player.quests).toEqual([]);
    expect(player.achievements).toEqual([]);
    expect(player.buffs).toEqual([]);
  });
  
  test('should calculate XP needed for next level correctly', () => {
    expect(player.getXpForNextLevel()).toBe(100); // Level 1 -> 2
    
    player.level = 2;
    expect(player.getXpForNextLevel()).toBe(150); // Level 2 -> 3
    
    player.level = 5;
    expect(player.getXpForNextLevel()).toBe(Math.floor(100 * Math.pow(1.5, 4))); // Level 5 -> 6
  });
  
  test('should add XP correctly', () => {
    const result = player.addXp(50);
    expect(player.xp).toBe(50);
    expect(result.xpGained).toBe(50);
  });
  
  test('should add XP with class multiplier', () => {
    player.characterClass = 'warrior';
    const result = player.addXp(10);
    expect(player.xp).toBe(11); // 10 * 1.1 (10% more)
    expect(result.xpGained).toBe(11);
    
    // Reset player for next test
    player = new Player();
    player.characterClass = 'mage';
    const result2 = player.addXp(10);
    expect(player.xp).toBe(12); // 10 * 1.2 (20% more)
    expect(result2.xpGained).toBe(12);
  });
  
  test('should level up when XP threshold is reached', () => {
    player.addXp(150);
    expect(player.level).toBe(2);
    expect(player.xp).toBe(50); // 150 - 100 = 50 carry over
  });
  
  test('should add gold correctly', () => {
    const result = player.addGold(50);
    expect(player.gold).toBe(50);
    expect(result.goldGained).toBe(50);
  });
  
  test('should add gold with class multiplier', () => {
    player.characterClass = 'rogue';
    const result = player.addGold(100);
    // The mocked Player implementation adds a 20% bonus for rogue
    expect(player.gold).toBe(120); 
    expect(result.goldGained).toBe(120);
  });
  
  test('should set character class correctly', () => {
    const success = player.setCharacterClass('warrior');
    expect(success).toBe(true);
    expect(player.characterClass).toBe('warrior');
    
    const failure = player.setCharacterClass('invalid');
    expect(failure).toBe(false);
    expect(player.characterClass).toBe('warrior'); // Still warrior
  });
  
  test('should add and manage buffs correctly', () => {
    const now = Date.now();
    const buff = {
      id: 'test_buff',
      name: 'Test Buff',
      type: 'test',
      duration: 60 // 60 seconds
    };
    
    player.addBuff(buff);
    expect(player.buffs.length).toBe(1);
    expect(player.buffs[0].type).toBe('test');
    expect(player.buffs[0].expiresAt).toBeGreaterThan(now);
    
    // Add another buff of the same type (should replace)
    const buff2 = { ...buff, name: 'New Test Buff' };
    player.addBuff(buff2);
    expect(player.buffs.length).toBe(1);
    expect(player.buffs[0].name).toBe('New Test Buff');
    
    // Test updateBuffs to remove expired buffs
    player.buffs[0].expiresAt = now - 1000; // Set expiration to past
    player.updateBuffs();
    expect(player.buffs.length).toBe(0);
  });
  
  test('should add achievements correctly', () => {
    const achievement = {
      id: 'test_achievement',
      title: 'Test Achievement'
    };
    
    const success = player.addAchievement(achievement);
    expect(success).toBe(true);
    expect(player.achievements.length).toBe(1);
    expect(player.achievements[0].id).toBe('test_achievement');
    expect(player.achievements[0].completedAt).toBeDefined();
    
    // Try to add the same achievement again (should not duplicate)
    const duplicate = player.addAchievement(achievement);
    expect(duplicate).toBe(false);
    expect(player.achievements.length).toBe(1);
  });
  
  test('should serialize to JSON correctly', () => {
    player.xp = 50;
    player.level = 2;
    player.gold = 100;
    player.characterClass = 'warrior';
    
    const json = player.toJSON();
    expect(json.xp).toBe(50);
    expect(json.level).toBe(2);
    expect(json.gold).toBe(100);
    expect(json.characterClass).toBe('warrior');
  });
}); 