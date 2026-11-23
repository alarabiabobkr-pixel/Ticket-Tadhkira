import json, re, os

raw_data = """
<!-- Doroob Al MarjalaS03E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ixay7on51k4q" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2woq83ytvknk" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lamdvawbr8ut" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/yor1t78lq3zi" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Doroob Al MarjalaS03E29 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/c1z0a1i8v8iy" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/tl3dxmar5uw9" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/exjno9d06btx" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ku2pq7721rvb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/t02uuiburybt" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/oc7emnc094ot" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/k2zfnjyok0s1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/z9oa6od1q8l2" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gwc1r5sbkgts" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ilhnn2laf5t3" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/9bkemkp6hb00" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/68z7jlgsydmq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/mqr9hxsvj33c" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2q4irdcm6ulb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ahnj5anc9ddp" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E25 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/u5cqsu4atorb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/27uqk3r5usm3" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gpd0kgign10d" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/18kl8koa93fk" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E06 720p SHAHID WEB-DL MeDo -->
<iframe width="600" height="480" src="https://playmogo.com/e/ev3wmnnlhb1c" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/s4qxsmaa9msv" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/veo189n5ojud" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/iswuej77q4mf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/46qa89cizgus" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/r1ya6uwkn52y" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E31 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/l1tvvcn6m6zh" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5pt7er163ia6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/yr1ubenauf2s" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lggq1zd6mkkm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ylfnn6ignjcg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/4mppsnb0t86j" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/xrmhrqwggs7p" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qltaergg3cxr" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Doroob Al MarjalaS03E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zwyurq0bfbry" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/k7hk5p6uvilu" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/md2epkb4newd" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/uhve5y3mqcb6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/b16pkl0icujr" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E29 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/rdrg1wrrjzdl" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/s3wthvi9qqtq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Doroob Al MarjalaS03E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/w5yxvixzsmbf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05 E15 -->
<iframe width="600" height="480" src="https://playmogo.com/e/wv7mz3nwt666" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/o6mtmhbuxhju" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/6e3ogj6i4sai" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/naqjq26tqfdv" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima and Halima S05 E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/xqjdbvrkyeex" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/s7yt3ww79y4h" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/52o7u9m4gdpj" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gnz6kutlwqmg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/esahxecb7qbd" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/669q31st2qbg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/bdsytf3pp4bc" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0dfcayntwl0j" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/pxlpnmn9lzpd" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qhx8ch1fk6ir" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/jpklxtdlwrgi" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Doroob Al MarjalaS03E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/7jie4k20l5kh" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dcm0ckv0zqtv" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Doroob Al MarjalaS03E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/b8hroh09d0cu" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/nl0tngsgsw5p" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ht4icm0c7ak2" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/esanmxmm92r1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dqkrx498k84m" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/jutk6pszibv8" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/l8hf9brvvhvb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Wadima Wa Halima S05E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/mo9345q8cjku" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/sri6mz7dfxha" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ul7igknss6zl" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/c8a4v8sex12f" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/3iw67y3emrmm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ko8ffpls1ie2" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/m5gs5p8kbx7v" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Watan A Watar 2026 E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/k51wr38z4tq1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ahcb0tw0j61e" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Watan A Watar 2026 E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/03lyv4rongpq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/i4yc8ut0fdn6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/mes6ws8q2ppa" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Al Qafer S01E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qf07dugvmhcb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E29 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2vsjn2hpg92o" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zeeht2xtqzh9" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Bait Al Tiin S06E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lh99jsxsstlx" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ucjk8s407i4m" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dr0bmkgl7dec" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ydjnbto56plr" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qw6v6fvippky" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Watan A Watar 2026 E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gyc9nd4fm6bp" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gwqscmvkv3wt" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zkhwa85t2m1m" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/q15fb6qtvgow" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/8xfcpv3gph4d" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/wr984gh48rf2" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Anbar 5 S01E01 new -->
<iframe width="600" height="480" src="https://playmogo.com/e/aed6b538idik" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/39nbi07gyeyg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E25 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/xwk2zd9xiz5q" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/pgdffx53182k" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- Jak Al Elm S03E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/wewcw7vgjbik" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
"""

pattern = re.compile(r'<!--\s*(.*?)\s*-->\s*<iframe.*?src="(https://playmogo.com/e/[^"]+)".*?</iframe>', re.DOTALL)
matches = pattern.findall(raw_data)
print(f"Found {len(matches)} embeds")

series_dict = {}

for comment, url in matches:
    # Identify series
    c_lower = comment.lower()
    series_key = None
    ep_num = 1
    
    if "doroob" in c_lower or "مرجلة" in c_lower:
        series_key = "doroob-al-marjala-s03"
    elif "al qafer" in c_lower or "القفير" in c_lower:
        series_key = "al-qafer-s01"
    elif "bait al tiin" in c_lower or "بيت الطين" in c_lower:
        series_key = "bait-al-tiin-s06"
    elif "wadima" in c_lower or "وديمة" in c_lower:
        series_key = "wadima-wa-halima-s05"
    elif "anbar 5" in c_lower or "عنبر" in c_lower:
        series_key = "anbar-5-s01"
    elif "jak al elm" in c_lower or "جاك العلم" in c_lower:
        series_key = "jak-al-elm-s03"
    elif "watan a watar" in c_lower or "وطن" in c_lower:
        series_key = "watan-a-watar-2026"
    else:
        print("Unrecognized series:", comment)
        continue

    # Extract episode number
    ep_match = re.search(r'E0*([0-9]+)', comment, re.IGNORECASE)
    if ep_match:
        ep_num = int(ep_match.group(1))
    else:
        # Check digit
        digit_match = re.search(r'([0-9]+)', comment)
        if digit_match:
            ep_num = int(digit_match.group(1))

    if series_key not in series_dict:
        series_dict[series_key] = {}
    
    # Store by episode number (deduplicating)
    if ep_num not in series_dict[series_key]:
        series_dict[series_key][ep_num] = url

for s_key, eps in series_dict.items():
    print(f"Series {s_key}: {len(eps)} episodes -> {sorted(eps.keys())}")
