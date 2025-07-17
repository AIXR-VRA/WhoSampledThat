# Deployment to Cloudflare Workers (Static Assets)

This project is configured to automatically deploy to Cloudflare Workers using Static Assets and GitHub Actions.

## Setup Instructions

### 1. Get Your Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read (if using a custom domain)
5. Copy the token

### 2. Configure GitHub Secrets

1. Go to your GitHub repository: `https://github.com/AIXR-VRA/PersonalApps`
2. Navigate to Settings → Secrets and variables → Actions
3. Add this repository secret:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token

### 3. Deploy

Once the secret is configured, any push to the `master` or `main` branch will trigger an automatic deployment.

Your app will be available at: `https://personalapps.<your-subdomain>.workers.dev`

## Manual Deployment

To deploy manually using Wrangler:

```bash
# Install Wrangler globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Workers
wrangler deploy
```

## Configuration

- **wrangler.toml**: Configuration file for Cloudflare Workers
- **src/worker.js**: Simple worker that serves static assets
- **Build output**: `dist` directory (configured in wrangler.toml)
- **SPA routing**: Enabled for React Router support

## Benefits of Workers Static Assets

- Faster cold starts than traditional Workers
- Automatic asset optimization and caching
- Built-in SPA routing support
- No separate Pages project needed
- Tighter integration with Workers ecosystem 