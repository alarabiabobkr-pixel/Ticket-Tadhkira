import urllib.request
import urllib.parse
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_elcinema_search(query):
    url = f"https://elcinema.com/search?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://elcinema.com/"
    })
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            html = r.read().decode("utf-8", "ignore")
            works = re.findall(r'/work/(\d+)/', html)
            imgs = re.findall(r'https://media\d*\.elcinema\.com/uploads/[^\s"\'<>]+\.jpg', html)
            print(f"Query: {query} -> works: {works[:3]}, imgs: {imgs[:2]}")
    except Exception as e:
        print(f"Error {query}: {e}")

test_elcinema_search("ريستارت")
test_elcinema_search("روكي الغلابة")
test_elcinema_search("أنستونا")
test_elcinema_search("عصابة الماكس")
test_elcinema_search("مستر إكس")
test_elcinema_search("بنسيون دلال")
test_elcinema_search("الهنا اللي أنا فيه")
