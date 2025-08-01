#!/usr/bin/env python3
"""
Generate self-signed SSL certificates for development.
This script creates a self-signed certificate and private key for HTTPS testing.
"""

import os
import subprocess
import sys
from pathlib import Path

def generate_ssl_certificate():
    """Generate self-signed SSL certificate and private key"""
    
    # Check if OpenSSL is available
    try:
        subprocess.run(['openssl', 'version'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: OpenSSL is not installed or not available in PATH")
        print("Please install OpenSSL to generate SSL certificates")
        return False
    
    # Certificate and key file paths
    cert_file = "cert.pem"
    key_file = "key.pem"
    
    # Check if files already exist
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print(f"SSL certificate files already exist:")
        print(f"  Certificate: {cert_file}")
        print(f"  Private Key: {key_file}")
        response = input("Do you want to regenerate them? (y/N): ")
        if response.lower() != 'y':
            print("Using existing SSL certificate files")
            return True
    
    print("Generating self-signed SSL certificate...")
    
    try:
        # Generate private key
        subprocess.run([
            'openssl', 'genrsa', '-out', key_file, '2048'
        ], check=True, capture_output=True)
        
        # Generate certificate signing request and self-signed certificate
        subprocess.run([
            'openssl', 'req', '-new', '-x509', '-key', key_file,
            '-out', cert_file, '-days', '365', '-subj',
            '/C=US/ST=State/L=City/O=Organization/CN=localhost'
        ], check=True, capture_output=True)
        
        print(f"SSL certificate generated successfully:")
        print(f"  Certificate: {cert_file}")
        print(f"  Private Key: {key_file}")
        print(f"  Valid for: 365 days")
        print(f"  Common Name: localhost")
        print()
        print("Note: This is a self-signed certificate for development only.")
        print("For production, use a certificate from a trusted Certificate Authority.")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error generating SSL certificate: {e}")
        return False

if __name__ == '__main__':
    success = generate_ssl_certificate()
    sys.exit(0 if success else 1) 