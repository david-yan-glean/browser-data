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

# SSL Configuration
SSL_CERT_PATH = os.getenv("SSL_CERT_PATH", "cert.pem")
SSL_KEY_PATH = os.getenv("SSL_KEY_PATH", "key.pem")


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
        # Create table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS browser_events_v2 (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                url TEXT NOT NULL,
                page_title TEXT,
                html_content MEDIUMTEXT,
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
        
        # Check if html_content column needs to be altered to MEDIUMTEXT
        cursor.execute("""
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'browser_events_v2' 
            AND COLUMN_NAME = 'html_content'
        """)
        
        result = cursor.fetchone()
        if result and result[0] in ['text', 'longtext', 'mediumblob']:
            # Alter the column to MEDIUMTEXT
            cursor.execute("""
                ALTER TABLE browser_events_v2 
                MODIFY COLUMN html_content MEDIUMTEXT
            """)
            logger.info("Updated html_content column to MEDIUMTEXT")
        
    except Error as e:
        logger.error(f"Error creating/updating browser_events table: {e}")
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
    logger.info(f"Received {request.method} request to /api/events")
    logger.info(f"Request headers: {dict(request.headers)}")
    
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
    page_title = get_string(event, "page_title")
    html_content = get_string(event, "html_content")
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
            INSERT INTO browser_events_v2 (
                event_type, url, page_title, html_content, text, highlighted_text, 
                clicked_url, action, timestamp, user_agent
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            event_type, url, page_title, html_content, text, highlighted_text,
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
    
    # Check if SSL certificates exist for HTTPS
    if os.path.exists(SSL_CERT_PATH) and os.path.exists(SSL_KEY_PATH):
        logger.info("SSL certificates found, starting HTTPS server")
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=False, 
            threaded=True,
            ssl_context=(SSL_CERT_PATH, SSL_KEY_PATH)
        )
    else:
        logger.info("SSL certificates not found, starting HTTP server")
        logger.warning("For production use, configure HTTPS to avoid Mixed Content errors")
        # Use threaded=True to handle multiple requests and set explicit HTTP version
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True) 