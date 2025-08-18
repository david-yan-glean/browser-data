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
    
    // Capture HTML after navigation with a delay
    if (changeInfo.url && !changeInfo.url.startsWith('chrome://') && !changeInfo.url.startsWith('extension://')) {
      setTimeout(() => {
        captureTabHTML(tabId, changeInfo.url, 'navigation_html');
      }, 3000); // 3 second delay to allow page to load
    }
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
  
  // If tab has a URL, capture HTML after a delay
  if (tab?.url && tab.url !== 'about:newtab' && tab.url !== 'about:blank') {
    setTimeout(() => {
      captureTabHTML(tab.id, tab.url, 'new_tab_html');
    }, 3000); // 3 second delay to allow page to load
  }
});

// Function to capture HTML from a tab
async function captureTabHTML(tabId, url, eventType = 'new_tab_html') {
  try {
    // Check if we can inject scripts into this tab
    const tab = await chrome.tabs.get(tabId);
    
    // Skip if tab is not accessible (chrome://, extension://, etc.)
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('extension://')) {
      console.log('Skipping HTML capture for restricted URL:', tab.url);
      return;
    }
    
    // Execute script to capture HTML
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        try {
          const html = document.documentElement.outerHTML;
          const title = document.title;
          return {
            html: html,
            title: title,
            length: html.length
          };
        } catch (error) {
          console.error('Error capturing HTML:', error);
          return null;
        }
      }
    });
    
    if (results && results[0] && results[0].result) {
      const htmlData = results[0].result;
      console.log('Captured HTML for', eventType, ':', url, 'Length:', htmlData.length);
      
      // Send HTML to backend
      sendEventToBackend({
        event_type: eventType,
        url: url,
        page_title: htmlData.title,
        html_content: htmlData.html,
        user_agent: navigator.userAgent
      });
    }
  } catch (error) {
    console.error('Error capturing tab HTML:', error);
  }
}

// Handle context menu items (if we want to add them later)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started up');
});