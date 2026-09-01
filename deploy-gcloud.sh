#!/bin/bash

# Google Cloud Run Deployment Script
# שימוש: ./deploy-gcloud.sh

set -e

echo "🚀 Contractor API - Google Cloud Run Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Install from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Get Google Cloud Project ID
echo -e "\n${YELLOW}Getting Google Cloud Project...${NC}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No Google Cloud project configured${NC}"
    echo "Run: gcloud init"
    exit 1
fi

echo -e "${GREEN}✓ Project: $PROJECT_ID${NC}"

# Set variables
REGION="us-central1"
SERVICE_NAME="contractor-api"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
DB_INSTANCE="contractor-db"

# Step 1: Enable APIs
echo -e "\n${YELLOW}Enabling Google Cloud APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
echo -e "${GREEN}✓ APIs enabled${NC}"

# Step 2: Check if Cloud SQL instance exists
echo -e "\n${YELLOW}Checking Cloud SQL instance...${NC}"
if ! gcloud sql instances describe $DB_INSTANCE &> /dev/null; then
    echo -e "${YELLOW}Creating Cloud SQL PostgreSQL instance...${NC}"
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --availability-type=regional \
        --backup-start-time=03:00 \
        --enable-bin-log
    echo -e "${GREEN}✓ Cloud SQL instance created${NC}"
else
    echo -e "${GREEN}✓ Cloud SQL instance exists${NC}"
fi

# Get Database IP
echo -e "\n${YELLOW}Getting Cloud SQL IP address...${NC}"
DB_IP=$(gcloud sql instances describe $DB_INSTANCE \
    --format='value(ipAddresses[0].ipAddress)')
echo -e "${GREEN}✓ Database IP: $DB_IP${NC}"

# Step 3: Create database if not exists
echo -e "\n${YELLOW}Setting up database...${NC}"
if ! gcloud sql databases describe contractor_db --instance=$DB_INSTANCE &> /dev/null; then
    gcloud sql databases create contractor_db --instance=$DB_INSTANCE
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database exists${NC}"
fi

# Step 4: Build Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
docker build -t $IMAGE_NAME:latest .
echo -e "${GREEN}✓ Docker image built${NC}"

# Step 5: Push to Container Registry
echo -e "\n${YELLOW}Pushing image to Container Registry...${NC}"
docker push $IMAGE_NAME:latest
echo -e "${GREEN}✓ Image pushed${NC}"

# Step 6: Get secrets
echo -e "\n${YELLOW}Enter configuration details:${NC}"
read -p "DB Password: " DB_PASSWORD
read -p "JWT Secret (min 32 chars): " JWT_SECRET
read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
read -p "Cloudinary API Key: " CLOUDINARY_API_KEY
read -sp "Cloudinary API Secret: " CLOUDINARY_API_SECRET
echo ""

# Step 7: Deploy to Cloud Run
echo -e "\n${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --set-env-vars=\
NODE_ENV=production,\
DB_HOST=$DB_IP,\
DB_PORT=5432,\
DB_USERNAME=postgres,\
DB_PASSWORD=$DB_PASSWORD,\
DB_NAME=contractor_db,\
JWT_SECRET=$JWT_SECRET,\
JWT_EXPIRES_IN=7d,\
CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME,\
CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY,\
CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET,\
PORT=3000

echo -e "${GREEN}✓ Service deployed${NC}"

# Step 8: Get service URL
echo -e "\n${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}API URL: $SERVICE_URL${NC}"
echo -e "${GREEN}Database IP: $DB_IP${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update Frontend with API URL:"
echo "   EXPO_PUBLIC_API_URL=$SERVICE_URL"
echo ""
echo "2. Run Frontend:"
echo "   npm run build"
echo "   eas submit --platform android --latest"
echo ""
echo "3. Monitor logs:"
echo "   gcloud run logs read $SERVICE_NAME --region=$REGION --limit=100 --follow"
