#!/bin/bash

# Comodo SSL Certificate Setup Script for Extension Server
# This script helps set up HTTPS using Comodo certificates

set -e

echo "🔒 Comodo SSL Certificate Setup for Extension Server"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the extension-server directory"
    exit 1
fi

# Check if certificate files exist
if [ ! -d "glean-browser_store" ]; then
    echo "❌ Error: glean-browser_store directory not found"
    echo "Please ensure your Comodo certificate files are in the glean-browser_store directory"
    exit 1
fi

echo "✅ Certificate directory found"

# Extract certificates from p7b file
echo "🔐 Extracting certificates from p7b file..."
cd glean-browser_store
if [ -f "glean-browser_store.p7b" ]; then
    openssl pkcs7 -in glean-browser_store.p7b -print_certs -out extracted_certs.pem
    echo "✅ Certificates extracted from p7b file"
else
    echo "❌ Error: glean-browser_store.p7b not found"
    exit 1
fi

# Create the certificate chain file
echo "🔗 Creating certificate chain..."
if [ -f "extracted_certs.pem" ] && [ -f "glean-browser_store.ca-bundle" ]; then
    # Combine the extracted certificate with the CA bundle
    cat extracted_certs.pem glean-browser_store.ca-bundle > cert_chain.pem
    echo "✅ Certificate chain created"
else
    echo "❌ Error: Required certificate files not found"
    exit 1
fi

cd ..

# Ask user for private key location
echo ""
echo "📝 Please provide the path to your private key file:"
echo "   (e.g., /path/to/your/private.key or /path/to/your/private.pem)"
read -p "Private key path: " PRIVATE_KEY_PATH

if [ ! -f "$PRIVATE_KEY_PATH" ]; then
    echo "❌ Error: Private key file not found at $PRIVATE_KEY_PATH"
    exit 1
fi

echo "✅ Private key found"

# Copy files to the main directory
echo "📁 Setting up certificate files..."
cp "$PRIVATE_KEY_PATH" key.pem
cp glean-browser_store/cert_chain.pem cert.pem

# Set proper permissions
chmod 600 key.pem
chmod 644 cert.pem

echo "✅ Certificate files configured with proper permissions"

# Create or update .env file
echo "📝 Updating .env file..."
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "✅ .env file created from template"
fi

# Update .env with SSL paths
if grep -q "SSL_CERT_PATH" .env; then
    # Update existing SSL paths
    sed -i.bak 's|SSL_CERT_PATH=.*|SSL_CERT_PATH=cert.pem|' .env
    sed -i.bak 's|SSL_KEY_PATH=.*|SSL_KEY_PATH=key.pem|' .env
else
    # Add SSL paths
    echo "" >> .env
    echo "# SSL Configuration (for HTTPS)" >> .env
    echo "SSL_CERT_PATH=cert.pem" >> .env
    echo "SSL_KEY_PATH=key.pem" >> .env
fi

echo "✅ .env file updated with SSL configuration"

# Install Python dependencies if needed
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

echo ""
echo "🎉 Comodo SSL setup complete!"
echo ""
echo "Certificate details:"
echo "  - Domain: glean-browser.store"
echo "  - Issuer: Sectigo Public Server Authentication CA DV R36"
echo "  - Certificate: cert.pem"
echo "  - Private Key: key.pem"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database settings if needed"
echo "2. Start the server: python3 run.py"
echo "3. The server will automatically use HTTPS on port 8080"
echo ""
echo "⚠️  Important: Make sure your domain 'glean-browser.store' points to this server"
echo "   and that port 443 (or your configured port) is accessible"
