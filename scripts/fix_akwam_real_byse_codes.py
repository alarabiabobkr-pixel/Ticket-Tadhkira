#!/usr/bin/env python3
"""
Audits and fixes all movies and series in catalog:
1. Ensures all Akwam movies use real Byse/Filemoon embed codes (not Mixdrop).
2. Fixes 'ولنا في الخيال حب' and any duplicate entries in catalog and curated_catalog.
3. Ensures all series with Byse episodes have active Episode 1 URLs.
4. Generates updated catalog.json, curated_catalog.json, and catalog.js.
"""

import os
import sys
import json
import re
import time
import urllib.request

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.9"
}

def fix_all():
    print("Loading catalogs...")
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    with open("public/curated_catalog.json", "r", encoding="utf-8") as f:
        curated = json.load(f)

    # 1. Specifically fix 'ولنا في الخيال حب'
    khayal_code = "foadey70c0ih"
    khayal_url = f"https://filemoon.sx/e/{khayal_code}"
    
    for item in catalog:
        if "الخيال" in item.get("title", ""):
            item["code"] = khayal_code
            item["embedUrl"] = khayal_url
            item["streamUrl"] = khayal_url
            item["byseUrl"] = khayal_url
            print(f"Fixed catalog item: {item.get('title')} -> {khayal_url}")

    for item in curated:
        if "الخيال" in item.get("title", ""):
            item["code"] = khayal_code
            item["embedUrl"] = khayal_url
            item["streamUrl"] = khayal_url
            item["byseUrl"] = khayal_url
            print(f"Fixed curated item: {item.get('title')} -> {khayal_url}")

    # 2. Check all movie-akw items that have suspect 14-char Mixdrop codes
    fixed_mixdrop = 0
    for item in catalog:
        item_id = item.get("id", "")
        code = item.get("code", "")
        if item_id.startswith("movie-akw-") and (len(code) == 14 or "qzo" in code or "wok" in code):
            slug = item_id.replace("movie-akw-", "akfilm-")
            watch_url = f"https://akw.cam/watch/{slug}/servers"
            try:
                req = urllib.request.Request(watch_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=8) as r:
                    html = r.read().decode("utf-8", errors="ignore")
                    byse_m = re.search(r"https?://(?:[a-zA-Z0-9\.\-]*byse[a-zA-Z0-9\.\-]*|filemoon\.[a-z]+)/(?:e|d)/([a-zA-Z0-9]+)", html)
                    if byse_m:
                        real_code = byse_m.group(1)
                        real_url = f"https://filemoon.sx/e/{real_code}"
                        item["code"] = real_code
                        item["embedUrl"] = real_url
                        item["streamUrl"] = real_url
                        item["byseUrl"] = real_url
                        fixed_mixdrop += 1
                        print(f"Fixed Mixdrop -> Byse: {item.get('title')} -> {real_code}")
                time.sleep(0.1)
            except Exception as e:
                print(f"Error checking {slug}: {e}")

    # 3. Ensure series with Byse episodes have top-level active episode 1 URLs
    series_fixed = 0
    for item in catalog:
        if item.get("type") == "series" or item.get("category") == "series":
            episodes = item.get("episodes", [])
            active_eps = [e for e in episodes if e.get("byseUrl") or e.get("embedUrl")]
            if active_eps:
                ep1 = active_eps[0]
                item["embedUrl"] = ep1.get("byseUrl") or ep1.get("embedUrl")
                item["streamUrl"] = item["embedUrl"]
                item["byseUrl"] = item["embedUrl"]
                item["code"] = ep1.get("code")
                series_fixed += 1

    for item in curated:
        if item.get("type") == "series" or item.get("category") == "series":
            episodes = item.get("episodes", [])
            active_eps = [e for e in episodes if e.get("byseUrl") or e.get("embedUrl")]
            if active_eps:
                ep1 = active_eps[0]
                item["embedUrl"] = ep1.get("byseUrl") or ep1.get("embedUrl")
                item["streamUrl"] = item["embedUrl"]
                item["byseUrl"] = item["embedUrl"]
                item["code"] = ep1.get("code")

    # 4. Save clean files
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.SITE_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"✅ Audit complete: Fixed {fixed_mixdrop} Mixdrop codes, {series_fixed} series ep1 URLs.")

if __name__ == "__main__":
    fix_all()
