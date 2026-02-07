# Cloudflare API Token Setup

## Required Permissions for GitHub Actions Deployment

Your Cloudflare API Token needs the following permissions:

### Account Permissions
- **Account Settings** → Read

### Zone Permissions  
- **Cloudflare Pages** → Edit

### User Permissions
- **User Details** → Read

## How to Create/Update the Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" or edit your existing token
3. Add the permissions listed above
4. Copy the token
5. Add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

## GitHub Secrets Required

Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN` - Your API token with the permissions above
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Finding Your Account ID

1. Go to https://dash.cloudflare.com
2. Select any site
3. Look in the right sidebar under "Account ID"
4. Or find it in the URL: `dash.cloudflare.com/<account-id>/...`

## Testing Locally

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
npx wrangler pages deploy packages/frontend/dist --project-name=eamcet-platform
```
