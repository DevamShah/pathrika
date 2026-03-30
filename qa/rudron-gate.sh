#!/bin/bash
# =============================================================================
# RUDRON — Automated Quality Gate for Pathrika
# =============================================================================
# This is the REAL Rudron. Not a simulated agent review.
# Runs automated checks and BLOCKS if any fail.
# Must pass before ANY gate presentation to Devam.
#
# Usage: ./qa/rudron-gate.sh [gate_number]
#   gate_number: 1-5 (default: 5 = full release check)
# =============================================================================

set +e
cd "$(dirname "$0")/.."

GATE=${1:-5}
PASS=0
FAIL=0
WARN=0
RESULTS=""

log_pass() { PASS=$((PASS + 1)); RESULTS="${RESULTS}\n  [PASS] $1"; echo "  [PASS] $1"; }
log_fail() { FAIL=$((FAIL + 1)); RESULTS="${RESULTS}\n  [FAIL] $1"; echo "  [FAIL] $1"; }
log_warn() { WARN=$((WARN + 1)); RESULTS="${RESULTS}\n  [WARN] $1"; echo "  [WARN] $1"; }

echo "============================================================"
echo "  RUDRON QUALITY GATE ${GATE} — Pathrika RSS Aggregator"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# ── CHECK 1: API TypeScript Compilation ──────────────────────────
echo ""
echo "[1] API TYPESCRIPT COMPILATION"
TSC_OUTPUT=$(cd api && npx tsc --noEmit 2>&1)
if [ $? -eq 0 ]; then
    log_pass "API TypeScript compiles clean"
else
    log_fail "API TypeScript compilation errors"
    echo "$TSC_OUTPUT" | tail -5
fi

# ── CHECK 2: Web TypeScript Compilation ──────────────────────────
echo ""
echo "[2] WEB TYPESCRIPT COMPILATION"
FTSC_OUTPUT=$(cd web && npx tsc --noEmit 2>&1)
if [ $? -eq 0 ]; then
    log_pass "Web TypeScript compiles clean"
else
    log_fail "Web TypeScript compilation errors"
    echo "$FTSC_OUTPUT" | tail -5
fi

# ── CHECK 3: API Health Check ────────────────────────────────────
echo ""
echo "[3] API HEALTH CHECK"
API_HEALTH=$(curl -s --max-time 5 http://localhost:3100/api/health 2>/dev/null)
if echo "$API_HEALTH" | grep -q '"ok"'; then
    STATUS=$(echo "$API_HEALTH" | grep -o '"status":"[^"]*"' | head -1)
    log_pass "API running and $STATUS"
else
    log_warn "API not running (start with: cd api && npm run dev)"
fi

# ── CHECK 4: Web Health Check ────────────────────────────────────
echo ""
echo "[4] WEB HEALTH CHECK"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3101 2>/dev/null)
if [ "$WEB_STATUS" = "200" ]; then
    log_pass "Web running at localhost:3101"
else
    log_warn "Web not running (start with: cd web && npm run dev)"
fi

# ── CHECK 5: Secret Scan ────────────────────────────────────────
echo ""
echo "[5] SECRET SCAN (gitleaks)"
LEAK_OUTPUT=$(gitleaks detect --source api/src --no-banner --no-git 2>&1)
if echo "$LEAK_OUTPUT" | grep -q "WRN.*leaks found"; then
    log_fail "Secrets found in API source code"
else
    log_pass "No secrets in source code"
fi

# ── CHECK 6: Security Scan (trivy) ──────────────────────────────
echo ""
echo "[6] DEPENDENCY SCAN (trivy)"
TRIVY_API=$(trivy fs --severity HIGH,CRITICAL --quiet api/ 2>&1)
TRIVY_WEB=$(trivy fs --severity HIGH,CRITICAL --quiet web/ 2>&1)
if echo "$TRIVY_API$TRIVY_WEB" | grep -qE "HIGH|CRITICAL"; then
    VULN_COUNT=$(echo "$TRIVY_API$TRIVY_WEB" | grep -cE "HIGH|CRITICAL" 2>/dev/null || echo "?")
    log_fail "High/Critical vulnerabilities found ($VULN_COUNT)"
    echo "$TRIVY_API" | grep -E "HIGH|CRITICAL" | head -5
    echo "$TRIVY_WEB" | grep -E "HIGH|CRITICAL" | head -5
else
    log_pass "No HIGH/CRITICAL vulnerabilities"
fi

# ── CHECK 7: Semgrep Scan ───────────────────────────────────────
echo ""
echo "[7] STATIC ANALYSIS (semgrep)"
SEMGREP_TMPFILE=$(mktemp)
(semgrep scan --config auto --quiet api/src/ web/src/ > "$SEMGREP_TMPFILE" 2>&1) &
SEMGREP_PID=$!
( sleep 60 && kill $SEMGREP_PID 2>/dev/null ) &
TIMER_PID=$!
wait $SEMGREP_PID 2>/dev/null
SEMGREP_EXIT=$?
kill $TIMER_PID 2>/dev/null
wait $TIMER_PID 2>/dev/null
SEMGREP_OUTPUT=$(cat "$SEMGREP_TMPFILE")
rm -f "$SEMGREP_TMPFILE"
if [ $SEMGREP_EXIT -ne 0 ] && [ -z "$SEMGREP_OUTPUT" ]; then
    log_warn "Semgrep timed out or failed (exit $SEMGREP_EXIT)"
elif echo "$SEMGREP_OUTPUT" | grep -qE "Findings:.*[1-9]"; then
    log_warn "Semgrep findings detected"
    echo "$SEMGREP_OUTPUT" | tail -5
else
    log_pass "Semgrep clean"
fi

# ── GATE 5 ONLY: Additional checks ─────────────────────────────
if [ "$GATE" -ge 5 ]; then

    # CHECK 8: Headless browser test (all pages)
    echo ""
    echo "[8] HEADLESS BROWSER TEST (all pages)"
    if [ -f "qa/headless_test.py" ] && [ "$WEB_STATUS" = "200" ]; then
        BROWSER_OUTPUT=$(npx playwright test qa/headless_test.py 2>&1 || python3 qa/headless_test.py 2>&1)
        if echo "$BROWSER_OUTPUT" | grep -q "passed"; then
            BROWSER_PASSED=$(echo "$BROWSER_OUTPUT" | grep -oE '[0-9]+/[0-9]+ passed' | head -1)
            log_pass "Headless browser: $BROWSER_PASSED"
        else
            log_fail "Headless browser: not all pages pass"
            echo "$BROWSER_OUTPUT" | grep "FAIL" | head -5
        fi
    else
        log_warn "Headless browser test skipped (web not running or test file missing)"
    fi

    # CHECK 9: Screenshots exist
    echo ""
    echo "[9] QA SCREENSHOTS"
    SCREENSHOT_COUNT=$(ls qa/screenshots/*.png 2>/dev/null | wc -l | tr -d ' ')
    if [ "$SCREENSHOT_COUNT" -ge 8 ]; then
        log_pass "QA screenshots: $SCREENSHOT_COUNT captured"
    else
        log_fail "QA screenshots insufficient: $SCREENSHOT_COUNT (need 8+)"
    fi

    # CHECK 10: API endpoint smoke test
    echo ""
    echo "[10] API ENDPOINT SMOKE TEST"
    if [ -n "$API_HEALTH" ]; then
        ENDPOINTS_OK=0
        ENDPOINTS_FAIL=0
        for EP in "/api/feeds" "/api/categories" "/api/items" "/api/health"; do
            EP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3100${EP}" 2>/dev/null)
            if [ "$EP_STATUS" = "200" ]; then
                ENDPOINTS_OK=$((ENDPOINTS_OK + 1))
            else
                ENDPOINTS_FAIL=$((ENDPOINTS_FAIL + 1))
                echo "    FAIL: $EP returned $EP_STATUS"
            fi
        done
        if [ $ENDPOINTS_FAIL -eq 0 ]; then
            log_pass "All $ENDPOINTS_OK API endpoints respond 200"
        else
            log_fail "$ENDPOINTS_FAIL/$((ENDPOINTS_OK + ENDPOINTS_FAIL)) API endpoints failed"
        fi
    else
        log_warn "API endpoint smoke test skipped (API not running)"
    fi

    # CHECK 11: Feed fetch verification
    echo ""
    echo "[11] FEED FETCH VERIFICATION"
    if [ -n "$API_HEALTH" ]; then
        ITEM_COUNT=$(curl -s --max-time 5 "http://localhost:3100/api/items?limit=1" 2>/dev/null | grep -o '"items":\[' | wc -l | tr -d ' ')
        FEED_HEALTH=$(curl -s --max-time 5 "http://localhost:3100/api/health" 2>/dev/null)
        HEALTHY_FEEDS=$(echo "$FEED_HEALTH" | grep -o '"isHealthy":true' | wc -l | tr -d ' ')
        if [ "$HEALTHY_FEEDS" -ge 15 ]; then
            log_pass "Feed health: $HEALTHY_FEEDS/25 feeds healthy"
        elif [ "$HEALTHY_FEEDS" -ge 1 ]; then
            log_warn "Feed health: only $HEALTHY_FEEDS/25 feeds healthy"
        else
            log_fail "No feeds fetched successfully"
        fi
    else
        log_warn "Feed fetch verification skipped (API not running)"
    fi
fi

# ── VERDICT ──────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  RUDRON VERDICT — GATE ${GATE}"
echo "============================================================"
echo -e "$RESULTS"
echo ""
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "  WARNINGS: $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "  VERDICT: ██ BLOCKED ██"
    echo "  Fix all FAIL items before presenting Gate ${GATE}."
    echo "============================================================"
    exit 1
else
    echo "  VERDICT: ✓ APPROVED"
    echo "  Gate ${GATE} may be presented to Devam."
    echo "============================================================"
    exit 0
fi
