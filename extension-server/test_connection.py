#!/usr/bin/env python3
"""
Test script to debug HTTP connection issues with the extension server
"""

import requests
import json

def test_server_connection(server_url):
    """Test connection to the server"""
    print(f"Testing connection to: {server_url}")
    
    # Test 1: Health endpoint
    try:
        print("\n1. Testing health endpoint...")
        response = requests.get(f"{server_url}/api/health", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Headers: {dict(response.headers)}")
    except requests.exceptions.RequestException as e:
        print(f"   Error: {e}")
    
    # Test 2: Events endpoint with POST
    try:
        print("\n2. Testing events endpoint...")
        test_event = {
            "event_type": "test",
            "url": "https://example.com",
            "timestamp": "2024-01-01T00:00:00Z",
            "tab_id": 123,
            "user_agent": "test-agent"
        }
        
        response = requests.post(
            f"{server_url}/api/events",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(test_event),
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Headers: {dict(response.headers)}")
    except requests.exceptions.RequestException as e:
        print(f"   Error: {e}")
    
    # Test 3: Test with different HTTP versions
    try:
        print("\n3. Testing with explicit HTTP/1.1...")
        session = requests.Session()
        session.headers.update({'Connection': 'close'})
        
        response = session.post(
            f"{server_url}/api/events",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(test_event),
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    # Replace with your actual GCP instance IP
    SERVER_URL = "http://34.83.75.136:8080"  # Replace EXTERNAL_IP with your actual IP
    
    print("HTTP Connection Test Script")
    print("=" * 50)
    
    test_server_connection(SERVER_URL)
    
    print("\n" + "=" * 50)
    print("Test completed. Check the output above for any errors.") 