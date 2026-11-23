#!/usr/bin/env python3
"""
Ticket Vib (تيكت فايب) - Byse / Filemoon Remote Sync & Auto-Migration Script
Author: Coding Engine
Description:
  Automates server-to-server remote upload from DoodStream to Byse / Filemoon
  without consuming user bandwidth.
  Maintains a persistent mapping (public/byse_mapping.json) so no existing
  movie, series, poster, or metadata is ever deleted or lost.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import argparse
import re

BYSE_API_KEY = os.environ.get("BYSE_API_KEY", "163193bubg5og40y2k2rpo")
BYSE_API_BASE = "https://api.byse.sx"
MAPPING_FILE = "public/byse_mapping.json"
CURATED_CATALOG_FILE = "public/curated_catalog.json"
FULL_CATALOG_FILE = "public/catalog.json"
CATALOG_JS_FILE = "public/catalog.js"

HEADERS = {
    "User-Agent": "TicketVibSync/1.0"
}

def load_json(filepath, default_val=None):
    if not os.path.exists(filepath):
        return default_val if default_val is not None else {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return default_val if default_val is not None else {}

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_dood_code(url):
    if not url or not isinstance(url, str):
        return None
    match = re.search(r'(?:d000d\.com|dood\.[a-z]+|ds2play\.com|d0000d\.com|d0o0d\.com|doodstream\.com)/(?:e|d)/([a-zA-Z0-9]+)', url)
    return match.group(1) if match else None

def api_call(endpoint, params=None):
    if params is None:
        params = {}
    params["key"] = BYSE_API_KEY
    url = f"{BYSE_API_BASE}/{endpoint}?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"API call error on {endpoint}: {e}")
        return None

def check_account():
    res = api_call("account/info")
    if res and res.get("status") == 200:
        info = res.get("result", {})
        print(f"✅ Byse Account Connected: {info.get('email')} (Login: {info.get('login')})")
        print(f"   Storage: {info.get('storage_used')} bytes used, Limit: {info.get('storage_left')}")
        return True
    else:
        print(f"❌ Failed to connect to Byse: {res}")
        return False

def add_remote_upload(dood_code):
    source_url = f"https://doodstream.com/e/{dood_code}"
    res = api_call("remote/add", {"url": source_url})
    if res and (res.get("status") == 200 or res.get("status") == "200"):
        filecode = res.get("result", {}).get("filecode")
        return filecode
    return None

def check_remote_status(filecode):
    res = api_call("remote/status", {"file_code": filecode})
    if res and (res.get("status") == 200 or res.get("status") == "200"):
        results = res.get("result")
        if isinstance(results, list) and len(results) > 0:
            return results[0]
        elif isinstance(results, dict):
            return results
    return None

def sync_batch(batch_size=10, delay=1.0):
    mapping = load_json(MAPPING_FILE, {})
    curated = load_json(CURATED_CATALOG_FILE, [])

    print(f"=== Starting Byse Sync Batch (Target new additions: {batch_size}) ===")
    
    # 1. First, check status of existing in-progress uploads
    pending_codes = [d_code for d_code, info in mapping.items() if info.get("status") in ("QUEUED", "WORKING", "PENDING")]
    if pending_codes:
        print(f"🔍 Checking {len(pending_codes)} in-progress remote uploads...")
        # Check in batch via file/info
        byse_fcs = [mapping[d_code].get("byse_filecode") for d_code in pending_codes if mapping[d_code].get("byse_filecode")]
        if byse_fcs:
            info_res = api_call("file/info", {"file_code": ",".join(byse_fcs)})
            ready_info_map = {}
            if info_res and info_res.get("status") == 200:
                for item in info_res.get("result", []):
                    if item.get("canplay") == 1 or item.get("status") == 200:
                        ready_info_map[item.get("file_code")] = item

            for d_code in pending_codes:
                byse_fc = mapping[d_code].get("byse_filecode")
                if not byse_fc:
                    continue
                if byse_fc in ready_info_map:
                    f_info = ready_info_map[byse_fc]
                    mapping[d_code]["status"] = "READY"
                    mapping[d_code]["byse_url"] = f"https://filemoon.sx/e/{byse_fc}"
                    mapping[d_code]["title"] = f_info.get("file_title") or mapping[d_code].get("title", "")
                    print(f"  ✨ Video Ready on Byse: {d_code} -> {byse_fc} ({mapping[d_code]['byse_url']})")
                    continue

                st = check_remote_status(byse_fc)
                if st:
                    status_str = st.get("status", "")
                    progress = st.get("progress", 0)
                    if status_str in ("WORKING", "FINISHED") or str(progress) == "100":
                        mapping[d_code]["status"] = "READY"
                        mapping[d_code]["byse_url"] = f"https://filemoon.sx/e/{byse_fc}"
                        print(f"  ✨ Video Ready on Byse: {d_code} -> {byse_fc}")
                    elif status_str == "ERROR":
                        mapping[d_code]["status"] = "ERROR"
                        mapping[d_code]["error"] = st.get("error_msg") or st.get("error", "The file is no longer available at the source.")
                        print(f"  ⚠️ Error on {d_code}: {mapping[d_code]['error']}")
                time.sleep(0.3)

    # 2. Queue new items that haven't been mapped yet
    queued_count = 0
    if batch_size > 0:
        for item in curated:
            if queued_count >= batch_size:
                break
            
            embed_url = item.get("embedUrl") or item.get("streamUrl") or ""
            d_code = extract_dood_code(embed_url)
            if not d_code:
                continue
            
            # Already mapped?
            if d_code in mapping:
                continue
            
            print(f"🚀 Queuing ({queued_count+1}/{batch_size}): {item.get('title')} ({d_code})...")
            byse_fc = add_remote_upload(d_code)
            if byse_fc:
                mapping[d_code] = {
                    "dood_code": d_code,
                    "byse_filecode": byse_fc,
                    "byse_url": f"https://filemoon.sx/e/{byse_fc}",
                    "status": "QUEUED",
                    "movie_id": item.get("id"),
                    "title": item.get("title"),
                    "queued_at": time.strftime("%Y-%m-%d %H:%M:%S")
                }
                queued_count += 1
                print(f"   -> Successfully queued with Byse filecode: {byse_fc}")
            else:
                print(f"   -> Failed to queue {d_code}")
            time.sleep(delay)

    # Save mapping
    save_json(MAPPING_FILE, mapping)
    print(f"💾 Updated {MAPPING_FILE} (Total mapped items: {len(mapping)})")

    # 3. Apply ready mappings to curated catalog and full catalog
    apply_mappings_to_catalogs()

def apply_mappings_to_catalogs():
    mapping = load_json(MAPPING_FILE, {})
    if not mapping:
        return

    ready_map = {d_code: info["byse_url"] for d_code, info in mapping.items() if info.get("status") == "READY" and info.get("byse_url")}
    print(f"🔄 Applying {len(ready_map)} READY Byse streams to catalogs...")

    # Update curated catalog
    curated = load_json(CURATED_CATALOG_FILE, [])
    updated_curated = 0
    for item in curated:
        embed_url = item.get("embedUrl") or item.get("streamUrl") or ""
        d_code = extract_dood_code(embed_url)
        if d_code and d_code in ready_map:
            byse_url = ready_map[d_code]
            if item.get("embedUrl") != byse_url or item.get("byseUrl") != byse_url:
                item["byseUrl"] = byse_url
                item["embedUrl"] = byse_url
                item["streamUrl"] = byse_url
                updated_curated += 1

    if updated_curated > 0:
        save_json(CURATED_CATALOG_FILE, curated)
        print(f"  ✅ Updated {updated_curated} items in {CURATED_CATALOG_FILE}")

    # Update full catalog if exists
    full = load_json(FULL_CATALOG_FILE, [])
    updated_full = 0
    if isinstance(full, list):
        for item in full:
            embed_url = item.get("embedUrl") or item.get("streamUrl") or ""
            d_code = extract_dood_code(embed_url)
            if d_code and d_code in ready_map:
                byse_url = ready_map[d_code]
                if item.get("embedUrl") != byse_url or item.get("byseUrl") != byse_url:
                    item["byseUrl"] = byse_url
                    item["embedUrl"] = byse_url
                    item["streamUrl"] = byse_url
                    updated_full += 1
        if updated_full > 0:
            save_json(FULL_CATALOG_FILE, full)
            print(f"  ✅ Updated {updated_full} items in {FULL_CATALOG_FILE}")

    # Update catalog.js
    if updated_curated > 0 or updated_full > 0:
        js_content = f"window.SITE_CATALOG = {json.dumps(curated, ensure_ascii=False, indent=2)};\n"
        with open(CATALOG_JS_FILE, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"  ✅ Updated {CATALOG_JS_FILE}")

def print_status():
    mapping = load_json(MAPPING_FILE, {})
    curated = load_json(CURATED_CATALOG_FILE, [])
    
    total_curated = len(curated)
    ready_count = sum(1 for m in mapping.values() if m.get("status") == "READY")
    queued_count = sum(1 for m in mapping.values() if m.get("status") in ("QUEUED", "WORKING", "PENDING"))
    error_count = sum(1 for m in mapping.values() if m.get("status") == "ERROR")
    unmapped = total_curated - len(mapping)

    print("\n================ BYSE MIGRATION STATUS ================")
    print(f"📁 Total Catalog Items:   {total_curated}")
    print(f"✨ Ready on Byse:         {ready_count}")
    print(f"⏳ In-Progress / Queued:  {queued_count}")
    print(f"⚠️ Source Error:          {error_count}")
    print(f"📦 Unmapped / Remaining:  {max(0, unmapped)}")
    print("=======================================================\n")
    if ready_count > 0:
        print("Recent Ready Items on Byse:")
        for code, info in list(mapping.items())[:10]:
            if info.get("status") == "READY":
                print(f"  - {info.get('title')}: {info.get('byse_url')}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Doodstream to Byse")
    parser.add_argument("--batch", type=int, default=5, help="Number of items to queue")
    parser.add_argument("--check-only", action="store_true", help="Only check status of existing uploads")
    parser.add_argument("--apply-only", action="store_true", help="Only apply mappings to catalog files")
    parser.add_argument("--status", action="store_true", help="Print overall migration status summary")
    args = parser.parse_args()

    if args.status:
        print_status()
        sys.exit(0)

    if not check_account():
        sys.exit(1)

    if args.apply_only:
        apply_mappings_to_catalogs()
    elif args.check_only:
        sync_batch(batch_size=0)
    else:
        sync_batch(batch_size=args.batch)
