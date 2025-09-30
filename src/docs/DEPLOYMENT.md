# Deployment & Operations Guide

## Overview

This guide covers deploying the Global Off-Grid Payment Protocol from development to production, including infrastructure setup, gateway deployment, monitoring, and operational procedures.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Development Deployment](#development-deployment)
3. [Staging Environment](#staging-environment)
4. [Production Deployment](#production-deployment)
5. [Gateway Setup](#gateway-setup)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Backup & Recovery](#backup--recovery)
8. [Operational Procedures](#operational-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Prerequisites

```bash
# Required software
node >= 18.0.0
pnpm >= 8.0.0
docker >= 24.0.0
docker-compose >= 2.0.0

# For mobile development
expo-cli >= 6.0.0
android-sdk (for Android builds)
xcode >= 14.0 (for iOS builds, macOS only)

# Cloud CLI tools (choose your provider)
aws-cli >= 2.0  # If using AWS
gcloud >= 400   # If using GCP
```

### Repository Setup

```bash
# Clone repository
git clone https://github.com/offgrid-protocol/payment-network.git
cd payment-network

# Install root dependencies
pnpm install

# Setup environment files
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

### Environment Variables

**Mobile App** (`.env.mobile`):
```bash
# App configuration
APP_NAME=OffGridWallet
APP_ENV=development|staging|production
APP_VERSION=1.0.0

# API endpoints
API_URL=https://api.offgrid.network
GATEWAY_WS_URL=wss://gateway.offgrid.network

# Feature flags
ENABLE_BLE=true
ENABLE_NFC=true
ENABLE_LORA=false  # Development: simulated
ENABLE_SMS=false   # Development: simulated

# Security
KEY_DERIVATION_ROUNDS=10000
BIOMETRIC_ENABLED=true
SOCIAL_RECOVERY_ENABLED=true

# Analytics
SENTRY_DSN=https://xxx@sentry.io/yyy
POSTHOG_API_KEY=phc_xxxxx
```

**Backend** (`.env.backend`):
```bash
# Server
NODE_ENV=development|staging|production
PORT=3000
LOG_LEVEL=info|debug

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/offgrid
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_MAX_RETRIES=3

# Crypto
JWT_SECRET=your-256-bit-secret
ENCRYPTION_KEY=your-encryption-key

# External services
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890

# LoRa gateway (if applicable)
LORA_NETWORK_SERVER=https://lora.network
LORA_APP_KEY=xxxxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/zzz
PROMETHEUS_PORT=9090
```

**Web Admin** (`.env.admin`):
```bash
# Next.js
NEXT_PUBLIC_API_URL=https://api.offgrid.network
NEXT_PUBLIC_WS_URL=wss://gateway.offgrid.network

# Auth
NEXTAUTH_URL=https://admin.offgrid.network
NEXTAUTH_SECRET=your-nextauth-secret

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
```

---

## Development Deployment

### Local Development

**1. Start PostgreSQL & Redis**:
```bash
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose ps
```

**2. Run Database Migrations**:
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

**3. Seed Development Data**:
```bash
pnpm run seed
# Creates:
# - 10 test devices
# - 4 gateway nodes
# - 100 sample transactions
# - Test conflicts
```

**4. Start Backend Services**:
```bash
# Terminal 1: API server
cd backend
pnpm dev

# Terminal 2: Reconciliation worker
pnpm run worker

# Terminal 3: WebSocket gateway
pnpm run gateway
```

**5. Start Web Admin**:
```bash
cd admin
pnpm dev
# Access at http://localhost:3000
```

**6. Start Mobile App** (Expo):
```bash
cd mobile
pnpm start

# Scan QR code with Expo Go app
# Or press 'a' for Android emulator
# Or press 'i' for iOS simulator
```

### Local Testing

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests (requires services running)
pnpm test:e2e

# Load testing
pnpm test:load
```

---

## Staging Environment

### Infrastructure Setup (AWS Example)

**1. VPC and Networking**:
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24  # Public
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24  # Private

# Internet gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxx --gateway-id igw-xxx
```

**2. RDS PostgreSQL**:
```bash
aws rds create-db-instance \
  --db-instance-identifier offgrid-staging \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name offgrid-subnet-group \
  --backup-retention-period 7 \
  --multi-az false
```

**3. ElastiCache Redis**:
```bash
aws elasticache create-replication-group \
  --replication-group-id offgrid-staging \
  --replication-group-description "Staging Redis" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --cache-subnet-group-name offgrid-subnet-group
```

**4. ECS Cluster**:
```bash
aws ecs create-cluster --cluster-name offgrid-staging
```

### Docker Build & Deploy

**1. Build Images**:
```bash
# Backend API
docker build -t offgrid/backend:staging -f backend/Dockerfile .

# Reconciliation worker
docker build -t offgrid/worker:staging -f backend/Dockerfile.worker .

# Gateway WebSocket
docker build -t offgrid/gateway:staging -f backend/Dockerfile.gateway .

# Admin console
docker build -t offgrid/admin:staging -f admin/Dockerfile .
```

**2. Push to ECR**:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag offgrid/backend:staging <account>.dkr.ecr.us-east-1.amazonaws.com/offgrid-backend:staging
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/offgrid-backend:staging

# Repeat for worker, gateway, admin
```

**3. Deploy to ECS**:
```bash
aws ecs create-service \
  --cluster offgrid-staging \
  --service-name backend-api \
  --task-definition offgrid-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000"
```

### Database Migration

```bash
# Run migrations on staging
DATABASE_URL=<staging-db-url> pnpm prisma migrate deploy

# Verify
DATABASE_URL=<staging-db-url> pnpm prisma studio
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Security audit completed
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Disaster recovery plan documented
- [ ] Monitoring and alerting configured
- [ ] SSL certificates issued and installed
- [ ] Environment variables secured (AWS Secrets Manager / GCP Secret Manager)
- [ ] Database backups tested
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Compliance requirements met (GDPR, etc.)
- [ ] Incident response plan ready
- [ ] On-call rotation established

### Production Infrastructure

**High Availability Architecture**:

```
                    ┌─────────────────┐
                    │   CloudFront    │ (CDN)
                    │   (Static Assets)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │ (ALB)
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
       ┌────▼────┐      ┌───▼────┐      ┌───▼────┐
       │ API (1) │      │ API (2)│      │ API (3)│
       │  ECS    │      │  ECS   │      │  ECS   │
       └────┬────┘      └───┬────┘      └───┬────┘
            │               │                │
            └───────┬───────┴────────────────┘
                    │
            ┌───────▼────────┐
            │   RDS Primary  │
            │  (Multi-AZ)    │
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │  Read Replica  │
            │  (us-west-2)   │
            └────────────────┘
```

**Scaling Configuration**:

```yaml
# Auto-scaling policy
resources:
  api:
    min: 3
    max: 20
    targetCPU: 70%
    targetMemory: 80%
  
  worker:
    min: 2
    max: 10
    targetQueueDepth: 100
  
  gateway:
    min: 2
    max: 15
    targetConnections: 1000
```

### Deployment Pipeline

**GitHub Actions** (`.github/workflows/deploy-production.yml`):

```yaml
name: Deploy Production

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm run lint
      - run: pnpm run security-scan
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: |
          docker build -t offgrid/backend:${{ github.ref_name }} .
          
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login ...
          docker push offgrid/backend:${{ github.ref_name }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster offgrid-production \
            --service backend-api \
            --force-new-deployment
          
      - name: Wait for stability
        run: |
          aws ecs wait services-stable \
            --cluster offgrid-production \
            --services backend-api
  
  smoke-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        run: |
          curl -f https://api.offgrid.network/health
          
      - name: Test critical flows
        run: |
          pnpm run test:smoke
```

### Blue-Green Deployment

```bash
# Create new "green" environment
aws ecs create-service \
  --cluster offgrid-production \
  --service-name backend-api-green \
  --task-definition offgrid-backend:new \
  --desired-count 3

# Wait for green to be healthy
aws ecs wait services-stable --cluster offgrid-production --services backend-api-green

# Switch traffic to green
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --default-actions Type=forward,TargetGroupArn=arn:...:targetgroup/green

# Monitor for 10 minutes
sleep 600

# If successful, scale down blue
aws ecs update-service \
  --cluster offgrid-production \
  --service backend-api-blue \
  --desired-count 0

# If issues, rollback
aws elbv2 modify-listener \
  --listener-arn ... \
  --default-actions Type=forward,TargetGroupArn=arn:...:targetgroup/blue
```

---

## Gateway Setup

### Hardware Requirements

**Urban Gateway**:
- Raspberry Pi 4 (4GB RAM) or equivalent
- WiFi/Ethernet connectivity
- Optional: Bluetooth dongle for BLE mesh
- Power: 5V 3A (15W)
- Storage: 32GB microSD

**Rural LoRa Gateway**:
- Raspberry Pi 3/4
- RAK2245 LoRa concentrator hat
- GPS module (for timing)
- Solar panel (20W) + battery (12V 10Ah)
- 4G/LTE modem for backhaul
- Outdoor enclosure (IP65 rated)

### Software Installation

**1. Base System**:
```bash
# Flash Raspberry Pi OS Lite
# SSH into device

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  docker.io \
  docker-compose \
  git \
  vim \
  htop
```

**2. Gateway Software**:
```bash
# Clone gateway repository
git clone https://github.com/offgrid-protocol/gateway.git
cd gateway

# Configure
cp config.example.yml config.yml
vim config.yml
```

**Gateway Configuration** (`config.yml`):
```yaml
gateway:
  id: gw_rural_01
  location:
    lat: 40.7128
    lon: -74.0060
    name: "Rural District A"
  type: lora  # lora | mesh | sms
  
network:
  api_url: https://api.offgrid.network
  ws_url: wss://gateway.offgrid.network
  reconnect_interval: 5000
  
lora:
  frequency: 915  # MHz (US), 868 (EU)
  spreading_factor: 7
  bandwidth: 125  # kHz
  tx_power: 14    # dBm
  
storage:
  max_snapshots: 1000
  retention_days: 90
  
security:
  private_key_path: /etc/offgrid/gateway.key
  certificate_path: /etc/offgrid/gateway.crt
```

**3. Start Gateway**:
```bash
# Generate gateway keypair
./scripts/generate-keys.sh

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify connection
curl http://localhost:8080/health
```

**4. Register with Network**:
```bash
# Register gateway with coordinator
curl -X POST https://api.offgrid.network/v1/gateways \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gatewayId": "gw_rural_01",
    "publicKey": "<gateway-public-key>",
    "location": {
      "lat": 40.7128,
      "lon": -74.0060,
      "name": "Rural District A"
    },
    "type": "lora"
  }'
```

### Gateway Monitoring

```bash
# Check gateway status
./scripts/status.sh

# View metrics
curl http://localhost:9090/metrics

# Test LoRa connectivity (if applicable)
./scripts/test-lora.sh
```

---

## Monitoring & Alerting

### Metrics Collection

**Prometheus** (`prometheus.yml`):
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-server'
    static_configs:
      - targets: ['api-1:3000', 'api-2:3000', 'api-3:3000']
  
  - job_name: 'gateways'
    static_configs:
      - targets: ['gateway-1:9090', 'gateway-2:9090']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Key Metrics

**Application Metrics**:
- `transactions_total` (counter): Total transactions processed
- `transactions_pending` (gauge): Pending reconciliations
- `conflicts_total` (counter): Total conflicts detected
- `conflicts_resolved` (counter): Auto-resolved conflicts
- `gateway_health` (gauge): Gateway health score (0-100)
- `merkle_sync_duration` (histogram): Time to reconcile
- `api_request_duration` (histogram): API latency

**System Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database connection pool
- Redis memory usage

### Alerting Rules

**Prometheus Alerts** (`alerts.yml`):
```yaml
groups:
  - name: critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      - alert: GatewayOffline
        expr: gateway_health < 50
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Gateway {{ $labels.gateway_id }} is unhealthy"
      
      - alert: ConflictBacklog
        expr: conflicts_pending > 100
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High conflict backlog"
          description: "{{ $value }} conflicts awaiting resolution"
      
      - alert: DatabaseHighLoad
        expr: rate(pg_stat_database_xact_commit[5m]) > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Database under high load"
```

### Grafana Dashboards

**System Overview Dashboard**:
- Active devices (last 24h)
- Transactions per second
- Network health
- Gateway status map
- Conflict resolution rate

**Gateway Dashboard**:
- Per-gateway health
- Transactions processed
- Sync latency
- Error rates
- Connection status

**Transaction Dashboard**:
- Transaction volume (hourly/daily)
- Success vs failure rate
- Average confirmation time
- Transport method distribution
- Geographic heatmap

---

## Backup & Recovery

### Database Backups

**Automated Backups**:
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/postgres

pg_dump -h $DB_HOST -U $DB_USER -d offgrid | \
  gzip > $BACKUP_DIR/offgrid_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/offgrid_$DATE.sql.gz \
  s3://offgrid-backups/postgres/

# Retain last 30 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

**Restore Procedure**:
```bash
# Download backup
aws s3 cp s3://offgrid-backups/postgres/offgrid_20240115.sql.gz .

# Restore
gunzip -c offgrid_20240115.sql.gz | \
  psql -h $DB_HOST -U $DB_USER -d offgrid
```

### Gateway Snapshot Backups

```bash
# Backup gateway snapshots
./scripts/backup-snapshots.sh

# Restores from S3 automatically on gateway restart
```

### Disaster Recovery

**RTO** (Recovery Time Objective): 15 minutes
**RPO** (Recovery Point Objective): 5 minutes

**DR Procedure**:
1. Detect outage (monitoring alerts)
2. Assess scope (regional vs global)
3. Failover to secondary region
4. Restore from latest backup
5. Verify data integrity
6. Resume operations
7. Post-mortem analysis

---

## Operational Procedures

### Daily Operations

**Morning Checklist**:
- [ ] Review overnight alerts
- [ ] Check gateway health
- [ ] Review conflict resolution queue
- [ ] Check database backup status
- [ ] Review error logs

**Weekly Tasks**:
- [ ] Review capacity metrics
- [ ] Check for security updates
- [ ] Rotate access logs
- [ ] Test backup restoration
- [ ] Review incident reports

### Scaling Procedures

**Scale Up API Servers**:
```bash
aws ecs update-service \
  --cluster offgrid-production \
  --service backend-api \
  --desired-count 5  # Increase from 3
```

**Scale Database**:
```bash
aws rds modify-db-instance \
  --db-instance-identifier offgrid-production \
  --db-instance-class db.r5.xlarge \
  --apply-immediately
```

### Incident Response

**Severity Levels**:
- **P0** (Critical): Service down, data loss, security breach
- **P1** (High): Major feature broken, high error rate
- **P2** (Medium): Minor feature broken, performance degraded
- **P3** (Low): Cosmetic issue, enhancement request

**P0 Response**:
1. Page on-call engineer immediately
2. Create incident war room (Slack/Discord)
3. Assemble response team
4. Communicate status to stakeholders every 15min
5. Implement fix or rollback
6. Verify resolution
7. Write post-mortem within 48h

---

## Troubleshooting

### Common Issues

**Issue: High Conflict Rate**

Symptoms:
- Conflicts queue growing
- Auto-resolution failing

Diagnosis:
```bash
# Check conflict types
psql -d offgrid -c "
  SELECT conflict_type, COUNT(*) 
  FROM conflicts 
  WHERE status = 'pending' 
  GROUP BY conflict_type
"

# Check affected devices
psql -d offgrid -c "
  SELECT device_a, device_b, COUNT(*) 
  FROM conflicts 
  GROUP BY device_a, device_b 
  ORDER BY COUNT(*) DESC 
  LIMIT 10
"
```

Resolution:
- Increase reconciliation worker count
- Check gateway connectivity
- Review timestamp synchronization
- Escalate complex conflicts manually

**Issue: Gateway Offline**

Symptoms:
- No heartbeat from gateway
- Devices can't sync

Diagnosis:
```bash
# SSH to gateway
ssh pi@gateway.local

# Check services
docker-compose ps

# Check logs
docker-compose logs gateway
```

Resolution:
- Restart gateway service
- Check network connectivity
- Verify API credentials
- Check LoRa hardware (if applicable)

**Issue: Slow Reconciliation**

Symptoms:
- Merkle sync taking > 30 seconds
- Pending queue growing

Diagnosis:
```bash
# Check database performance
psql -d offgrid -c "
  SELECT * FROM pg_stat_activity 
  WHERE state = 'active'
"

# Check Merkle tree size
psql -d offgrid -c "
  SELECT device_id, COUNT(*) as tx_count 
  FROM transactions 
  GROUP BY device_id 
  ORDER BY tx_count DESC 
  LIMIT 10
"
```

Resolution:
- Add database indexes
- Increase worker parallelism
- Partition large Merkle trees
- Archive old transactions

---

## Maintenance Windows

**Scheduled Maintenance**: Every Sunday 02:00-04:00 UTC

**Procedure**:
1. Announce maintenance 72h in advance
2. Scale up redundancy before window
3. Perform rolling updates (zero downtime)
4. Run database maintenance
5. Test critical paths
6. Monitor for 2h post-maintenance

---

**For production support, contact: ops@offgrid.network**