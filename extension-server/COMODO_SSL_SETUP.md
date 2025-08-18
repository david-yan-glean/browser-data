# Comodo SSL Certificate Setup Guide

This guide explains how to set up HTTPS on your extension server using Comodo/Sectigo certificates.

## Prerequisites

- Comodo certificate files (you have these in `glean-browser_store/`)
- Private key file that was used to generate the certificate
- OpenSSL installed on your system

## Automatic Setup (Recommended)

Run the automated setup script:

```bash
./setup_comodo_ssl.sh
```

The script will:
1. Extract certificates from the p7b file
2. Create a proper certificate chain
3. Ask for your private key location
4. Set up the files with proper permissions
5. Update your .env file

## Manual Setup

If you prefer to set up manually, follow these steps:

### Step 1: Extract Certificates

```bash
cd glean-browser_store
openssl pkcs7 -in glean-browser_store.p7b -print_certs -out extracted_certs.pem
```

### Step 2: Create Certificate Chain

```bash
# Combine your certificate with the CA bundle
cat extracted_certs.pem glean-browser_store.ca-bundle > cert_chain.pem
cd ..
```

### Step 3: Set Up Certificate Files

```bash
# Copy your private key (replace with actual path)
cp /path/to/your/private.key key.pem

# Copy the certificate chain
cp glean-browser_store/cert_chain.pem cert.pem

# Set proper permissions
chmod 600 key.pem
chmod 644 cert.pem
```

### Step 4: Update Environment Configuration

Edit your `.env` file and add:

```env
# SSL Configuration (for HTTPS)
SSL_CERT_PATH=cert.pem
SSL_KEY_PATH=key.pem
```

## Certificate Details

- **Domain**: glean-browser.store
- **Issuer**: Sectigo Public Server Authentication CA DV R36
- **Certificate File**: cert.pem (contains your certificate + CA chain)
- **Private Key File**: key.pem (your private key)

## Starting the Server

After setup, start your server:

```bash
python3 run.py
```

The server will automatically detect the SSL certificates and start in HTTPS mode on port 8080.

## Important Notes

1. **Domain Configuration**: Make sure your domain `glean-browser.store` points to this server
2. **Port Access**: Ensure port 443 (or your configured port) is accessible from the internet
3. **Firewall**: Configure your firewall to allow HTTPS traffic
4. **DNS**: Update your DNS records to point to your server's IP address

## Troubleshooting

### Certificate Chain Issues
If you get certificate chain errors, verify the chain is complete:
```bash
openssl verify -CAfile glean-browser_store/glean-browser_store.ca-bundle cert.pem
```

### Permission Issues
Ensure proper file permissions:
```bash
chmod 600 key.pem
chmod 644 cert.pem
```

### Port Issues
If you need to use a different port, update your `.env` file:
```env
PORT=443
```

## Security Best Practices

1. Keep your private key secure and never share it
2. Use strong file permissions (600 for private key, 644 for certificate)
3. Regularly update your certificates before they expire
4. Monitor certificate expiration dates
5. Use HTTPS-only in production environments
