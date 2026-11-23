import urllib.request
import re
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://elcinema.com/"
}

targets = [
    {
        "id": "series-al-qafer-s01",
        "name": "القافر",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGttGVcLa7T9D4bhzGSt10kICe5-LJJSzj5G6mSKhOTWsbreSpQzq1RWukuS3X22KHJbVtShSZL6VOJseLrFaxSY18NGrXV-KgcAQDiDnnBGhPL63w20MGmx0wNz9OC"
    },
    {
        "id": "series-anbar-5-s01",
        "name": "عنبر 5",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG8Ye4DjoXdj9cDNlutisPT9M_R7ASqAzB_TsNtdIZ0_tz6_Zo9NGuPCL5sqaaLS-LKRRgWo-IJSFtLSN-pB4sZRGEHO14ncPD84ppEBC2h86K9yep7Gxv2"
    },
    {
        "id": "series-al-qarar-s01",
        "name": "القرار",
        "redirect": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHB_SE5Xt9kgAyqocYqjzML45rVLL_1YWJEx4OHjE61XUJbFXgHt35L-XGiS65oIZuUVgdggqzbC4Ngq0WJFnhmBJvlTZz15cBd5THs7uAr-Z_MpMgJ3y0="
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
            imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
            chosen = None
            for img in imgs:
                if "_315x420_" in img or "_600x800_" in img or "_original_" in img or "_1200x_" in img:
                    chosen = img
                    break
            if not chosen and imgs:
                chosen = imgs[0]

            if chosen:
                print(f"Chosen image: {chosen}")
                dest = f"public/posters/{t['id']}.jpg"
                dl_req = urllib.request.Request(chosen, headers=headers)
                with urllib.request.urlopen(dl_req, context=ctx, timeout=8) as ir:
                    with open(dest, "wb") as f:
                        f.write(ir.read())
                print(f"Saved to {dest} ({os.path.getsize(dest)} bytes)")
            else:
                print("No image found!")
    except Exception as e:
        print(f"Error {t['name']}: {e}")
