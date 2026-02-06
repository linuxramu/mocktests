# 🚀 Quick Start Guide

## Start the Authentication Worker

### Option 1: Using the script (Easiest)

```bash
./start.sh
```

### Option 2: Using npm

```bash
npm run dev
```

### Option 3: From project root

```bash
cd packages/auth-worker && npm run dev
```

---

## ✅ Verify It's Running

Open another terminal and test:

```bash
curl http://localhost:8787/auth/verify
```

You should see an error about missing token (that's good! It means the auth worker is running).

---

## 🎨 Test with UI

1. **Make sure the worker is running** (see above)
2. **Open the test UI**: Double-click `test-ui.html` or run:
   ```bash
   open test-ui.html
   ```
3. **Start testing!** Register, login, and test all features

---

## ⚠️ Troubleshooting

### "Failed to fetch" error in UI

- **Cause**: Worker is not running or wrong worker is running
- **Fix**:
  1. Stop any running workers (Ctrl+C in terminal)
  2. Make sure you're in `packages/auth-worker` directory
  3. Run `npm run dev`
  4. Verify with: `curl http://localhost:8787/auth/verify`

### Wrong worker is running

- **Symptom**: You see "AI Worker" or other worker message
- **Fix**:
  1. Kill the process: `lsof -i :8787` then `kill -9 <PID>`
  2. Navigate to auth-worker: `cd packages/auth-worker`
  3. Start: `npm run dev`

### Port 8787 already in use

- **Fix**: Kill the existing process:
  ```bash
  lsof -i :8787
  kill -9 <PID>
  ```

---

## 📝 What to Test

1. ✅ Register a new user
2. ✅ Login with credentials
3. ✅ Verify token works
4. ✅ Get user profile
5. ✅ Update profile information
6. ✅ Refresh access token
7. ✅ Logout
8. ✅ Test error cases (wrong password, invalid email, etc.)

---

## 🎯 Next Steps

After testing, continue to:

- Task 5: AI Question Generation System
- Task 6: Test Engine Core Implementation
