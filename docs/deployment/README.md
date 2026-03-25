# Deployment and Setup Guide

## Overview

This guide provides comprehensive instructions for setting up, deploying, and maintaining the food delivery platform in various environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Production Deployment](#production-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Development Environment
```
Operating System: Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+
Node.js: Version 18.0 or higher
npm: Version 8.0 or higher (or yarn/pnpm)
Git: Version 2.20 or higher
PostgreSQL: Version 13 or higher
Redis: Version 6.0 or higher (for caching)
```

#### Production Environment
```
Server: 2+ CPU cores, 4GB+ RAM, 20GB+ SSD storage
Database: PostgreSQL 13+ with connection pooling
Load Balancer: Nginx or similar
SSL Certificate: Let's Encrypt or commercial certificate
Domain: Configured DNS with proper records
Monitoring: Application and infrastructure monitoring
```

### Required Accounts and Services

1. **Supabase Account**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note down project URL and API keys

2. **Google Cloud Platform** (for maps and services)
   - Google Maps API key
   - Geocoding API access
   - Places API access

3. **Stripe Account** (for payments)
   - Stripe API keys (test and live)
   - Webhook endpoint configuration

4. **Domain and Hosting**
   - Domain registration
   - SSL certificate
   - Hosting provider (Vercel, AWS, etc.)

## Local Development Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/food-delivery-platform.git
cd food-delivery-platform

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Configuration

Create environment files:

```bash
# Copy example environment file
cp .env.example .env.local

# Edit the environment variables
nano .env.local
```

#### Environment Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/food_delivery"
DIRECT_URL="postgresql://username:password@localhost:5432/food_delivery"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret"

# Security
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE="5000000"
NEXT_PUBLIC_UPLOAD_PATH="/uploads"

# Rate Limiting
RATE_LIMIT_WINDOW="15"
RATE_LIMIT_MAX="100"

# Logging
LOG_LEVEL="debug"
LOG_FORMAT="combined"
```

### 3. Database Setup

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb food_delivery
sudo -u postgres psql -c "CREATE USER food_delivery_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE food_delivery TO food_delivery_user;"
```

**macOS (using Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database and user
createdb food_delivery
psql -c "CREATE USER food_delivery_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE food_delivery TO food_delivery_user;"
```

**Windows:**
```bash
# Download and install PostgreSQL from postgresql.org
# Use pgAdmin or psql command line to create database
createdb food_delivery
psql -c "CREATE USER food_delivery_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE food_delivery TO food_delivery_user;"
```

#### Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database with initial data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:3000
```

#### Development Commands

```bash
# Start development server with Turbopack (faster)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma db push

# Reset database
npx prisma db push --force-reset

# Generate Prisma client
npx prisma generate

# Seed database
npm run db:seed

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Database Setup

### Prisma Configuration

The project uses Prisma as the ORM. Configuration is in `prisma/schema.prisma`.

#### Database Schema Management

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database to initial state
npx prisma migrate reset

# View migration history
npx prisma migrate status

# Generate client after schema changes
npx prisma generate
```

#### Seed Database

```bash
# Run seed script
npm run db:seed

# The seed script populates:
# - Sample restaurants
# - Menu items
# - Users (customers, drivers, vendors)
# - Sample orders
```

### Database Backup and Restore

#### Backup

```bash
# Create database backup
pg_dump -U food_delivery_user -h localhost food_delivery > backup.sql

# Backup with compression
pg_dump -U food_delivery_user -h localhost food_delivery | gzip > backup.sql.gz
```

#### Restore

```bash
# Restore from backup
psql -U food_delivery_user -h localhost food_delivery < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -U food_delivery_user -h localhost food_delivery
```

## Environment Configuration

### Development Environment

The development environment is optimized for rapid development and debugging.

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
DATABASE_URL="postgresql://user:pass@localhost:5432/food_delivery"
```

### Staging Environment

```env
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
LOG_LEVEL=info
DATABASE_URL="postgresql://user:pass@staging-db:5432/food_delivery_staging"
```

### Production Environment

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
LOG_LEVEL=warn
DATABASE_URL="postgresql://user:pass@prod-db:5432/food_delivery_prod"
```

### Environment-Specific Configurations

#### Database Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  
  // Connection pool settings
  relationMode = "prisma"
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

#### Redis Configuration (Optional)

```typescript
// lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redis;
```

## Production Deployment

### Option 1: Vercel Deployment

#### Prerequisites
- Vercel account
- GitHub repository
- Environment variables configured

#### Steps

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Navigate to project settings
   - Add environment variables for production

3. **Custom Domain**
   ```bash
   # Add custom domain
   vercel domains add your-domain.com
   
   # Configure DNS records
   # CNAME record: cname.vercel-dns.com
   ```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### Option 2: AWS Deployment

#### Prerequisites
- AWS account
- AWS CLI configured
- Domain name

#### Architecture
```
CloudFront (CDN) → ALB (Load Balancer) → ECS/Fargate (Application)
                                    ↓
                           RDS (PostgreSQL)
```

#### Deployment Steps

1. **Build and Push Docker Image**
   ```bash
   # Build Docker image
   docker build -t food-delivery-app .
   
   # Tag for ECR
   docker tag food-delivery-app:latest 123456789.dkr.ecr.region.amazonaws.com/food-delivery-app:latest
   
   # Push to ECR
   docker push 123456789.dkr.ecr.region.amazonaws.com/food-delivery-app:latest
   ```

2. **Deploy to ECS**
   ```bash
   # Update ECS service
   aws ecs update-service --cluster food-delivery-cluster --service food-delivery-service --force-new-deployment
   ```

### Option 3: DigitalOcean Deployment

#### Droplet Setup

```bash
# Create 4GB RAM, 2 vCPU droplet
# Ubuntu 20.04 LTS

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/your-username/food-delivery-platform.git
cd food-delivery-platform
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/food-delivery
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/food_delivery
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=food_delivery
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale app=3

# Update and restart
docker-compose pull
docker-compose up -d

# Backup database
docker-compose exec db pg_dump -U user food_delivery > backup.sql

# Restore database
docker-compose exec -T db psql -U user food_delivery < backup.sql
```

## Cloud Deployment

### AWS Deployment with Terraform

#### Infrastructure as Code

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "food-delivery-vpc"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "food-delivery-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "food_delivery"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "food-delivery-db-final-snapshot"

  tags = {
    Name = "food-delivery-db"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "food-delivery-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "food-delivery-cluster"
  }
}
```

#### Deployment Commands

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Deploy application
aws ecs update-service --cluster food-delivery-cluster --service food-delivery-service --force-new-deployment
```

### Google Cloud Platform

#### Cloud Run Deployment

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/food-delivery-app', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/food-delivery-app']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'food-delivery-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/food-delivery-app'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

#### Deploy to Cloud Run

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Update service
gcloud run deploy food-delivery-app \
  --image gcr.io/PROJECT_ID/food-delivery-app \
  --region us-central1 \
  --platform managed
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  VERCEL_ORG_ID: $VERCEL_ORG_ID
  VERCEL_PROJECT_ID: $VERCEL_PROJECT_ID

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
    - npm run lint
    - npm run type-check

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour

deploy_staging:
  stage: deploy
  script:
    - npm install -g vercel
    - vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
    - vercel build --token=$VERCEL_TOKEN
    - vercel deploy --prebuilt --token=$VERCEL_TOKEN
  environment:
    name: staging
    url: $VERCEL_URL
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - npm install -g vercel
    - vercel pull --yes --environment=production --token=$VERCEL_TOKEN
    - vercel build --prod --token=$VERCEL_TOKEN
    - vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
  environment:
    name: production
    url: $VERCEL_URL
  only:
    - main
```

## Monitoring and Maintenance

### Application Monitoring

#### Health Checks

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check external services
    const checks = await Promise.allSettled([
      checkSupabase(),
      checkStripe(),
      checkGoogleMaps()
    ]);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        supabase: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        stripe: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        googleMaps: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
      }
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

async function checkSupabase() {
  // Implement Supabase health check
}

async function checkStripe() {
  // Implement Stripe health check
}

async function checkGoogleMaps() {
  // Implement Google Maps health check
}
```

#### Performance Monitoring

```typescript
// lib/monitoring.ts
import { NextApiRequest } from 'next';

export function trackApiPerformance(req: NextApiRequest, duration: number) {
  // Log performance metrics
  console.log(`API ${req.url} took ${duration}ms`);
  
  // Send to monitoring service
  if (process.env.MONITORING_ENDPOINT) {
    fetch(process.env.MONITORING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'api_response_time',
        value: duration,
        endpoint: req.url,
        timestamp: new Date().toISOString()
      })
    });
  }
}

export function trackError(error: Error, context?: any) {
  console.error('Application Error:', error, context);
  
  // Send to error tracking service
  if (process.env.ERROR_TRACKING_ENDPOINT) {
    fetch(process.env.ERROR_TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      })
    });
  }
}
```

### Infrastructure Monitoring

#### Log Management

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'food-delivery-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DATABASE_URL="postgresql://user:pass@localhost:5432/food_delivery"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/database/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Keep S3 backups for 90 days
aws s3 ls s3://your-backup-bucket/database/ | while read -r line; do
  createDate=`echo $line|awk {'print $1" "$2'}`
  createDate=`date -d"$createDate" +%s`
  olderThan=`date -d"90 days ago" +%s`
  if [[ $createDate -lt $olderThan ]]; then
    fileName=`echo $line|awk {'print $4'}`
    aws s3 rm s3://your-backup-bucket/database/$fileName
  fi
done
```

### Maintenance Tasks

#### Database Maintenance

```bash
#!/bin/bash
# db_maintenance.sh

# Analyze database statistics
psql $DATABASE_URL -c "ANALYZE;"

# Vacuum database
psql $DATABASE_URL -c "VACUUM;"

# Reindex database
psql $DATABASE_URL -c "REINDEX DATABASE food_delivery;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('food_delivery'));"
```

#### Security Updates

```bash
#!/bin/bash
# security_updates.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit
npm audit fix

# Update Docker images
docker-compose pull
docker system prune -f

# Restart services
sudo systemctl restart nginx
docker-compose up -d
```

## Troubleshooting

### Common Deployment Issues

#### Database Connection Issues

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check database logs
tail -f /var/log/postgresql/postgresql-*.log
```

#### Build Issues

```bash
# Clear build cache
rm -rf .next
rm -rf node_modules
npm install
npm run build

# Check TypeScript errors
npm run type-check

# Check linting issues
npm run lint
```

#### Runtime Issues

```bash
# Check application logs
pm2 logs food-delivery-app

# Check system resources
htop
df -h
free -h

# Check network connectivity
netstat -tulpn | grep :3000
```

### Performance Issues

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('food_delivery'));
```

#### Application Performance

```bash
# Check memory usage
pm2 show food-delivery-app

# Check CPU usage
top -p $(pgrep -f "node.*server.js")

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/health"
```

### Security Issues

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] All user flows working
- [ ] Database connectivity confirmed
- [ ] External services connected
- [ ] Error tracking active
- [ ] Performance monitoring enabled

### Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] User input validation active
- [ ] CORS properly configured

### Monitoring
- [ ] Application logs configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Database monitoring enabled
- [ ] Security monitoring active

---

*Last updated: October 2025*