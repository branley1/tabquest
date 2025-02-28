// Utility for sending messages to background script
import chromeAPI from './chrome-api';

/**
 * Sends a message to the background script
 * @param {Object} message - Message object to send
 * @returns {Promise<Object>} - Response from background script
 */
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      if (chromeAPI.isExtensionEnvironment) {
        chrome.runtime.sendMessage(message, (response) => {
          // Check for chrome runtime errors
          const error = chrome.runtime && chrome.runtime.lastError;
          if (error) {
            console.error('Chrome runtime error:', error);
            reject(error);
            return;
          }
          
          resolve(response);
        });
      } else {
        // In non-extension environment, mock the response
        console.log('Message would be sent in extension:', message);
        resolve({ success: true, mock: true, data: message });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      reject(error);
    }
  });
}

/**
 * Adds a listener for messages from content scripts or popup
 * @param {Function} callback - Function to call when message is received
 */
export function addMessageListener(callback) {
  if (chromeAPI.isExtensionEnvironment) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Make callback return a Promise that resolves to the response
      Promise.resolve(callback(message, sender))
        .then(sendResponse)
        .catch(error => {
          console.error('Error in message handler:', error);
          sendResponse({ error: error.message });
        });
      
      // Return true to indicate async response
      return true;
    });
  } else {
    console.log('Would add message listener in extension environment');
  }
}

export default {
  sendMessage,
  addMessageListener
};