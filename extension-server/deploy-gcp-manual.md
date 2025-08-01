# Deploying Extension Server on Google Cloud Platform

This guide provides step-by-step instructions for deploying the extension-server on Google Cloud Platform (GCP).

## Prerequisites

1. **Google Cloud Account**: You need a GCP account with billing enabled
2. **Google Cloud SDK**: Install the gcloud CLI tool
3. **Docker**: Install Docker on your local machine
4. **Project Setup**: Create a new GCP project or use an existing one

## Step 1: Install Google Cloud SDK

### macOS (using Homebrew):
```bash
brew install google-cloud-sdk
```

### Linux:
```bash
# Download and install the SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Windows:
Download from: https://cloud.google.com/sdk/docs/install

## Step 2: Authenticate and Configure

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 3: Build and Push Docker Image

```bash
# Navigate to the extension-server directory
cd extension-server

# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/extension-server .

# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker

# Push the image to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/extension-server
```

## Step 4: Create Firewall Rule

```bash
# Create a firewall rule to allow traffic on port 8080
gcloud compute firewall-rules create allow-extension-server \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow traffic to extension server" \
    --target-tags extension-server
```

## Step 5: Create VM Instance

### Option A: Using gcloud command (Recommended)

```bash
gcloud compute instances create-with-container extension-server \
    --zone=us-west1-a \
    --machine-type=e2-micro \
    --boot-disk-size=10GB \
    --network=default \
    --subnet=default \
    --container-image=gcr.io/dev-sandbox-334901/extension-server \
    --tags=extension-serve \
    --metadata=startup-script="#!/bin/bash"
# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker \$USER
fi

# Pull and run the container
docker pull gcr.io/YOUR_PROJECT_ID/extension-server
docker run -d \
    --name extension-server \
    --restart unless-stopped \
    -p 8080:8080 \
    -e DB_HOST=10.1.8.3 \
    -e DB_PORT=3306 \
    -e DB_USER=test \
    -e DB_PASSWORD=test4scio \
    -e DB_NAME=browser_data \
    gcr.io/YOUR_PROJECT_ID/extension-server"
```

### Option B: Using Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Compute Engine > VM instances
3. Click "Create Instance"
4. Configure the instance:
   - **Name**: `extension-server`
   - **Region/Zone**: `us-west1-a`
   - **Machine type**: `e2-micro` (free tier eligible)
   - **Boot disk**: 10GB standard persistent disk
   - **Firewall**: Allow HTTP traffic
5. Under "Container", select "Deploy a container image to this VM instance"
6. Enter: `gcr.io/YOUR_PROJECT_ID/extension-server`
7. Set container port to `8080`
8. Click "Create"

## Step 6: Configure Environment Variables

If you need to customize the database connection, you can set environment variables:

```bash
# SSH into the instance
gcloud compute ssh extension-server --zone=us-west1-a

# Stop the current container
docker stop extension-server
docker rm extension-server

# Run with custom environment variables
docker run -d \
    --name extension-server \
    --restart unless-stopped \
    -p 8080:8080 \
    -e DB_HOST=your-db-host \
    -e DB_PORT=3306 \
    -e DB_USER=your-db-user \
    -e DB_PASSWORD=your-db-password \
    -e DB_NAME=your-db-name \
    gcr.io/YOUR_PROJECT_ID/extension-server
```

## Step 7: Get the External IP

```bash
# Get the external IP address
gcloud compute instances describe extension-server \
    --zone=us-west1-a \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```

## Step 8: Test the Deployment

```bash
# Test the health endpoint
curl http://EXTERNAL_IP:8080/api/health

# Test with a sample event
curl -X POST http://EXTERNAL_IP:8080/api/events \
    -H "Content-Type: application/json" \
    -d '{
        "event_type": "test",
        "url": "https://example.com",
        "timestamp": "2024-01-01T00:00:00Z"
    }'
```

## Step 9: Update Chrome Extension

Update your Chrome extension's `background.js` to point to the new server URL:

```javascript
// Replace the server URL with your GCP instance IP
const SERVER_URL = 'http://EXTERNAL_IP:8080';
```

## Useful Commands

### View Logs
```bash
gcloud compute ssh extension-server --zone=us-west1-a --command='docker logs extension-server'
```

### SSH into Instance
```bash
gcloud compute ssh extension-server --zone=us-west1-a
```

### Stop Instance
```bash
gcloud compute instances stop extension-server --zone=us-west1-a
```

### Start Instance
```bash
gcloud compute instances start extension-server --zone=us-west1-a
```

### Delete Instance
```bash
gcloud compute instances delete extension-server --zone=us-west1-a
```

## Cost Optimization

- **Free Tier**: The `e2-micro` machine type is eligible for GCP's free tier
- **Scheduling**: Consider stopping the instance when not in use to save costs
- **Preemptible Instances**: For non-critical workloads, consider using preemptible instances

## Security Considerations

1. **Firewall Rules**: The current setup allows traffic from anywhere (0.0.0.0/0). Consider restricting this to specific IP ranges
2. **HTTPS**: For production, set up HTTPS using a load balancer or reverse proxy
3. **Database Security**: Ensure your database is properly secured and not publicly accessible
4. **Environment Variables**: Store sensitive information like database passwords securely

## Troubleshooting

### Container Not Starting
```bash
# Check container logs
docker logs extension-server

# Check if port is in use
netstat -tlnp | grep 8080
```

### Database Connection Issues
```bash
# Test database connectivity from the instance
mysql -h DB_HOST -u DB_USER -p DB_NAME
```

### Permission Issues
```bash
# Make sure Docker is running
sudo systemctl status docker

# Add user to docker group
sudo usermod -aG docker $USER
``` 