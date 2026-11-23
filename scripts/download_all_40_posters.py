import urllib.request
import urllib.parse
import re
import ssl
import os
import json
import shutil

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://elcinema.com/"
}

targets = [
    {"id": "movie-love-with-its-details-2023", "queries": ["الحب بتفاصيله", "Love With Its Details"]},
    {"id": "movie-esaaf-2025", "queries": ["إسعاف", "إسعاف يونس", "Esaaf"]},
    {"id": "movie-el-shater-2025", "queries": ["الشاطر", "الشاطر أمير كرارة", "El Shater"]},
    {"id": "movie-abo-nasab-2023", "queries": ["أبو نسب", "Abo Nasab"]},
    {"id": "movie-restart-2025", "queries": ["ريستارت", "Restart"]},
    {"id": "movie-rocky-el-ghalaba-2025", "queries": ["روكي الغلابة", "Rocky El Ghalaba"]},
    {"id": "movie-groom-and-two-brides-2025", "queries": ["عريس وعروستين", "Groom and Two Brides"]},
    {"id": "movie-ghomeda-2025", "queries": ["غميضة", "Ghomeda"]},
    {"id": "movie-seeking-haven-for-mr-rambo", "queries": ["البحث عن منفذ لخروج السيد رامبو", "السيد رامبو", "Mr Rambo"]},
    {"id": "play-al-signor-oqdat-al-khawaja", "queries": ["السنيور", "عقدة الخواجة", "مسرحية السنيور"]},
    {"id": "movie-el-qesas-2024", "queries": ["القصاص", "El Qesas"]},
    {"id": "movie-the-system-2024", "queries": ["السيستم", "The System", "فيلم السيستم"]},
    {"id": "movie-el-hana-elly-ana-feeh", "queries": ["الهنا اللي أنا فيه", "El Hana Elly Ana Feeh"]},
    {"id": "play-sambosa-chapati-2025", "queries": ["سمبوسة شباتي", "مسرحية سمبوسة شباتي"]},
    {"id": "movie-shabab-el-bomb-2-2025", "queries": ["شباب البومب 2", "شباب البومب", "Shabab El Bomb"]},
    {"id": "movie-pension-dalal-2024", "queries": ["بنسيون دلال", "Pension Dalal"]},
    {"id": "movie-fakhr-al-suwaidi-2024", "queries": ["فخر السويدي", "Fakhr Al Suwaidi"]},
    {"id": "movie-a-matter-of-life-and-death", "queries": ["مسألة حياة أو موت", "Matter Of Life And Death"]},
    {"id": "movie-darweesh-2025", "queries": ["درويش", "Darweesh", "درويش عمرو يوسف"]},
    {"id": "play-tallaqni-2025", "queries": ["طلقني", "مسرحية طلقني", "Tallaqni"]},
    {"id": "movie-al-dawr-al-sabe", "queries": ["الدور السابع", "Al Dawr Al Sabe"]},
    {"id": "movie-gergasha-the-movie", "queries": ["قرقاشة", "Gergasha", "فيلم قرقاشة"]},
    {"id": "movie-family-business-2026", "queries": ["فاميلي بيزنس", "Family Business", "عائلة فاميلي بيزنس"]},
    {"id": "movie-qashmoo-2024", "queries": ["قشموع", "Qashmoo"]},
    {"id": "movie-bershama-2025", "queries": ["برشامة", "Bershama"]},
    {"id": "movie-ahmed-wa-ahmed-2025", "queries": ["أحمد وأحمد", "Ahmed Wa Ahmed"]},
    {"id": "movie-en-ghab-el-kot-2025", "queries": ["إن غاب القط", "En Ghab El Kot"]},
    {"id": "movie-mr-ex-2023", "queries": ["مستر إكس", "Mr Ex"]},
    {"id": "play-anistoona-2024", "queries": ["أنستونا", "مسرحية أنستونا", "Anistoona"]},
    {"id": "play-al-sada-al-afadel", "queries": ["السادة الأفاضل", "مسرحية السادة الأفاضل"]},
    {"id": "movie-sakr-w-kanarya-2026", "queries": ["صقر وكناريا", "Sakr w Kanarya"]},
    {"id": "movie-the-fakenapping-2025", "queries": ["خطف", "The Fakenapping", "عملية تزوير"]},
    {"id": "movie-feeha-eh-yaani-2025", "queries": ["فيها إيه يعني", "Feeha Eh Yaani"]},
    {"id": "play-da-sot-eh-da-2026", "queries": ["ده صوت إيه ده", "مسرحية ده صوت إيه ده"]},
    {"id": "movie-the-gang-of-el-max-2024", "queries": ["عصابة الماكس", "The Gang of El Max"]},
    {"id": "movie-bath-mobasher-2017", "queries": ["بث مباشر", "Bath Mobasher", "فيلم بث مباشر"]},
    {"id": "movie-egybest-2026", "queries": ["إيجي بست", "EgyBest"]},
    {"id": "movie-al-mahytya-2026", "queries": ["المحيطية", "Al Mahytya"]},
    {"id": "movie-alzarfah-hanhounia-hell-2025", "queries": ["الزرافة", "جحيم حنحونيا", "Alzarfah"]},
    {"id": "movie-waqt-edafy-2024", "queries": ["وقت إضافي", "Waqt Edafy"]}
]

os.makedirs("public/posters", exist_ok=True)
os.makedirs("public/backdrops", exist_ok=True)

def find_elcinema_poster(query):
    try:
        url = f"https://elcinema.com/search?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode("utf-8", "ignore")
            # Look for work images
            imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
            for img in imgs:
                if "_315x420_" in img or "_600x800_" in img or "_320x_" in img or "_original_" in img:
                    return img
            if imgs:
                return imgs[0]
            
            # Check work link and fetch first work page
            works = re.findall(r'/work/(\d+)/', html)
            if works:
                work_url = f"https://elcinema.com/work/{works[0]}/"
                wreq = urllib.request.Request(work_url, headers=HEADERS)
                with urllib.request.urlopen(wreq, context=ctx, timeout=8) as wr:
                    whtml = wr.read().decode("utf-8", "ignore")
                    wimgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', whtml)
                    for img in wimgs:
                        if "_315x420_" in img or "_600x800_" in img or "_320x_" in img or "_original_" in img:
                            return img
                    if wimgs:
                        return wimgs[0]
    except Exception as e:
        print(f"Search error for {query}: {e}")
    return None

def download_image(url, dest_path):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            content = r.read()
            if len(content) > 1000:
                with open(dest_path, "wb") as f:
                    f.write(content)
                return True
    except Exception as e:
        print(f"Download error {url}: {e}")
    return False

success_count = 0
failed_targets = []

for t in targets:
    t_id = t["id"]
    poster_path = f"public/posters/{t_id}.jpg"
    backdrop_path = f"public/backdrops/{t_id}.jpg"
    
    found_url = None
    for q in t["queries"]:
        found_url = find_elcinema_poster(q)
        if found_url:
            break
            
    if found_url:
        # Upgrade resolution if possible
        high_res = found_url.replace("_150x200_", "_315x420_").replace("_120x160_", "_315x420_")
        print(f"[{t_id}] Found image: {high_res}")
        if download_image(high_res, poster_path):
            shutil.copy2(poster_path, backdrop_path)
            success_count += 1
            print(f" -> Successfully saved {poster_path} ({os.path.getsize(poster_path)} bytes)")
        else:
            failed_targets.append(t)
    else:
        print(f"[{t_id}] No image found on elcinema!")
        failed_targets.append(t)

print(f"\n==========================================")
print(f"Downloaded {success_count}/{len(targets)} posters!")
print(f"Failed count: {len(failed_targets)}")
for ft in failed_targets:
    print(f" - {ft['id']}: {ft['queries']}")
