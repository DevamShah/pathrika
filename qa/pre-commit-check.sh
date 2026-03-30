#!/bin/bash
# Pathrika — Mandatory Pre-Commit QA Gate
# This script blocks git commit if ANY check fails.
# Configured as a Claude Code hook in .claude/settings.json
# Cannot be bypassed by Claude — runs automatically.

cd /Users/devam/Documents/archeon/forgeon/pathrika
FAIL=0

echo "========================================"
echo "  PATHRIKA PRE-COMMIT QA GATE"
echo "========================================"

# 1. Backend TypeScript compilation
echo ""
echo "[1/4] Checking API TypeScript compilation..."
TSC_OUTPUT=$(cd api && npx tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
    echo "$TSC_OUTPUT" | tail -10
    echo "FAIL: API TypeScript compilation errors"
    FAIL=1
else
    echo "  OK — API compiles clean"
fi

# 2. Frontend TypeScript compilation
echo ""
echo "[2/4] Checking Web TypeScript compilation..."
FTSC_OUTPUT=$(cd web && npx tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
    echo "$FTSC_OUTPUT" | tail -10
    echo "FAIL: Web TypeScript compilation errors"
    FAIL=1
else
    echo "  OK — Web compiles clean"
fi

# 3. Frontend build
echo ""
echo "[3/4] Checking frontend build..."
FBUILD=$(cd web && npx next build 2>&1 | tail -5)
if echo "$FBUILD" | grep -qi "error\|failed"; then
    echo "$FBUILD"
    echo "FAIL: Frontend build broken"
    FAIL=1
else
    echo "  OK — Frontend builds clean"
fi

# 4. Secret scan
echo ""
echo "[4/4] Scanning for secrets..."
SECRETS=$(gitleaks detect --source api/src --no-banner --no-git 2>&1 | tail -2)
if echo "$SECRETS" | grep -q "WRN.*leaks found"; then
    echo "$SECRETS"
    echo "FAIL: Secrets detected in source code"
    FAIL=1
else
    echo "  OK — No secrets detected"
fi

echo ""
echo "========================================"
if [ $FAIL -ne 0 ]; then
    echo '{"decision":"block","reason":"PRE-COMMIT QA FAILED. Fix issues above before committing."}'
    exit 0
fi
echo '{"decision":"allow","reason":"All pre-commit checks passed."}'
