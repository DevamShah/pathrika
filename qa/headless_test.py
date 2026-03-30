"""Pathrika — Headless Browser QA Tests with Screenshots

Tests every page and captures screenshots as evidence.
Uses Playwright for browser automation.
"""

import asyncio
import os
from playwright.async_api import async_playwright

WEB_URL = "http://localhost:3101"
API_URL = "http://localhost:3100"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

PAGES = [
    ("01_home", "/", "Home — All Stories feed"),
    ("02_indian_politics", "/category/indian-politics", "Indian Politics category"),
    ("03_geopolitics", "/category/geopolitics", "Geopolitics category"),
    ("04_ai_technology", "/category/ai-technology", "AI & Technology category"),
    ("05_finance_economy", "/category/finance-economy", "Finance & Economy category"),
    ("06_cybersecurity", "/category/cybersecurity", "Cybersecurity category"),
    ("07_health", "/health", "Feed Health dashboard"),
    ("08_search", "/search?q=AI", "Search results for 'AI'"),
]

API_ENDPOINTS = [
    ("09_api_feeds", "/api/feeds", "All feeds list"),
    ("10_api_categories", "/api/categories", "Categories list"),
    ("11_api_items", "/api/items?limit=10", "Latest items"),
    ("12_api_health", "/api/health", "Health status"),
    ("13_api_category_cyber", "/api/categories/cybersecurity", "Cybersecurity category items"),
    ("14_api_search", "/api/search?q=security", "Search API"),
]


async def screenshot(page, name, desc="", full_page=True):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    try:
        await page.screenshot(path=path, full_page=full_page, timeout=15000)
    except Exception:
        # Fallback: viewport-only screenshot if full-page times out
        await page.screenshot(path=path, full_page=False, timeout=10000)
    print(f"  [SCREENSHOT] {name}.png — {desc}")
    return path


async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        results = []

        # ── WEB PAGE TESTS ─────────────────────────────────────────
        for name, path, desc in PAGES:
            test_name = f"Page: {desc}"
            print(f"\n=== {test_name} ===")
            try:
                resp = await page.goto(
                    f"{WEB_URL}{path}",
                    wait_until="networkidle",
                    timeout=20000,
                )
                await page.wait_for_timeout(1500)

                status = resp.status if resp else 0
                if status == 200:
                    # Verify real content rendered (not just blank page)
                    body_text = await page.inner_text("body")
                    if len(body_text.strip()) > 50:
                        await screenshot(page, name, desc)
                        results.append((test_name, "PASS"))
                    else:
                        await screenshot(page, f"{name}_empty", f"EMPTY: {desc}")
                        results.append((test_name, "FAIL — page rendered but no content"))
                else:
                    await screenshot(page, f"{name}_error", f"HTTP {status}")
                    results.append((test_name, f"FAIL — HTTP {status}"))
            except Exception as e:
                await screenshot(page, f"{name}_error", str(e)[:80])
                results.append((test_name, f"FAIL — {str(e)[:80]}"))

        # ── API ENDPOINT TESTS ─────────────────────────────────────
        for name, path, desc in API_ENDPOINTS:
            test_name = f"API: {desc}"
            print(f"\n=== {test_name} ===")
            try:
                resp = await page.goto(
                    f"{API_URL}{path}",
                    wait_until="load",
                    timeout=10000,
                )
                status = resp.status if resp else 0
                body = await page.inner_text("body")

                if status == 200 and '"ok":true' in body.replace(" ", "").replace("\n", ""):
                    await page.set_viewport_size({"width": 1440, "height": 900})
                    await screenshot(page, name, desc)
                    results.append((test_name, "PASS"))
                else:
                    await screenshot(page, f"{name}_error", f"HTTP {status}")
                    results.append((test_name, f"FAIL — HTTP {status}, ok not true"))
            except Exception as e:
                results.append((test_name, f"FAIL — {str(e)[:80]}"))

        await browser.close()

        # ── RESULTS SUMMARY ────────────────────────────────────────
        print("\n" + "=" * 60)
        print("HEADLESS BROWSER QA — RESULTS SUMMARY")
        print("=" * 60)
        passed = sum(1 for _, s in results if "PASS" in s)
        failed = sum(1 for _, s in results if "FAIL" in s)
        total = len(results)
        for name, status in results:
            icon = "PASS" if "PASS" in status else "FAIL"
            print(f"  [{icon}] {name}: {status}")
        print(f"\nTotal: {passed}/{total} passed, {failed} failed")
        print(f"Screenshots saved to: {SCREENSHOT_DIR}/")
        print(f"Screenshot count: {len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.png')])}")


if __name__ == "__main__":
    asyncio.run(run_tests())
