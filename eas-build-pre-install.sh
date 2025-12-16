#!/bin/bash
# EAS Build Pre-Install Hook
# This script ensures npm is used instead of yarn for dependency installation

set -e

echo "=== EAS Build Pre-Install Hook ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo "✓ Found package-lock.json - npm will be used"
else
    echo "⚠ No package-lock.json found - generating one"
    npm install --package-lock-only --legacy-peer-deps
fi

# Remove any yarn.lock if it exists to prevent yarn from being used
if [ -f "yarn.lock" ]; then
    echo "⚠ Found yarn.lock - removing to ensure npm is used"
    rm yarn.lock
fi

echo "=== Pre-Install Hook Complete ==="
