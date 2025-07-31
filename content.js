// Content script for text highlighting functionality
let highlightingEnabled = false;
let highlightCounter = 0;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleHighlighting') {
    highlightingEnabled = !highlightingEnabled;
    updateHighlightingState();
    sendResponse({ enabled: highlightingEnabled });
  } else if (request.action === 'clearHighlights') {
    clearAllHighlights();
    sendResponse({ success: true });
  }
});

// Update highlighting state
function updateHighlightingState() {
  if (highlightingEnabled) {
    document.addEventListener('mouseup', handleTextSelection);
    document.body.style.cursor = 'crosshair';
    showNotification('Highlighting enabled - select text to highlight');
  } else {
    document.removeEventListener('mouseup', handleTextSelection);
    document.body.style.cursor = '';
    showNotification('Highlighting disabled');
  }
}

// Handle text selection
function handleTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText.length > 0) {
    // Console log the highlighted text
    console.log('Highlighted text:', selectedText);
    
    // Send to backend
    sendEventToBackend({
      event_type: 'highlight',
      url: window.location.href,
      highlighted_text: selectedText,
      user_agent: navigator.userAgent
    });
    
    highlightSelectedText(selection);
    selection.removeAllRanges();
  }
}

// Highlight selected text
function highlightSelectedText(selection) {
  try {
    const range = selection.getRangeAt(0);
    
    // Don't highlight if already highlighted
    const parentElement = range.commonAncestorContainer.parentElement;
    if (parentElement && parentElement.classList.contains('quick-notes-highlight')) {
      return;
    }
    
    // Create highlight element
    const highlight = document.createElement('span');
    highlight.className = 'quick-notes-highlight';
    highlight.setAttribute('data-highlight-id', ++highlightCounter);
    highlight.title = 'Highlighted text - Right-click to remove';
    
    // Add right-click context menu
    highlight.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm('Remove this highlight?')) {
        removeHighlight(highlight);
      }
    });
    
    // Wrap the selected content
    try {
      range.surroundContents(highlight);
      showNotification(`Text highlighted! (${highlightCounter} total)`);
    } catch (error) {
      // Fallback for complex selections
      const contents = range.extractContents();
      highlight.appendChild(contents);
      range.insertNode(highlight);
      showNotification(`Text highlighted! (${highlightCounter} total)`);
    }
    
  } catch (error) {
    console.error('Error highlighting text:', error);
    showNotification('Could not highlight selected text');
  }
}

// Remove a specific highlight
function removeHighlight(highlightElement) {
  const parent = highlightElement.parentNode;
  while (highlightElement.firstChild) {
    parent.insertBefore(highlightElement.firstChild, highlightElement);
  }
  parent.removeChild(highlightElement);
  
  // Normalize the text nodes
  parent.normalize();
  showNotification('Highlight removed');
}

// Clear all highlights on the page
function clearAllHighlights() {
  const highlights = document.querySelectorAll('.quick-notes-highlight');
  highlights.forEach(removeHighlight);
  highlightCounter = 0;
  showNotification('All highlights cleared');
}

// Show notification to user
function showNotification(message) {
  // Remove existing notification
  const existing = document.getElementById('quick-notes-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create new notification
  const notification = document.createElement('div');
  notification.id = 'quick-notes-notification';
  notification.className = 'quick-notes-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Initialize content script
function init() {
  // Load existing highlights count
  const existingHighlights = document.querySelectorAll('.quick-notes-highlight');
  highlightCounter = existingHighlights.length;
  
  // Add event listeners to existing highlights
  existingHighlights.forEach(highlight => {
    highlight.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm('Remove this highlight?')) {
        removeHighlight(highlight);
      }
    });
  });
  
  // Add click handler for links
  document.addEventListener('click', handleLinkClick);
  
  // Add copy handler for text
  document.addEventListener('copy', handleTextCopy);
  
  // Add paste handler for text
  document.addEventListener('paste', handleTextPaste);
}

// Handle link clicks
function handleLinkClick(event) {
  const link = event.target.closest('a');
  if (link) {
    const url = link.href;
    console.log('Link clicked:', url);
    
    // Send to backend
    sendEventToBackend({
      event_type: 'link_click',
      url: window.location.href,
      clicked_url: url,
      user_agent: navigator.userAgent
    });
  }
}

// Handle text copy
function handleTextCopy(event) {
  const selection = window.getSelection();
  const copiedText = selection.toString().trim();
  
  if (copiedText.length > 0) {
    console.log('Text copied:', copiedText);
    
    // Send to backend
    // sendEventToBackend({
    //   event_type: 'copy',
    //   url: window.location.href,
    //   text: copiedText,
    //   action: 'copy',
    //   user_agent: navigator.userAgent,
    //   extension_id: chrome.runtime.id
    // });
  }
}

// Handle text paste
function handleTextPaste(event) {
  // Get pasted text from clipboard
  const pastedText = event.clipboardData.getData('text/plain');
  
  if (pastedText && pastedText.trim().length > 0) {
    console.log('Text pasted:', pastedText.trim());
    
    // Send to backend
    // sendEventToBackend({
    //   event_type: 'paste',
    //   url: window.location.href,
    //   text: pastedText.trim(),
    //   action: 'paste',
    //   user_agent: navigator.userAgent,
    //   extension_id: chrome.runtime.id
    // });
  }
}

// Send event to backend server
async function sendEventToBackend(eventData) {
  try {
    const response = await fetch('https://your-backend-url.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      console.log('Event sent to backend successfully');
    } else {
      console.error('Failed to send event to backend:', response.status);
    }
  } catch (error) {
    console.error('Error sending event to backend:', error);
  }
}

// Run initialization when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}