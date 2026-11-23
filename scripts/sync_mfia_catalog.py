#!/usr/bin/env python3
"""
Clean Rebuild & Sync Script for Tadhkira VIP (تذكرة دخول)
Source of Truth: User's Byse Account 'mfia' (qtabm769@gmail.com)
- Deletes all old blocked/broken links (playmogo / doodstream)
- Pulls 100% of playable movies and series directly from mfia Byse API
- Deduplicates qualities (1080p > 720p > 480p) and sorts series from Episode 1
- Enriches titles, overviews, genres, origins, actors, and downloads authentic TMDB posters & backdrops
"""

import os
import re
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

BYSE_API_KEY = os.environ.get("BYSE_MFIA_KEY", "162600zzs5eit2x7wncj53")
BYSE_API_BASE = "https://api.byse.sx"
TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

SERIES_ALIASES = {
    "albrani": "Al Berrani",
    "al berrani": "Al Berrani",
    "alsdik": "Alsadiq",
    "alsadiq": "Alsadiq",
    "bahu elsett lamya": "Bahu El Sett Lamya",
    "bahu el sett lamya": "Bahu El Sett Lamya",
    "blindspot": "Blindspot",
    "kftan khdiga": "Caftan Khadija",
    "caftan khadija": "Caftan Khadija",
    "daha 17 2026": "Sabea Ashar",
    "daha 17": "Sabea Ashar",
    "sabea ashar": "Sabea Ashar",
    "el leba el clasico": "El Leba",
    "el leba": "El Leba",
    "habetein": "Habbatein",
    "habbatein": "Habbatein",
    "jak el elm": "Jak Al Elm",
    "jak al elm": "Jak Al Elm",
    "kizilcik serbeti": "Sharab Al Toot",
    "sharab al toot aka one love 2025": "Sharab Al Toot",
    "sharab al toot aka one love": "Sharab Al Toot",
    "sharab al toot arabic": "Sharab Al Toot",
    "sharab al toot": "Sharab Al Toot",
    "wadima and halima": "Wadima Wa Halima",
    "wadima wa halima": "Wadima Wa Halima",
    "outlander blood of my blood": "Outlander Blood of My Blood",
    "s w a t exiles": "S.W.A.T. Exiles",
    "aile": "Aile",
    "aila": "Aile",
    "family": "Aile",
    "watan a watar": "Watan A Watar 2026",
    "black clover": "Black Clover",
    "بلاك كلوفر": "Black Clover",
    "game of thrones": "Game Of Thrones",
    "taşacak bu deniz": "Tasacak Bu Deniz",
    "tasacak bu deniz": "Tasacak Bu Deniz",
    "this sea will overflow": "Tasacak Bu Deniz",
    "this sea will overflow 2025": "Tasacak Bu Deniz",
}

KNOWN_ARABIC_SERIES = {
    "Game Of Thrones": ("مسلسل صراع العروش (Game of Thrones)", "foreign", "Game of Thrones"),
    "Tasacak Bu Deniz": ("مسلسل هذا البحر سوف يفيض (Taşacak Bu Deniz)", "turkish", "Tasacak Bu Deniz"),
    "Black Clover": ("مسلسل أنمي بلاك كلوفر (Black Clover)", "anime", "Black Clover"),
    "Sabea Ashar": ("مسلسل السابع عشر (Daha 17)", "turkish", "Daha 17"),
    "Sharab Al Toot": ("مسلسل شراب التوت (Kızılcık Şerbeti)", "turkish", "Kizilcik Serbeti"),
    "Blindspot": ("مسلسل نقطة عمياء (Blindspot)", "foreign", "Blindspot"),
    "El Leba": ("مسلسل اللعبة - الكلاسيكو", "arabic", "El Leba"),
    "Al Berrani": ("مسلسل البراني", "arabic", "Al Berrani"),
    "Alsadiq": ("مسلسل الصديق", "arabic", "Alsadiq"),
    "Al Fondoq Al Maloun": ("مسلسل الفندق الملعون", "arabic", "Al Fondoq Al Maloun"),
    "Al Qafer": ("مسلسل القفر", "arabic", "Al Qafer"),
    "Al Qarar": ("مسلسل القرار", "arabic", "Al Qarar"),
    "Ahla Naseeb": ("مسلسل أحلى نصيب", "arabic", "Ahla Naseeb"),
    "Anbar 5": ("مسلسل عنبر 5", "arabic", "Anbar 5"),
    "Ask Ve Gozyasi": ("مسلسل حب ودموع (Aşk ve Gözyaşı)", "turkish", "Ask Ve Gozyasi"),
    "Bahu El Sett Lamya": ("مسلسل بهو الست لمياء", "arabic", "Bahu El Sett Lamya"),
    "Bait Al Tiin": ("مسلسل بيت الطين", "arabic", "Bait Al Tiin"),
    "Caftan Khadija": ("مسلسل قفطان خديجة", "arabic", "Caftan Khadija"),
    "Doroob Al Marjala": ("مسلسل دروب المرجلة", "yemeni", "Doroob Al Marjala"),
    "El Dayiea": ("مسلسل الضيعة", "arabic", "El Dayiea"),
    "Family": ("مسلسل العائلة (Aile)", "turkish", "Aile"),
    "Aile": ("مسلسل العائلة (Aile)", "turkish", "Aile"),
    "Forsan Graih": ("مسلسل فرسان قريح", "arabic", "Forsan Graih"),
    "Habbatein": ("مسلسل حبتين", "arabic", "Habbatein"),
    "Hob Aswad": ("مسلسل حب أسود", "arabic", "Hob Aswad"),
    "Ihtimal Hob": ("مسلسل احتمال حب", "arabic", "Ihtimal Hob"),
    "Istanbul Rasan Ala Aqeb": ("مسلسل إسطنبول رأساً على عقب", "turkish", "Istanbul Rasan Ala Aqeb"),
    "Jak Al Elm": ("مسلسل جاك العلم", "arabic", "Jak Al Elm"),
    "Khamseen Khamseen": ("مسلسل خمسين خمسين", "arabic", "Khamseen Khamseen"),
    "Meyra Wa Selim": ("مسلسل ميرا وسليم", "arabic", "Meyra Wa Selim"),
    "Outlander Blood of My Blood": ("مسلسل أوتلاندر: دماء من دمي", "foreign", "Outlander: Blood of My Blood"),
    "Peaky Blinders": ("مسلسل بيكي بلايندرز (Peaky Blinders)", "foreign", "Peaky Blinders"),
    "Ricky Gervais Alley Cats": ("مسلسل القطط المشاكسة (Alley Cats)", "foreign", "Ricky Gervais: Alley Cats"),
    "S.W.A.T. Exiles": ("مسلسل سوات: المنفيون (S.W.A.T. Exiles)", "foreign", "S.W.A.T. Exiles"),
    "Wadima Wa Halima": ("مسلسل وديمة وحليمة", "arabic", "Wadima Wa Halima"),
    "Ward Ala Foll Wa Yasmeen": ("مسلسل ورد على فل وياسمين", "arabic", "Ward Ala Foll Wa Yasmeen"),
    "Watan A Watar 2026": ("مسلسل وطن ع وتر 2026", "arabic", "Watan A Watar"),
    "Zanb Insani": ("مسلسل ذنب إنساني", "arabic", "Zanb Insani"),
    "9-1-1": ("مسلسل الطوارئ 9-1-1", "foreign", "9-1-1"),
}

SEASON_AR_NAMES = {
    1: "الموسم الأول",
    2: "الموسم الثاني",
    3: "الموسم الثالث",
    4: "الموسم الرابع",
    5: "الموسم الخامس",
    6: "الموسم السادس",
    7: "الموسم السابع",
    8: "الموسم الثامن",
    9: "الموسم التاسع",
    10: "الموسم العاشر",
}


def slugify(text):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return s[:70] if s else "item"


def quality_score(title, length=0):
    t = title.lower()
    score = 0
    if "1080" in t or "fhd" in t:
        score += 400
    elif "720" in t or "hd" in t:
        score += 300
    elif "480" in t:
        score += 200
    elif "360" in t:
        score += 100
    else:
        score += 250
    if "bluray" in t:
        score += 30
    elif "web-dl" in t or "webdl" in t or "webrip" in t:
        score += 20
    if length and length > 60:
        score += 10
    return score


def extract_quality_label(title):
    t = title.lower()
    if "1080" in t or "fhd" in t:
        return "1080p FHD"
    if "720" in t or "hd" in t:
        return "HD 720p"
    if "480" in t:
        return "SD 480p"
    return "1080p FHD"


MOVIE_QUERY_OVERRIDES = {
    "rango": ("Rango", "2011", "فيلم رانجو (Rango 2011)"),
    "whsh lbnwk": ("وحش البنوك", "2025", "فيلم وحش البنوك (2025)"),
    "attack on titan the last attack": ("Attack on Titan: THE LAST ATTACK", "2024", "فيلم هجوم العمالقة: الهجوم الأخير (Attack on Titan 2024)"),
    "iki dunya bir dilek": ("İki Dünya Bir Dilek", "2025", "فيلم عالمان، أمنية واحدة (İki Dünya Bir Dilek 2025)"),
    "i ki d nya bir dilek": ("İki Dünya Bir Dilek", "2025", "فيلم عالمان، أمنية واحدة (İki Dünya Bir Dilek 2025)"),
    "the whisper man": ("The Whisper Man", "2026", "فيلم الهامس (The Whisper Man 2026)"),
    "alice in wonderland": ("Alice in Wonderland", "2010", "فيلم أليس في بلاد العجائب (Alice in Wonderland 2010)"),
    "f9 the fast saga": ("F9", "2021", "فيلم السرعة والغضب 9 (F9 The Fast Saga 2021)"),
    "dhurandhar the revenge": ("Dhurandhar The Revenge", "2026", "فيلم دهوراندهار: الانتقام (Dhurandhar: The Revenge 2026)"),
    "sokkar sababa wa habboub al kharziz": ("Sukkar Sababa", "", "فيلم سكر صبابة وحبوب الخرزيز"),
    "a minecraft movie": ("A Minecraft Movie", "2025", "فيلم ماينكرافت (A Minecraft Movie 2025)"),
    "ballerina": ("From the World of John Wick: Ballerina", "2025", "فيلم باليرينا (Ballerina 2025)"),
    "fixed": ("Fixed", "2025", "فيلم Fixed (2025)"),
    "maleficent": ("Maleficent", "2014", "فيلم ماليفسنت (Maleficent 2014)"),
    "esaaf": ("إسعاف", "2025", "فيلم إسعاف (Esaaf 2025)"),
    "al mashroa x": ("المشروع إكس", "2025", "فيلم المشروع X (2025)"),
    "al signor oqdat al khawaja": ("عقدة الخواجة", "2018", "فيلم عقدة الخواجة (Al Signor Oqdat Al Khawaja)"),
    "wish eg": ("Wish", "2023", "فيلم الأمنية (2023) Wish - مدبلج"),
    "joy awards s2026": ("Joy Awards 2026", "2026", "حفل جوائز صناع الترفيه Joy Awards 2026"),
    "the system": ("السيستم", "2024", "فيلم السيستم (The System 2024)"),
    "pooja meri jaan hindi": ("Pooja Meri Jaan", "", "فيلم Pooja Meri Jaan (هندي)"),
    "black clover sword of the wizard king": ("Black Clover: Sword of the Wizard King", "2023", "فيلم بلاك كلوفر: سيف الملك الساحر (Black Clover 2023)"),
}


def decode_hex_utf8_tokens(text):
    """Fix filenames where UTF-8 bytes became space-separated hex like 'C4 B0ki D C3 BCnya'."""
    def repl(m):
        raw = m.group(0).replace(" ", "")
        try:
            return bytes.fromhex(raw).decode("utf-8")
        except Exception:
            return m.group(0)
    return re.sub(r"(?:\b[CD][0-9A-F]\s+[89AB][0-9A-F]\b)", repl, text)


def clean_movie_title(raw_title):
    t = raw_title.strip()
    t = re.sub(r"\.(mp4|mkv|avi)$", "", t, flags=re.I)
    t = re.sub(r"[-_]+", " ", t)
    t = decode_hex_utf8_tokens(t)

    # Known garbled/corrupted Arabic filenames on Byse
    if "هجو" in t and "القه" in t:
        return "Attack on Titan THE LAST ATTACK", "2024"

    # Extract year if present
    year = ""
    ym = re.search(r"\b(19\d{2}|20[0-2]\d)\b", t)
    if ym:
        year = ym.group(1)

    # Normalize multi-word noise phrases first
    t = re.sub(r"\braw\s+and\s+undekha\b", " ", t, flags=re.I)

    # Remove rip/site/region noise
    noise = [
        r"\b(?:1080p?|720p?|480p?|360p?)(?:bluray|web[\s-]?dl|webdl|webrip|hdrip|hdtv)?\b",
        r"\b4k\b", r"\bamzn\b", r"\bdsnp\b", r"\bhmax\b", r"\batvp\b", r"\bhulu\b", r"\bshahid\b",
        r"\b(?:web[\s-]?)?dl\d+p?\b", r"\bweb[\s-]?dl\b", r"\bwebdl\b", r"\bwebrip\b",
        r"\bbluray\b", r"\bhdrip\b", r"\bhdtv\b", r"\bhdcam\b", r"\bdvdrip\b", r"\bbrrip\b", r"\bhc\b",
        r"\bakwam\b", r"\begydead\b", r"\bcom\b", r"\bmycima\b", r"\bwecima\b",
        r"\bshahid4u\b", r"\bfaselhd\b", r"\bcima4u\b", r"\bhd\b", r"\bnew\b",
        r"\bmp4\b", r"\bweb\b", r"\bx264\b", r"\bx265\b", r"\bhevc\b", r"\baac\b",
        r"\bcam\b", r"\bunrated\b", r"\brip\b", r"\barabic\b", r"\bbengali\b",
        r"\bar\b", r"\bus\b", r"\buk\b", r"\bnf\b", r"\bim\b", r"\bdc\b"
    ]
    cleaned = t
    for pat in noise:
        cleaned = re.sub(pat, " ", cleaned, flags=re.I)

    # Remove parenthesized year from cleaned name
    if year:
        cleaned = re.sub(rf"\(?\b{year}\b\)?", " ", cleaned)

    cleaned = re.sub(r"[()\[\]{}]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -_.")

    # Canonical aliases for duplicate multi-part titles
    if re.fullmatch(r"pirates of the caribbean 3", cleaned, flags=re.I):
        cleaned = "Pirates Of The Caribbean At Worlds End"
    elif re.fullmatch(r"İki Dünya Bir Dilek", cleaned, flags=re.I):
        cleaned = "İki Dünya Bir Dilek"
    elif re.fullmatch(r"el\s*7?har[re]*fa", cleaned, flags=re.I) or "el harreefa" in cleaned.lower() or "el harifa" in cleaned.lower():
        cleaned = "El Harreefa"
    elif "tad and the magic lamp" in cleaned.lower():
        cleaned = "Tad and The Magic Lamp"

    return cleaned, year


def normalize_key(text):
    if not text:
        return ""
    s = text.lower()
    s = re.sub(r"^(?:فيلم|مسلسل)\s+", "", s)
    s = re.sub(r"\(?\b(19\d{2}|20\d{2})\b\)?", "", s)
    s = re.sub(r"(?:مترجم|مدبلج|بطولة.*|كامل|أونلاين|الموسم.*)", "", s)
    s = re.sub(r"[^a-z0-9\u0600-\u06ff]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def fetch_all_mfia_files():
    print("Fetching all playable files from mfia Byse account...")
    all_files = []
    page = 1
    while True:
        url = f"{BYSE_API_BASE}/file/list?key={BYSE_API_KEY}&page={page}&per_page=100"
        req = urllib.request.Request(url, headers={"User-Agent": "TicketVipSync/2.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
            files = data.get("result", {}).get("files", [])
            if not files:
                break
            all_files.extend(files)
            print(f"  Page {page}: {len(files)} files (total: {len(all_files)})")
            page += 1
            if len(files) < 100:
                break
    return [f for f in all_files if f.get("canplay") == 1 and f.get("file_code")]


def load_existing_enrichment():
    """Load existing catalog.json solely for preserving curated Arabic titles/posters/overviews when matched."""
    by_code = {}
    by_norm = {}
    if not os.path.exists("public/catalog.json"):
        return by_code, by_norm
    try:
        with open("public/catalog.json", "r", encoding="utf-8") as f:
            old_cat = json.load(f)
        for item in old_cat:
            # Index by existing file codes
            for field in ("byseUrl", "embedUrl", "streamUrl"):
                u = item.get(field, "")
                m = re.search(r"/e/([a-zA-Z0-9_-]+)", u)
                if m:
                    by_code[m.group(1)] = item
            # Index by normalized titles
            for tf in (item.get("originalTitle"), item.get("title")):
                nk = normalize_key(tf)
                if nk and len(nk) > 2:
                    by_norm[nk] = item
                # Also extract English part inside Arabic title
                if tf:
                    eng_m = re.findall(r"[A-Za-z0-9][A-Za-z0-9\s:'&-]{2,}", tf)
                    for part in eng_m:
                        pnk = normalize_key(part)
                        if pnk and len(pnk) > 2 and pnk not in ("fhd", "hd", "1080p", "720p"):
                            by_norm[pnk] = item
    except Exception as e:
        print(f"Note: existing catalog lookup skipped: {e}")
    return by_code, by_norm


def tmdb_search(query, is_tv=False, year=""):
    endpoint = "tv" if is_tv else "movie"
    clean_q = re.sub(r"\b(arabic|dub|dubbed|sub)\b", "", query, flags=re.I).strip()
    if not clean_q or len(clean_q) < 2:
        return None

    for lang in ("ar", "en-US"):
        q = urllib.parse.quote(clean_q)
        url = f"https://api.themoviedb.org/3/search/{endpoint}?api_key={TMDB_KEY}&query={q}&language={lang}&include_adult=false"
        if year and year.isdigit() and not is_tv:
            url += f"&year={year}"
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=7) as r:
                data = json.loads(r.read().decode("utf-8"))
                results = data.get("results", [])
                if results:
                    # Prefer result with poster_path
                    best = next((res for res in results if res.get("poster_path")), results[0])
                    tmdb_id = best.get("id")
                    # Fetch details with credits
                    det_url = f"https://api.themoviedb.org/3/{endpoint}/{tmdb_id}?api_key={TMDB_KEY}&language=ar&append_to_response=credits"
                    try:
                        req2 = urllib.request.Request(det_url, headers=HEADERS)
                        with urllib.request.urlopen(req2, timeout=7) as r2:
                            det = json.loads(r2.read().decode("utf-8"))
                            return det
                    except Exception:
                        return best
        except Exception:
            pass
    # Retry without year restriction if year was strict
    if year and not is_tv:
        return tmdb_search(query, is_tv=is_tv, year="")
    return None


def download_image_if_needed(url, dest_rel):
    if not url:
        return False
    dest = os.path.join("public", dest_rel.lstrip("/"))
    if os.path.exists(dest) and os.path.getsize(dest) > 1500:
        return True
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            if len(data) > 1500:
                with open(dest, "wb") as f:
                    f.write(data)
                return True
    except Exception:
        pass
    return False


def map_tmdb_origin_and_genre(det, fallback_origin="foreign", lock_fallback=False):
    orig_lang = (det.get("original_language") or "").lower()
    genres = [g.get("name", "") for g in det.get("genres", []) if g.get("name")]
    origin = fallback_origin
    if not lock_fallback:
        if fallback_origin == "yemeni":
            origin = "yemeni"
        elif orig_lang == "ar":
            origin = "arabic"
        elif orig_lang == "tr":
            origin = "turkish"
        elif orig_lang == "ko":
            origin = "korean"
        elif orig_lang in ("hi", "ta", "te", "ml", "pa"):
            origin = "indian"
        elif orig_lang == "ja" and any("Animation" in g or "رسوم" in g for g in genres):
            origin = "anime"
        elif fallback_origin in ("arabic", "turkish", "indian", "korean"):
            origin = fallback_origin
        elif orig_lang:
            origin = "foreign"

    sub_genre = "drama"
    g_str = " ".join(genres).lower()
    if any(w in g_str for w in ("رسوم", "أنمي", "أنيميشن", "animation", "anime")):
        sub_genre = "animation"
    elif any(w in g_str for w in ("كوميديا", "comedy")):
        sub_genre = "comedy"
    elif any(w in g_str for w in ("أكشن", "حركة", "action")):
        sub_genre = "action"
    elif any(w in g_str for w in ("رعب", "horror")):
        sub_genre = "horror"
    elif any(w in g_str for w in ("مغامرة", "فانتازيا", "خيال", "adventure")):
        sub_genre = "adventure"

    genre_text = " • ".join(genres[:3]) if genres else "دراما • سينما عالمية"
    return origin, genre_text, sub_genre


def parse_and_build():
    raw_files = fetch_all_mfia_files()
    print(f"Total playable files fetched from mfia: {len(raw_files)}")

    old_by_code, old_by_norm = load_existing_enrichment()

    series_buckets = {}  # (canonical_series, season_num) -> { ep_num -> best_file }
    movie_buckets = {}   # (norm_key, year) -> best_file

    for f in raw_files:
        title = (f.get("title") or "").strip()
        code = f.get("file_code")
        if not title or len(title) < 3:
            continue

        # Check series pattern (also matches Watan A Watar E19WEB-DL & Arabic series like بلاك كلوفر 169)
        m_bc_ar = re.fullmatch(r"بلاك كلوفر\s+(\d+)", title)
        m = re.search(r"(?:S(\d+)\s*[-_]?\s*E(?:p)?\s*(\d+)|(?:^|\s)E(?:p)?\s*(\d+)(?:\s|$|-|WEB)|EP\s*(\d+)|الحلقة\s*(\d+))", title, re.I)
        if m_bc_ar:
            canonical_name = "Black Clover"
            season_num = 1
            ep_num = int(m_bc_ar.group(1))
            bucket = series_buckets.setdefault((canonical_name, season_num), {})
            qscore = quality_score(title, f.get("length", 0))
            existing = bucket.get(ep_num)
            if not existing or qscore > existing["_qscore"] or (qscore == existing["_qscore"] and f.get("uploaded", "") > existing.get("uploaded", "")):
                f_copy = dict(f)
                f_copy["_qscore"] = qscore
                bucket[ep_num] = f_copy
            continue
        if m:
            raw_prefix = title[:m.start()].strip(" -_.")
            # Strip trailing year from prefix if like "Daha 17 2026"
            norm_pref = re.sub(r"\s+", " ", raw_prefix.lower()).strip()
            canonical_name = SERIES_ALIASES.get(norm_pref)
            if not canonical_name:
                # Try stripping trailing year
                norm_no_yr = re.sub(r"\s+(19\d{2}|20\d{2})$", "", norm_pref).strip()
                canonical_name = SERIES_ALIASES.get(norm_no_yr, raw_prefix.strip())

            # Skip obvious stray garbage test clip with < 3 chars
            if len(canonical_name) < 3:
                continue

            season_num = int(m.group(1)) if m.group(1) else 1
            ep_num = int(m.group(2) or m.group(3) or m.group(4) or m.group(5))

            bucket = series_buckets.setdefault((canonical_name, season_num), {})
            qscore = quality_score(title, f.get("length", 0))
            existing = bucket.get(ep_num)
            if not existing or qscore > existing["_qscore"] or (qscore == existing["_qscore"] and f.get("uploaded", "") > existing.get("uploaded", "")):
                f_copy = dict(f)
                f_copy["_qscore"] = qscore
                bucket[ep_num] = f_copy
        else:
            clean_name, yr = clean_movie_title(title)
            if len(clean_name) < 2:
                continue
            nk = normalize_key(clean_name)
            if not nk:
                continue
            mkey = (nk, yr)
            qscore = quality_score(title, f.get("length", 0))
            existing = movie_buckets.get(mkey)
            up_ts = f.get("uploaded", "") or ""
            prev_latest = existing.get("_latest_uploaded", existing.get("uploaded", "")) if existing else ""
            best_latest = max(prev_latest, up_ts)
            if not existing or qscore > existing["_qscore"] or (qscore == existing["_qscore"] and up_ts > existing.get("uploaded", "")):
                f_copy = dict(f)
                f_copy["_qscore"] = qscore
                f_copy["_clean_name"] = clean_name
                f_copy["_year"] = yr
                f_copy["_latest_uploaded"] = best_latest
                movie_buckets[mkey] = f_copy
            else:
                existing["_latest_uploaded"] = best_latest

    # Merge duplicate movie uploads sharing the exact normalized key when one lacks a year or years differ by <= 3 (re-encodes/re-uploads)
    buckets_by_nk = {}
    for mkey, val in list(movie_buckets.items()):
        buckets_by_nk.setdefault(mkey[0], []).append((mkey, val))
    merged_movie_buckets = {}
    for nk, entries in buckets_by_nk.items():
        if len(entries) == 1:
            merged_movie_buckets[entries[0][0]] = entries[0][1]
            continue
        entries.sort(key=lambda e: (e[0][1] == "", -(e[1]["_qscore"]), e[0][1]))
        kept = []
        for mkey, val in entries:
            yr = mkey[1]
            merged_into = False
            for k_idx, (kmkey, kval) in enumerate(kept):
                kyr = kmkey[1]
                close_years = (not yr or not kyr) or (yr.isdigit() and kyr.isdigit() and abs(int(yr) - int(kyr)) <= 3)
                if close_years:
                    merged_latest = max(kval.get("_latest_uploaded", kval.get("uploaded", "")), val.get("_latest_uploaded", val.get("uploaded", "")))
                    if val["_qscore"] > kval["_qscore"] or (val["_qscore"] == kval["_qscore"] and val.get("uploaded", "") > kval.get("uploaded", "")):
                        val["_clean_name"] = kval["_clean_name"]
                        val["_year"] = kval["_year"] or val["_year"]
                        val["_latest_uploaded"] = merged_latest
                        kept[k_idx] = (kmkey, val)
                    else:
                        kval["_latest_uploaded"] = merged_latest
                    merged_into = True
                    break
            if not merged_into:
                kept.append((mkey, val))
        for kmkey, kval in kept:
            merged_movie_buckets[kmkey] = kval
    movie_buckets = merged_movie_buckets

    print(f"Grouped into {len(series_buckets)} series seasons and {len(movie_buckets)} unique movies.")

    catalog = []

    # 1. Build Series Items First (Featured cleanly at top / alongside top movies)
    def build_series_entry(key_val):
        (canonical_name, season_num), eps_map = key_val
        sorted_eps = sorted(eps_map.items(), key=lambda x: x[0])
        if not sorted_eps:
            return None

        info = KNOWN_ARABIC_SERIES.get(canonical_name)
        ar_base = info[0] if info else f"مسلسل {canonical_name}"
        fallback_origin = info[1] if info else "arabic"
        tmdb_query = info[2] if info else canonical_name

        season_label = SEASON_AR_NAMES.get(season_num, f"الموسم {season_num}")
        if canonical_name == "Black Clover":
            full_title = f"{ar_base} - كامل"
            item_id = f"series-{slugify(canonical_name)}-s{season_num:02d}"
        elif season_num > 1 or any(k[0] == canonical_name and k[1] != season_num for k in series_buckets.keys()):
            full_title = f"{ar_base} - {season_label}"
            item_id = f"series-{slugify(canonical_name)}-s{season_num:02d}"
        else:
            full_title = f"{ar_base} - {season_label}" if season_num == 1 else ar_base
            item_id = f"series-{slugify(canonical_name)}-s{season_num:02d}"

        # Check existing enrichment (prefer exact season match when reusing poster)
        old_exact = old_by_norm.get(normalize_key(f"{canonical_name} S{season_num:02d}"))
        old = old_exact or old_by_norm.get(normalize_key(canonical_name))
        det = tmdb_search(tmdb_query, is_tv=True)

        season_det = None
        if det and det.get("id") and season_num >= 1:
            try:
                s_url = f"https://api.themoviedb.org/3/tv/{det['id']}/season/{season_num}?api_key={TMDB_KEY}&language=ar"
                with urllib.request.urlopen(urllib.request.Request(s_url, headers=HEADERS), timeout=7) as sr:
                    season_det = json.loads(sr.read().decode("utf-8"))
            except Exception:
                season_det = None

        poster_rel = f"/posters/{item_id}.jpg"
        backdrop_rel = f"/backdrops/{item_id}.jpg"

        # Prefer verified existing poster if local file exists for this season (or non-multi-season fallback)
        poster_ok = False
        backdrop_ok = False
        if old_exact and old_exact.get("poster") and os.path.exists(os.path.join("public", old_exact["poster"].lstrip("/"))) and os.path.getsize(os.path.join("public", old_exact["poster"].lstrip("/"))) > 5000:
            poster_rel = old_exact["poster"]
            poster_ok = True
        if old and old.get("backdrop") and os.path.exists(os.path.join("public", old["backdrop"].lstrip("/"))) and os.path.getsize(os.path.join("public", old["backdrop"].lstrip("/"))) > 5000:
            backdrop_rel = old["backdrop"]
            backdrop_ok = True

        if not poster_ok and season_det and season_det.get("poster_path"):
            poster_ok = download_image_if_needed(f"https://image.tmdb.org/t/p/w500{season_det['poster_path']}", poster_rel)
        if det:
            if not poster_ok and det.get("poster_path"):
                poster_ok = download_image_if_needed(f"https://image.tmdb.org/t/p/w500{det['poster_path']}", poster_rel)
            if not backdrop_ok and det.get("backdrop_path"):
                backdrop_ok = download_image_if_needed(f"https://image.tmdb.org/t/p/w1280{det['backdrop_path']}", backdrop_rel)

        # Fallback to first episode thumbnail if no TMDB poster found
        first_ep_thumb = sorted_eps[0][1].get("thumbnail")
        if not poster_ok and first_ep_thumb:
            poster_ok = download_image_if_needed(first_ep_thumb, poster_rel)
        if not backdrop_ok:
            if os.path.exists(os.path.join("public", poster_rel.lstrip("/"))):
                # copy poster to backdrop so zero missing images
                b_dest = os.path.join("public", backdrop_rel.lstrip("/"))
                os.makedirs(os.path.dirname(b_dest), exist_ok=True)
                with open(os.path.join("public", poster_rel.lstrip("/")), "rb") as src_f, open(b_dest, "wb") as dst_f:
                    dst_f.write(src_f.read())

        lock_series_origin = canonical_name in KNOWN_ARABIC_SERIES
        origin, genre_text, sub_genre = map_tmdb_origin_and_genre(det or {}, fallback_origin=fallback_origin, lock_fallback=lock_series_origin)
        overview = (season_det.get("overview") if season_det else "") or (old.get("overview") if old else "") or (det.get("overview") if det else "") or f"شاهد جميع حلقات {ar_base} ({season_label}) بجودة عالية وبدون إعلانات على منصة تذكرة دخول VIP."
        year = ((season_det.get("air_date") or "")[:4] if season_det else "") or (old_exact.get("year") if old_exact else "") or ((det.get("first_air_date") or "")[:4] if det else "") or "2025"
        rating = (old.get("rating") if old else "") or (f"{det.get('vote_average'):.1f}" if det and det.get("vote_average") else "8.5")
        actors = (old.get("actors") if old else None) or [c.get("name") for c in (det.get("credits", {}).get("cast", [])[:4] if det else []) if c.get("name")] or ["نجوم الدراما"]

        episodes = []
        for ep_num, fdata in sorted_eps:
            fc = fdata["file_code"]
            byse_url = f"https://bysezejataos.com/e/{fc}"
            episodes.append({
                "episodeNum": ep_num,
                "title": f"الحلقة {ep_num}",
                "quality": extract_quality_label(fdata.get("title", "")),
                "embedUrl": byse_url,
                "streamUrl": byse_url,
                "byseUrl": byse_url,
                "customWidth": 600,
                "customHeight": 480
            })

        first_url = episodes[0]["embedUrl"]
        ep_count = len(episodes)

        return {
            "id": item_id,
            "title": full_title,
            "originalTitle": f"{canonical_name} S{season_num:02d}",
            "type": "series",
            "category": "series",
            "duration": f"{ep_count} حلقة" if ep_count > 1 else "حلقة مميزة",
            "genre": genre_text,
            "subGenre": sub_genre,
            "badge": f"{ep_count} حلقة" if ep_count > 1 else episodes[0]["quality"],
            "quality": episodes[0]["quality"],
            "year": str(year),
            "rating": str(rating),
            "origin": origin,
            "embedUrl": first_url,
            "streamUrl": first_url,
            "byseUrl": first_url,
            "customWidth": 600,
            "customHeight": 480,
            "poster": poster_rel,
            "backdrop": backdrop_rel,
            "overview": overview,
            "actors": actors,
            "episodesCount": ep_count,
            "episodes": episodes,
            "uploadedAt": max((epf.get("uploaded", "") for _, epf in sorted_eps), default=""),
            "_sort_uploaded": max((epf.get("uploaded", "") for _, epf in sorted_eps), default=""),
            "_ep_count": ep_count,
        }

    # 2. Build Movie Items
    def build_movie_entry(key_val):
        (nk, yr), fdata = key_val
        clean_name = fdata["_clean_name"]
        fc = fdata["file_code"]
        byse_url = f"https://bysezejataos.com/e/{fc}"

        # Normalize key for ASCII fold on Turkish İ -> i
        nk_ascii = re.sub(r"[^a-z0-9\u0600-\u06ff]+", " ", nk.replace("İ", "i").replace("ı", "i").replace("ü", "u").lower()).strip()
        override = MOVIE_QUERY_OVERRIDES.get(nk) or MOVIE_QUERY_OVERRIDES.get(nk_ascii)
        tmdb_q = override[0] if override else clean_name
        tmdb_yr = (override[1] if override and override[1] else yr)

        old = old_by_code.get(fc) or old_by_norm.get(nk)
        det = tmdb_search(tmdb_q, is_tv=False, year=tmdb_yr)

        dirty_old = False
        if old and old.get("title"):
            ot = old["title"]
            if re.search(r"\b(DL480p|DL720p|720pBluRay|AMZN|NF\s*\(2025\)|Raw and Undekha|Rip|wHsh lbnwk|AR\s*\(2026\)|us\s*\(2023\)|Bengali\s*\(2026\)|sokkar sababa|Al Mashroa X|Al Signor|Wish EG|Joy Awards)\b", ot, flags=re.I):
                dirty_old = True

        item_id = (old.get("id") if old and old.get("id") and not dirty_old else f"movie-{slugify(tmdb_q or clean_name)}-{tmdb_yr or yr or fc[:6]}")
        poster_rel = f"/posters/{item_id}.jpg"
        backdrop_rel = f"/backdrops/{item_id}.jpg"

        poster_ok = False
        backdrop_ok = False
        if old and not dirty_old and old.get("poster") and os.path.exists(os.path.join("public", old["poster"].lstrip("/"))) and os.path.getsize(os.path.join("public", old["poster"].lstrip("/"))) > 5000:
            poster_rel = old["poster"]
            poster_ok = True
        if old and not dirty_old and old.get("backdrop") and os.path.exists(os.path.join("public", old["backdrop"].lstrip("/"))) and os.path.getsize(os.path.join("public", old["backdrop"].lstrip("/"))) > 5000:
            backdrop_rel = old["backdrop"]
            backdrop_ok = True

        if det:
            if not poster_ok and det.get("poster_path"):
                poster_ok = download_image_if_needed(f"https://image.tmdb.org/t/p/w500{det['poster_path']}", poster_rel)
            if not backdrop_ok and det.get("backdrop_path"):
                backdrop_ok = download_image_if_needed(f"https://image.tmdb.org/t/p/w1280{det['backdrop_path']}", backdrop_rel)

        # Fallback to Byse video thumbnail ONLY if TMDB lacks image
        if not poster_ok and fdata.get("thumbnail"):
            poster_ok = download_image_if_needed(fdata["thumbnail"], poster_rel)
        if not backdrop_ok:
            if os.path.exists(os.path.join("public", poster_rel.lstrip("/"))):
                b_dest = os.path.join("public", backdrop_rel.lstrip("/"))
                os.makedirs(os.path.dirname(b_dest), exist_ok=True)
                with open(os.path.join("public", poster_rel.lstrip("/")), "rb") as src_f, open(b_dest, "wb") as dst_f:
                    dst_f.write(src_f.read())

        # Authoritative Yemeni/Arabic origin detection before falling back to TMDB language guess
        yemeni_kw = ("the burdened", "المرهقون", "doroob al marjala", "دروب المرجلة")
        arabic_kw = (
            "restart", "ريستارت", "ahmed wa ahmed", "أحمد وأحمد", "el set", "الست", "colonya", "كولونيا",
            "laylet el eid", "ليلة العيد", "el ameel sefr", "العميل صفر", "shabab el bomb", "شباب البومب",
            "qashmoo", "قشموع", "anistoona", "أنستونا", "daye", "سيرة أهل الضي", "harreefa", "الحريفة",
            "leh teeshha", "ليه تعيشها", "waqt edafy", "وقت إضافي", "el hawa sotan", "الهوى سلطان",
            "meen yesaddaq", "مين يصدق", "ana la habibi", "أنا لحبيبي", "five rounds", "خمس جولات",
            "tal2 sena3y", "طلق صناعي", "mister x", "مستر إكس", "the system", "السيستم",
            "bath mobasher", "بث مباشر", "palastin 36", "فلسطين 36", "presidents cake", "مملكة القصب",
            "shahr zii aleasal", "شهر زي العسل", "al mahytya", "el arafa we el laana",
            "alsajin el ankaboot", "sokkar sababa", "سكر صبابة", "joy awards", "esaaf", "إسعاف",
            "whsh lbnwk", "وحش البنوك", "al mashroa x", "المشروع x", "oqdat al khawaja", "عقدة الخواجة",
            "fakhr al suwaidi", "bershama", "ghomeda", "gergasha", "hepta", "gang of el max", "alzarfah",
            "egybest", "darweesh", "el shater", "el qesas", "hana elly ana feeh", "en ghab el kot",
            "pension dalal", "rocky el ghalaba", "selem w el thoban", "alhamour", "sambosa", "fakenapping",
            "al sada al afadel", "seeking haven for mr rambo", "dawr al sabe", "hind rajab", "fadel w neama",
            "abo nasab", "groom and two brides", "el dawr al sabe", "the harouns"
        )
        title_combo = f"{clean_name} {tmdb_q} {old.get('title','') if old else ''} {old.get('originalTitle','') if old else ''}".lower()

        fb_origin = "foreign"
        lock_movie_origin = False
        if any(k in title_combo for k in yemeni_kw):
            fb_origin = "yemeni"
            lock_movie_origin = True
        elif any(k in title_combo for k in arabic_kw):
            fb_origin = "arabic"
            lock_movie_origin = True
        elif re.search(r"\bhindi\b", nk):
            fb_origin = "indian"

        origin, genre_text, sub_genre = map_tmdb_origin_and_genre(det or {}, fallback_origin=fb_origin, lock_fallback=lock_movie_origin)
        if nk in ("wish", "wish eg", "wish ar"):
            origin = "foreign"
            sub_genre = "animation"
        ar_title = (override[2] if override and override[2] else "") or (old.get("title") if (old and not dirty_old) else "")
        if not ar_title:
            tmdb_t = (det.get("title") or det.get("original_title")) if det else ""
            effective_yr = tmdb_yr or yr or ((det.get("release_date") or "")[:4] if det else "") or "2025"
            if tmdb_t and tmdb_t.lower() != clean_name.lower() and re.search(r"[\u0600-\u06ff]", tmdb_t):
                ar_title = f"فيلم {tmdb_t} ({effective_yr}) {clean_name}"
            else:
                ar_title = f"فيلم {clean_name}" + (f" ({effective_yr})" if effective_yr else "")

        release_yr = (override[1] if override and override[1] else "") or yr or (old.get("year") if old else "") or ((det.get("release_date") or "")[:4] if det else "") or "2025"
        overview = (old.get("overview") if (old and not dirty_old) else "") or (det.get("overview") if det else "") or f"شاهد {ar_title} كاملاً بجودة عالية وبدون إعلانات على منصة تذكرة دخول VIP."
        rating = (old.get("rating") if old else "") or (f"{det.get('vote_average'):.1f}" if det and det.get("vote_average") and det.get("vote_average") > 0 else "7.8")
        actors = (old.get("actors") if old else None) or [c.get("name") for c in (det.get("credits", {}).get("cast", [])[:4] if det else []) if c.get("name")] or ["نجوم السينما"]

        qual = extract_quality_label(fdata.get("title", ""))
        dur_sec = fdata.get("length", 0)
        if dur_sec and dur_sec > 300:
            hrs = dur_sec // 3600
            mins = (dur_sec % 3600) // 60
            dur_str = f"{hrs} ساعة و {mins} دقيقة" if hrs > 0 else f"{mins} دقيقة"
        else:
            dur_str = (old.get("duration") if old else "") or "فيلم كامل"

        anime_kw = ("toy story", "moana", "zootopia", "kung fu panda", "shark tale", "hotel transylvania",
                    "migration", "sherlock gnomes", "isle of dogs", "kusunoki", "attack on titan", "mononoke",
                    "sword art", "lost in starlight", "ne zha", "megamind", "orion and the dark", "elio",
                    "avatar aang", "knightfall", "paw patrol", "casagrandes", "magic lamp", "twits",
                    "missing lynx", "tigers apprentice", "rebellious", "tafiti", "little emma", "your letter",
                    "mahavatar", "rango", "puppy hotel", "gintama", "gundam", "animal farm",
                    "charlie the wonderdog", "رسوم متحركة", "أنمي", "مدبلج للعربية")
        is_anim = (sub_genre in ("anime", "animation") or origin == "anime"
                   or nk in ("wish", "wish eg", "wish ar")
                   or any(w in f"{genre_text} {ar_title} {clean_name}".lower() for w in anime_kw))
        category = "anime" if is_anim else "movies"
        if category == "anime" and sub_genre == "drama":
            sub_genre = "animation"

        return {
            "id": item_id,
            "title": ar_title,
            "originalTitle": clean_name,
            "type": "movie",
            "category": category,
            "duration": dur_str,
            "genre": genre_text,
            "subGenre": sub_genre,
            "badge": qual,
            "quality": qual,
            "year": str(release_yr),
            "rating": str(rating),
            "origin": origin,
            "embedUrl": byse_url,
            "streamUrl": byse_url,
            "byseUrl": byse_url,
            "customWidth": 600,
            "customHeight": 480,
            "poster": poster_rel,
            "backdrop": backdrop_rel,
            "overview": overview,
            "actors": actors,
            "uploadedAt": fdata.get("_latest_uploaded") or fdata.get("uploaded", ""),
            "_sort_uploaded": fdata.get("_latest_uploaded") or fdata.get("uploaded", ""),
        }

    print("Enriching series with TMDB & official posters (multi-threaded)...")
    series_items = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = [ex.submit(build_series_entry, kv) for kv in series_buckets.items()]
        for fut in as_completed(futs):
            res = fut.result()
            if res:
                series_items.append(res)

    series_items.sort(key=lambda x: (x.get("_sort_uploaded", ""), x.get("_ep_count", 0)), reverse=True)

    print("Enriching movies with TMDB & official posters (multi-threaded)...")
    movie_items = []
    done = 0
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = [ex.submit(build_movie_entry, kv) for kv in movie_buckets.items()]
        for fut in as_completed(futs):
            res = fut.result()
            if res:
                movie_items.append(res)
            done += 1
            if done % 100 == 0:
                print(f"  Processed {done}/{len(movie_buckets)} movies...")

    # Sort movies: newest uploaded & highest year first
    movie_items.sort(key=lambda x: (x.get("_sort_uploaded", ""), x.get("year", "")), reverse=True)

    # Unified sort: ALWAYS place newest uploads first across series & movies so Top 10 and front showcase feature latest additions
    combined_items = series_items + movie_items
    combined_items.sort(key=lambda x: (x.get("_sort_uploaded", ""), x.get("year", "")), reverse=True)

    # Deduplicate IDs if two items ever collide on slug
    used_ids = set()
    final_catalog = []
    for item in combined_items:
        item.pop("_sort_uploaded", None)
        item.pop("_ep_count", None)
        base_id = item["id"]
        if base_id in used_ids:
            # append code suffix
            m = re.search(r"/e/([a-zA-Z0-9]+)", item["byseUrl"])
            item["id"] = f"{base_id}-{m.group(1)[:5]}" if m else f"{base_id}-{len(used_ids)}"
        used_ids.add(item["id"])
        final_catalog.append(item)

    print(f"Final clean catalog size: {len(final_catalog)} ({len(series_items)} series seasons + {len(movie_items)} movies)")

    # Write public/catalog.json, public/curated_catalog.json, public/catalog.js
    for fname in ("public/catalog.json", "public/curated_catalog.json"):
        with open(fname, "w", encoding="utf-8") as f:
            json.dump(final_catalog, f, ensure_ascii=False, indent=2)

    with open("public/catalog.js", "w", encoding="utf-8") as f:
        f.write("window.CURATED_CATALOG = ")
        json.dump(final_catalog, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("Saved catalog.json, curated_catalog.json, and catalog.js cleanly!")


if __name__ == "__main__":
    parse_and_build()
