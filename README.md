# Quick Notes & Highlighter Chrome Extension

A starter Chrome extension that demonstrates core extension development concepts through a practical productivity tool.

## Features

- **Quick Notes**: Save page-specific notes that persist across browser sessions
- **Text Highlighting**: Select and highlight text on any webpage
- **Persistent Storage**: All data is saved locally using Chrome's storage API
- **Clean UI**: Modern, responsive popup interface
- **Real-time Updates**: Notes and highlights update across all extension components
- **Backend Integration**: Optional backend server for data collection and analytics

## Project Structure

```
chrome-extension/
├── manifest.json          # Extension configuration and permissions
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script for page interaction
├── content.css           # Styles injected into web pages
├── background.js         # Background service worker
├── utils.js              # Shared utility functions (backend communication, etc.)
├── icons/                # Extension icons (you'll need to add these)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── extension-server/     # Backend server for data collection
│   ├── app.py           # Flask application
│   ├── run.py           # Server startup script
│   ├── requirements.txt # Python dependencies
│   └── HTTPS_SETUP.md   # HTTPS configuration guide
└── README.md             # This file
```

## Installation & Development

### 1. Set Up the Project
1. Create a new folder for your extension
2. Copy all the provided files into this folder
3. Create an `icons` folder and add icon files (16x16, 32x32, 48x48, 128x128 px)

### 2. Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select your extension folder
4. The extension should now appear in your extensions list

### 3. Set Up Backend Server (Optional)
The extension includes a backend server for data collection. To set it up:

1. **Install Python Dependencies**:
   ```bash
   cd extension-server
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp env.example .env
   # Edit .env with your database settings
   ```

3. **Set Up HTTPS** (Required for Mixed Content):
   ```bash
   # Generate self-signed certificate for development
   python generate_ssl_cert.py
   
   # Or follow the full HTTPS setup guide
   # See extension-server/HTTPS_SETUP.md
   ```

4. **Start the Server**:
   ```bash
   python run.py
   ```

### 4. Test the Extension
1. Click the extension icon in the Chrome toolbar
2. Try adding notes to different websites
3. Test the highlighting feature by enabling it and selecting text
4. Check that data persists when you reload pages
5. Verify backend data collection (if server is running)

### 5. Debug Issues
- **Popup issues**: Right-click the extension icon → "Inspect popup"
- **Content script issues**: Open DevTools on any webpage
- **Background script issues**: Go to `chrome://extensions/` → Click "service worker" link
- **Backend issues**: Check server logs and database connection
- **Mixed Content errors**: Ensure HTTPS is properly configured
- **Check console**: Look for error messages in all DevTools instances

## Backend Server

The extension includes a Flask backend server that collects browser events and stores them in a MySQL database. This is useful for:

- **Analytics**: Track user behavior and extension usage
- **Data Collection**: Store notes and highlights in the cloud
- **Cross-device Sync**: Share data across multiple devices
- **Backup**: Provide data backup and recovery

### Unified Backend Communication

The extension uses a unified `sendEventToBackend` function in `utils.js` that:

- **Tries HTTPS first** to avoid Mixed Content errors
- **Falls back to HTTP** if HTTPS fails (for development)
- **Handles network errors** gracefully
- **Provides consistent logging** across all components
- **Returns success/failure status** for better error handling

### HTTPS Configuration

**Important**: The backend server must use HTTPS to avoid Mixed Content errors when the extension runs on HTTPS pages (like Google Cloud Console).

See `extension-server/HTTPS_SETUP.md` for detailed setup instructions.

### Quick HTTPS Setup

For development, generate a self-signed certificate:

```bash
cd extension-server
python generate_ssl_cert.py
python run.py
```

The server will automatically detect the SSL certificates and start in HTTPS mode.

## Core Concepts Demonstrated

### Manifest V3
- Modern Chrome extension configuration
- Permissions system (storage, activeTab)
- Service worker background scripts

### Extension Components
- **Popup**: User interface when clicking the extension icon
- **Content Script**: JavaScript that runs on web pages
- **Background Script**: Handles events and long-running tasks
- **Storage API**: Persistent data storage

### Communication
- Message passing between popup and content scripts
- Background script event handling
- Storage change listening

### User Interface
- Modern CSS styling with Chrome's design language
- Responsive layout that works in the popup
- Real-time updates and user feedback

## Customization Ideas

### Easy Modifications
- Change highlight colors in `content.css`
- Modify the popup size in `popup.css`
- Add new note categories or tags
- Change the extension name and description

### Advanced Features
- Export notes to different formats
- Sync notes across devices
- Add note search functionality
- Implement note sharing
- Add keyboard shortcuts
- Create an options page for settings

### API Integrations
- Save notes to cloud services
- OCR for image text highlighting
- Translation features
- Web scraping capabilities

## Common Issues & Solutions

### Permission Errors
- Make sure all required permissions are in `manifest.json`
- Some APIs require additional permissions

### Content Script Not Working
- Check if the page allows content scripts
- Some pages (chrome://, extension pages) block content scripts
- Verify the `matches` pattern in manifest

### Storage Not Persisting
- Use `chrome.storage.local` for local data
- Use `chrome.storage.sync` for data that syncs across devices
- Check storage quotas if saving large amounts of data

### Popup Not Opening
- Verify `popup.html` path in manifest
- Check for JavaScript errors in popup
- Ensure popup HTML is valid

## Next Steps

1. **Add Icons**: Create proper icon files for your extension
2. **Test Thoroughly**: Try the extension on different websites
3. **Add Features**: Implement additional functionality you need
4. **Prepare for Publishing**: Create promotional images and descriptions
5. **Submit to Chrome Web Store**: Package and publish your extension

## Development Tips

- Use `console.log()` extensively for debugging
- Test on different types of websites
- Check Chrome's extension documentation for advanced APIs
- Consider user experience and performance
- Keep the popup lightweight and fast

This starter project gives you a solid foundation for building any type of Chrome extension!
