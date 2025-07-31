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
        os.environ['PORT'] = '3306'
    
    if not os.getenv('DB_HOST'):
        os.environ['DB_HOST'] = '10.1.8.3'
    
    if not os.getenv('DB_PORT'):
        os.environ['DB_PORT'] = '5432'
    
    if not os.getenv('DB_USER'):
        os.environ['DB_USER'] = 'test'
    
    if not os.getenv('DB_PASSWORD'):
        os.environ['DB_PASSWORD'] = 'test4scio'
    
    if not os.getenv('DB_NAME'):
        os.environ['DB_NAME'] = 'browser_data'
    
    port = int(os.environ['PORT'])
    print(f"Starting extension server on port {port}")
    print(f"Database: {os.environ['DB_HOST']}:{os.environ['DB_PORT']}/{os.environ['DB_NAME']}")
    
    app.run(host='0.0.0.0', port=port, debug=False) 