import urllib.request
import re
import ssl
import json
import os
import shutil

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://elcinema.com/"
}

url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGnyn07ha3R4hGxk_umQ89VzmV_83FeHznfEw7Axr8ksjONASPeaPpS7XtwBmJBXc5f21Slhg49FhQguY4PGMplzrtmHoHm4mdGNvoI0UX57GCYHvbGXkkz"

dest = "public/posters/series-el-dayiea-s01.jpg"

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
        final_url = r.geturl()
        print("Final URL:", final_url)
        html = r.read().decode("utf-8", "ignore")
        imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
        print("Images found:", len(imgs))
        chosen = None
        for img in imgs:
            if "_315x420_" in img or "_600x800_" in img:
                chosen = img
                break
        if not chosen and imgs:
            chosen = imgs[0]
            
        if chosen:
            print("Downloading:", chosen)
            dl_req = urllib.request.Request(chosen, headers=headers)
            with urllib.request.urlopen(dl_req, context=ctx, timeout=8) as ir:
                with open(dest, "wb") as f:
                    f.write(ir.read())
            print(f"Saved {dest} ({os.path.getsize(dest)} bytes)")
            
            # Also copy to backdrop
            shutil.copyfile(dest, "public/backdrops/series-el-dayiea-s01.jpg")
except Exception as e:
    print("Download error:", e)
