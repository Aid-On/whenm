#!/bin/bash

# =============================================================================
# Prolog Test Runner for WhenM Event Calculus
# =============================================================================
# Run native Prolog tests using SWI-Prolog
# =============================================================================

set -e

echo "==================================================="
echo "Running WhenM Event Calculus Prolog Test Suite"
echo "==================================================="

# Check if SWI-Prolog is installed
if ! command -v swipl &> /dev/null; then
    echo "Error: SWI-Prolog (swipl) is not installed."
    echo "Install with: brew install swi-prolog (macOS) or apt-get install swi-prolog (Linux)"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run test files
TEST_FILES=(
    "event_calculus_test.pl"
)

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

for test_file in "${TEST_FILES[@]}"; do
    if [ -f "$test_file" ]; then
        echo ""
        echo "Running: $test_file"
        echo "---------------------------------------------------"
        
        # Run the test and capture output
        if swipl -g "run_tests." -t halt "$test_file" 2>&1 | tee test_output.tmp; then
            # Parse output for test results
            if grep -q "test passed" test_output.tmp || grep -q "All tests passed" test_output.tmp; then
                echo -e "${GREEN}✓ Tests in $test_file passed${NC}"
                ((PASSED_TESTS++))
            elif grep -q "ERROR" test_output.tmp || grep -q "FAILED" test_output.tmp; then
                echo -e "${RED}✗ Some tests in $test_file failed${NC}"
                ((FAILED_TESTS++))
            else
                echo -e "${GREEN}✓ Tests in $test_file completed${NC}"
                ((PASSED_TESTS++))
            fi
        else
            echo -e "${RED}✗ Error running $test_file${NC}"
            ((FAILED_TESTS++))
        fi
        
        ((TOTAL_TESTS++))
        rm -f test_output.tmp
    else
        echo -e "${YELLOW}Warning: Test file $test_file not found${NC}"
    fi
done

echo ""
echo "==================================================="
echo "Test Summary"
echo "==================================================="
echo "Total test files: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi