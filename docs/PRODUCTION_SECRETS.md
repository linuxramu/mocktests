# Production Secrets Management

This document outlines how to manage secrets and environment variables for the EAMCET Mock Test Platform in production.

## Overview

Secrets are sensitive configuration values that should never be committed to version control. The platform uses Cloudflare Workers Secrets for secure storage and GitHub Secrets for CI/CD pipelines.

## Required Secrets

### 1. Cloudflare Workers Secrets

These secrets must be set for each worker in both development and production environments.

#### Auth Worker

```bash
# Production
wrangler secret put JWT_SECRET --env production
# Enter a strong random string (minimum 32 characters)

# Development
wrangler secret put JWT_SECRET --env development
# Can use a simpler value for development
```

**JWT_SECRET**: Used for signing and verifying JWT tokens

- **Format**: Random alphanumeric string
- **Length**: Minimum 32 characters
- **Generation**: `openssl rand -base64 32`

#### AI Worker

```bash
# Production
wrangler secret put AI_API_KEY --env production
# Enter your AI service API key

# Development
wrangler secret put AI_API_KEY --env development
# Can use test API key for development
```

**AI_API_KEY**: API key for external AI question generation service

- **Format**: Provided by AI service provider
- **Source**: Obtain from your AI service dashboard

### 2. GitHub Secrets

These secrets are required for GitHub Actions CI/CD pipelines.

Navigate to: `Repository Settings > Secrets and variables > Actions > New repository secret`

#### Required GitHub Secrets

1. **CLOUDFLARE_API_TOKEN**
   - **Description**: API token for Cloudflare authentication
   - **How to get**:
     - Go to Cloudflare Dashboard > My Profile > API Tokens
     - Create token with permissions:
       - Account:Cloudflare Workers:Edit
       - Account:Cloudflare Pages:Edit
       - Account:D1:Edit
       - Zone:Zone Settings:Edit
   - **Format**: Cloudflare API token string

2. **CLOUDFLARE_ACCOUNT_ID**
   - **Description**: Your Cloudflare account ID
   - **How to get**:
     - Go to Cloudflare Dashboard
     - Select any domain
     - Account ID is shown in the right sidebar
   - **Format**: 32-character hexadecimal string

3. **CLOUDFLARE_EMAIL**
   - **Description**: Email associated with your Cloudflare account
   - **Format**: email@example.com

4. **JWT_SECRET**
   - **Description**: Secret for JWT token signing (same as worker secret)
   - **Format**: Random alphanumeric string (32+ characters)
   - **Generation**: `openssl rand -base64 32`

5. **AI_API_KEY** (Optional)
   - **Description**: API key for AI service (if needed in CI/CD)
   - **Format**: Provided by AI service

## Setting Secrets

### Using Wrangler CLI

```bash
# Set a secret for a specific worker
cd packages/auth-worker
wrangler secret put SECRET_NAME --env production

# List all secrets (names only, values are hidden)
wrangler secret list --env production

# Delete a secret
wrangler secret delete SECRET_NAME --env production
```

### Using GitHub UI

1. Go to repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Enter name and value
5. Click "Add secret"

### Using GitHub CLI

```bash
# Set a secret
gh secret set SECRET_NAME

# List secrets
gh secret list

# Delete a secret
gh secret delete SECRET_NAME
```

## Secret Rotation

Secrets should be rotated periodically for security. Follow this process:

### 1. JWT_SECRET Rotation

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Set new secret in all environments
wrangler secret put JWT_SECRET --env production
# Enter NEW_SECRET

wrangler secret put JWT_SECRET --env development
# Enter NEW_SECRET

# Update GitHub secret
gh secret set JWT_SECRET
# Enter NEW_SECRET
```

**Important**: After rotating JWT_SECRET, all existing user sessions will be invalidated and users will need to log in again.

### 2. AI_API_KEY Rotation

```bash
# Get new API key from AI service provider
# Set new key in workers
wrangler secret put AI_API_KEY --env production
# Enter new key

# Update GitHub secret if needed
gh secret set AI_API_KEY
# Enter new key
```

### 3. Cloudflare API Token Rotation

```bash
# Create new API token in Cloudflare Dashboard
# Update GitHub secret
gh secret set CLOUDFLARE_API_TOKEN
# Enter new token

# Revoke old token in Cloudflare Dashboard
```

## Security Best Practices

### 1. Never Commit Secrets

- Add `.env` files to `.gitignore`
- Use `.env.example` for documentation only
- Never hardcode secrets in source code

### 2. Use Different Secrets Per Environment

- Production secrets should be different from development
- Use strong, randomly generated secrets in production
- Development secrets can be simpler but still secure

### 3. Limit Secret Access

- Only grant secret access to necessary team members
- Use GitHub's environment protection rules
- Regularly audit who has access to secrets

### 4. Monitor Secret Usage

- Enable Cloudflare audit logs
- Monitor GitHub Actions logs for secret usage
- Set up alerts for unauthorized access attempts

### 5. Rotate Secrets Regularly

- Rotate JWT_SECRET every 90 days
- Rotate API keys when team members leave
- Rotate Cloudflare tokens annually

## Troubleshooting

### Secret Not Found Error

```
Error: Secret JWT_SECRET not found
```

**Solution**: Set the secret using `wrangler secret put JWT_SECRET --env production`

### Invalid API Token

```
Error: Authentication error
```

**Solution**:

1. Verify token has correct permissions
2. Check token hasn't expired
3. Regenerate token if necessary

### GitHub Actions Failing

```
Error: CLOUDFLARE_API_TOKEN not set
```

**Solution**: Verify secret is set in GitHub repository settings

## Emergency Procedures

### If Secrets Are Compromised

1. **Immediately rotate all affected secrets**
2. **Revoke compromised API tokens**
3. **Review access logs for unauthorized usage**
4. **Notify team members**
5. **Update incident response documentation**

### If Deployment Fails Due to Secrets

1. **Verify all required secrets are set**
2. **Check secret names match exactly**
3. **Ensure secrets are set for correct environment**
4. **Test locally with `wrangler dev`**

## Verification Checklist

Before deploying to production, verify:

- [ ] All worker secrets are set in production environment
- [ ] All GitHub secrets are configured
- [ ] Secrets are different between dev and prod
- [ ] JWT_SECRET is strong and random (32+ characters)
- [ ] API tokens have correct permissions
- [ ] Team members have appropriate access levels
- [ ] Backup of secret names (not values) is documented
- [ ] Secret rotation schedule is established

## Additional Resources

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
