import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF_u2Vo_H59xjXBgnN7UyyIllETdg-VU-yEgZ8rDfgiKYmwOsXWaOFapKHHtJrWvlpv7RDE_W2gIjox99BNaHckhE9v5h0Qudsmt405HFmd_HrZwf3JSrYq"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0", "Referer": "https://elcinema.com/"})
with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
    html = r.read().decode("utf-8", "ignore")
    imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
    print("Resolved URL:", r.geturl())
    print("Images found:", len(imgs))
    for img in imgs[:5]:
        print("  ->", img)
