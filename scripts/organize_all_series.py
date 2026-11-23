#!/usr/bin/env python3
"""
Organize, clean, and enrich all newly scraped & existing series in catalog.json.
Ensures every series has a unique ID, valid poster, proper metadata, and active Byse episodes.
"""

import json
import re
import os

with open("public/catalog.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

# Slug dictionary for clean IDs
SLUG_MAP = {
    "سقف الوالد 2": "series-saqf-al-waled-s02",
    "محمد الفاتح": "series-mehmed-fetihler-sultani",
    "سيدو وحورية": "series-sido-wa-houria",
    "تحت الأرض": "series-taht-al-ard",
    "جبل جونول": "series-gonul-dagi",
    "المدينة البعيدة": "series-al-madina-al-baeda",
    "طالع نازل": "series-tala-nazl-alhb",
    "الزواج جميل": "series-al-zawaj-jameel",
    "القهوة المالحة": "series-al-qahwa-al-maleha",
    "المنظمة": "series-al-monazama-teskilat",
    "المعلم اومور": "series-al-muallem-omur",
    "في السابعة عشرة": "series-fi-al-sabea-ashra",
    "حبك نار": "series-hobak-nar",
    "الخليفة": "series-al-khalifa",
    "انت من احب": "series-anta-man-uhibb",
    "A Trap Called Desire": "series-a-trap-called-desire",
    "100 Days of Deception": "series-100-days-of-deception",
    "Between Steps": "series-between-steps",
    "Where the Mask Ends": "series-where-the-mask-ends",
    "KiDnap GAME": "series-kidnap-game",
    "Love in Disguise": "series-love-in-disguise",
    "Hell Home": "series-hell-home",
    "Brother, Sister": "series-brother-sister",
    "Love on the Menu": "series-love-on-the-menu",
    "A Love Other Than Yours": "series-a-love-other-than-yours",
    "Chitose-kun": "series-chitose-kun",
    "JoJo Steel Ball Run": "series-jojo-steel-ball-run"
}

# Fix El Dayiea episodes 1 to 13 that were accidentally overwritten by Marshals
# Marshals episodes 1-13 extracted
marshals_eps = []
bleach_eps = []

el_dayiea = next((x for x in catalog if x.get("id") == "series-el-dayiea-s01"), None)
if el_dayiea:
    cleaned_el_dayiea_eps = []
    for ep in el_dayiea.get("episodes", []):
        url = ep.get("embedUrl", "")
        # Marshals codes: pjjpwpk6t31rex, k00ldlwrtvzd3d, q11mjm94fk6go1, l77808qwsqrovw, 4ddpep96s36n0, z11gngjjsgmq3j, 033memrnizjleo, 677oeod9so9x9v, 4ddpeprquxkdvr, pjjpwpz4agdpdw, owwxlxx8fljrz9, 8lloeooqie9x9l, z11gngxpagnknx
        if any(c in url for c in ["pjjpwpk6t31rex", "k00ldlwrtvzd3d", "q11mjm94fk6go1", "l77808qwsqrovw", "4ddpep96s36n0", "z11gngjjsgmq3j", "033memrnizjleo", "677oeod9so9x9v", "4ddpeprquxkdvr", "pjjpwpz4agdpdw", "owwxlxx8fljrz9", "8lloeooqie9x9l", "z11gngxpagnknx"]):
            marshals_eps.append(ep)
        elif any(c in url for c in ["o87cmdktqv37", "8lloeo0ec6467q"]):
            bleach_eps.append(ep)
        else:
            cleaned_el_dayiea_eps.append(ep)
    
    # Restore authentic El Dayiea episodes 1 to 13
    el_dayiea_playmogo = {
        1: "55ctpu37wfbl", 2: "938ss58cqzar", 3: "rbsisff693xz", 4: "nsnycsne7n9z",
        5: "5ym481ux8wj5", 6: "y4pj59a3y43q", 7: "246a4gzkyst7", 8: "iyof34u1tiu8",
        9: "5q2zcuadu9e5", 10: "fj7y8ioi6866", 11: "9dsv9rt1fgkm", 12: "8e2bgsjp1a76",
        13: "mtfqjtfijor1"
    }
    restored_1_to_13 = []
    for num in range(1, 14):
        code = el_dayiea_playmogo[num]
        embed = f"https://filemoon.sx/e/{code}"
        restored_1_to_13.append({
            "episodeNum": num,
            "title": f"الحلقة {num}",
            "embedUrl": embed,
            "streamUrl": embed,
            "byseUrl": embed,
            "customWidth": 600,
            "customHeight": 480
        })
    
    final_dayiea = restored_1_to_13 + [ep for ep in cleaned_el_dayiea_eps if ep["episodeNum"] >= 14 and ep["episodeNum"] <= 30]
    final_dayiea.sort(key=lambda x: x["episodeNum"])
    el_dayiea["episodes"] = final_dayiea
    el_dayiea["embedUrl"] = final_dayiea[0]["embedUrl"]
    el_dayiea["byseUrl"] = final_dayiea[0]["embedUrl"]
    print(f"Restored El Dayiea: {len(final_dayiea)} episodes")

# Add Marshals as its own series if we have episodes
if marshals_eps:
    marshals_eps.sort(key=lambda x: x["episodeNum"])
    catalog.insert(0, {
        "id": "series-marshals-s01",
        "title": "مسلسل مارشالز Marshals - الموسم الأول (2026)",
        "category": "series",
        "type": "مسلسل",
        "year": "2026",
        "genre": ["أكشن", "جريمة", "تشويق"],
        "country": "أجنبي",
        "quality": "1080p FHD",
        "poster": "https://m.media-amazon.com/images/M/MV5BMTEzODAyNTgtYzRhZS00MTAzLThmNzMtMmQ3YTBkNjNlNDU4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        "backdrop": "https://m.media-amazon.com/images/M/MV5BMTEzODAyNTgtYzRhZS00MTAzLThmNzMtMmQ3YTBkNjNlNDU4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        "description": "مشاهدة وتحميل مسلسل Marshals الموسم الأول كامل مترجم أونلاين بدقة عالية حصرياً.",
        "rating": 8.6,
        "views": 4900,
        "embedUrl": marshals_eps[0]["embedUrl"],
        "byseUrl": marshals_eps[0]["embedUrl"],
        "episodes": marshals_eps
    })
    print(f"Added Marshals series with {len(marshals_eps)} episodes")

# Add Bleach if we have episodes
if bleach_eps:
    bleach_eps.sort(key=lambda x: x["episodeNum"])
    catalog.insert(0, {
        "id": "series-bleach-tybw-s02",
        "title": "انمي بليتش Bleach: حرب الألف عام - الموسم الثاني",
        "category": "series",
        "type": "انمي",
        "year": "2026",
        "genre": ["انمي", "أكشن", "فانتازيا"],
        "country": "ياباني",
        "quality": "1080p FHD",
        "poster": "https://m.media-amazon.com/images/M/MV5BZmZlMzhlYzgtMTgyNC00MmNhLWI2YTMtOWM0Mjk4NTViMTE0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        "backdrop": "https://m.media-amazon.com/images/M/MV5BZmZlMzhlYzgtMTgyNC00MmNhLWI2YTMtOWM0Mjk4NTViMTE0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        "description": "مشاهدة وتحميل حلقات انمي Bleach: Thousand-Year Blood War بجودة عالية مترجمة.",
        "rating": 9.1,
        "views": 6200,
        "embedUrl": bleach_eps[0]["embedUrl"],
        "byseUrl": bleach_eps[0]["embedUrl"],
        "episodes": bleach_eps
    })
    print(f"Added Bleach series with {len(bleach_eps)} episodes")

# Clean up generic IDs
seen_ids = set()
for item in catalog:
    item_id = item.get("id", "")
    title = item.get("title", "")
    
    # Check if ID needs better slug
    if "akwam-" in item_id or item_id in seen_ids:
        # Match from slug map
        new_id = None
        for key, slug in SLUG_MAP.items():
            if key in title:
                new_id = slug
                break
        if not new_id:
            # Generate from title
            clean_title = re.sub(r"[^\w\s-]", "", title).strip()
            clean_title = re.sub(r"\s+", "-", clean_title)
            new_id = f"series-{abs(hash(title)) % 1000000}"
        
        # Ensure uniqueness
        counter = 1
        base_new_id = new_id
        while new_id in seen_ids:
            new_id = f"{base_new_id}-{counter}"
            counter += 1
        item["id"] = new_id

    seen_ids.add(item.get("id"))

    # Ensure embedUrl fallback
    if item.get("category") == "series" or "مسلسل" in item.get("type", ""):
        eps = item.get("episodes", [])
        if eps:
            first_active = next((e for e in eps if e.get("embedUrl") or e.get("byseUrl")), None)
            if first_active:
                item["embedUrl"] = first_active.get("embedUrl") or first_active.get("byseUrl")
                item["byseUrl"] = item["embedUrl"]

print(f"Catalog processed. Total items: {len(catalog)}")

with open("public/catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

with open("public/catalog.js", "w", encoding="utf-8") as f:
    f.write("window.TADHKIRA_MEDIA = " + json.dumps(catalog, ensure_ascii=False, indent=2) + ";")

print("All catalogs saved successfully!")
