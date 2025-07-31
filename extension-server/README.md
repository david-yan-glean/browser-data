# Extension Server (Python)

A Python Flask server that receives and stores browser events from a Chrome extension.

## Features

- Receives browser events via HTTP POST requests
- Stores events in MySQL database
- Supports CORS for cross-origin requests
- Health check endpoint
- Environment-based configuration

## API Endpoints

### POST /api/events
Receives browser events from the Chrome extension.

**Request Body:**
```json
{
  "event_type": "page_load",
  "url": "https://example.com",
  "tab_id": 123,
  "text": "some text",
  "highlighted_text": "highlighted content",
  "clicked_url": "https://example.com/link",
  "action": "copy",
  "user_agent": "Mozilla/5.0..."
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Environment Variables

- `PORT`: Server port (default: 8080)
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password (default: empty)
- `DB_NAME`: MySQL database name (default: extension_data)

## Database Schema

The server creates a `browser_events` table with the following structure:

```sql
CREATE TABLE browser_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    tab_id INT,
    text TEXT,
    highlighted_text TEXT,
    clicked_url TEXT,
    action VARCHAR(10),
    timestamp DATETIME NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Server

### Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up MySQL database

3. Set environment variables (optional, defaults provided)

4. Run the server:
   ```bash
   python app.py
   ```

### Using Docker

1. Build the image:
   ```bash
   docker build -t extension-server .
   ```

2. Run the container:
   ```bash
   docker run -p 8080:8080 \
     -e DB_HOST=your_mysql_host \
     -e DB_USER=your_mysql_user \
     -e DB_PASSWORD=your_mysql_password \
     -e DB_NAME=your_database_name \
     extension-server
   ```

## Dependencies

- Flask: Web framework
- mysql-connector-python: MySQL adapter
- python-dotenv: Environment variable management 