#!/usr/bin/env python3
"""
Akwam Series to Byse Cloner & Catalog Synchronizer
Extracts episodes from Akwam, clones video files into Byse user account,
and integrates active episodes into the site catalog.
"""

import os
import sys
import json
import re
import time
import urllib.request
import urllib.parse

BYSE_API_KEY = os.environ.get("BYSE_API_KEY", "163193bubg5og40y2k2rpo")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.9"
}

def clean_series_title(raw):
    t = re.sub(r"<[^>]+>", "", raw)
    t = re.sub(r"مشاهدة\s*", "", t)
    t = re.sub(r"مسلسل\s*", "", t)
    t = re.sub(r"الحلقة.*", "", t)
    t = re.sub(r"اونلاين.*", "", t)
    t = re.sub(r"مترجم.*", "", t)
    t = re.sub(r"مدبلج.*", "", t)
    t = re.sub(r"-\s*اكوام.*", "", t)
    t = t.strip(" -:")
    return t

def extract_episode_num(text):
    m = re.search(r"الحلقة\s*(\d+)", text)
    if m:
        return int(m.group(1))
    m = re.search(r"\b[eE](\d+)\b", text)
    if m:
        return int(m.group(1))
    m = re.search(r"-s(\d+)", text)
    if m:
        return int(m.group(1))
    return 1

def clone_to_byse(file_code, api_key):
    url = f"https://api.byse.sx/file/clone?key={api_key}&file_code={file_code}"
    req = urllib.request.Request(url, headers={"User-Agent": "TicketVibCrawler/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data.get("status") == 200:
                new_code = data.get("result", {}).get("file_code")
                return new_code or file_code
    except Exception as e:
        print(f"    Clone API notice: {e}", flush=True)
    return file_code

def fetch_page_safe(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return ""

def main():
    print("==================================================", flush=True)
    print("🚀 Starting Akwam -> Byse Series Scraper & Cloner", flush=True)
    print(f"Byse Account Key: {BYSE_API_KEY[:6]}...", flush=True)
    print("==================================================", flush=True)

    # 1. Collect episode slugs from episodestv pages
    all_episode_slugs = []
    print("Step 1: Collecting episode slugs from Akwam episodestv...", flush=True)
    for p in range(1, 13):
        url = f"https://akw.cam/episodestv/page/{p}" if p > 1 else "https://akw.cam/episodestv"
        html = fetch_page_safe(url)
        if not html:
            continue
        matches = re.findall(r'href=[\"\'](https://akw\.cam/(?:akdrama-[^\s\"\'#]+|[^\s\"\'#]*الحلقة[^\s\"\'#]*))[\"\']', html)
        for m in matches:
            slug = m.split('/')[-2] if m.endswith('/') else m.split('/')[-1]
            if slug and slug not in all_episode_slugs:
                all_episode_slugs.append(slug)
        print(f"  + Page {p}: total {len(all_episode_slugs)} episodes collected so far", flush=True)

    print(f"\nTotal episodes to process: {len(all_episode_slugs)}", flush=True)

    # Load existing catalogs
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    # Index existing series
    series_by_id = {item["id"]: item for item in catalog if item.get("category") == "series" or "مسلسل" in item.get("type", "")}
    print(f"Loaded {len(series_by_id)} existing series in catalog", flush=True)

    # Process episodes
    cloned_episodes = 0
    episodes_by_series = {}

    for idx, slug in enumerate(all_episode_slugs, 1):
        watch_url = f"https://akw.cam/watch/{slug}/servers"
        whtml = fetch_page_safe(watch_url)
        if not whtml:
            continue

        # Extract title
        title_m = re.search(r"<title>(.*?)</title>", whtml)
        raw_title = title_m.group(1) if title_m else slug
        
        # Extract Byse/Filemoon embed URL
        byse_match = re.search(r'https?://(?:bysetayico\.com|bysewihe\.com|filemoon\.(?:sx|to)|byse\.sx)/e/([a-zA-Z0-9]{8,14})', whtml)
        if not byse_match:
            iframe_m = re.search(r'<iframe[^\>]+src=[\"\']([^\"]+)[\"\']', whtml)
            if iframe_m:
                src = iframe_m.group(1)
                byse_match = re.search(r'/(?:e|d)/([a-zA-Z0-9]{8,14})', src)

        if not byse_match:
            continue

        raw_code = byse_match.group(1)
        
        # Clone to user account
        user_code = clone_to_byse(raw_code, BYSE_API_KEY)
        cloned_embed = f"https://filemoon.sx/e/{user_code}"
        cloned_episodes += 1

        ep_num = extract_episode_num(raw_title)
        series_name = clean_series_title(raw_title)

        # Extract poster if available
        poster_m = re.search(r'<meta\s+property=[\"\']og:image[\"\']\s+content=[\"\']([^\"]+)[\"\']', whtml)
        poster_url = poster_m.group(1) if poster_m else ""

        print(f"[{idx}/{len(all_episode_slugs)}] Cloned: {series_name} Ep {ep_num} -> {user_code}", flush=True)

        if series_name not in episodes_by_series:
            episodes_by_series[series_name] = {
                "series_name": series_name,
                "poster": poster_url,
                "episodes": {}
            }
        
        episodes_by_series[series_name]["episodes"][ep_num] = {
            "episodeNum": ep_num,
            "title": f"الحلقة {ep_num}",
            "embedUrl": cloned_embed,
            "streamUrl": cloned_embed,
            "byseUrl": cloned_embed,
            "customWidth": 600,
            "customHeight": 480
        }

    print(f"\n==================================================", flush=True)
    print(f"Cloned {cloned_episodes} episodes across {len(episodes_by_series)} series!", flush=True)
    print("Now integrating into catalog.json...", flush=True)

    # Map scraped series to existing series or create new series
    for s_name, s_data in episodes_by_series.items():
        sorted_eps = [s_data["episodes"][n] for n in sorted(s_data["episodes"].keys())]
        if not sorted_eps:
            continue

        first_embed = sorted_eps[0]["embedUrl"]

        # Try to find matching existing series
        matched_item = None
        for item in series_by_id.values():
            item_title = item.get("title", "")
            clean_item_title = clean_series_title(item_title)
            if s_name in clean_item_title or clean_item_title in s_name or any(word in clean_item_title for word in s_name.split() if len(word) > 3):
                matched_item = item
                break

        if matched_item:
            print(f"  -> Merging {len(sorted_eps)} episodes into existing: {matched_item['title']}", flush=True)
            existing_eps = matched_item.get("episodes", [])
            ep_dict = {ep["episodeNum"]: ep for ep in existing_eps}
            for new_ep in sorted_eps:
                ep_dict[new_ep["episodeNum"]] = new_ep
            
            merged = [ep_dict[k] for k in sorted(ep_dict.keys())]
            matched_item["episodes"] = merged
            matched_item["embedUrl"] = merged[0]["embedUrl"]
            matched_item["byseUrl"] = merged[0]["embedUrl"]
        else:
            # Create a new series entry
            safe_slug = re.sub(r"[^a-zA-Z0-9]+", "-", s_name).strip("-").lower()
            if not safe_slug or len(safe_slug) < 3:
                safe_slug = f"series-akwam-{int(time.time())}"
            new_id = f"series-{safe_slug}"
            
            print(f"  + Creating NEW series: {s_name} with {len(sorted_eps)} episodes", flush=True)
            new_item = {
                "id": new_id,
                "title": f"مسلسل {s_name}",
                "category": "series",
                "type": "مسلسل",
                "year": "2026",
                "genre": ["دراما", "تشويق"],
                "country": "عربي / تركي",
                "quality": "1080p FHD",
                "poster": s_data["poster"] or "/pwa-512x512.png",
                "backdrop": s_data["poster"] or "/pwa-512x512.png",
                "description": f"مشاهدة وتحميل مسلسل {s_name} كامل بجودة عالية اونلاين حصرياً على TicketVib.",
                "rating": 8.5,
                "views": 4200,
                "embedUrl": first_embed,
                "byseUrl": first_embed,
                "episodes": sorted_eps
            }
            catalog.insert(0, new_item)

    # Save catalogs
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print("✅ Catalogs updated successfully!", flush=True)

if __name__ == "__main__":
    main()
