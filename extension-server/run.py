#!/usr/bin/env python3
"""
Simple startup script for the extension server.
This script can be used to run the server with custom configuration.
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # Set default environment variables if not already set
    if not os.getenv('PORT'):
        os.environ['PORT'] = '8080'  # Changed from 3306 to 8080
    
    if not os.getenv('DB_HOST'):
        os.environ['DB_HOST'] = '10.1.8.3'
    
    if not os.getenv('DB_PORT'):
        os.environ['DB_PORT'] = '3306'  # Changed from 5432 to 3306
    
    if not os.getenv('DB_USER'):
        os.environ['DB_USER'] = 'test'
    
    if not os.getenv('DB_PASSWORD'):
        os.environ['DB_PASSWORD'] = 'test4scio'
    
    if not os.getenv('DB_NAME'):
        os.environ['DB_NAME'] = 'browser_data'
    
    # SSL Configuration
    if not os.getenv('SSL_CERT_PATH'):
        os.environ['SSL_CERT_PATH'] = 'cert.pem'
    
    if not os.getenv('SSL_KEY_PATH'):
        os.environ['SSL_KEY_PATH'] = 'key.pem'
    
    port = int(os.environ['PORT'])
    print(f"Starting extension server on port {port}")
    print(f"Database: {os.environ['DB_HOST']}:{os.environ['DB_PORT']}/{os.environ['DB_NAME']}")
    
    # Check if SSL certificates exist
    ssl_cert = os.environ['SSL_CERT_PATH']
    ssl_key = os.environ['SSL_KEY_PATH']
    
    if os.path.exists(ssl_cert) and os.path.exists(ssl_key):
        print(f"SSL certificates found, starting HTTPS server")
        app.run(host='0.0.0.0', port=port, debug=False, ssl_context=(ssl_cert, ssl_key))
    else:
        print(f"SSL certificates not found, starting HTTP server")
        print("Warning: For production use, configure HTTPS to avoid Mixed Content errors")
        app.run(host='0.0.0.0', port=port, debug=False) 