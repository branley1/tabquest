// TabQuest Content Script
// This script runs on all web pages to track user interaction

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageInfo') {
    // Get page title and URL
    const pageInfo = {
      title: document.title,
      url: window.location.href
    };
    
    sendResponse(pageInfo);
  }
  return true;
});

// Optional: Track user activity on the page for potential additional XP rewards
let lastActivity = Date.now();
const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];

// Update last activity timestamp when user interacts with the page
activityEvents.forEach(eventType => {
  document.addEventListener(eventType, () => {
    lastActivity = Date.now();
  });
});

// Periodically check for active engagement and send to background
setInterval(() => {
  const now = Date.now();
  const idleTime = (now - lastActivity) / 1000; // idle time in seconds
  
  // Consider user as actively engaged if they've interacted in the last 60 seconds
  const isActivelyEngaged = idleTime < 60;
  
  // Send engagement status to background script
  if (isActivelyEngaged) {
    chrome.runtime.sendMessage({
      action: 'trackEngagement',
      data: {
        url: window.location.href,
        title: document.title,
        timestamp: now
      }
    });
  }
}, 60000); // Check every minute 