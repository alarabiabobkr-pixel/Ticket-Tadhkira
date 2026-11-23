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
    "دروب المرجلة",
    "القفير",
    "بيت الطين",
    "وديمة وحليمة",
    "جاك العلم",
    "عنبر 5",
    "وطن ع وتر",
    "القرار"
]

for show in shows:
    q = urllib.parse.quote(show)
    url = f"https://elcinema.com/search/?q={q}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode("utf-8", "ignore")
            imgs = re.findall(r'https://media\.elcinema\.com/uploads/_315x420_[^"\']+\.jpg', html)
            if imgs:
                # Replace _315x420_ with _600x800_ or similar for high res
                high_res = imgs[0].replace("_315x420_", "_600x800_")
                print(f"FOUND {show}: {high_res} (or {imgs[0]})")
            else:
                print(f"No direct elcinema img for {show}")
    except Exception as e:
        print(f"Error {show}: {e}")
