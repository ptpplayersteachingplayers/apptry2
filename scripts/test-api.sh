#!/bin/bash
#
# PTP API Endpoint Tester
# Tests the WordPress REST API endpoints for the PTP mobile app
#

API_BASE="https://ptpsummercamps.com"
API_NAMESPACE="/wp-json/ptp/v1"

echo "============================================"
echo "PTP API Endpoint Tester"
echo "============================================"
echo ""
echo "Testing: $API_BASE$API_NAMESPACE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local endpoint=$1
    local description=$2

    echo -n "Testing $description... "

    response=$(curl -s -w "\n%{http_code}" "$API_BASE$API_NAMESPACE$endpoint" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" 2>&1)

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ OK ($http_code)${NC}"
        echo "  Response preview: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}✗ Connection Failed${NC}"
        echo "  Could not connect to server"
    else
        echo -e "${YELLOW}⚠ Error ($http_code)${NC}"
        echo "  Response: $(echo "$body" | head -c 200)"
    fi
    echo ""
}

# Test WordPress REST API discovery
echo "--- WordPress REST API ---"
echo -n "Testing WP REST API... "
wp_response=$(curl -s -w "\n%{http_code}" "$API_BASE/wp-json/" 2>&1)
wp_code=$(echo "$wp_response" | tail -n1)
if [ "$wp_code" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Error ($wp_code)${NC}"
    echo "  WordPress REST API not accessible"
fi
echo ""

# Test PTP API endpoints
echo "--- PTP API Endpoints ---"
test_endpoint "/programs" "Programs (Camps & Clinics)"
test_endpoint "/programs/featured" "Featured Programs"
test_endpoint "/trainers" "Trainers"
test_endpoint "/trainers/featured" "Featured Trainers"
test_endpoint "/markets" "Markets (Locations)"

echo "--- Authentication Endpoints ---"
echo "Testing JWT Auth endpoint..."
jwt_response=$(curl -s -w "\n%{http_code}" "$API_BASE/wp-json/jwt-auth/v1/token" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>&1)
jwt_code=$(echo "$jwt_response" | tail -n1)
jwt_body=$(echo "$jwt_response" | sed '$d')

if [ "$jwt_code" = "403" ]; then
    echo -e "${GREEN}✓ JWT Auth endpoint responding ($jwt_code)${NC}"
    echo "  (403 expected for invalid credentials)"
elif [ "$jwt_code" = "200" ]; then
    echo -e "${GREEN}✓ JWT Auth working${NC}"
else
    echo -e "${YELLOW}⚠ JWT Auth status: $jwt_code${NC}"
fi
echo ""

echo "============================================"
echo "Test Complete"
echo "============================================"
echo ""
echo "If endpoints return errors, check:"
echo "1. WordPress is accessible at $API_BASE"
echo "2. PTP Mobile API plugin is activated"
echo "3. JWT Authentication plugin is activated"
echo "4. No security plugins blocking API requests"
echo ""
