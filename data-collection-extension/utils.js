// Utility functions for the Chrome extension

/**
 * Send event data to the backend server with HTTPS/HTTP fallback
 * @param {Object} eventData - The event data to send
 * @param {string} eventData.event_type - Type of event (e.g., 'navigation', 'highlight', 'link_click', 'page_html')
 * @param {string} eventData.url - Current page URL
 * @param {string} [eventData.text] - Text content (for copy/paste events)
 * @param {string} [eventData.highlighted_text] - Highlighted text
 * @param {string} [eventData.clicked_url] - Clicked URL
 * @param {string} [eventData.action] - Action performed
 * @param {string} [eventData.user_agent] - User agent string
 * @param {string} [eventData.page_title] - Page title (for page_html events)
 * @param {string} [eventData.html_content] - Raw HTML content (for page_html events)
 * @param {number} [eventData.html_length] - Length of HTML content (for page_html events)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function sendEventToBackend(eventData) {
  try {
    // Use HTTPS by default to avoid Mixed Content errors
    const SERVER_URL = 'https://glean-browser.store:8080';
    const FALLBACK_URL = 'http://glean-browser.store:8080';
    
    console.log('Sending event to backend:', SERVER_URL, eventData);
    
    // Try HTTPS first
    let response = await fetch(`${SERVER_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      console.log('Event sent to backend successfully via HTTPS');
      return true;
    } else {
      console.error('Failed to send event to backend:', response.status, response.statusText);
    }
    
    // If HTTPS fails, try HTTP fallback (for development)
    console.log('HTTPS failed, trying HTTP fallback...');
    response = await fetch(`${FALLBACK_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      console.log('Event sent to backend successfully via HTTP fallback');
      return true;
    } else {
      console.error('Failed to send event to backend:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending event to backend:', error);
    
    // If HTTPS fails with network error, try HTTP fallback
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      try {
        console.log('Trying HTTP fallback due to HTTPS error...');
        const FALLBACK_URL = 'http://glean-browser.store:8080';
        const response = await fetch(`${FALLBACK_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
          console.log('Event sent to backend successfully via HTTP fallback');
          return true;
        } else {
          console.error('HTTP fallback also failed:', response.status, response.statusText);
          return false;
        }
      } catch (fallbackError) {
        console.error('HTTP fallback also failed:', fallbackError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Generate a unique ID for events
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format timestamp for logging
 * @param {Date} [date] - Date to format (defaults to current date)
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Sanitize text content for logging
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} - Sanitized text
 */
function sanitizeText(text, maxLength = 100) {
  if (!text) return '';
  const sanitized = text.replace(/[\r\n\t]/g, ' ').trim();
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + '...' : sanitized;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    sendEventToBackend,
    generateId,
    formatTimestamp,
    sanitizeText
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to window
  window.extensionUtils = {
    sendEventToBackend,
    generateId,
    formatTimestamp,
    sanitizeText
  };
} 