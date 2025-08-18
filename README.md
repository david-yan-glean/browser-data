# Browser Data Collector Chrome Extension

A Chrome extension that collects comprehensive browser data including page HTML, user interactions, and navigation events, with optional backend integration for data storage and analytics.

## Features

- **Page HTML Capture**: Automatically captures and displays the raw HTML of every webpage visited
- **Text Highlighting**: Select and highlight text on any webpage with visual feedback
- **User Interaction Tracking**: Monitors link clicks, text copying, and pasting activities
- **Navigation Monitoring**: Tracks page navigation, new tab creation, and tab closure
- **Real-time Data Display**: Shows current page information and HTML content in the popup
- **Backend Integration**: Sends all collected data to a configurable backend server
- **HTTPS/HTTP Fallback**: Robust backend communication with automatic fallback
- **Cross-tab Synchronization**: Real-time updates across all browser tabs

## Project Structure

```
chrome-extension/
├── data-collection-extension/    # Main extension directory
│   ├── manifest.json             # Extension configuration and permissions
│   ├── popup.html               # Extension popup interface
│   ├── popup.css                # Popup styling
│   ├── popup.js                 # Popup functionality
│   ├── content.js               # Content script for page interaction
│   ├── content.css              # Styles injected into web pages
│   ├── background.js            # Background service worker
│   ├── utils.js                 # Shared utility functions (backend communication)
│   └── icons/                   # Extension icons
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
├── extension-server/             # Backend server for data collection
│   ├── app.py                   # Flask application
│   ├── run.py                   # Server startup script
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Docker configuration
│   ├── docker-compose.yml       # Docker Compose setup
│   ├── setup_https.sh           # HTTPS setup script
│   ├── setup_comodo_ssl.sh      # Comodo SSL setup
│   ├── COMODO_SSL_SETUP.md      # SSL configuration guide
│   ├── DEPLOYMENT.md            # Deployment instructions
│   ├── deploy-gcp.sh            # Google Cloud deployment script
│   ├── deploy-gcp-manual.md     # Manual GCP deployment guide
│   └── test_connection.py       # Connection testing utility
├── utils.js                     # Shared utilities (root level)
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Installation & Development

### 1. Set Up the Project
1. Clone or download the project
2. Navigate to the `data-collection-extension` directory
3. Ensure all icon files are present in the `icons/` folder

### 2. Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `data-collection-extension` folder
4. The extension should now appear in your extensions list

### 3. Set Up Backend Server (Optional)
The extension includes a comprehensive backend server for data collection. To set it up:

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
   # Quick setup with self-signed certificate
   ./setup_https.sh
   
   # Or follow the detailed SSL setup guide
   # See extension-server/COMODO_SSL_SETUP.md
   ```

4. **Start the Server**:
   ```bash
   python run.py
   ```

### 4. Test the Extension
1. Click the extension icon in the Chrome toolbar
2. Navigate to different websites to see HTML capture in action
3. Test the highlighting feature by enabling it and selecting text
4. Try copying and pasting text to see interaction tracking
5. Check that data is being sent to the backend (if server is running)

## Data Collection Features

### Page HTML Capture
- **Automatic Capture**: HTML is captured automatically when pages load
- **Multiple Triggers**: Captures on DOM load, window load, and URL changes
- **SPA Support**: Detects navigation in single-page applications
- **Real-time Display**: Shows HTML content in the extension popup
- **Copy Functionality**: Easy HTML copying from the popup interface

### User Interaction Tracking
- **Text Highlighting**: Tracks highlighted text selections
- **Link Clicks**: Monitors all link click events
- **Copy/Paste Events**: Records text copying and pasting activities
- **Navigation Events**: Tracks page navigation, new tabs, and tab closure

### Backend Communication
The extension uses a unified `sendEventToBackend` function that:

- **Tries HTTPS first** to avoid Mixed Content errors
- **Falls back to HTTP** if HTTPS fails (for development)
- **Handles network errors** gracefully
- **Provides consistent logging** across all components
- **Supports multiple event types**:
  - `page_html`: Raw HTML content with metadata
  - `highlight`: Text highlighting events
  - `link_click`: Link interaction events
  - `copy`/`paste`: Text manipulation events
  - `navigation`: Page navigation events
  - `new_tab`/`tab_closed`: Tab management events

## Backend Server

The extension includes a production-ready Flask backend server with:

### Features
- **Data Storage**: MySQL database integration
- **HTTPS Support**: SSL/TLS configuration with Comodo certificates
- **Docker Support**: Containerized deployment
- **Google Cloud Ready**: GCP deployment scripts and documentation
- **Connection Testing**: Built-in connection validation tools

### Deployment Options
1. **Local Development**: Quick setup with self-signed certificates
2. **Docker Deployment**: Containerized deployment with docker-compose
3. **Google Cloud Platform**: Automated deployment scripts
4. **Manual Deployment**: Step-by-step deployment guide

### HTTPS Configuration
**Important**: The backend server must use HTTPS to avoid Mixed Content errors when the extension runs on HTTPS pages.

See `extension-server/COMODO_SSL_SETUP.md` for detailed SSL setup instructions.

## Core Concepts Demonstrated

### Manifest V3
- Modern Chrome extension configuration
- Comprehensive permissions system (storage, activeTab, scripting, notifications, tabs)
- Service worker background scripts
- Web accessible resources

### Extension Components
- **Popup**: Rich user interface with HTML display and interaction controls
- **Content Script**: Advanced page interaction and data collection
- **Background Script**: Event handling and navigation monitoring
- **Storage API**: Persistent data storage and cross-tab synchronization

### Communication
- Message passing between popup and content scripts
- Background script event handling
- Storage change listening across tabs
- Unified backend communication system

### User Interface
- Modern CSS styling with Chrome's design language
- Responsive layout optimized for popup dimensions
- Real-time updates and user feedback
- HTML content display and copying functionality

## Data Privacy & Security

### Local Data
- All extension data is stored locally using Chrome's storage API
- No data is sent to external servers unless backend is configured
- User has full control over data collection

### Backend Data
- Optional backend integration for analytics and data storage
- HTTPS encryption for all backend communication
- Configurable data retention policies
- User consent required for data collection

## Customization Ideas

### Easy Modifications
- Change highlight colors in `content.css`
- Modify the popup size and layout in `popup.css`
- Adjust HTML capture timing and triggers
- Customize event tracking parameters

### Advanced Features
- Export collected data to different formats
- Implement data visualization and analytics
- Add machine learning for content analysis
- Create data processing pipelines
- Build custom dashboards for collected data

### API Integrations
- Integrate with external analytics platforms
- Connect to data warehouses and BI tools
- Implement real-time data streaming
- Add webhook support for event notifications

## Common Issues & Solutions

### Permission Errors
- Ensure all required permissions are in `manifest.json`
- Some APIs require additional permissions for full functionality

### Content Script Not Working
- Check if the page allows content scripts
- Some pages (chrome://, extension pages) block content scripts
- Verify the `matches` pattern in manifest

### Backend Connection Issues
- Verify HTTPS configuration for production
- Check firewall and network settings
- Use `test_connection.py` to validate connectivity
- Review server logs for detailed error information

### HTML Capture Issues
- Some pages may block content access
- Dynamic content may require longer capture delays
- Check console for capture-related errors

## Development Tips

- Use `console.log()` extensively for debugging
- Test on different types of websites and content
- Monitor network requests in DevTools
- Check Chrome's extension documentation for advanced APIs
- Consider performance impact of HTML capture on large pages
- Test backend communication thoroughly before deployment

## Next Steps

1. **Configure Backend**: Set up the backend server for data collection
2. **Customize Collection**: Adjust what data is collected and when
3. **Add Analytics**: Implement data analysis and visualization
4. **Deploy Production**: Set up production deployment with proper SSL
5. **Scale Infrastructure**: Plan for handling large volumes of data

This extension provides a comprehensive foundation for browser data collection and analysis, with production-ready backend integration and deployment options.
