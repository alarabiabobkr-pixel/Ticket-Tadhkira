#!/usr/bin/env python3
"""
Comprehensive Byse / Filemoon Sync Script
Syncs all uploaded movies & series episodes from Byse account 163193bubg5og40y2k2rpo
to catalog.json, curated_catalog.json, and catalog.js
"""

import os
import sys
import json
import re
import urllib.request

BYSE_API_KEY = os.environ.get("BYSE_API_KEY", "163193bubg5og40y2k2rpo")
BYSE_API_BASE = "https://api.byse.sx"

HEADERS = {
    "User-Agent": "TicketVibSync/2.0"
}

def fetch_all_byse_files(api_key):
    files = []
    page = 1
    print(f"Fetching all files from Byse API using key: {api_key[:6]}...")
    while True:
        url = f"{BYSE_API_BASE}/file/list?key={api_key}&page={page}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") != 200:
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

    # Series maps
    series_episodes_map = {
        "series-el-dayiea-s01": {},
        "series-doroob-al-marjala-s03": {},
        "series-anbar-5-s01": {},
        "series-al-qafer-s01": {},
        "series-watan-a-watar-2026": {},
        "series-jak-al-elm-s03": {},
        "series-al-qarar-s01": {},
        "series-wadima-wa-halima-s05": {},
        "series-bait-al-tiin-s06": {}
    }

    # Movie matches mapping: regex or keyword -> list of file objects
    byse_movie_matches = []

    for file_info in files:
        title = file_info.get("title", "")
        code = file_info.get("file_code")
        canplay = file_info.get("canplay", 1)
        if not code:
            continue

        embed_url = f"https://filemoon.sx/e/{code}"

        # Check Series
        m_dayiea = re.search(r"el[\s\._]*dayiea[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_doroob = re.search(r"doroob[\s\._]*al[\s\._]*marjala[\s\._]*s03e(\d+)", title, re.IGNORECASE)
        m_anbar = re.search(r"anbar[\s\._]*5[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_qafer = re.search(r"al[\s\._]*qafer[\s\._]*s01e(\d+)", title, re.IGNORECASE)
        m_watan = re.search(r"watan[\s\._]*a[\s\._]*watar[\s\._]*(?:2026[\s\._]*)?(?:s\d+)?(?:e)?(\d+)", title, re.IGNORECASE)
        m_jak = re.search(r"jak[\s\._]*(?:al|el)[\s\._]*elm[\s\._]*s03e(\d+)", title, re.IGNORECASE)
        m_qarar = re.search(r"al[\s\._]*qarar[\s\._]*s01[\s\._]*e(\d+)", title, re.IGNORECASE)
        m_wadima = re.search(r"wadima[\s\._]*(?:wa|and)[\s\._]*halima.*?s05[\s\._]*e(\d+)", title, re.IGNORECASE)
        m_tiin = re.search(r"bait[\s\._]*al[\s\._]*tiin.*?s06[\s\._]*e(\d+)", title, re.IGNORECASE)

        if m_dayiea:
            series_episodes_map["series-el-dayiea-s01"][int(m_dayiea.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_doroob:
            series_episodes_map["series-doroob-al-marjala-s03"][int(m_doroob.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_anbar:
            series_episodes_map["series-anbar-5-s01"][int(m_anbar.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_qafer:
            series_episodes_map["series-al-qafer-s01"][int(m_qafer.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_watan:
            series_episodes_map["series-watan-a-watar-2026"][int(m_watan.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_jak:
            series_episodes_map["series-jak-al-elm-s03"][int(m_jak.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_qarar:
            series_episodes_map["series-al-qarar-s01"][int(m_qarar.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_wadima:
            series_episodes_map["series-wadima-wa-halima-s05"][int(m_wadima.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        elif m_tiin:
            series_episodes_map["series-bait-al-tiin-s06"][int(m_tiin.group(1))] = {"file_code": code, "embed_url": embed_url, "title": title}
        else:
            byse_movie_matches.append({
                "title": title,
                "code": code,
                "embed_url": embed_url
            })

        mapping[code] = {
            "byse_filecode": code,
            "byse_url": embed_url,
            "title": title,
            "status": "READY" if canplay == 1 else "PROCESSING"
        }

    # Update series in catalogs
    total_episodes_linked = 0
    series_updated = set()

    def update_series_catalog(cat_list):
        nonlocal total_episodes_linked
        for item in cat_list:
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
                if 1 in eps_to_link:
                    ep1_url = eps_to_link[1]["embed_url"]
                    item["embedUrl"] = ep1_url
                    item["streamUrl"] = ep1_url
                    item["byseUrl"] = ep1_url

    update_series_catalog(catalog)
    update_series_catalog(curated)

    # Movie keywords mapping to catalog items
    movie_rules = [
        (r"abo[\s\._]*nasab", ["أبو نسب"]),
        (r"restart", ["ريستارت"]),
        (r"seeking[\s\._]*haven.*?rambo", ["رامبو"]),
        (r"el[\s\._]*hana[\s\._]*elly", ["الهنا اللي أنا فيه"]),
        (r"esaaf", ["إسعاف", "اسعاف"]),
        (r"shabab[\s\._]*el[\s\._]*bomb", ["شباب البومب"]),
        (r"the[\s\._]*system", ["السيستم"]),
        (r"rocky[\s\._]*el[\s\._]*ghalaba", ["روكي الغلابة"]),
        (r"sambosa[\s\._]*chapati", ["سمبوسة"]),
        (r"groom[\s\._]*and[\s\._]*two[\s\._]*brides", ["عريس وعروستين"]),
        (r"darweesh", ["درويش"]),
        (r"el[\s\._]*shater", ["الشاطر"]),
        (r"ghomeda", ["غميضة"]),
        (r"feeha[\s\._]*eh[\s\._]*yaani", ["فيها إيه يعني"]),
        (r"fakenapping", ["خطف وهمي", "فاكنابينغ"]),
        (r"sada[\s\._]*al[\s\._]*afadel", ["السادة الأفاضل"]),
        (r"anistoona", ["أنستونا"]),
        (r"da[\s\._]*sot[\s\._]*eh[\s\._]*da", ["ده صوت إيه ده"]),
        (r"waqt[\s\._]*edafy", ["وقت إضافي"]),
        (r"ahmed[\s\._]*(?:wa|w)[\s\._]*ahmed", ["أحمد وأحمد"]),
        (r"qashmoo", ["قشموع"]),
        (r"bath[\s\._]*mobasher", ["بث مباشر"]),
        (r"gergasha", ["قرقاشة"]),
        (r"mr[\s\._]*ex", ["مستر إكس"]),
        (r"bershama", ["برشامة"]),
        (r"gang[\s\._]*of[\s\._]*el[\s\._]*max", ["عصابة الماكس"]),
        (r"dawr[\s\._]*al[\s\._]*sabe", ["الدور السابع"]),
        (r"fakhr[\s\._]*al[\s\._]*suwaidi", ["فخر السويدي"]),
        (r"alzarfah", ["الزرافة"]),
        (r"family[\s\._]*business", ["فاميلي بيزنس"]),
        (r"pension[\s\._]*dalal", ["بنسيون دلال"]),
        (r"en[\s\._]*ghab[\s\._]*el[\s\._]*kot", ["إن غاب القط"]),
        (r"tallaqni", ["طلقني"]),
        (r"egybest", ["إيجي بست"]),
        (r"el[\s\._]*qesas", ["القصاص"]),
        (r"al[\s\._]*mahytya", ["المحيطية"]),
        (r"sakr[\s\._]*w[\s\._]*kanarya", ["صقر وكناريا"]),
        (r"matter[\s\._]*of[\s\._]*life", ["مسألة حياة أو موت"]),
        (r"signor.*?khawaja", ["السنيور", "عقدة الخواجة"])
    ]

    movies_linked = 0
    matched_movie_titles = []

    for b_movie in byse_movie_matches:
        btitle = b_movie["title"]
        burl = b_movie["embed_url"]
        bcode = b_movie["code"]

        matched = False
        for pattern, ar_keywords in movie_rules:
            if re.search(pattern, btitle, re.IGNORECASE):
                # find in catalog
                for item in catalog:
                    ititle = item.get("title", "")
                    if any(k in ititle for k in ar_keywords):
                        item["embedUrl"] = burl
                        item["streamUrl"] = burl
                        item["byseUrl"] = burl
                        item["code"] = bcode
                        matched = True
                        movies_linked += 1
                        matched_movie_titles.append(f"{btitle} -> {ititle}")
                        break
                # also in curated
                for item in curated:
                    ititle = item.get("title", "")
                    if any(k in ititle for k in ar_keywords):
                        item["embedUrl"] = burl
                        item["streamUrl"] = burl
                        item["byseUrl"] = burl
                        item["code"] = bcode
                if matched:
                    break

    # Save catalogs
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open("public/curated_catalog.json", "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.SITE_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    with open("public/byse_mapping.json", "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print("\n==========================================")
    print("✅ COMPREHENSIVE BYSE SYNC FINISHED!")
    print(f"Total files on Byse: {len(files)}")
    print(f"Series updated: {len(series_updated)}")
    for sid, eps in series_episodes_map.items():
        if eps:
            print(f"  - {sid}: {len(eps)} episodes linked")
    print(f"Movies linked: {movies_linked}")
    for m in matched_movie_titles[:15]:
        print(f"  + {m}")
    if len(matched_movie_titles) > 15:
        print(f"  ... and {len(matched_movie_titles) - 15} more movies!")
    print("==========================================")

if __name__ == "__main__":
    sync()
