// Background service worker for the extension

// Import utility functions
importScripts('utils.js');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Glean Browser Data Collector installed');
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      highlightColor: '#ffeb3b',
      autoSave: true,
      showNotifications: true
    });
  }
});

// Handle browser action click (when popup is not available)
chrome.action.onClicked.addListener(async (tab) => {
  // This will only trigger if no popup is defined
  console.log('Extension icon clicked for tab:', tab?.id);
});

// Handle storage changes to sync across tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes, namespace);
  
  // Notify all tabs about storage changes
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'storageChanged',
          changes: changes,
          namespace: namespace
        }).catch(() => {
          // Ignore errors for tabs that can't receive messages
        });
      }
    });
  });
});

// Handle tab updates to manage extension state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
  
  // Log navigation to new website
  if (changeInfo.url) {
    console.log('Navigated to:', changeInfo.url);
    
    // Send to backend using unified function
    sendEventToBackend({
      event_type: 'navigation',
      url: changeInfo.url,
      user_agent: navigator.userAgent
    });
  }
});

// Handle tab creation (new tab opened)
chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab opened:', tab?.url || 'about:newtab');
  
  // Send to backend using unified function
  sendEventToBackend({
    event_type: 'new_tab',
    url: tab?.url || 'about:newtab',
    user_agent: navigator.userAgent
  });
});

// Handle context menu items (if we want to add them later)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started up');
});

// Clean up old data periodically (optional)
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get();
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    for (const [url, notes] of Object.entries(result)) {
      if (Array.isArray(notes)) {
        const filteredNotes = notes.filter(note => 
          now - note.timestamp < maxAge
        );
        
        if (filteredNotes.length !== notes.length) {
          await chrome.storage.local.set({ [url]: filteredNotes });
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily