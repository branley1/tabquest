// Achievement definitions
export const achievements = [
  {
    id: 'first_monster',
    title: 'Monster Slayer',
    description: 'Defeat your first monster',
    condition: 'monsters_defeated',
    threshold: 1,
    reward: { xp: 50, gold: 20 }
  },
  {
    id: 'first_treasure',
    title: 'Treasure Hunter',
    description: 'Find your first treasure',
    condition: 'treasures_found', 
    threshold: 1,
    reward: { xp: 50, gold: 20 }
  },
  {
    id: 'tab_master',
    title: 'Tab Master',
    description: 'Close 100 tabs',
    condition: 'tabs_closed',
    threshold: 100,
    reward: { xp: 200, gold: 100 }
  },
  {
    id: 'level_5',
    title: 'Adventurer',
    description: 'Reach level 5',
    condition: 'level_reached',
    threshold: 5,
    reward: { xp: 0, gold: 200 }
  },
  {
    id: 'golden_hoard',
    title: 'Dragon\'s Hoard',
    description: 'Collect 1000 gold',
    condition: 'gold_collected',
    threshold: 1000,
    reward: { xp: 100, gold: 0 }
  }
];

// Function to check for unlocked achievements
export function checkAchievements(player, action, value) {
  // Guard clauses for invalid inputs
  if (!player) {
    return [];
  }
  
  // Ensure player.achievements exists
  if (!player.achievements) {
    player.achievements = [];
  }
  
  // If no action or value provided, return empty array
  if (!action || value === undefined || value === null) {
    return [];
  }
  
  const newAchievements = [];
  
  achievements.forEach(achievement => {
    // Skip if already earned
    if (player.achievements.some(a => a.id === achievement.id)) {
      return;
    }
    
    let metCondition = false;
    
    // Check different types of conditions
    switch(achievement.condition) {
      case 'level_reached':
        metCondition = player.level >= achievement.threshold;
        break;
      case 'gold_collected':
        metCondition = player.gold >= achievement.threshold;
        break;
      case action: // Dynamic condition from parameter
        metCondition = value >= achievement.threshold;
        break;
    }
    
    if (metCondition) {
      // Try adding achievement through the player method first
      if (typeof player.addAchievement === 'function') {
        try {
          const added = player.addAchievement(achievement);
          if (added) {
            newAchievements.push(achievement);
          }
        } catch (error) {
          console.error('Error adding achievement via player method:', error);
          // Fallback to direct addition if method fails
          if (!player.achievements.find(a => a.id === achievement.id)) {
            const achievementWithDate = {
              ...achievement,
              earnedAt: new Date().toISOString()
            };
            player.achievements.push(achievementWithDate);
            newAchievements.push(achievementWithDate);
          }
        }
      } else {
        // Fallback if player.addAchievement is not available
        if (!player.achievements.find(a => a.id === achievement.id)) {
          const achievementWithDate = {
            ...achievement,
            earnedAt: new Date().toISOString()
          };
          player.achievements.push(achievementWithDate);
          newAchievements.push(achievementWithDate);
        }
      }
    }
  });
  
  return newAchievements;
}
