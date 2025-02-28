import { jest } from '@jest/globals';
import {
  validateEventData,
  safeCloneTemplate,
  safeQuerySelector,
  cleanup,
  STATE
} from '../popup.js';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('Event Data Validation', () => {
  test('validates monster event data correctly', () => {
    const validMonster = {
      type: 'monster',
      data: {
        name: 'Dragon',
        level: 5,
        xp: 100,
        gold: 50
      }
    };
    expect(validateEventData(validMonster)).toBe(true);
  });

  test('rejects invalid monster event data', () => {
    const invalidMonster = {
      type: 'monster',
      data: {
        name: 'Dragon',
        // missing level
        xp: 100,
        gold: 50
      }
    };
    expect(validateEventData(invalidMonster)).toBe(false);
  });

  test('validates treasure event data correctly', () => {
    const validTreasure = {
      type: 'treasure',
      data: {
        name: 'Golden Chest',
        xp: 50,
        gold: 100
      }
    };
    expect(validateEventData(validTreasure)).toBe(true);
  });

  test('validates riddle event data correctly', () => {
    const validRiddle = {
      type: 'riddle',
      data: {
        question: 'What walks on four legs in the morning...?',
        xp: 75,
        gold: 25
      }
    };
    expect(validateEventData(validRiddle)).toBe(true);
  });

  test('validates power-up event data correctly', () => {
    const validPowerUp = {
      type: 'powerUp',
      data: {
        name: 'Double XP',
        description: 'Doubles all XP gained',
        duration: 300
      }
    };
    expect(validateEventData(validPowerUp)).toBe(true);
  });

  test('rejects events with missing data', () => {
    expect(validateEventData(null)).toBe(false);
    expect(validateEventData({})).toBe(false);
    expect(validateEventData({ type: 'monster' })).toBe(false);
    expect(validateEventData({ data: {} })).toBe(false);
  });
});

describe('Safe DOM Operations', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <template id="test-template">
        <div class="test-content">Test</div>
      </template>
      <div id="test-container">
        <span class="test-item">Item 1</span>
      </div>
    `;
  });

  test('safeCloneTemplate clones template correctly', () => {
    const template = document.getElementById('test-template');
    const clone = safeCloneTemplate(template, 'test');
    expect(clone.querySelector('.test-content')).toBeTruthy();
    expect(clone.querySelector('.test-content').textContent).toBe('Test');
  });

  test('safeCloneTemplate throws error for missing template', () => {
    expect(() => safeCloneTemplate(null, 'test')).toThrow('Template for test not found');
  });

  test('safeQuerySelector finds elements correctly', () => {
    const container = document.getElementById('test-container');
    const element = safeQuerySelector(container, '.test-item');
    expect(element).toBeTruthy();
    expect(element.textContent).toBe('Item 1');
  });

  test('safeQuerySelector throws error for missing elements', () => {
    const container = document.getElementById('test-container');
    expect(() => safeQuerySelector(container, '.non-existent'))
      .toThrow('Element with selector ".non-existent" not found');
  });
});

describe('Event Listener Management', () => {
  beforeEach(() => {
    cleanup(); // Clear any existing listeners
    document.body.innerHTML = '<button id="test-button">Test</button>';
  });

  test('cleanup removes all registered event listeners', () => {
    const button = document.getElementById('test-button');
    const handler = jest.fn();
    
    // Add event listener
    button.addEventListener('click', handler);
    STATE.eventListeners.add({ element: button, event: 'click', handler });
    
    // Simulate click
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);
    
    // Cleanup
    cleanup();
    
    // Simulate click again
    button.click();
    expect(handler).toHaveBeenCalledTimes(1); // Should not increase
    expect(STATE.eventListeners.size).toBe(0);
  });

  test('STATE tracks initialization correctly', () => {
    expect(STATE.initialized).toBe(false);
    STATE.initialized = true;
    expect(STATE.initialized).toBe(true);
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  test('safeQuerySelector logs error for missing element', () => {
    const container = document.createElement('div');
    expect(() => safeQuerySelector(container, '.non-existent')).toThrow();
    expect(console.error).not.toHaveBeenCalled(); // Should throw instead of log
  });

  test('validateEventData handles null/undefined gracefully', () => {
    expect(validateEventData(null)).toBe(false);
    expect(validateEventData(undefined)).toBe(false);
    expect(validateEventData({})).toBe(false);
  });
});

// Mock storage module
jest.mock('../src/utils/storage.js', () => ({
  loadPlayerData: jest.fn(),
  savePlayerData: jest.fn()
}));

describe('Player Data Management', () => {
  test('handles missing player data gracefully', () => {
    const data = validateEventData({
      type: 'monster',
      data: null
    });
    expect(data).toBe(false);
  });
}); 