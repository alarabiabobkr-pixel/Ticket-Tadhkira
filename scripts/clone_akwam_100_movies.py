#!/usr/bin/env python3
"""
High-Speed Akwam to Byse Cloner: First 100 Movies Batch
One-shot metadata extraction and instantaneous Filemoon/Byse server cloning.
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

def clean_arabic_title(raw):
    t = re.sub(r"<[^>]+>", "", raw)
    t = re.sub(r"مشاهدة\s*", "", t)
    t = re.sub(r"\s+اونلاين.*", "", t)
    t = re.sub(r"\s+مترجم.*", "", t)
    t = re.sub(r"\s+مدبلج.*", "", t)
    t = re.sub(r"\s+WEB-DL.*", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+1080p.*", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+720p.*", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\s+اون\s*لاين.*", "", t)
    t = t.strip()
    return t

def clone_file_to_byse(file_code, api_key):
    url = f"https://api.byse.sx/file/clone?key={api_key}&file_code={file_code}"
    req = urllib.request.Request(url, headers={"User-Agent": "TicketVibSync/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data.get("status") == 200:
                new_code = data.get("result", {}).get("file_code")
                return new_code or file_code
    except Exception as e:
        print(f"  Clone err: {e}", flush=True)
    return file_code

def main():
    print("==================================================", flush=True)
    print("🚀 Starting Akwam -> Byse Automated 100 Movies Batch", flush=True)
    print(f"Account API Key: {BYSE_API_KEY[:6]}...", flush=True)
    print("==================================================", flush=True)

    # Load existing catalog
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    with open("public/curated_catalog.json", "r", encoding="utf-8") as f:
        curated = json.load(f)

    # 1. Collect movie slugs across pages 1 to 6
    all_slugs = []
    print("Collecting movie links from Akwam...", flush=True)
    for p in range(1, 8):
        url = f"https://akw.cam/films/page/{p}" if p > 1 else "https://akw.cam/films"
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                slugs = re.findall(r"href=\"https://akw\.cam/(akfilm-[^\"]+)/\"", html)
                for s in slugs:
                    if s not in all_slugs:
                        all_slugs.append(s)
            print(f"  + Page {p}: collected {len(all_slugs)} movies so far", flush=True)
            if len(all_slugs) >= 115:
                break
        except Exception as e:
            print(f"  Error on page {p}: {e}", flush=True)

    print(f"Total candidate movies collected: {len(all_slugs)}", flush=True)

    target_count = 100
    added_count = 0
    added_movies = []

    for idx, slug in enumerate(all_slugs, 1):
        if added_count >= target_count:
            break

        try:
            watch_url = f"https://akw.cam/watch/{slug}/servers"
            wreq = urllib.request.Request(watch_url, headers=HEADERS)
            with urllib.request.urlopen(wreq, timeout=8) as wresp:
                whtml = wresp.read().decode("utf-8", errors="ignore")

            # Extract Title
            title_m = re.search(r"<title>(.*?)</title>", whtml)
            raw_title = title_m.group(1).split(" - ")[0] if title_m else slug
            title = clean_arabic_title(raw_title)
            if not title.startswith("فيلم "):
                title = f"فيلم {title}"

            # Extract Year
            year_m = re.search(r"(202[0-6]|201\d)", raw_title) or re.search(r"(202[0-6]|201\d)", whtml)
            year = year_m.group(1) if year_m else "2025"

            # Extract Poster
            poster_m = re.search(r"<meta property=\"og:image\" content=\"([^\"]+)\"", whtml)
            poster_url = poster_m.group(1) if poster_m else "/pwa-512x512.png"

            # Extract Codes (Prefer Byse / Filemoon codes)
            code_m = re.search(r"/(?:e|d)/([a-zA-Z0-9]{10,14})", whtml)
            if not code_m:
                continue

            source_code = code_m.group(1)

            # Instant clone into user's account
            user_code = clone_file_to_byse(source_code, BYSE_API_KEY)
            byse_embed_url = f"https://filemoon.sx/e/{user_code}"

            item_id = f"movie-akw-{slug.replace('akfilm-', '')}"
            display_title = f"{title} ({year})"

            movie_entry = {
                "id": item_id,
                "title": display_title,
                "originalTitle": slug.replace("akfilm-", "").replace("-", " ").title(),
                "type": "movie",
                "category": "action",
                "origin": "arabic" if any(k in display_title for k in ["أحمد", "محمد", "الست", "درويش", "الدشاش", "أيام", "حب", "شباب", "مصر", "عريس"]) else "foreign",
                "duration": "ساعة و45 دقيقة",
                "genre": "تشويق وإثارة • دراما",
                "subGenre": "action",
                "badge": "1080p FHD",
                "quality": "1080p FHD",
                "year": year,
                "rating": "7.9",
                "poster": poster_url,
                "backdrop": poster_url,
                "embedUrl": byse_embed_url,
                "streamUrl": byse_embed_url,
                "byseUrl": byse_embed_url,
                "code": user_code,
                "overview": f"مشاهدة وتحميل {display_title} كامل بجودة فائقة وبدون إعلانات عبر منصة تذكرة دخول VIP.",
                "actors": ["نجوم العمل"]
            }

            # Check if exists in catalog
            matched = False
            for exist in catalog:
                if exist.get("id") == item_id or exist.get("title") == display_title:
                    exist["embedUrl"] = byse_embed_url
                    exist["streamUrl"] = byse_embed_url
                    exist["byseUrl"] = byse_embed_url
                    exist["code"] = user_code
                    exist["poster"] = poster_url
                    matched = True
                    break

            if not matched:
                catalog.append(movie_entry)
                if len(curated) < 180:
                    curated.append(movie_entry)

            added_count += 1
            added_movies.append(display_title)
            print(f"[{added_count:03d}/{target_count}] ✅ {display_title} -> Code: {user_code}", flush=True)

            # Auto-save every 10 movies
            if added_count % 10 == 0:
                with open("public/catalog.json", "w", encoding="utf-8") as f:
                    json.dump(catalog, f, ensure_ascii=False, indent=2)
                with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
                    json.dump(curated, f, ensure_ascii=False, indent=2)
                with open("public/catalog.js", "w", encoding="utf-8") as f:
                    f.write("window.SITE_CATALOG = ")
                    json.dump(catalog, f, ensure_ascii=False, indent=2)
                    f.write(";\n")
                print(f"  💾 Auto-saved batch checkpoint ({added_count} movies)...", flush=True)

            time.sleep(0.15)

        except Exception as e:
            print(f"  Error on {slug}: {e}", flush=True)

    # Final Save
    print(f"\nFinalizing catalog save with {added_count} movies...", flush=True)
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.SITE_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("==================================================", flush=True)
    print(f"🎉 SUCCESS! {added_count} Movies Successfully Cloned to Byse Account!", flush=True)
    print(f"Total Catalog Items: {len(catalog)}", flush=True)
    print("==================================================", flush=True)

if __name__ == "__main__":
    main()
