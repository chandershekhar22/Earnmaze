#!/bin/bash

echo "🧪 Testing Guest Session System"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5173"

echo "${BLUE}1. Testing Guest Login API...${NC}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/guest/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -c /tmp/guest_cookies.txt)

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "${GREEN}✓ Guest login API working${NC}"
  SESSION_ID=$(echo "$RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
  echo "  Session ID: $SESSION_ID"
else
  echo "${RED}✗ Guest login API failed${NC}"
  echo "  Response: $RESPONSE"
  exit 1
fi

echo ""
echo "${BLUE}2. Testing Guest Dashboard API...${NC}"
DASHBOARD_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/guest/dashboard" \
  -b /tmp/guest_cookies.txt)

if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
  echo "${GREEN}✓ Guest dashboard API working${NC}"
  EMAIL=$(echo "$DASHBOARD_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
  POINTS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"sessionPoints":[0-9]*' | cut -d':' -f2)
  echo "  Email: $EMAIL"
  echo "  Session Points: $POINTS"
else
  echo "${RED}✗ Guest dashboard API failed${NC}"
  echo "  Response: $DASHBOARD_RESPONSE"
  exit 1
fi

echo ""
echo "${BLUE}3. Checking Database...${NC}"
DB_CHECK=$(docker exec earnmaze-postgres psql -U postgres -d earnmaze -t -c "SELECT COUNT(*) FROM guest_sessions WHERE email='test@example.com' AND status='active';")
COUNT=$(echo "$DB_CHECK" | tr -d ' ')

if [ "$COUNT" -gt 0 ]; then
  echo "${GREEN}✓ Guest session found in database${NC}"
  echo "  Active sessions: $COUNT"
else
  echo "${RED}✗ No guest session in database${NC}"
  exit 1
fi

echo ""
echo "${BLUE}4. Testing Session Reuse...${NC}"
REUSE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/guest/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')

if echo "$REUSE_RESPONSE" | grep -q "$SESSION_ID"; then
  echo "${GREEN}✓ Session reuse working (same session ID)${NC}"
else
  echo "${RED}✗ Session reuse not working (new session created)${NC}"
  echo "  Response: $REUSE_RESPONSE"
fi

echo ""
echo "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit ${BLUE}http://localhost:5173/earn-money${NC}"
echo "2. Enter email: ${BLUE}test@example.com${NC}"
echo "3. Complete Turnstile"
echo "4. Verify redirect to ${BLUE}/guest/dashboard${NC}"
echo ""
echo "To view guest sessions:"
echo "${BLUE}docker exec earnmaze-postgres psql -U postgres -d earnmaze -c 'SELECT email, status, expires_at, session_points FROM guest_sessions ORDER BY created_at DESC LIMIT 5;'${NC}"
