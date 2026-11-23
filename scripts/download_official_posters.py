import urllib.request
import re
import ssl
import os
import shutil

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://elcinema.com/"
}

targets = [
    {
        "id": "series-doroob-al-marjala-s03",
        "name": "دروب المرجلة 3",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGCUx2mp5XDzr55mHPkSiMUSv-1Dc04jESCHWRWctGH6RrTpNOwgKW-6jXGsn-Twwa2AtRCxvql15B7U-1P28TOCi3xnjIK6HY5maE3tJOjn2ayctoPsnc="
    },
    {
        "id": "series-al-qafer-s01",
        "name": "القافر (القفير)",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHk1kHbvgHzHQZ1C63Ixz1aA9JXzD0YN4Pm5KzJHhdL-IGSjH9z1KBLT77miVM8px3czI7p31J44SKliOBDKnRqjDarB5XmeRAGYMLsFbhTBmbG6i4BHnBC="
    },
    {
        "id": "series-wadima-wa-halima-s05",
        "name": "وديمة وحليمة 5",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG4M4WRkxp5JmpxxVaMMglxbUJn5GtMv6D-pb70docdlvKB81z4mzSSge_Rj-ERY7pVhNEPIqGdYGTPYDgynxxmwaxY_QxJ5hn1NTIOmmULorz0Fj3bLWI="
    },
    {
        "id": "series-jak-al-elm-s03",
        "name": "جاك العلم 3",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG_Qdi2l2txtu3p1PbzScE39JjYjCDThg6ptxXq0SFRzk5HpbtD9004ELdZfsEM_ioTEJWhfw7KX7Tp_P73BuwljJOefkpUEBg7UydAm_rWM-5nKnUAcs8="
    },
    {
        "id": "series-anbar-5-s01",
        "name": "عنبر 5",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGLUSl8Ot33-5BZeBKtAjeTMPskqn1xaczTaKYpQCcA51xFiOLhlRRXAKMrislOEZPyg11FyKmh8twWsn_KEXxv_V0KasuYXhyNRTF9yB8-1yyyY2fEc4oi="
    },
    {
        "id": "series-bait-al-tiin-s06",
        "name": "بيت الطين 6",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEWkqZKjs7FZvRo2uGV0-yM-0vyfdtDIHzQeYfOmLJkb1cxiNkt4M8GVemzkD7kY9oLt-r2zI5yMErGCgsQhA57AcUpJSnX976dZOgh973z0BGPgA2QM7I="
    },
    {
        "id": "series-watan-a-watar-2026",
        "name": "وطن ع وتر",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGw4I2rZAwsOMiE03ylKY3afxBDJls1sgAdjwtJgUywzlPhtk7ngNXL9fKW1JCMSnkxKdt4v8hw5Mh2E22QekEbAtGu3-BrpZpahJ9NpRNX3JC0mwFK7xA="
    }
]

for t in targets:
    print(f"\nFetching {t['name']} ({t['id']})...")
    try:
        req = urllib.request.Request(t["redirect"], headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            final_url = r.geturl()
            print("Final URL:", final_url)
            html = r.read().decode("utf-8", "ignore")
            # find primary work image
            imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
            # Find the main work poster (usually _315x420_ or _600x800_)
            chosen = None
            for img in imgs:
                if "_315x420_" in img or "_600x800_" in img or "_original_" in img or "_1200x_" in img:
                    chosen = img
                    break
            if not chosen and imgs:
                chosen = imgs[0]

            if chosen:
                # If it is 315x420, try downloading high-res original
                high_res = re.sub(r'_\d+x\d+_', '_', chosen)
                print(f"Chosen image: {chosen}")
                
                # Download to public/posters/{t['id']}.jpg
                dest = f"public/posters/{t['id']}.jpg"
                try:
                    dl_req = urllib.request.Request(high_res, headers=headers)
                    with urllib.request.urlopen(dl_req, context=ctx, timeout=8) as ir:
                        with open(dest, "wb") as f:
                            f.write(ir.read())
                    print(f"Saved high-res to {dest} ({os.path.getsize(dest)} bytes)")
                except Exception as e_hr:
                    print(f"Fallback to standard {chosen}: {e_hr}")
                    dl_req = urllib.request.Request(chosen, headers=headers)
                    with urllib.request.urlopen(dl_req, context=ctx, timeout=8) as ir:
                        with open(dest, "wb") as f:
                            f.write(ir.read())
                    print(f"Saved to {dest} ({os.path.getsize(dest)} bytes)")
            else:
                print("No image found on page!")
    except Exception as e:
        print(f"Error fetching {t['name']}: {e}")
