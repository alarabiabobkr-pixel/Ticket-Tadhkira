#!/usr/bin/env python3
"""
Download all remaining remote HTTP posters locally to public/posters/
and remove any non-Ep1 or duplicate series cards.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse
import shutil

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.9",
    "Referer": "https://akw.cam/"
}

os.makedirs("public/posters", exist_ok=True)
os.makedirs("public/backdrops", exist_ok=True)

def download_image(url, dest):
    try:
        parsed = urllib.parse.urlparse(url)
        quoted_path = urllib.parse.quote(parsed.path)
        full_url = f"{parsed.scheme}://{parsed.netloc}{quoted_path}"
        req = urllib.request.Request(full_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            if len(data) > 3000:
                with open(dest, "wb") as f:
                    f.write(data)
                return True
    except Exception as e:
        pass
    return False

def main():
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Original catalog: {len(catalog)} items", flush=True)

    # 1. Deduplicate series and remove any series starting > 1
    seen_ids = set()
    cleaned = []
    removed = 0

    for item in catalog:
        iid = item.get("id")
        is_series = item.get("category") == "series" or "مسلسل" in item.get("type", "")
        
        if is_series:
            eps = item.get("episodes", [])
            nums = [e.get("episodeNum") for e in eps if e.get("episodeNum")]
            # If series has active episodes but starts > 1, remove
            if nums and nums[0] != 1:
                print(f"Removing series starting > 1: {item.get('title')} (starts at Ep {nums[0]})", flush=True)
                removed += 1
                continue
            
            # Check for duplicate series by clean title
            clean_t = re.sub(r"-\s*الموسم.*", "", item.get("title", "")).strip()
            if clean_t in seen_ids:
                print(f"Removing duplicate series: {item.get('title')}", flush=True)
                removed += 1
                continue
            seen_ids.add(clean_t)

        cleaned.append(item)

    print(f"Removed {removed} invalid/duplicate series. Remaining items: {len(cleaned)}", flush=True)

    # 2. Download all HTTP posters locally
    downloaded_count = 0
    for idx, item in enumerate(cleaned, 1):
        p = item.get("poster", "")
        iid = item.get("id", f"item-{idx}")
        
        if p.startswith("http"):
            safe_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", iid).strip("-")
            local_name = f"{safe_id}.jpg"
            dest_file = os.path.join("public/posters", local_name)
            
            if not os.path.exists(dest_file):
                if download_image(p, dest_file):
                    shutil.copy2(dest_file, os.path.join("public/backdrops", local_name))
                    downloaded_count += 1
                    if downloaded_count % 20 == 0:
                        print(f"  Downloaded {downloaded_count} posters locally...", flush=True)
            
            if os.path.exists(dest_file):
                item["poster"] = f"/posters/{local_name}"
                item["backdrop"] = f"/posters/{local_name}"

    print(f"Downloaded total of {downloaded_count} new local posters!", flush=True)

    # Ensure all series have embedUrl pointing to Ep 1
    for item in cleaned:
        if item.get("category") == "series" or "مسلسل" in item.get("type", ""):
            eps = item.get("episodes", [])
            if eps and (eps[0].get("embedUrl") or eps[0].get("byseUrl")):
                item["embedUrl"] = eps[0].get("embedUrl") or eps[0].get("byseUrl")
                item["byseUrl"] = item["embedUrl"]

    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.TADHKIRA_MEDIA = " + json.dumps(cleaned, ensure_ascii=False, indent=2) + ";")

    print("✅ All catalogs cleaned, posters localized, and saved successfully!", flush=True)

if __name__ == "__main__":
    main()
