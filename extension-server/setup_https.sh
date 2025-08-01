#!/bin/bash

# HTTPS Setup Script for Extension Server
# This script helps set up HTTPS for the extension server to resolve Mixed Content errors

set -e

echo "🔒 HTTPS Setup for Extension Server"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the extension-server directory"
    exit 1
fi

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed"
    echo "Please install OpenSSL first:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL: sudo yum install openssl"
    echo "  macOS: brew install openssl"
    exit 1
fi

echo "✅ OpenSSL found"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

echo "✅ Python 3 found"

# Generate SSL certificate if it doesn't exist
if [ ! -f "cert.pem" ] || [ ! -f "key.pem" ]; then
    echo "🔐 Generating self-signed SSL certificate..."
    python3 generate_ssl_cert.py
else
    echo "✅ SSL certificates already exist"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your database settings"
else
    echo "✅ .env file exists"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo ""
echo "🎉 HTTPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database settings"
echo "2. Start the server: python3 run.py"
echo "3. The server will automatically use HTTPS"
echo ""
echo "For production deployment, see HTTPS_SETUP.md for proper SSL certificates" 