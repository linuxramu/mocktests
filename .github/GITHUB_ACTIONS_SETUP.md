# GitHub Actions Extension Setup Guide

## 🚀 Quick Setup (VS Code / Kiro)

### Step 1: Install the Extension

1. Open **Extensions** panel (Cmd+Shift+X on Mac, Ctrl+Shift+X on Windows/Linux)
2. Search for: **"GitHub Actions"**
3. Install the extension by **GitHub** (official)

Or install via command:
```bash
code --install-extension github.vscode-github-actions
```

---

### Step 2: Authenticate with GitHub

1. Press **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows/Linux)
2. Type: **"GitHub Actions: Sign in"**
3. Follow the authentication flow
4. Grant permissions to the extension

---

### Step 3: View Your Workflows

Once installed, you'll see a new **GitHub Actions** icon in the sidebar:

**Features:**
- 📊 View all workflow runs
- ✅ See pass/fail status in real-time
- 📝 View logs directly in VS Code
- 🔄 Re-run failed workflows
- 🔔 Get notifications on failures

---

## 📊 Current Workflows in This Project

You have 5 workflows configured:

1. **test.yml** - Run tests on push/PR
2. **deploy-workers.yml** - Deploy Cloudflare Workers
3. **deploy-frontend.yml** - Deploy frontend to Cloudflare Pages
4. **database-migration.yml** - Run database migrations
5. **verify-cloudflare-token.yml** - Verify Cloudflare credentials

---

## 🎯 How to Use

### View Workflow Status
1. Click the **GitHub Actions** icon in sidebar
2. See all recent runs
3. Click any run to view details

### View Logs
1. Click on a workflow run
2. Expand the job
3. Click on any step to see logs

### Re-run Failed Workflows
1. Right-click on a failed run
2. Select **"Re-run workflow"**

### Trigger Manual Workflows
1. Right-click on a workflow
2. Select **"Run workflow"**
3. Choose branch and parameters

---

## 🔔 Enable Notifications

### In VS Code Settings:
1. Open Settings (Cmd+,)
2. Search: **"GitHub Actions"**
3. Enable:
   - ✅ Show notifications on workflow completion
   - ✅ Show notifications on workflow failure

---

## 💡 Pro Tips

### Status Bar Integration
The extension adds workflow status to your status bar:
- ✅ Green checkmark = All workflows passing
- ❌ Red X = Some workflows failing
- 🔄 Spinning = Workflows running

### Keyboard Shortcuts
- **Cmd+Shift+P** → "GitHub Actions: View Workflow Runs"
- **Cmd+Shift+P** → "GitHub Actions: Open Workflow File"

### Filter Workflows
In the GitHub Actions panel:
- Filter by status (success, failure, in progress)
- Filter by branch
- Filter by workflow name

---

## 🐛 Troubleshooting

### Extension Not Showing Workflows?
1. Make sure you're authenticated
2. Refresh the extension (click refresh icon)
3. Check you have internet connection
4. Verify repo has `.github/workflows/` directory

### Can't Authenticate?
1. Try: **"GitHub Actions: Sign out"**
2. Then: **"GitHub Actions: Sign in"** again
3. Make sure you grant all permissions

### Workflows Not Updating?
- Click the **refresh** icon in the GitHub Actions panel
- Or run: **"GitHub Actions: Refresh"** from command palette

---

## 📚 Alternative: GitHub CLI

If you prefer command line:

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# View workflow runs
gh run list

# Watch a specific run
gh run watch

# View logs
gh run view --log

# Re-run failed workflows
gh run rerun <run-id>
```

---

## 🎨 Alternative: Status Badges

Add badges to README.md to see status at a glance:

```markdown
![Tests](https://github.com/linuxramu/mocktests/workflows/test/badge.svg)
![Deploy Workers](https://github.com/linuxramu/mocktests/workflows/deploy-workers/badge.svg)
![Deploy Frontend](https://github.com/linuxramu/mocktests/workflows/deploy-frontend/badge.svg)
```

---

## ✅ You're All Set!

Now you can track all your CI/CD pipelines directly in your editor! 🎉

**Next Steps:**
- Continue to Task 5: AI Question Generation System
- Or explore your workflows in the GitHub Actions panel
