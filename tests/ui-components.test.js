import { jest } from '@jest/globals';

describe('UI Components', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="game-container">
        <div id="level-badge"></div>
        <div id="player-xp"></div>
        <div id="xp-needed"></div>
        <div id="player-gold"></div>
        <div id="player-class"></div>
      </div>
      <div id="character-selection" class="hidden">
        <div class="class-cards-container"></div>
        <button id="confirm-class" disabled>Confirm</button>
      </div>
      <div id="current-event" class="hidden">
        <div id="event-container"></div>
      </div>
      <template id="monster-event-template">
        <div class="monster-event">
          <img class="monster-image" src="" alt="Monster">
          <div class="monster-name"></div>
          <div class="monster-level">Level <span></span></div>
          <div class="monster-rewards">
            <span class="xp"></span>
            <span class="gold"></span>
          </div>
          <button class="defeat-monster">Defeat</button>
        </div>
      </template>
    `;
  });

  describe('Character Selection', () => {
    test('shows character selection screen correctly', () => {
      const gameContainer = document.getElementById('game-container');
      const characterSelection = document.getElementById('character-selection');
      
      showCharacterSelection();
      
      expect(gameContainer.classList.contains('hidden')).toBe(true);
      expect(characterSelection.classList.contains('hidden')).toBe(false);
    });

    test('enables confirm button when class is selected', () => {
      showCharacterSelection();
      
      const confirmBtn = document.getElementById('confirm-class');
      const classCard = document.querySelector('.class-card');
      
      expect(confirmBtn.disabled).toBe(true);
      
      // Simulate class selection
      classCard.click();
      
      expect(confirmBtn.disabled).toBe(false);
    });
  });

  describe('Event Display', () => {
    test('displays monster event correctly', () => {
      const monsterData = {
        type: 'monster',
        data: {
          name: 'Dragon',
          level: 5,
          xp: 100,
          gold: 50,
          image: 'dragon.png'
        }
      };

      currentEvent = monsterData;
      displayCurrentEvent();

      const eventContainer = document.getElementById('event-container');
      const monsterName = eventContainer.querySelector('.monster-name');
      const monsterLevel = eventContainer.querySelector('.monster-level span');
      const monsterXP = eventContainer.querySelector('.monster-rewards .xp');
      const monsterGold = eventContainer.querySelector('.monster-rewards .gold');

      expect(monsterName.textContent).toBe('Dragon');
      expect(monsterLevel.textContent).toBe('5');
      expect(monsterXP.textContent).toBe('100');
      expect(monsterGold.textContent).toBe('50');
    });

    test('handles invalid event data gracefully', () => {
      console.error = jest.fn();
      
      currentEvent = { type: 'invalid' };
      displayCurrentEvent();
      
      expect(console.error).toHaveBeenCalled();
      expect(document.getElementById('event-container').innerHTML).toBe('');
    });
  });

  describe('Player Stats Display', () => {
    test('updates player stats correctly', () => {
      const playerData = {
        level: 5,
        xp: 450,
        gold: 1000,
        characterClass: 'warrior'
      };

      player = playerData;
      updatePlayerStats();

      expect(document.getElementById('level-badge').textContent).toBe('5');
      expect(document.getElementById('player-xp').textContent).toBe('450');
      expect(document.getElementById('player-gold').textContent).toBe('1000');
      expect(document.getElementById('player-class').textContent).toBe('Warrior');
    });

    test('handles missing player data gracefully', () => {
      console.warn = jest.fn();
      
      player = null;
      updatePlayerStats();
      
      expect(console.warn).toHaveBeenCalledWith('Attempted to update stats with no player data');
    });
  });

  describe('Error Handling', () => {
    test('handles missing DOM elements gracefully', () => {
      document.body.innerHTML = ''; // Clear all elements
      console.warn = jest.fn();
      
      updatePlayerStats();
      showCharacterSelection();
      displayCurrentEvent();
      
      expect(console.warn).toHaveBeenCalled();
    });

    test('handles failed template cloning', () => {
      document.getElementById('monster-event-template').remove();
      console.error = jest.fn();
      
      currentEvent = {
        type: 'monster',
        data: { name: 'Dragon', level: 1, xp: 100, gold: 50 }
      };
      
      displayCurrentEvent();
      
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 