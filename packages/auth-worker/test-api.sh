#!/bin/bash

# Manual API Testing Script for Authentication Worker
# Make sure the worker is running with: npm run dev

BASE_URL="http://localhost:8787"

echo "🧪 Testing EAMCET Authentication Worker"
echo "========================================"
echo ""

# Test 1: Register a new user
echo "📝 Test 1: Register a new user"
echo "POST $BASE_URL/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Extract access token from registration
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken // empty')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Registration failed or user already exists"
  echo ""
  
  # Try to login instead
  echo "🔐 Attempting login with existing user"
  echo "POST $BASE_URL/auth/login"
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "TestPassword123"
    }')
  
  echo "$LOGIN_RESPONSE" | jq '.'
  echo ""
  
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // empty')
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken // empty')
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Could not get access token. Exiting."
  exit 1
fi

echo "✅ Got access token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Test 2: Verify token
echo "🔍 Test 2: Verify token"
echo "GET $BASE_URL/auth/verify"
curl -s -X GET "$BASE_URL/auth/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 3: Get profile
echo "👤 Test 3: Get user profile"
echo "GET $BASE_URL/auth/profile"
curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 4: Update profile
echo "✏️  Test 4: Update user profile"
echo "PUT $BASE_URL/auth/profile"
curl -s -X PUT "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User",
    "profileData": {
      "targetScore": 150,
      "preferredSubjects": ["physics", "mathematics"],
      "studyGoals": ["Improve problem-solving speed", "Master calculus"]
    }
  }' | jq '.'
echo ""

# Test 5: Refresh token
echo "🔄 Test 5: Refresh access token"
echo "POST $BASE_URL/auth/refresh"
curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq '.'
echo ""

# Test 6: Logout
echo "👋 Test 6: Logout"
echo "POST $BASE_URL/auth/logout"
curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 7: Try to access profile after logout (should still work with JWT)
echo "🔒 Test 7: Access profile with token (JWT is stateless, so this still works)"
echo "GET $BASE_URL/auth/profile"
curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 8: Test invalid credentials
echo "❌ Test 8: Login with invalid credentials"
echo "POST $BASE_URL/auth/login"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123"
  }' | jq '.'
echo ""

# Test 9: Test invalid token
echo "❌ Test 9: Access with invalid token"
echo "GET $BASE_URL/auth/verify"
curl -s -X GET "$BASE_URL/auth/verify" \
  -H "Authorization: Bearer invalid.token.here" | jq '.'
echo ""

echo "✅ All tests completed!"
echo ""
echo "💡 Tips:"
echo "  - The worker must be running: cd packages/auth-worker && npm run dev"
echo "  - Install jq for pretty JSON: brew install jq (macOS) or apt-get install jq (Linux)"
echo "  - Check the database: wrangler d1 execute eamcet-platform-db-dev --command 'SELECT * FROM users'"
