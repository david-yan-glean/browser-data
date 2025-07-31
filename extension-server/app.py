import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

import mysql.connector
from mysql.connector import Error
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Database connection
db_conn = None


def get_db_connection():
    """Get database connection with retry logic"""
    global db_conn
    
    if db_conn is None or not db_conn.is_connected():
        # Get database connection details from environment variables
        db_host = os.getenv("DB_HOST", "10.1.8.3")
        db_port = os.getenv("DB_PORT", "3306")
        db_user = os.getenv("DB_USER", "test")
        db_password = os.getenv("DB_PASSWORD", "test4scio")
        db_name = os.getenv("DB_NAME", "browser_data")
        
        try:
            db_conn = mysql.connector.connect(
                host=db_host,
                port=int(db_port),
                user=db_user,
                password=db_password,
                database=db_name,
                autocommit=True
            )
            logger.info("Database connected successfully")
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    return db_conn


def create_tables():
    """Create database tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS browser_events (
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
            )
        """)
        logger.info("Database table created successfully")
    except Error as e:
        logger.error(f"Error creating browser_events table: {e}")
        raise
    finally:
        cursor.close()


def get_string(event: Dict[str, Any], key: str) -> str:
    """Helper function to safely get string value from event dict"""
    return str(event.get(key, "")) if event.get(key) is not None else ""


def get_int(event: Dict[str, Any], key: str) -> Optional[int]:
    """Helper function to safely get integer value from event dict"""
    value = event.get(key)
    if value is not None:
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
    return None


@app.route('/api/health', methods=['GET'])
def handle_health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route('/api/events', methods=['POST', 'OPTIONS'])
def handle_events():
    """Handle browser events endpoint"""
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200
    
    # Handle CORS for actual requests
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    
    if request.method != 'POST':
        return jsonify({"error": "Method not allowed"}), 405
    
    try:
        # Parse the request body
        event = request.get_json()
        if not event:
            return jsonify({"error": "Invalid JSON"}), 400
        
        # Get event type
        event_type = event.get("event_type")
        if not event_type:
            return jsonify({"error": "Missing event_type"}), 400
        
        # Handle the browser event
        handle_browser_event(event)
        
        return jsonify({"status": "success"}), 200
        
    except Exception as e:
        logger.error(f"Error handling event: {e}")
        return jsonify({"error": "Internal server error"}), 500


def handle_browser_event(event: Dict[str, Any]):
    """Handle browser event and insert into database"""
    # Extract all possible data fields
    url = get_string(event, "url")
    tab_id = get_int(event, "tab_id")
    text = get_string(event, "text")
    highlighted_text = get_string(event, "highlighted_text")
    clicked_url = get_string(event, "clicked_url")
    action = get_string(event, "action")
    user_agent = get_string(event, "user_agent")
    event_type = get_string(event, "event_type")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert into unified database table
        cursor.execute("""
            INSERT INTO browser_events (
                event_type, url, tab_id, text, highlighted_text, 
                clicked_url, action, timestamp, user_agent
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            event_type, url, tab_id, text, highlighted_text,
            clicked_url, action, datetime.now(), user_agent
        ))
        logger.info(f"Successfully inserted browser event: {event_type}")
        
    except Error as e:
        logger.error(f"Error inserting browser event: {e}")
        raise
    finally:
        cursor.close()


# Initialize the application
def initialize_app():
    """Initialize the application"""
    try:
        create_tables()
        logger.info("Application initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise


if __name__ == '__main__':
    # Initialize the application before starting
    initialize_app()
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8080))
    
    logger.info(f"Server starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False) 