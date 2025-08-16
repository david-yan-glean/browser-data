// Background service worker for the extension

// Import utility functions
importScripts('utils.js');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Quick Notes & Highlighter installed');
  
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

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'getNotes') {
    // Handle note retrieval
    handleGetNotes(request.url).then(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'saveNote') {
    // Handle note saving
    handleSaveNote(request.url, request.note).then(sendResponse);
    return true;
  }
  
  if (request.action === 'deleteNote') {
    // Handle note deletion
    handleDeleteNote(request.url, request.index).then(sendResponse);
    return true;
  }
});

// Get notes for a specific URL
async function handleGetNotes(url) {
  try {
    const result = await chrome.storage.local.get([url]);
    return { success: true, notes: result[url] || [] };
  } catch (error) {
    console.error('Error getting notes:', error);
    return { success: false, error: error.message };
  }
}

// Save a note for a specific URL
async function handleSaveNote(url, note) {
  try {
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    
    notes.push({
      text: note.text,
      timestamp: Date.now(),
      id: extensionUtils.generateId()
    });
    
    await chrome.storage.local.set({ [url]: notes });
    return { success: true, notes };
  } catch (error) {
    console.error('Error saving note:', error);
    return { success: false, error: error.message };
  }
}

// Delete a note for a specific URL
async function handleDeleteNote(url, index) {
  try {
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    
    if (index >= 0 && index < notes.length) {
      notes.splice(index, 1);
      await chrome.storage.local.set({ [url]: notes });
      return { success: true, notes };
    } else {
      return { success: false, error: 'Invalid note index' };
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message };
  }
}

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
    
    // Update badge with note count for this URL
    updateBadge(tab.url, tabId);
  }
  
  // Log navigation to new website
  if (changeInfo.url) {
    console.log('Navigated to:', changeInfo.url);
    
    // Send to backend using unified function
    sendEventToBackend({
      event_type: 'navigation',
      url: changeInfo.url,
      tab_id: tabId,
      user_agent: navigator.userAgent
    });
  }
});

// Update extension badge with note count
async function updateBadge(url, tabId) {
  try {
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    const count = notes.length;
    
    if (count > 0) {
      chrome.action.setBadgeText({
        text: count.toString(),
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#1a73e8',
        tabId: tabId
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Handle tab creation (new tab opened)
chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab opened:', tab?.url || 'about:newtab');
  
  // Send to backend using unified function
  sendEventToBackend({
    event_type: 'new_tab',
    url: tab?.url || 'about:newtab',
    tab_id: tab?.id || null,
    user_agent: navigator.userAgent
  });
});

// Handle tab removal (tab closed)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab closed:', tabId);
  
  // Send to backend using unified function
  sendEventToBackend({
    event_type: 'tab_closed',
    url: '',
    tab_id: tabId,
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