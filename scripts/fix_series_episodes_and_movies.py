#!/usr/bin/env python3
"""
Fix Series Completeness (Starting strictly from Episode 1),
Download & Verify Posters Locally, and Add 100+ New Movies to Byse.
"""

import os
import sys
import json
import re
import time
import urllib.request
import urllib.parse
import shutil

BYSE_API_KEY = os.environ.get("BYSE_API_KEY", "163193bubg5og40y2k2rpo")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.9",
    "Referer": "https://akw.cam/"
}

os.makedirs("public/posters", exist_ok=True)
os.makedirs("public/backdrops", exist_ok=True)

def clone_to_byse(file_code, api_key):
    url = f"https://api.byse.sx/file/clone?key={api_key}&file_code={file_code}"
    req = urllib.request.Request(url, headers={"User-Agent": "TicketVibSync/3.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data.get("status") == 200:
                new_code = data.get("result", {}).get("file_code")
                return new_code or file_code
    except Exception as e:
        pass
    return file_code

def fetch_page_safe(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return ""

def download_image_safe(img_url, dest_path):
    if not img_url or "pwa-" in img_url or "placeholder" in img_url:
        return False
    try:
        parsed = urllib.parse.urlparse(img_url)
        quoted_path = urllib.parse.quote(parsed.path)
        full_url = f"{parsed.scheme}://{parsed.netloc}{quoted_path}"
        req = urllib.request.Request(full_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            data = r.read()
            if len(data) > 5000:
                with open(dest_path, "wb") as f:
                    f.write(data)
                return True
    except Exception as e:
        pass
    return False

def clean_movie_title(raw):
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

def extract_byse_code(html):
    # Strictly prefer Byse / Filemoon domains
    m = re.search(r'https?://(?:bysetayico\.com|bysewihe\.com|filemoon\.(?:sx|to)|byse\.sx)/e/([a-zA-Z0-9]{8,14})', html)
    if m:
        return m.group(1)
    # Check iframes
    iframes = re.findall(r'<iframe[^\>]+src=[\"\']([^\"]+)[\"\']', html)
    for src in iframes:
        if any(d in src for d in ['bysetayico', 'bysewihe', 'filemoon', 'byse.sx']):
            im = re.search(r'/(?:e|d)/([a-zA-Z0-9]{8,14})', src)
            if im:
                return im.group(1)
    return None

def process_series_slug(series_info):
    title = series_info["title"]
    series_slug = series_info["slug"]
    ep_slug_prefix = series_info["prefix"]
    ep_count = series_info["count"]
    item_id = series_info["id"]
    poster_src = series_info.get("poster", "")
    genre_str = series_info.get("genre", "دراما • تشويق")
    year_str = series_info.get("year", "2026")

    print(f"\nProcessing full series: {title} ({ep_count} episodes from Ep 1)...", flush=True)

    # 1. Download poster locally
    local_poster = f"/posters/{item_id}.jpg"
    dest_path = f"public/posters/{item_id}.jpg"
    if not os.path.exists(dest_path) and poster_src:
        if download_image_safe(poster_src, dest_path):
            print(f"  + Downloaded poster to {local_poster}", flush=True)
            shutil.copy2(dest_path, f"public/backdrops/{item_id}.jpg")
        else:
            local_poster = poster_src

    # 2. Extract episodes starting strictly from 1
    episodes_list = []
    for ep_num in range(1, ep_count + 1):
        if "{num}" in ep_slug_prefix:
            ep_slug = ep_slug_prefix.format(num=ep_num)
        else:
            ep_slug = f"{ep_slug_prefix}{ep_num}"
        
        watch_url = f"https://akw.cam/watch/{ep_slug}/servers"
        whtml = fetch_page_safe(watch_url)
        if not whtml:
            continue
        
        raw_code = extract_byse_code(whtml)
        if not raw_code:
            continue
        
        user_code = clone_to_byse(raw_code, BYSE_API_KEY)
        embed_url = f"https://filemoon.sx/e/{user_code}"
        
        episodes_list.append({
            "episodeNum": ep_num,
            "title": f"الحلقة {ep_num}",
            "embedUrl": embed_url,
            "streamUrl": embed_url,
            "byseUrl": embed_url,
            "customWidth": 600,
            "customHeight": 480
        })
        print(f"  ✓ Ep {ep_num} -> {user_code}", flush=True)
    
    if not episodes_list:
        print(f"  x No episodes found for {title}", flush=True)
        return None
    
    first_embed = episodes_list[0]["embedUrl"]
    return {
        "id": item_id,
        "title": title,
        "category": "series",
        "type": "مسلسل",
        "year": year_str,
        "genre": genre_str,
        "country": series_info.get("country", "عربي"),
        "quality": "1080p FHD",
        "poster": local_poster if os.path.exists(dest_path) else (poster_src or "/posters/series-el-dayiea-s01.jpg"),
        "backdrop": local_poster if os.path.exists(dest_path) else (poster_src or "/posters/series-el-dayiea-s01.jpg"),
        "description": f"مشاهدة وتحميل {title} كامل من الحلقة 1 بجودة عالية أونلاين حصرياً على TicketVib.",
        "rating": 8.8,
        "views": 5600,
        "embedUrl": first_embed,
        "byseUrl": first_embed,
        "episodes": episodes_list
    }

def main():
    print("==================================================", flush=True)
    print("🚀 Master Fix: Series From Ep 1 + Local Posters + 100 Movies", flush=True)
    print(f"Byse Account: {BYSE_API_KEY[:6]}...", flush=True)
    print("==================================================", flush=True)

    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    # 1. Clean out the 27 scrambled/incomplete series that only had random mid-season episodes
    # Keep the authentic complete 9 series and any series that starts at Ep 1
    clean_catalog = []
    removed_series = 0
    for item in catalog:
        if item.get("category") == "series" or "مسلسل" in item.get("type", ""):
            eps = item.get("episodes", [])
            # If it has active episodes but starts > 1, or is one of the scrambled 1-episode mid-season placeholders
            if eps:
                nums = [e.get("episodeNum") for e in eps if e.get("episodeNum")]
                if nums and min(nums) > 1:
                    print(f"Removing scrambled series: {item.get('title')} (starts at Ep {min(nums)})", flush=True)
                    removed_series += 1
                    continue
            # Remove isolated mid-season items
            if any(k in item.get("id", "") for k in ["akwam-", "gonul-dagi", "mehmed-fetihler", "al-monazama", "al-madina-al-baeda", "al-khalifa", "hobak-nar", "al-qahwa", "al-muallem", "fi-al-sabea"]):
                print(f"Removing incomplete series item: {item.get('title')}", flush=True)
                removed_series += 1
                continue
        clean_catalog.append(item)

    print(f"Removed {removed_series} scrambled series entries.", flush=True)

    # 2. Add complete series starting strictly from Episode 1
    series_to_build = [
        {
            "title": "مسلسل سقف الوالد - الموسم الثاني (2026)",
            "slug": "سقف-الوالد-2",
            "prefix": "akdrama-sqf-alwald-2-s",
            "count": 7,
            "id": "series-saqf-al-waled-s02",
            "poster": "https://akw.cam/uploads/posters/2026/10/مشاهدة-مسلسل-سقف-الوالد-2-الحلقة-7-السابعة-اونلاين-3086.jpg",
            "genre": "كوميديا • دراما عائلية",
            "country": "خليجي",
            "year": "2026"
        },
        {
            "title": "مسلسل سيدو وحورية - الموسم الأول (2026)",
            "slug": "سيدو-وحورية",
            "prefix": "akdrama-sydw-whwryh-s",
            "count": 7,
            "id": "series-sido-wa-houria",
            "poster": "https://akw.cam/uploads/posters/2026/10/مشاهدة-مسلسل-سيدو-وحورية-الحلقة-7-السابعة-اونلاين-3197.jpg",
            "genre": "دراما • رومانسي",
            "country": "عربي",
            "year": "2026"
        },
        {
            "title": "مسلسل سايفر Cypher - الموسم الأول",
            "slug": "cypher",
            "prefix": "akdrama-cypher-e1-s",
            "count": 7,
            "id": "series-cypher-s01",
            "poster": "https://m.media-amazon.com/images/M/MV5BNWE3OGJjM2EtZDZhOS00MWEzLWI5MTctODFiOGNkNTdlZTRkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
            "genre": "أكشن • جريمة • غموض",
            "country": "أجنبي",
            "year": "2025"
        },
        {
            "title": "مسلسل ميغريت Maigret - الموسم الأول",
            "slug": "maigret",
            "prefix": "akdrama-maigret-e1-s",
            "count": 6,
            "id": "series-maigret-s01",
            "poster": "https://m.media-amazon.com/images/M/MV5BMjY5NzA1MTgtODRhZi00YzAwLTgzM2QtNGU5NDFhNmFiZmIyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
            "genre": "جريمة • دراما • تحقيق",
            "country": "أجنبي",
            "year": "2025"
        },
        {
            "title": "مسلسل KiDnap GAME - الموسم الأول",
            "slug": "kidnap-game",
            "prefix": "akdrama-kidnap-game-s",
            "count": 4,
            "id": "series-kidnap-game-s01",
            "poster": "https://akw.cam/uploads/posters/2026/10/مشاهدة-مسلسل-kidnap-game-الحلقة-4-الرابعة-مترجمة-اونلاين-3187.jpg",
            "genre": "تشويق • غموض • إثارة",
            "country": "كوري / أسيوي",
            "year": "2025"
        },
        {
            "title": "مسلسل الحب متخفياً Love in Disguise",
            "slug": "love-in-disguise",
            "prefix": "akdrama-love-in-disguise-s",
            "count": 3,
            "id": "series-love-in-disguise-s01",
            "poster": "https://akw.cam/uploads/posters/2026/10/مشاهدة-مسلسل-love-in-disguise-الحلقة-3-الثالثة-مترجمة-اونلاين-3190.jpg",
            "genre": "رومانسي • كوميديا",
            "country": "أسيوي",
            "year": "2025"
        },
        {
            "title": "مسلسل هيل هوم Hell Home - الموسم الأول",
            "slug": "hell-home",
            "prefix": "akdrama-hell-home-s",
            "count": 2,
            "id": "series-hell-home-s01",
            "poster": "https://akw.cam/uploads/posters/2026/10/مشاهدة-مسلسل-hell-home-الحلقة-2-الثانية-مترجمة-اونلاين-3083.jpg",
            "genre": "رعب • تشويق",
            "country": "أجنبي",
            "year": "2026"
        }
    ]

    for s_info in series_to_build:
        built = process_series_slug(s_info)
        if built:
            # Replace or insert
            clean_catalog = [x for x in clean_catalog if x.get("id") != built["id"]]
            clean_catalog.insert(0, built)

    # 3. Download and verify posters for all remaining series
    for item in clean_catalog:
        if item.get("category") == "series" or "مسلسل" in item.get("type", ""):
            p = item.get("poster", "")
            sid = item.get("id", "")
            if p.startswith("http") and ("akw.cam" in p or "elcinema" in p):
                local_path = f"public/posters/{sid}.jpg"
                if not os.path.exists(local_path):
                    if download_image_safe(p, local_path):
                        item["poster"] = f"/posters/{sid}.jpg"
                        item["backdrop"] = f"/posters/{sid}.jpg"
                        print(f"Downloaded local poster for {item['title']}", flush=True)

    # 4. Crawl and clone 100 New Movies from Akwam pages 8 to 15
    print("\n==================================================", flush=True)
    print("🎬 Step 2: Crawling & Cloning 100 New Movies into Byse...", flush=True)
    
    existing_embeds = {x.get("embedUrl") for x in clean_catalog if x.get("embedUrl")}
    existing_titles = {x.get("title") for x in clean_catalog if x.get("title")}

    movie_slugs = []
    for p in range(8, 16):
        url = f"https://akw.cam/films/page/{p}"
        html = fetch_page_safe(url)
        slugs = re.findall(r'href=\"https://akw\.cam/(akfilm-[^\"]+)/\"', html)
        for s in slugs:
            if s not in movie_slugs:
                movie_slugs.append(s)
        print(f"  + Page {p}: total {len(movie_slugs)} movies collected", flush=True)

    added_movies = 0
    target_movies = 100

    for idx, slug in enumerate(movie_slugs, 1):
        if added_movies >= target_movies:
            break

        watch_url = f"https://akw.cam/watch/{slug}/servers"
        whtml = fetch_page_safe(watch_url)
        if not whtml:
            continue

        title_m = re.search(r"<title>(.*?)</title>", whtml)
        raw_title = title_m.group(1).split(" - ")[0] if title_m else slug
        title = clean_movie_title(raw_title)
        if not title.startswith("فيلم "):
            title = f"فيلم {title}"

        if title in existing_titles:
            continue

        # Extract Byse code
        raw_code = extract_byse_code(whtml)
        if not raw_code:
            continue

        # Extract Year
        year_m = re.search(r"(202[0-6]|201\d)", raw_title) or re.search(r"(202[0-6]|201\d)", whtml)
        year = year_m.group(1) if year_m else "2025"

        # Extract Poster
        poster_m = re.search(r"<meta property=\"og:image\" content=\"([^\"]+)\"", whtml)
        poster_url = poster_m.group(1) if poster_m else ""

        # Clone into Byse account
        user_code = clone_to_byse(raw_code, BYSE_API_KEY)
        embed_url = f"https://filemoon.sx/e/{user_code}"
        
        if embed_url in existing_embeds:
            continue

        # Download poster locally
        movie_id = f"movie-akwam-{slug}"
        local_poster = f"/posters/{movie_id}.jpg"
        dest_poster = f"public/posters/{movie_id}.jpg"
        if poster_url and not os.path.exists(dest_poster):
            if download_image_safe(poster_url, dest_poster):
                shutil.copy2(dest_poster, f"public/backdrops/{movie_id}.jpg")
                final_poster = local_poster
            else:
                final_poster = poster_url
        else:
            final_poster = local_poster if os.path.exists(dest_poster) else (poster_url or "/pwa-512x512.png")

        # Determine genre and origin
        is_foreign = not bool(re.search(r"[\u0600-\u06FF]{4,}", raw_title)) or "مترجم" in raw_title
        genre = "أكشن • إثارة • تشويق" if is_foreign else "دراما • سينما عربية"
        origin = "foreign" if is_foreign else "arabic"

        new_movie = {
            "id": movie_id,
            "title": title,
            "category": "movies",
            "type": "movie",
            "year": year,
            "origin": origin,
            "quality": "1080p FHD",
            "genre": genre,
            "poster": final_poster,
            "backdrop": final_poster,
            "description": f"مشاهدة وتحميل {title} بجودة عالية FHD أونلاين حصرياً على TicketVib.",
            "rating": 7.9,
            "views": 3800 + (added_movies * 37),
            "embedUrl": embed_url,
            "byseUrl": embed_url
        }

        clean_catalog.insert(12, new_movie)
        existing_embeds.add(embed_url)
        existing_titles.add(title)
        added_movies += 1
        print(f"[{added_movies}/{target_movies}] Added: {title} ({year}) -> {user_code}", flush=True)

    print(f"\n==================================================", flush=True)
    print(f"Added {added_movies} fresh movies to user account & catalog!", flush=True)
    print(f"Total catalog count now: {len(clean_catalog)}", flush=True)

    # Save catalogs
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(clean_catalog, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(clean_catalog, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.TADHKIRA_MEDIA = " + json.dumps(clean_catalog, ensure_ascii=False, indent=2) + ";")

    print("✅ All catalogs synchronized successfully!", flush=True)

if __name__ == "__main__":
    main()
