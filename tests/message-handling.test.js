import { jest } from '@jest/globals';
import { sendMessage } from '../src/utils/messaging';
import chromeAPI from '../src/utils/chrome-api';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: null
  }
};

// Mock chromeAPI
jest.mock('../src/utils/chrome-api', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
  isExtensionEnvironment: true
}));

describe('Message Handling', () => {
  beforeEach(() => {
    // Reset mocks before each test
    chrome.runtime.sendMessage.mockReset();
    chrome.runtime.lastError = null;
    chromeAPI.runtime.sendMessage.mockReset();
  });

  test('handles successful message sending', async () => {
    const expectedResponse = { success: true, data: 'test' };
    chromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
      callback(expectedResponse);
    });

    const response = await sendMessage({ action: 'test' });
    expect(response).toEqual(expectedResponse);
    expect(chromeAPI.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'test' },
      expect.any(Function)
    );
  });

  test('handles chrome runtime errors', async () => {
    chrome.runtime.lastError = { message: 'Test error' };
    chromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
      callback(null);
    });

    try {
      await sendMessage({ action: 'test' });
    } catch (error) {
      expect(error).toEqual({ message: 'Test error' });
    }
  });

  test('handles general errors', async () => {
    chromeAPI.runtime.sendMessage.mockImplementation(() => {
      throw new Error('Network error');
    });

    const response = await sendMessage({ action: 'test' });
    expect(response).toEqual({ error: 'Network error' });
  });

  test('handles null response', async () => {
    chromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
      callback(null);
    });

    const response = await sendMessage({ action: 'test' });
    expect(response).toBeNull();
  });
});

describe('Event Handlers', () => {
  beforeEach(() => {
    chromeAPI.runtime.sendMessage.mockReset();
    chrome.runtime.lastError = null;
  });

  test('handles monster defeat success', async () => {
    chromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'handleMonsterDefeat') {
        callback({ success: true });
      }
    });

    const response = await sendMessage({ action: 'handleMonsterDefeat' });
    expect(response).toEqual({ success: true });
  });

  test('handles riddle answer correctly', async () => {
    chromeAPI.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'handleRiddleAnswer') {
        callback({ 
          success: true, 
          correct: message.answer === 'correct answer' 
        });
      }
    });

    const correctResponse = await sendMessage({ 
      action: 'handleRiddleAnswer', 
      answer: 'correct answer' 
    });
    expect(correctResponse).toEqual({ success: true, correct: true });

    const incorrectResponse = await sendMessage({ 
      action: 'handleRiddleAnswer', 
      answer: 'wrong answer' 
    });
    expect(incorrectResponse).toEqual({ success: true, correct: false });
  });
}); 