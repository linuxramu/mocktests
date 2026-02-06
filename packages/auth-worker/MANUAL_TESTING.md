# Manual Testing Guide - Authentication Worker

## Prerequisites

**Start the worker**:

```bash
cd packages/auth-worker
npm run dev
```

The worker will start at `http://localhost:8787`

---

## 🎨 Option 1: Test with UI (Easiest!)

1. **Start the worker** (see above)

2. **Open the test UI** in your browser:
   ```bash
   open test-ui.html
   # or just double-click the file
   ```

3. **Test all features** with the visual interface:
   - Register a new user
   - Login with credentials
   - Verify tokens
   - Get and update profile
   - Refresh tokens
   - Logout

The UI automatically stores tokens and shows all responses in a beautiful interface!

---

## 🤖 Option 2: Automated Script

Run the automated test script:

```bash
./test-api.sh
```

This will test all endpoints automatically (requires `jq` - install with `brew install jq`).

---

## 💻 Option 3: Manual cURL Commands

---

## Manual Testing (Step by Step)

### 1. Register a New User

```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }' | jq '.'
```

**Expected Response:**

```json
{
  "user": {
    "id": "uuid-here",
    "email": "student@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "profileData": {}
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Save the accessToken for next steps!**

---

### 2. Login with Existing User

```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123"
  }' | jq '.'
```

---

### 3. Verify Token

Replace `YOUR_ACCESS_TOKEN` with the token from step 1 or 2:

```bash
curl -X GET http://localhost:8787/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq '.'
```

**Expected Response:**

```json
{
  "valid": true,
  "user": {
    "id": "uuid-here",
    "email": "student@example.com",
    "name": "John Doe",
    ...
  }
}
```

---

### 4. Get User Profile

```bash
curl -X GET http://localhost:8787/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq '.'
```

---

### 5. Update User Profile

```bash
curl -X PUT http://localhost:8787/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "profileData": {
      "targetScore": 180,
      "preferredSubjects": ["physics", "mathematics"],
      "studyGoals": ["Master calculus", "Improve speed"],
      "timeZone": "Asia/Kolkata"
    }
  }' | jq '.'
```

---

### 6. Refresh Access Token

```bash
curl -X POST http://localhost:8787/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }' | jq '.'
```

---

### 7. Logout

```bash
curl -X POST http://localhost:8787/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq '.'
```

---

## Error Testing

### Test Invalid Email Format

```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123",
    "name": "Test User"
  }' | jq '.'
```

**Expected:** Error response with code `INVALID_EMAIL`

---

### Test Weak Password

```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "weak",
    "name": "Test User"
  }' | jq '.'
```

**Expected:** Error response with code `WEAK_PASSWORD`

---

### Test Invalid Credentials

```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "WrongPassword123"
  }' | jq '.'
```

**Expected:** Error response with code `INVALID_CREDENTIALS`

---

### Test Invalid Token

```bash
curl -X GET http://localhost:8787/auth/verify \
  -H "Authorization: Bearer invalid.token.here" | jq '.'
```

**Expected:** Error response with code `INVALID_TOKEN`

---

### Test Missing Authorization Header

```bash
curl -X GET http://localhost:8787/auth/profile | jq '.'
```

**Expected:** Error response with code `UNAUTHORIZED`

---

## Database Inspection

Check the users in the database:

```bash
wrangler d1 execute eamcet-platform-db-dev \
  --command "SELECT id, email, name, email_verified, created_at FROM users"
```

View a specific user's profile data:

```bash
wrangler d1 execute eamcet-platform-db-dev \
  --command "SELECT email, name, profile_data FROM users WHERE email = 'student@example.com'"
```

---

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Token verification works
- [ ] Profile retrieval works
- [ ] Profile update works
- [ ] Token refresh works
- [ ] Logout works
- [ ] Invalid email is rejected
- [ ] Weak password is rejected
- [ ] Invalid credentials are rejected
- [ ] Invalid token is rejected
- [ ] Missing auth header is rejected
- [ ] CORS headers are present
- [ ] Passwords are hashed (not stored in plain text)

---

## Troubleshooting

### Worker not starting?

```bash
# Make sure you're in the right directory
cd packages/auth-worker

# Install dependencies
npm install

# Try running with verbose output
npm run dev
```

### Database errors?

```bash
# Check if database exists
wrangler d1 list

# Check database schema
wrangler d1 execute eamcet-platform-db-dev \
  --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Token issues?

- Make sure JWT_SECRET is set in wrangler.toml
- Check that the token hasn't expired
- Verify the Authorization header format: `Bearer <token>`

---

## Next Steps

After manual testing is complete:

1. Proceed to Task 5: AI Question Generation System
2. Or continue to Task 6: Test Engine Core Implementation
