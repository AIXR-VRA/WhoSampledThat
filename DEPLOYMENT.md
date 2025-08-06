# Deployment to Cloudflare Workers (Maintainers Only)

> ⚠️ **Note**: This documentation is for project maintainers only. Contributors don't need deployment access.

This project is configured to automatically deploy to Cloudflare Workers using Static Assets and GitHub Actions. The deployment is secured to only work from the original repository, not from forks.

## Setup Instructions

### 1. Get Your Cloudflare Credentials

#### API Token
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read for whosampledthat.com
5. Copy the token

#### Account ID
1. Go to your [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Copy your "Account ID" from the right sidebar

### 2. Configure GitHub Secrets

1. Go to your GitHub repository: `https://github.com/AIXR-VRA/WhoSampledThat`
2. Navigate to Settings → Secrets and variables → Actions
3. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

### 3. Deploy

Once the secrets are configured, any push to the `master` or `main` branch **from the original repository** will trigger an automatic deployment.

**Security Note**: The GitHub Actions workflow includes a repository check (`github.repository == 'AIXR-VRA/WhoSampledThat'`) to prevent deployments from forks.

Your app will be available at: `https://whosampledthat.com`

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

- **wrangler.toml**: Configuration for Cloudflare Workers with custom domain routing
- **src/worker.js**: Simple worker that serves static assets
- **Build output**: `dist` directory (configured in wrangler.toml)
- **SPA routing**: Enabled for React Router support
- **Custom domain**: Configured to serve from whosampledthat.com

## Security for Open Source

- **Repository Check**: Deployment only works from `AIXR-VRA/WhoSampledThat`, not from forks
- **Secret Protection**: GitHub secrets are only available to the original repository
- **PR Testing**: Pull requests from forks run tests but cannot deploy
- **Safe Contributions**: Contributors can develop and test locally without deployment access

## Benefits of Workers Static Assets

- Faster cold starts than traditional Workers
- Automatic asset optimization and caching
- Built-in SPA routing support
- Custom domain integration
- Tighter integration with Workers ecosystem 