#!/bin/bash

# GCP Extension Server Deployment Script
# This script deploys the extension-server to Google Cloud Platform

set -e

# Configuration - Update these variables
PROJECT_ID="dev-sandbox-334901"
REGION="us-west1"
ZONE="us-west1-a"
INSTANCE_NAME="browser-data-collection-server"
MACHINE_TYPE="e2-small"
DISK_SIZE="10GB"
DOCKER_IMAGE_NAME="browser-data-collection-server"
CONTAINER_PORT="8080"
EXTERNAL_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting GCP deployment for extension-server...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting GCP project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t gcr.io/$PROJECT_ID/$DOCKER_IMAGE_NAME .

echo -e "${YELLOW}Pushing Docker image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$DOCKER_IMAGE_NAME

# Create firewall rule for the application
echo -e "${YELLOW}Creating firewall rule...${NC}"
gcloud compute firewall-rules create allow-extension-server \
    --allow tcp:$EXTERNAL_PORT \
    --source-ranges 0.0.0.0/0 \
    --description "Allow traffic to extension server" \
    --target-tags extension-server

# Create the VM instance
echo -e "${YELLOW}Creating VM instance...${NC}"
gcloud compute instances create-with-container $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --boot-disk-size=$DISK_SIZE \
    --container-image=gcr.io/$PROJECT_ID/$DOCKER_IMAGE_NAME \
    --container-port=$CONTAINER_PORT \
    --tags=extension-server \
    --metadata=startup-script="#!/bin/bash
# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker \$USER
fi

# Pull and run the container
docker pull gcr.io/$PROJECT_ID/$DOCKER_IMAGE_NAME
docker run -d \
    --name extension-server \
    --restart unless-stopped \
    -p $CONTAINER_PORT:$CONTAINER_PORT \
    -e DB_HOST=\${DB_HOST:-10.1.8.3} \
    -e DB_PORT=\${DB_PORT:-3306} \
    -e DB_USER=\${DB_USER:-test} \
    -e DB_PASSWORD=\${DB_PASSWORD:-test4scio} \
    -e DB_NAME=\${DB_NAME:-browser_data} \
    gcr.io/$PROJECT_ID/$DOCKER_IMAGE_NAME"

# Wait for instance to be ready
echo -e "${YELLOW}Waiting for instance to be ready...${NC}"
sleep 30

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your extension server is now running at:${NC}"
echo -e "${GREEN}http://$EXTERNAL_IP:$EXTERNAL_PORT${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker logs extension-server'"
echo "  SSH into instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  Stop instance: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
echo "  Start instance: gcloud compute instances start $INSTANCE_NAME --zone=$ZONE"
echo "  Delete instance: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE"
echo ""
echo -e "${YELLOW}Don't forget to update your Chrome extension's background.js with the new server URL!${NC}" 