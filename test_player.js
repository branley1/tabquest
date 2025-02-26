import { Player } from './src/models/player.js';

const player = new Player();
player.characterClass = 'warrior';
const result = player.addXp(100);

console.log('Player XP:', player.xp);
console.log('XP Gained:', result.xpGained);

const player2 = new Player();
player2.characterClass = 'mage';
const result2 = player2.addXp(100);

console.log('Player2 XP:', player2.xp);
console.log('XP Gained2:', result2.xpGained); 