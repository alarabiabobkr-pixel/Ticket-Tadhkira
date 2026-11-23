import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

urls = [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGCUx2mp5XDzr55mHPkSiMUSv-1Dc04jESCHWRWctGH6RrTpNOwgKW-6jXGsn-Twwa2AtRCxvql15B7U-1P28TOCi3xnjIK6HY5maE3tJOjn2ayctoPsnc=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHf_toNaa6t8IRFxXZlVNffBN8XPmR7LaAuUQj9mq-p-SIrZiPSxGMdRUoI0NZSSuLqh10-CyZX7vFS82L5JLcNDNqIV6DOXCzgH2AEWsAWKYpW_RSne1GkKPbz"
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            real_url = resp.geturl()
            print("Redirects to:", real_url)
            html = resp.read().decode("utf-8", "ignore")
            imgs = re.findall(r'https://media\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
            print("Found images:", set(imgs))
    except Exception as e:
        print("Error:", e)
