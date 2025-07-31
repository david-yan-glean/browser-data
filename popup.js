// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  await loadPageInfo();
  await loadNotes();
  setupEventListeners();
});

// Load current page information
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    document.getElementById('page-title').textContent = tab.title || 'Unknown Page';
    document.getElementById('page-url').textContent = tab.url || 'Unknown URL';
    
    // Fetch the raw HTML of the current page
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.documentElement.outerHTML
        });
        
        if (results && results[0] && results[0].result) {
          const htmlContent = results[0].result;
          const htmlTextarea = document.getElementById('page-html');
          htmlTextarea.value = htmlContent;
          htmlTextarea.style.height = '200px'; // Set a reasonable height
        }
      } catch (error) {
        console.error('Error fetching page HTML:', error);
        document.getElementById('page-html').value = 'Unable to load page HTML (restricted page)';
      }
    } else {
      document.getElementById('page-html').value = 'HTML not available for this page type';
    }
  } catch (error) {
    console.error('Error loading page info:', error);
  }
}

// Load saved notes for current page
async function loadNotes() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    
    displayNotes(notes);
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

// Display notes in the popup
function displayNotes(notes) {
  const notesList = document.getElementById('notes-list');
  
  if (notes.length === 0) {
    notesList.innerHTML = '<p class="info">No notes saved for this page.</p>';
    return;
  }

  notesList.innerHTML = notes.map((note, index) => `
    <div class="note-item">
      <div class="note-text">${escapeHtml(note.text)}</div>
      <div class="note-time">${new Date(note.timestamp).toLocaleString()}</div>
      <button class="note-delete" data-index="${index}">×</button>
    </div>
  `).join('');

  // Add delete functionality
  notesList.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      await deleteNote(index);
    });
  });
}

// Save a new note
async function saveNote() {
  const noteInput = document.getElementById('note-input');
  const noteText = noteInput.value.trim();
  
  if (!noteText) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    
    notes.push({
      text: noteText,
      timestamp: Date.now()
    });
    
    await chrome.storage.local.set({ [url]: notes });
    noteInput.value = '';
    await loadNotes();
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Delete a note
async function deleteNote(index) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const result = await chrome.storage.local.get([url]);
    const notes = result[url] || [];
    
    notes.splice(index, 1);
    await chrome.storage.local.set({ [url]: notes });
    await loadNotes();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

// Toggle highlighting mode
async function toggleHighlighting() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleHighlighting' });
    
    const button = document.getElementById('toggle-highlight');
    if (response.enabled) {
      button.textContent = 'Disable Highlighting';
      button.classList.add('active');
    } else {
      button.textContent = 'Enable Highlighting';
      button.classList.remove('active');
    }
  } catch (error) {
    console.error('Error toggling highlighting:', error);
  }
}

// Clear all highlights
async function clearHighlights() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
  } catch (error) {
    console.error('Error clearing highlights:', error);
  }
}

// Copy HTML to clipboard
async function copyHtml() {
  const htmlTextarea = document.getElementById('page-html');
  try {
    await navigator.clipboard.writeText(htmlTextarea.value);
    showCopyNotification('HTML copied to clipboard!');
  } catch (error) {
    console.error('Error copying HTML:', error);
    // Fallback for older browsers
    htmlTextarea.select();
    document.execCommand('copy');
    showCopyNotification('HTML copied to clipboard!');
  }
}

// Show copy notification
function showCopyNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 2000);
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('save-note').addEventListener('click', saveNote);
  document.getElementById('note-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveNote();
    }
  });
  
  document.getElementById('toggle-highlight').addEventListener('click', toggleHighlighting);
  document.getElementById('clear-highlights').addEventListener('click', clearHighlights);
  document.getElementById('copy-html').addEventListener('click', copyHtml);
  
  document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}