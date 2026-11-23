#!/usr/bin/env python3
"""
Add new Akwam releases and sync batch to Byse / Filemoon
"""
import os
import json
import time
import urllib.request
import urllib.parse
import re

BYSE_API_KEY = "162600zzs5eit2x7wncj53"
BYSE_API_BASE = "https://api.byse.sx"
MAPPING_FILE = "public/byse_mapping.json"
CURATED_CATALOG_FILE = "public/curated_catalog.json"
FULL_CATALOG_FILE = "public/catalog.json"
CATALOG_JS_FILE = "public/catalog.js"

HEADERS = {"User-Agent": "TicketVibSync/1.0"}

NEW_AKWAM_MOVIES = [
    {
        "id": "movie-tenzing-2026",
        "title": "فيلم تينزينغ (2026)",
        "originalTitle": "Tenzing 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و50 دقيقة",
        "genre": "مغامرات • دراما تاريخية • تسلق جبال",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "8.1",
        "code": "ruzplhb2z2dv",
        "overview": "الملحمة البطولية لتينزينغ نورغاي وإدموند هيلاري في رحلتهما الأسطورية لغزو قمة إيفرست والتحديات القاسية التي واجهتهما.",
        "actors": ["توم هيدلستون", "ويليم دافو"]
    },
    {
        "id": "movie-chinna-chinna-aasai-2026",
        "title": "فيلم تشينا تشينا آسيا (2026)",
        "originalTitle": "Chinna Chinna Aasai 2026",
        "type": "movie",
        "category": "drama",
        "origin": "foreign",
        "duration": "ساعتان و10 دقائق",
        "genre": "دراما عائلية • رومانسية",
        "subGenre": "drama",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.6",
        "code": "ng6plgvmopnt",
        "overview": "قصة دافئة عن الأحلام الصغيرة لأسرة متواضعة وكيف تتحد لمواجهة صعوبات الحياة بروح التفاؤل والأمل.",
        "actors": ["نجوم السينما الهندية"]
    },
    {
        "id": "movie-spiderman-brand-new-day-2026",
        "title": "فيلم سبايدرمان: يوم جديد كلياً (2026)",
        "originalTitle": "Spider-Man Brand New Day 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعتان و15 دقيقة",
        "genre": "أكشن • خيال علمي • أبطال خارقين",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "8.4",
        "code": "yp8sfcm4hz9n",
        "overview": "مغامرة جديدة للرجل العنكبوت في شوارع نيويورك لمواجهة تهديد غامض يهدد التوازن بين العوالم.",
        "actors": ["توم هولاند", "زيندايا"]
    },
    {
        "id": "movie-katukutu-buro-2026",
        "title": "فيلم كوتوكوتو بورو (2026)",
        "originalTitle": "Katukutu Buro 2026",
        "type": "movie",
        "category": "comedy",
        "origin": "foreign",
        "duration": "ساعة و45 دقيقة",
        "genre": "كوميديا • تشويق ومغامرات",
        "subGenre": "comedy",
        "badge": "WEB-DL",
        "quality": "WEB-DL",
        "year": "2026",
        "rating": "7.2",
        "code": "g03x9gvshhtc",
        "overview": "كوميديا شيقة تدور حول سلسلة من المفارقات المضحكة لرجل مسن يحاول حل لغز عائلي غامض.",
        "actors": ["كوكبة من نجوم الكوميديا"]
    },
    {
        "id": "movie-doing-life-2026",
        "title": "فيلم دوينغ لايف (2026)",
        "originalTitle": "Doing Life 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و55 دقيقة",
        "genre": "جريمة • دراما • غموض نفسي",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.7",
        "code": "gycepe74io2r",
        "overview": "سجين سابق يحاول البدء من جديد لكن ماضيه المظلم يلاحقه مجبراً إياه على خوض معركة أخيرة لاستعادة حريته.",
        "actors": ["نجوم هوليوود"]
    },
    {
        "id": "movie-fall-2-deadpoint-2026",
        "title": "فيلم السقوط 2: نقطة الموت (2026)",
        "originalTitle": "Fall 2 Deadpoint 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و48 دقيقة",
        "genre": "إثارة وتشويق • مغامرات البقاء",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "8.0",
        "code": "95a5c213l6lb",
        "overview": "الجزء الثاني المرتقب من فيلم الإثارة العالي، حيث يجد متسلقون أنفسهم محاصرين على حافة هاوية شاهقة بين الحياة والموت.",
        "actors": ["غريس كارولين كوري", "فرجينيا غاردنر"]
    },
    {
        "id": "movie-second-case-of-seetharam-2026",
        "title": "فيلم القضية الثانية لسيثارام (2026)",
        "originalTitle": "Second Case of Seetharam 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعتان",
        "genre": "غموض وتحقيق • إثارة وجريمة",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.9",
        "code": "b91ggndvxhan",
        "overview": "المحقق الذكي سيثارام يعود لحل لغز سلسلة جرائم غامضة تهز المدينة وسط تشابك خيوط التحقيق والمؤامرات.",
        "actors": ["فيجاي راغافيندرا"]
    },
    {
        "id": "movie-thudakkam-2026",
        "title": "فيلم ثوداكام: البداية (2026)",
        "originalTitle": "Thudakkam 2026",
        "type": "movie",
        "category": "drama",
        "origin": "foreign",
        "duration": "ساعتان و5 دقائق",
        "genre": "دراما وتشويق هندي",
        "subGenre": "drama",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.5",
        "code": "vlh7l40nkk1g",
        "overview": "رحلة ملهمة لشاب يواجه تحديات مجتمعية واقتصادية لتحقيق حلمه وتغيير مصير قريته.",
        "actors": ["نجوم السينما الهندية"]
    },
    {
        "id": "movie-modha-rathri-2026",
        "title": "فيلم موذا راثري (2026)",
        "originalTitle": "Modha Rathri 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و42 دقيقة",
        "genre": "إثارة ورعب • غموض وتشويق",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.3",
        "code": "pnaqnyqkxh7c",
        "overview": "أحداث ليلة غامضة تنقلب فيها الأمور رأساً على عقب حين تظهر قوى غير مفسرة داخل منزل منعزل.",
        "actors": ["طاقم الإثارة والغموض"]
    },
    {
        "id": "movie-baby-do-die-do-2026",
        "title": "فيلم بيبي دو داي دو (2026)",
        "originalTitle": "Baby Do Die Do 2026",
        "type": "movie",
        "category": "comedy",
        "origin": "foreign",
        "duration": "ساعة و38 دقيقة",
        "genre": "كوميديا سوداء • مطاردات وأكشن",
        "subGenre": "comedy",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.4",
        "code": "tg4h0b5z4jrw",
        "overview": "مفارقات كوميدية سريعة الإيقاع حول حقيبة مفقودة تتنافس عليها عدة عصابات بأطرف الطرق.",
        "actors": ["نجوم الكوميديا العالمية"]
    },
    {
        "id": "movie-black-box-2026",
        "title": "فيلم الصندوق الأسود (2026)",
        "originalTitle": "Black Box 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و52 دقيقة",
        "genre": "غموض طيران • خيال علمي • تشويق",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "8.0",
        "code": "jt0rhouyu0ht",
        "overview": "تحقيق مثير في حادث تحطم طائرة حديثة يكشف عن تسجيلات مروعة تقود المحللين لكشف أسرار كبرى.",
        "actors": ["بيير نيني", "لو دو لاج"]
    },
    {
        "id": "movie-irumudi-2026",
        "title": "فيلم إيرومودي (2026)",
        "originalTitle": "Irumudi 2026",
        "type": "movie",
        "category": "drama",
        "origin": "foreign",
        "duration": "ساعتان",
        "genre": "مغامرات ودراما روحانية",
        "subGenre": "drama",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.5",
        "code": "xba58lzhvwt6",
        "overview": "رحلة حج تقليدية محفوفة بالتحديات والتجارب الروحية التي تغير نظرة المشاركين للحياة.",
        "actors": ["نجوم السينما الهندية"]
    },
    {
        "id": "movie-bethlehem-kudumba-unit-2026",
        "title": "فيلم وحدة عائلة بيت لحم (2026)",
        "originalTitle": "Bethlehem Kudumba Unit 2026",
        "type": "movie",
        "category": "comedy",
        "origin": "foreign",
        "duration": "ساعة و50 دقيقة",
        "genre": "كوميديا اجتماعية • دراما عائلية",
        "subGenre": "comedy",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.6",
        "code": "l2f6qppskpav",
        "overview": "مفارقات اجتماعية طريفة بين أفراد عائلة كبيرة يجتمعون لمناسبة خاصة فتتفجر المواقف الكوميدية.",
        "actors": ["نجوم الدراما والكوميديا"]
    },
    {
        "id": "movie-sardar-2-2026",
        "title": "فيلم سردار 2 (2026)",
        "originalTitle": "Sardar 2 (2026)",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعتان و25 دقيقة",
        "genre": "أكشن وجاسوسية • مطاردات دولية",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "8.3",
        "code": "kn1e6br39jmp",
        "overview": "الجاسوس الأسطوري سردار يعود في مهمة استخباراتية دولية محفوفة بالمخاطر لحماية أسرار الأمن القومي.",
        "actors": ["كارثي", "إس جاي سوريا"]
    },
    {
        "id": "movie-legend-white-dragon-2024",
        "title": "فيلم أسطورة التنين الأبيض (2024)",
        "originalTitle": "Legend of the White Dragon",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و58 دقيقة",
        "genre": "أكشن • خيال علمي • فنون قتالية",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2024",
        "rating": "7.5",
        "code": "q3xnnk88r89k",
        "overview": "بطل أسطوري منفي يعود بعد سنوات من العزلة للدفاع عن مدينته وتطهير اسمه من التهم المنسوبة إليه.",
        "actors": ["جيسون ديفيد فرانك", "مارك داكاسكوس"]
    },
    {
        "id": "movie-aan-paavam-pollathathu-2025",
        "title": "فيلم آن بافام بولاثاثو (2025)",
        "originalTitle": "Aan Paavam Pollathathu 2025",
        "type": "movie",
        "category": "comedy",
        "origin": "foreign",
        "duration": "ساعتان",
        "genre": "كوميديا رومانسية • دراما اجتماعية",
        "subGenre": "comedy",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2025",
        "rating": "7.4",
        "code": "0lcuc6byvud1",
        "overview": "قصة حب ومفارقات طريفة بين عائلتين تتصارعان حول تقاليد الزواج والعادات الموروثة.",
        "actors": ["أبطال الكوميديا"]
    },
    {
        "id": "movie-siccin-9-2026",
        "title": "فيلم سيكين 9 (2026)",
        "originalTitle": "Siccin 9 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و35 دقيقة",
        "genre": "رعب نفسي • تشويق وغموض تركي",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.7",
        "code": "hry2ebesqnbd",
        "overview": "الجزء الأحدث من سلسلة الرعب التركية الشهيرة حيث تتشابك اللعنات القديمة مع أسرار عائلية مخيفة.",
        "actors": ["نجوم الرعب التركي"]
    },
    {
        "id": "movie-reporting-live-2026",
        "title": "فيلم بث مباشر من الميدان (2026)",
        "originalTitle": "Reporting Live 2026",
        "type": "movie",
        "category": "action",
        "origin": "foreign",
        "duration": "ساعة و40 دقيقة",
        "genre": "إثارة إعلامية • تشويق وجريمة",
        "subGenre": "action",
        "badge": "1080p FHD",
        "quality": "1080p FHD",
        "year": "2026",
        "rating": "7.5",
        "code": "4vdk3z957q2a",
        "overview": "مذيعة ميدانية تجد نفسها وسط عملية احتجاز رهائن معقدة وتبث الأحداث مباشرة كاشفة الفساد.",
        "actors": ["طاقم الإثارة"]
    },
    {
        "id": "movie-aasha-2026",
        "title": "فيلم عائشة: الأمل (2026)",
        "originalTitle": "Aasha 2026",
        "type": "movie",
        "category": "drama",
        "origin": "foreign",
        "duration": "ساعتان",
        "genre": "دراما إنسانية مؤثرة",
        "subGenre": "drama",
        "badge": "720p HD",
        "quality": "720p HD",
        "year": "2026",
        "rating": "7.8",
        "code": "mf0i2e1axcns",
        "overview": "قصة مؤثرة عن صمود امرأة تواجه مصاعب الحياة وتكافح لتربية أطفالها وغرس الأمل في قلوبهم.",
        "actors": ["نخبة من نجوم الدراما"]
    }
]

def api_call(endpoint, params=None):
    if params is None:
        params = {}
    params["key"] = BYSE_API_KEY
    url = f"{BYSE_API_BASE}/{endpoint}?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"API call error on {endpoint}: {e}")
        return None

def main():
    print("=== Step 1: Adding 19 New Akwam Movies to Catalog ===")
    with open(CURATED_CATALOG_FILE, "r", encoding="utf-8") as f:
        curated = json.load(f)
    with open(FULL_CATALOG_FILE, "r", encoding="utf-8") as f:
        full_cat = json.load(f)
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        mapping = json.load(f)

    existing_ids = {x.get("id") for x in curated}
    existing_codes = set()
    for item in curated:
        m = re.search(r'/(?:e|d)/([a-zA-Z0-9]+)', item.get("embedUrl", ""))
        if m: existing_codes.add(m.group(1))

    added_items = []
    for item in NEW_AKWAM_MOVIES:
        if item["id"] in existing_ids or item["code"] in existing_codes:
            continue
        
        entry = {
            "id": item["id"],
            "title": item["title"],
            "originalTitle": item["originalTitle"],
            "type": item["type"],
            "category": item["category"],
            "origin": item["origin"],
            "duration": item["duration"],
            "genre": item["genre"],
            "subGenre": item["subGenre"],
            "badge": item["badge"],
            "quality": item["quality"],
            "year": item["year"],
            "rating": item["rating"],
            "embedUrl": f"https://d000d.com/e/{item['code']}",
            "streamUrl": f"https://d000d.com/e/{item['code']}",
            "customWidth": 600,
            "customHeight": 480,
            "poster": f"/posters/{item['id']}.jpg",
            "backdrop": f"/backdrops/{item['id']}.jpg",
            "overview": item["overview"],
            "actors": item["actors"]
        }
        curated.insert(0, entry) # insert at top for freshness
        full_cat.insert(0, entry)
        added_items.append(entry)

    print(f"Added {len(added_items)} new movies to catalog!")

    # Step 2: Queue all 19 to Byse Remote Upload
    print("\n=== Step 2: Remote Upload to Byse Server ===")
    queued_akwam = 0
    for m in NEW_AKWAM_MOVIES:
        d_code = m["code"]
        if d_code in mapping and mapping[d_code].get("status") in ("READY", "WORKING", "QUEUED"):
            continue
        
        print(f"Queuing to Byse: {m['title']} ({d_code})...")
        res = api_call("remote/add", {"url": f"https://doodstream.com/e/{d_code}"})
        if res and (res.get("status") == 200 or str(res.get("status")) == "200"):
            fc = res.get("result", {}).get("filecode")
            mapping[d_code] = {
                "dood_code": d_code,
                "byse_filecode": fc,
                "title": m["title"],
                "byse_url": f"https://filemoon.sx/e/{fc}" if fc else "",
                "status": "QUEUED",
                "time": time.time()
            }
            queued_akwam += 1
            print(f"  -> Byse Filecode: {fc}")
        else:
            print(f"  -> Failed to queue: {res}")
        time.sleep(0.4)

    # Step 3: Queue an additional batch of 30 unmapped catalog movies
    print("\n=== Step 3: Queue Batch of 30 Unmapped Catalog Movies ===")
    queued_batch = 0
    for item in curated:
        if queued_batch >= 30:
            break
        embed = item.get("embedUrl", "")
        if "filemoon" in embed:
            continue
        m = re.search(r'/(?:e|d)/([a-zA-Z0-9]+)', embed)
        if not m:
            continue
        d_code = m.group(1)
        if d_code in mapping:
            continue
        
        print(f"Queuing catalog item ({queued_batch+1}/30): {item.get('title')} ({d_code})...")
        res = api_call("remote/add", {"url": f"https://doodstream.com/e/{d_code}"})
        if res and (res.get("status") == 200 or str(res.get("status")) == "200"):
            fc = res.get("result", {}).get("filecode")
            mapping[d_code] = {
                "dood_code": d_code,
                "byse_filecode": fc,
                "title": item.get("title", ""),
                "byse_url": f"https://filemoon.sx/e/{fc}" if fc else "",
                "status": "QUEUED",
                "time": time.time()
            }
            queued_batch += 1
            print(f"  -> Queued filecode: {fc}")
        time.sleep(0.4)

    # Save all files
    with open(CURATED_CATALOG_FILE, "w", encoding="utf-8") as f:
        json.dump(curated, f, ensure_ascii=False, indent=2)
    with open(FULL_CATALOG_FILE, "w", encoding="utf-8") as f:
        json.dump(full_cat, f, ensure_ascii=False, indent=2)
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    with open(CATALOG_JS_FILE, "w", encoding="utf-8") as f:
        f.write(f"window.SITE_CATALOG = {json.dumps(curated, ensure_ascii=False, indent=2)};\n")

    print("\n✅ Successfully updated catalogs and Byse queue!")
    print(f"   - Total Catalog Titles Now: {len(curated)}")
    print(f"   - Newly Added from Akwam: {len(added_items)}")
    print(f"   - Newly Queued to Byse: {queued_akwam + queued_batch}")

if __name__ == "__main__":
    main()
