#!/usr/bin/env python3
"""
Ticket Vib (تيكت فايب) - Byse / Filemoon New Account Sync Script
Syncs all uploaded movies & series episodes from the new Byse account to catalog.json, curated_catalog.json, and catalog.js
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse

BYSE_API_KEY = os.environ.get("BYSE_API_KEY", "163193bubg5og40y2k2rpo")
BYSE_API_BASE = "https://api.byse.sx"

HEADERS = {
    "User-Agent": "TicketVibSync/2.0"
}

def fetch_all_byse_files(api_key):
    files = []
    page = 1
    print(f"Fetching file list from Byse API using key: {api_key[:6]}...")
    while True:
        url = f"{BYSE_API_BASE}/file/list?key={api_key}&page={page}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") != 200:
                    print(f"API returned status {data.get('status')}: {data.get('msg')}")
                    break
                page_files = data.get("result", {}).get("files", [])
                if not page_files:
                    break
                files.extend(page_files)
                if len(page_files) < 100:
                    break
                page += 1
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
    print(f"Total files fetched from Byse: {len(files)}")
    return files

def normalize_title(t):
    if not t:
        return ""
    t = re.sub(r'[\._\-]+', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

def sync():
    files = fetch_all_byse_files(BYSE_API_KEY)
    if not files:
        print("No files retrieved from Byse.")
        return

    # Load catalogs
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    with open("public/curated_catalog.json", "r", encoding="utf-8") as f:
        curated = json.load(f)

    mapping = {}
    if os.path.exists("public/byse_mapping.json"):
        try:
            with open("public/byse_mapping.json", "r", encoding="utf-8") as f:
                mapping = json.load(f)
        except Exception:
            mapping = {}

    # Build index of files by normalized pattern
    series_episodes_map = {
        "series-el-dayiea-s01": {},
        "series-doroob-al-marjala-s03": {},
        "series-anbar-5-s01": {},
        "series-al-qafer-s01": {},
        "series-watan-a-watar-2026": {},
        "series-jak-al-elm-s03": {},
        "series-al-qarar-s01": {}
    }

    movie_files = {}

    for file_info in files:
        title = file_info.get("title", "")
        code = file_info.get("file_code")
        canplay = file_info.get("canplay", 1)
        if not code:
            continue

        embed_url = f"https://filemoon.sx/e/{code}"

        # Matchers for series
        m_dayiea = re.search(r"el[\s\._]*dayiea[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_doroob = re.search(r"doroob[\s\._]*al[\s\._]*marjala[\s\._]*s03e(\d+)", title, re.IGNORECASE)
        m_anbar = re.search(r"anbar[\s\._]*5[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_qafer = re.search(r"al[\s\._]*qafer[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_watan = re.search(r"watan[\s\._]*a[\s\._]*watar[\s\._]*(?:2026[\s\._]*)?(?:s\d+)?(?:e)?(\d+)", title, re.IGNORECASE)
        m_jak = re.search(r"jak[\s\._]*(?:al|el)[\s\._]*elm[\s\._]*s03e(\d+)", title, re.IGNORECASE)
        m_qarar = re.search(r"al[\s\._]*qarar[\s\._]*s01[\s\._]*e(\d+)", title, re.IGNORECASE)

        if m_dayiea:
            ep_num = int(m_dayiea.group(1))
            series_episodes_map["series-el-dayiea-s01"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_doroob:
            ep_num = int(m_doroob.group(1))
            series_episodes_map["series-doroob-al-marjala-s03"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_anbar:
            ep_num = int(m_anbar.group(1))
            series_episodes_map["series-anbar-5-s01"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_qafer:
            ep_num = int(m_qafer.group(1))
            series_episodes_map["series-al-qafer-s01"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_watan:
            ep_num = int(m_watan.group(1))
            series_episodes_map["series-watan-a-watar-2026"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_jak:
            ep_num = int(m_jak.group(1))
            series_episodes_map["series-jak-al-elm-s03"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        elif m_qarar:
            ep_num = int(m_qarar.group(1))
            series_episodes_map["series-al-qarar-s01"][ep_num] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }
        else:
            norm = normalize_title(title)
            movie_files[norm] = {
                "file_code": code,
                "embed_url": embed_url,
                "title": title
            }

        # Store in mapping
        mapping[code] = {
            "byse_filecode": code,
            "byse_url": embed_url,
            "title": title,
            "status": "READY" if canplay == 1 else "PROCESSING"
        }

    # Update catalog
    total_episodes_linked = 0
    series_updated = set()

    for item in catalog:
        item_id = item.get("id")
        if item_id in series_episodes_map:
            eps_to_link = series_episodes_map[item_id]
            ep_list = item.get("episodes", [])
            for ep in ep_list:
                ep_num = ep.get("episodeNum")
                if ep_num in eps_to_link:
                    ep_data = eps_to_link[ep_num]
                    ep["embedUrl"] = ep_data["embed_url"]
                    ep["streamUrl"] = ep_data["embed_url"]
                    ep["byseUrl"] = ep_data["embed_url"]
                    ep["code"] = ep_data["file_code"]
                    total_episodes_linked += 1
                    series_updated.add(item_id)
            
            # If episode 1 is linked, also set the main series embedUrl to Ep 1
            if 1 in eps_to_link:
                ep1_url = eps_to_link[1]["embed_url"]
                item["embedUrl"] = ep1_url
                item["streamUrl"] = ep1_url
                item["byseUrl"] = ep1_url

    # Also update curated catalog
    for item in curated:
        item_id = item.get("id")
        if item_id in series_episodes_map:
            eps_to_link = series_episodes_map[item_id]
            ep_list = item.get("episodes", [])
            for ep in ep_list:
                ep_num = ep.get("episodeNum")
                if ep_num in eps_to_link:
                    ep_data = eps_to_link[ep_num]
                    ep["embedUrl"] = ep_data["embed_url"]
                    ep["streamUrl"] = ep_data["embed_url"]
                    ep["byseUrl"] = ep_data["embed_url"]
                    ep["code"] = ep_data["file_code"]
            if 1 in eps_to_link:
                ep1_url = eps_to_link[1]["embed_url"]
                item["embedUrl"] = ep1_url
                item["streamUrl"] = ep1_url
                item["byseUrl"] = ep1_url

    # Save catalog.json
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    # Save curated_catalog.json
    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=2)

    # Save catalog.js
    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.SITE_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    # Save byse_mapping.json
    with open("public/byse_mapping.json", "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"\n==========================================")
    print(f"✅ Sync Finished Successfully!")
    print(f"Total series updated: {len(series_updated)}")
    for sid, eps in series_episodes_map.items():
        print(f"  - {sid}: {len(eps)} episodes linked ({sorted(eps.keys())})")
    print(f"Total episodes linked across site: {total_episodes_linked}")
    print(f"==========================================")

if __name__ == "__main__":
    sync()
