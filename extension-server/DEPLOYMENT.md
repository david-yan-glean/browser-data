# Extension Server Deployment Guide

## Quick Start (Automated)

1. **Update the project ID** in `deploy-gcp.sh`:
   ```bash
   PROJECT_ID="your-gcp-project-id"
   ```

2. **Make the script executable and run it**:
   ```bash
   chmod +x deploy-gcp.sh
   ./deploy-gcp.sh
   ```

## Quick Start (Manual)

1. **Install prerequisites**:
   - Google Cloud SDK
   - Docker

2. **Authenticate with GCP**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Build and deploy**:
   ```bash
   # Build Docker image
   docker build -t gcr.io/YOUR_PROJECT_ID/extension-server .
   
   # Push to GCR
   gcloud auth configure-docker
   docker push gcr.io/YOUR_PROJECT_ID/extension-server
   
   # Create instance
   gcloud compute instances create-with-container extension-server \
       --zone=us-central1-a \
       --machine-type=e2-micro \
       --container-image=gcr.io/YOUR_PROJECT_ID/extension-server \
       --container-port=8080 \
       --tags=extension-server
   ```

4. **Create firewall rule**:
   ```bash
   gcloud compute firewall-rules create allow-extension-server \
       --allow tcp:8080 \
       --source-ranges 0.0.0.0/0 \
       --target-tags extension-server
   ```

## Configuration

### Environment Variables

The server uses these environment variables:

- `DB_HOST`: Database host (default: 10.1.8.3)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username (default: test)
- `DB_PASSWORD`: Database password (default: test4scio)
- `DB_NAME`: Database name (default: browser_data)

### Customizing Database Connection

To use a different database, update the environment variables when running the container:

```bash
docker run -d \
    --name extension-server \
    -p 8080:8080 \
    -e DB_HOST=your-db-host \
    -e DB_USER=your-user \
    -e DB_PASSWORD=your-password \
    -e DB_NAME=your-database \
    gcr.io/YOUR_PROJECT_ID/extension-server
```

## Testing

### Health Check
```bash
curl http://EXTERNAL_IP:8080/api/health
```

### Send Test Event
```bash
curl -X POST http://EXTERNAL_IP:8080/api/events \
    -H "Content-Type: application/json" \
    -d '{
        "event_type": "test",
        "url": "https://example.com",
        "timestamp": "2024-01-01T00:00:00Z"
    }'
```

## Cost Optimization

- **Free Tier**: Use `e2-micro` machine type (free tier eligible)
- **Stop when not in use**: `gcloud compute instances stop extension-server --zone=us-central1-a`
- **Start when needed**: `gcloud compute instances start extension-server --zone=us-central1-a`

## Security Notes

⚠️ **Important**: The current setup allows traffic from anywhere (0.0.0.0/0). For production:

1. Restrict firewall rules to specific IP ranges
2. Set up HTTPS with a load balancer
3. Secure your database connection
4. Use environment variables for sensitive data

## Troubleshooting

### Common Issues

1. **Container not starting**: Check logs with `docker logs extension-server`
2. **Database connection failed**: Verify database credentials and network connectivity
3. **Port already in use**: Check if another service is using port 8080

### Useful Commands

```bash
# View logs
gcloud compute ssh extension-server --zone=us-central1-a --command='docker logs extension-server'

# SSH into instance
gcloud compute ssh extension-server --zone=us-central1-a

# Get external IP
gcloud compute instances describe extension-server --zone=us-central1-a --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```

## Next Steps

After deployment:

1. Update your Chrome extension's `background.js` with the new server URL
2. Test the connection from your extension
3. Monitor logs for any issues
4. Consider setting up monitoring and alerting 