#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  AcademIQ Load & Security Tests"
echo "======================================"
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Server is running"
else
    echo -e "${RED}✗${NC} Server is not running on localhost:3000"
    echo "Please start the server first with: npm run dev"
    exit 1
fi

# Create results directory
mkdir -p load-tests/results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="load-tests/results/$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo ""
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Function to run Node.js based load tests
run_nodejs_tests() {
    echo "======================================"
    echo "Running Node.js Load Tests"
    echo "======================================"
    echo ""

    node load-tests/nodejs-load-test.js > "$RESULTS_DIR/load-test-output.txt" 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Load tests completed"
    else
        echo -e "${YELLOW}⚠${NC} Load tests completed with warnings"
    fi

    echo ""
}

# Function to run security tests
run_security_tests() {
    echo "======================================"
    echo "Running Security Tests"
    echo "======================================"
    echo ""

    node load-tests/nodejs-security-test.js > "$RESULTS_DIR/security-test-output.txt" 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Security tests completed"
    else
        echo -e "${RED}✗${NC} Security tests found issues"
    fi

    echo ""
}

# Run tests
run_nodejs_tests
run_security_tests

# Generate summary report
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""

if [ -f "$RESULTS_DIR/load-test-output.txt" ]; then
    echo "Load Test Results:"
    tail -n 20 "$RESULTS_DIR/load-test-output.txt"
    echo ""
fi

if [ -f "$RESULTS_DIR/security-test-output.txt" ]; then
    echo "Security Test Results:"
    tail -n 20 "$RESULTS_DIR/security-test-output.txt"
    echo ""
fi

echo "======================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "Full results available in: $RESULTS_DIR"
echo "======================================"
