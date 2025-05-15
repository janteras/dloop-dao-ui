# D-Loop UI: Netlify Deployment Guide

This document provides instructions for setting up the D-Loop UI on Netlify with proper environment variables and configuration.

## Environment Variables

The following environment variables must be set in your Netlify deployment:

| Variable Name | Description | Required |
|--------------|-------------|----------|
| `VITE_INFURA_API_KEY` | Your Infura API key for Ethereum network access | Yes |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your WalletConnect project ID | Yes |

## Setting Up Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your D-Loop UI site
3. Navigate to **Site settings > Build & deploy > Environment > Environment variables**
4. Add each of the required variables with their values
5. Save the changes and trigger a new deployment

## Troubleshooting Blockchain Connection Issues

If you encounter the error: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`, it usually means:

1. Your Infura API key is invalid or not properly configured
2. API requests are being redirected to HTML error pages
3. CORS issues may be preventing proper API connections

### Solutions:

1. Verify your Infura API key is valid and has access to Sepolia testnet
2. Make sure the `VITE_INFURA_API_KEY` environment variable is correctly set in Netlify
3. Check the "Access control" settings in your Infura project dashboard
4. Ensure your Netlify site is using the netlify.toml configuration with the proper CORS headers

## Custom Domains and API Access

If you're using a custom domain, make sure:

1. The domain is properly configured in your Infura project settings
2. SSL/TLS is correctly set up for your custom domain
3. Your Netlify configuration has proper CORS and security headers

For more details on Netlify deployment options, see the [official Netlify documentation](https://docs.netlify.com/configure-builds/overview/).
