import urllib.request
import urllib.parse
import re
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

shows = [
    ("series-doroob-al-marjala-s03", "مسلسل دروب المرجلة الجزء 3"),
    ("series-al-qafer-s01", "مسلسل القفير 2024"),
    ("series-bait-al-tiin-s06", "مسلسل بيت الطين الجزء السادس"),
    ("series-wadima-wa-halima-s05", "مسلسل وديمة وحليمة الجزء 5"),
    ("series-jak-al-elm-s03", "مسلسل جاك العلم الموسم 3"),
    ("series-anbar-5-s01", "مسلسل عنبر 5 2024"),
    ("series-watan-a-watar-2026", "مسلسل وطن ع وتر 2026"),
    ("series-al-qarar-s01", "مسلسل القرار 2024")
]

for s_id, query in shows:
    print(f"\n--- Checking {s_id}: {query} ---")
    # Search DuckDuckGo Images API or HTML
    try:
        # DDG VQD search
        vqd_url = f"https://duckduckgo.com/?q={urllib.parse.quote(query + ' بوستر')}&iax=images&ia=images"
        vqd_req = urllib.request.Request(vqd_url, headers=headers)
        with urllib.request.urlopen(vqd_req, context=ctx, timeout=5) as r:
            body = r.read().decode('utf-8', 'ignore')
            vqd_m = re.search(r'vqd=([0-9-]+)', body) or re.search(r'vqd="([^"]+)"', body)
            if vqd_m:
                vqd = vqd_m.group(1)
                img_api = f"https://duckduckgo.com/i.js?l=wt-wt&o=json&q={urllib.parse.quote(query + ' بوستر')}&vqd={vqd}&f=,,,&p=1"
                img_req = urllib.request.Request(img_api, headers=headers)
                with urllib.request.urlopen(img_req, context=ctx, timeout=5) as ir:
                    data = json.loads(ir.read().decode('utf-8'))
                    results = data.get("results", [])
                    if results:
                        for item in results[:3]:
                            print("Image result:", item.get("image"))
            else:
                print("No VQD token found")
    except Exception as e:
        print("Search error:", e)
