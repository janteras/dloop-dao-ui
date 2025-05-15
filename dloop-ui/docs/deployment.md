# D-LOOP UI Deployment Guide

This document provides comprehensive instructions for deploying the D-LOOP UI application to various environments.

## Prerequisites

Before deploying the D-LOOP UI, ensure you have the following:

- Node.js 18.x or higher
- npm 9.x or higher
- Access to the necessary API keys:
  - Infura API Key (for Ethereum network access)
  - WalletConnect Project ID (for wallet connection)
- Git (for version control)
- Access to the deployment platform of your choice

## Environment Configuration

The D-LOOP UI requires specific environment variables to function properly:

| Variable | Description | Required |
|----------|-------------|----------|
| `INFURA_API_KEY` | API key for Infura Ethereum node service | Yes |
| `WALLETCONNECT_PROJECT_ID` | Project ID for WalletConnect integration | Yes |
| `NODE_ENV` | Environment setting (`development`, `production`, or `test`) | Yes |
| `PORT` | Port to run the server on (defaults to 5000) | No |

### Setting Up Environment Variables

For local development and testing, create a `.env` file in the project root:

```
INFURA_API_KEY=your_infura_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NODE_ENV=development
```

For production deployments, configure these variables according to your hosting platform's requirements.

## Build Process

### Production Build

To create a production build:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. The build output will be generated in the `dist` directory.

### Analyzing the Bundle

To analyze the build bundle size:

```bash
npm run analyze
```

This will generate a visual report of the bundle size, helping you identify large dependencies.

## Deployment Options

### Option 1: Static Site Hosting

The D-LOOP UI can be deployed as a static site to platforms like Netlify, Vercel, or GitHub Pages.

#### Vercel Deployment

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the application:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

#### Netlify Deployment

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy the application:
   ```bash
   netlify deploy --dir=dist
   ```

4. For production deployment:
   ```bash
   netlify deploy --dir=dist --prod
   ```

### Option 2: Docker Deployment

The D-LOOP UI can be containerized for deployment to container orchestration platforms.

#### Building the Docker Image

1. Build the Docker image:
   ```bash
   docker build -t dloop-ui:latest .
   ```

2. Run the container locally:
   ```bash
   docker run -p 5000:5000 -e INFURA_API_KEY=your_key -e WALLETCONNECT_PROJECT_ID=your_id dloop-ui:latest
   ```

#### Deploying to Container Platforms

##### AWS Elastic Container Service (ECS)

1. Push the Docker image to Amazon ECR:
   ```bash
   aws ecr get-login-password --region region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.region.amazonaws.com
   docker tag dloop-ui:latest your-account-id.dkr.ecr.region.amazonaws.com/dloop-ui:latest
   docker push your-account-id.dkr.ecr.region.amazonaws.com/dloop-ui:latest
   ```

2. Create an ECS task definition and service using the AWS Console or CLI.

##### Google Cloud Run

1. Push the Docker image to Google Container Registry:
   ```bash
   gcloud auth configure-docker
   docker tag dloop-ui:latest gcr.io/your-project-id/dloop-ui:latest
   docker push gcr.io/your-project-id/dloop-ui:latest
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy dloop-ui --image gcr.io/your-project-id/dloop-ui:latest --platform managed
   ```

### Option 3: Traditional Server Deployment

The D-LOOP UI can be deployed to a traditional server environment.

#### Setting up on a VPS (e.g., DigitalOcean, AWS EC2)

1. SSH into your server:
   ```bash
   ssh user@your-server-ip
   ```

2. Install Node.js and npm:
   ```bash
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/dloop-ui.git
   cd dloop-ui
   ```

4. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

5. Set up environment variables:
   ```bash
   echo "INFURA_API_KEY=your_key" >> .env
   echo "WALLETCONNECT_PROJECT_ID=your_id" >> .env
   echo "NODE_ENV=production" >> .env
   ```

6. Install PM2 for process management:
   ```bash
   npm install -g pm2
   ```

7. Start the application:
   ```bash
   pm2 start npm --name "dloop-ui" -- start
   ```

8. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Pipeline

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy D-LOOP UI

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        INFURA_API_KEY: ${{ secrets.INFURA_API_KEY }}
        WALLETCONNECT_PROJECT_ID: ${{ secrets.WALLETCONNECT_PROJECT_ID }}
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

### GitLab CI Pipeline

Create a `.gitlab-ci.yml` file:

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  image: node:18
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
```

## Post-Deployment Verification

After deploying the D-LOOP UI, perform these checks to ensure everything is working correctly:

1. **Connectivity Test**: Verify that the application can connect to the Ethereum network via Infura.
2. **Wallet Connection**: Test the wallet connection functionality.
3. **Contract Interactions**: Verify that the application can interact with the deployed smart contracts.
4. **Mobile Responsiveness**: Check the application on various device sizes.
5. **Performance Metrics**: Measure page load times and other performance metrics.

## Monitoring and Logging

### Application Monitoring

Set up monitoring for the D-LOOP UI using services like:

- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay and frontend monitoring
- [Google Analytics](https://analytics.google.com/) for user analytics

### Server Monitoring (if applicable)

For server deployments, set up:

- [Prometheus](https://prometheus.io/) for metrics collection
- [Grafana](https://grafana.com/) for metrics visualization
- [ELK Stack](https://www.elastic.co/elastic-stack) for log aggregation and analysis

## Troubleshooting Common Issues

### Issue: Application Cannot Connect to Ethereum Network

**Possible Causes**:
- Invalid or expired Infura API key
- Network connectivity issues
- Incorrect network configuration

**Solutions**:
1. Verify your Infura API key is valid and has access to the required networks
2. Check network connectivity from the deployment environment to Infura
3. Ensure the correct network is configured (Sepolia testnet)

### Issue: Wallet Connection Fails

**Possible Causes**:
- Invalid or expired WalletConnect Project ID
- Incompatible wallet provider
- CORS issues

**Solutions**:
1. Verify your WalletConnect Project ID is valid
2. Test with different wallet providers
3. Check CORS configuration on your hosting platform

### Issue: Static Assets Not Loading

**Possible Causes**:
- Incorrect base path configuration
- Missing cache headers
- Build process issues

**Solutions**:
1. Verify the base path configuration in your build settings
2. Check server cache headers for static assets
3. Rebuild and redeploy the application

## Security Considerations

- Always use environment variables for sensitive keys
- Implement Content Security Policy (CSP) headers
- Keep dependencies updated to patch security vulnerabilities
- Use HTTPS for all production deployments
- Implement rate limiting for API endpoints

## Performance Optimization

- Enable gzip/Brotli compression on the server
- Configure proper cache headers for static assets
- Use a CDN for static asset delivery
- Implement code splitting for reduced bundle sizes
- Optimize images and other media assets

## Backup and Disaster Recovery

- Regularly backup configuration files and environment variables
- Document the deployment process thoroughly
- Maintain versioned builds for quick rollback
- Test the recovery process periodically

## Compliance and Legal Considerations

- Ensure the application has appropriate privacy policies
- Comply with relevant regulations (GDPR, CCPA, etc.)
- Document data handling practices
- Implement necessary cookie consent mechanisms