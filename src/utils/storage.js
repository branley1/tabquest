// Utility functions for storage
import chromeAPI from './chrome-api';

// Save data to storage
const saveData = (key, value) => {
  return chromeAPI.setStorageData({ [key]: value });
};

// Load data from storage
const loadData = (key) => {
  return chromeAPI.getStorageData(key);
};

// Save player data
export const savePlayerData = (playerData) => {
  return saveData('playerData', playerData);
};

// Load player data
export const loadPlayerData = async () => {
  const playerData = await loadData('playerData');
  return playerData || null;
};

// Save current event
export const saveCurrentEvent = (event) => {
  return saveData('currentEvent', event);
};

// Load current event
export const loadCurrentEvent = async () => {
  const currentEvent = await loadData('currentEvent');
  return currentEvent || null;
};

// Clear current event
export const clearCurrentEvent = () => {
  return saveData('currentEvent', null);
};

// Load tab timestamps
export const loadTabTimestamps = async () => {
  const timestamps = await loadData('tabTimestamps');
  return timestamps || {};
};

// Update tab timestamp
export const updateTabTimestamp = async (tabId) => {
  try {
    const timestamps = await loadTabTimestamps();
    timestamps[tabId] = Date.now();
    await saveData('tabTimestamps', timestamps);
  } catch (error) {
    console.error('Failed to update timestamp:', error);
    throw new Error('Failed to update timestamp');
  }
};

// Remove tab timestamp
export const removeTabTimestamp = async (tabId) => {
  try {
    const timestamps = await loadTabTimestamps();
    if (timestamps && timestamps[tabId]) {
      delete timestamps[tabId];
      await saveData('tabTimestamps', timestamps);
    }
  } catch (error) {
    console.error('Failed to remove timestamp:', error);
    throw new Error('Failed to remove timestamp');
  }
};

// Get tab duration
export const getTabDuration = async (tabId) => {
  try {
    const timestamps = await loadTabTimestamps();
    if (timestamps && timestamps[tabId]) {
      const duration = Date.now() - timestamps[tabId];
      return duration;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get tab duration:', error);
    return 0;
  }
};