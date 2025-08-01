# HTTPS Setup Guide

This guide explains how to set up HTTPS for your extension server to resolve Mixed Content errors.

## Problem

When your Chrome extension runs on HTTPS pages (like Google Cloud Console), browsers block HTTP requests to your backend server for security reasons. This results in Mixed Content errors.

## Solutions

### Option 1: Self-Signed Certificate (Development)

For development and testing, you can use a self-signed certificate:

1. **Generate SSL Certificate**:
   ```bash
   cd extension-server
   python generate_ssl_cert.py
   ```

2. **Start Server with HTTPS**:
   ```bash
   python run.py
   ```
   The server will automatically detect the SSL certificates and start in HTTPS mode.

3. **Update Chrome Extension**:
   The extension is already configured to try HTTPS first, then fall back to HTTP.

### Option 2: Let's Encrypt Certificate (Production)

For production use, obtain a free SSL certificate from Let's Encrypt:

1. **Install Certbot**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install certbot
   
   # CentOS/RHEL
   sudo yum install certbot
   ```

2. **Obtain Certificate**:
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **Configure Environment**:
   ```bash
   # Add to your .env file
   SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
   SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
   ```

4. **Auto-renewal** (recommended):
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Option 3: Reverse Proxy with Nginx

Use Nginx as a reverse proxy to handle HTTPS:

1. **Install Nginx**:
   ```bash
   sudo apt-get install nginx
   ```

2. **Configure Nginx**:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Start Flask Server on HTTP**:
   ```bash
   # Remove SSL configuration from Flask
   python app.py
   ```

## GCP Deployment

For Google Cloud Platform deployment:

1. **Create SSL Certificate in GCP**:
   - Go to Google Cloud Console
   - Navigate to "Security" > "SSL Certificates"
   - Create a new SSL certificate
   - Use the certificate in your load balancer

2. **Update Load Balancer**:
   - Configure your load balancer to use HTTPS
   - Point to your Flask server on port 8080 (HTTP)

3. **Update Extension**:
   - Change the SERVER_URL to use your load balancer's HTTPS endpoint

## Testing

1. **Test HTTPS Connection**:
   ```bash
   curl -k https://your-server:8080/api/health
   ```

2. **Test from Extension**:
   - Open Chrome DevTools
   - Check the Console for HTTPS connection logs
   - Verify no Mixed Content errors

## Troubleshooting

### Certificate Errors
- For self-signed certificates, browsers will show security warnings
- Accept the certificate in your browser for testing
- Use proper CA-signed certificates for production

### Port Issues
- Ensure port 443 (HTTPS) is open in your firewall
- Check that your GCP firewall rules allow HTTPS traffic

### Mixed Content Still Appears
- Clear browser cache
- Reload the extension
- Check that the server is actually running on HTTPS

## Security Notes

- Self-signed certificates are for development only
- Always use proper CA-signed certificates in production
- Keep private keys secure and never commit them to version control
- Regularly update and renew certificates 