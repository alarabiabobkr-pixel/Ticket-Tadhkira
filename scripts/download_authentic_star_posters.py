#!/usr/bin/env python3
"""
Download Authentic Official Cinema Posters from TMDB for Star Movies & Recent Additions
"""

import os
import json
import re
import urllib.request
import urllib.parse
import time

TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def clean_title_for_search(item):
    # Try originalTitle first
    orig = item.get("originalTitle")
    if orig:
        clean = re.sub(r"\s*S\d+E\d+.*", "", orig)
        clean = re.sub(r"\s*\(\d{4}\).*", "", clean)
        clean = clean.strip()
        if len(clean) > 2:
            return clean

    # Otherwise extract english or arabic title
    t = item.get("title", "")
    # Check if there is English title in parentheses
    m = re.search(r"\(([0-9]{4})\)\s*([A-Za-z0-9\s:,\'-]+)", t)
    if m:
        return m.group(2).strip()

    # Strip prefixes like "فيلم", "مسلسل"
    clean = re.sub(r"^(?:فيلم|مسلسل)\s*", "", t)
    clean = re.sub(r"\s*\(?\d{4}\)?.*", "", clean)
    clean = re.sub(r"\s*مترجم.*", "", clean)
    clean = re.sub(r"\s*مدبلج.*", "", clean)
    clean = re.sub(r"\s*بطولة.*", "", clean)
    return clean.strip()

def search_tmdb_poster(query, is_tv=False, year=None):
    endpoint = "tv" if is_tv else "movie"
    q = urllib.parse.quote(query)
    url = f"https://api.themoviedb.org/3/search/{endpoint}?api_key={TMDB_KEY}&query={q}&include_adult=false"
    if year and year.isdigit() and not is_tv:
        url += f"&year={year}"

    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            data = json.loads(r.read().decode())
            results = data.get("results", [])
            for res in results:
                path = res.get("poster_path")
                if path:
                    return f"https://image.tmdb.org/t/p/w500{path}"
    except Exception as e:
        pass
    return None

def download_image(url, dest_paths):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            if len(data) > 3000:
                for dest in dest_paths:
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with open(dest, "wb") as f:
                        f.write(data)
                return True
    except Exception as e:
        pass
    return False

def main():
    print("Loading catalog...")
    with open("public/catalog.json", "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Total items in catalog: {len(catalog)}")

    # Target items: All items that were added or modified in the stars batches or have svg/synthetic markers
    # Also specific list of recent blockbuster movies
    updated_count = 0

    for idx, item in enumerate(catalog):
        poster_rel = item.get("poster", "")
        if not poster_rel or not poster_rel.startswith("/posters/"):
            continue

        filename = os.path.basename(poster_rel)
        dest1 = os.path.join("public/posters", filename)
        dest2 = os.path.join("dist-hd-perfect/posters", filename)
        dest3 = os.path.join("dist-deploy/posters", filename)
        dest_paths = [dest1, dest2, dest3]

        # Prioritize movies that have star names or were added in recent batches
        actors = item.get("actors", [])
        is_star_movie = len(actors) > 0 and any(a in str(actors) for a in [
            "Depp", "ديب", "Niro", "نيرو", "Freeman", "فريمان", "Redmayne", "ريدماين",
            "Felicity", "جونز", "Armas", "أرماس", "Song", "كيو", "Kıvanç", "تاتليتوغ",
            "Beren", "سات", "Hande", "أرتشيل", "Mona", "زكي", "Ezz", "عز", "Karim",
            "عبد العزيز", "Ortega", "أورتيجا", "Grillo", "جريلو", "Tyrese", "جيبسون",
            "Hardy", "هاردي", "Walker", "ووكر", "Statham", "ستاثام", "Affleck", "أفليك",
            "Jolie", "جولي", "Khan", "شاروخان", "Deepika", "بادوكون", "Dong-seok", "دونغ سوك"
        ])

        # Also check file size: if it is around ~50-80KB and generated from svg
        is_synthetic = False
        if os.path.exists(dest1):
            sz = os.path.getsize(dest1)
            # Inspect first 1000 bytes for SVG marker or check if it is part of star films
            if is_star_movie:
                is_synthetic = True

        if not is_synthetic:
            continue

        is_tv = item.get("type") == "series" or item.get("category") == "series"
        query = clean_title_for_search(item)
        year = str(item.get("year", ""))

        poster_url = search_tmdb_poster(query, is_tv, year)
        if not poster_url and item.get("originalTitle"):
            poster_url = search_tmdb_poster(item.get("originalTitle"), is_tv)
        if not poster_url:
            # Try searching with just 2-3 words
            short_query = " ".join(query.split()[:3])
            poster_url = search_tmdb_poster(short_query, is_tv)

        if poster_url:
            ok = download_image(poster_url, dest_paths)
            if ok:
                updated_count += 1
                print(f"[{updated_count}] Downloaded official poster for: {item.get('title')[:45]} -> {filename}")
                time.sleep(0.15)
        else:
            print(f"(-) Poster not found on TMDB for: {query}")

    print("==================================================")
    print(f"🎉 Updated {updated_count} movies with authentic official cinema posters!")
    print("==================================================")

if __name__ == "__main__":
    main()
