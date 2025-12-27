#!/bin/bash

# PTP Webhook Test Script
# Usage: ./test-webhook.sh <supabase-url> [secret]

SUPABASE_URL="${1:-https://your-project.supabase.co}"
WEBHOOK_SECRET="${2:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "PTP Webhook Test Suite"
echo "=================================="
echo ""
echo "Target: ${SUPABASE_URL}/functions/v1/woo-webhook"
echo ""

# Function to calculate HMAC signature
calculate_signature() {
    local payload="$1"
    local secret="$2"
    echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" -binary | base64
}

# Test 1: Basic Connectivity
echo -e "${YELLOW}Test 1: Basic Connectivity${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/functions/v1/woo-webhook" \
    -H "Content-Type: application/json" \
    -H "x-wc-webhook-topic: order.created" \
    -d '{"id": 0, "status": "test"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -lt 500 ]; then
    echo -e "${GREEN}✓ Function reachable (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Function error (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 2: Order Created (Single Child)
echo -e "${YELLOW}Test 2: Order Created (Single Child)${NC}"
PAYLOAD=$(cat docs/test-payloads/order-created.json)

if [ -n "$WEBHOOK_SECRET" ]; then
    SIGNATURE=$(calculate_signature "$PAYLOAD" "$WEBHOOK_SECRET")
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "${SUPABASE_URL}/functions/v1/woo-webhook" \
        -H "Content-Type: application/json" \
        -H "x-wc-webhook-topic: order.created" \
        -H "x-wc-webhook-signature: $SIGNATURE" \
        -d "$PAYLOAD")
else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "${SUPABASE_URL}/functions/v1/woo-webhook" \
        -H "Content-Type: application/json" \
        -H "x-wc-webhook-topic: order.created" \
        -d "$PAYLOAD")
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Order processed successfully${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 3: Order with Multiple Children
echo -e "${YELLOW}Test 3: Order with Multiple Children${NC}"
PAYLOAD=$(cat docs/test-payloads/order-multiple-children.json)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/functions/v1/woo-webhook" \
    -H "Content-Type: application/json" \
    -H "x-wc-webhook-topic: order.created" \
    -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Multi-child order processed${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 4: Order Refunded
echo -e "${YELLOW}Test 4: Order Refunded (Status Update)${NC}"
PAYLOAD=$(cat docs/test-payloads/order-refunded.json)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/functions/v1/woo-webhook" \
    -H "Content-Type: application/json" \
    -H "x-wc-webhook-topic: order.updated" \
    -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Refund processed${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

echo "=================================="
echo "Test Suite Complete"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Check Supabase Dashboard > Table Editor > orders"
echo "2. Check Supabase Dashboard > Table Editor > enrollments"
echo "3. Check Edge Functions > woo-webhook > Logs"
