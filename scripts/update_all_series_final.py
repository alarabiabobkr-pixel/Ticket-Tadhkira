import re, json, os, shutil


# Full combined raw data from turn 11 and turn 12
raw_data_turn11 = """
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

raw_data_turn12 = """
<!-- Jak Al Elm S03E07 720p SHAHID WEB-DL MeDo -->
<iframe width="600" height="480" src="https://playmogo.com/e/in9ybrr548w6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/1joyd1zeswlx" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zidwoeugcaqe" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/i9uoe0zbfugn" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ofonxylzoh3l" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/b9advhzmhbl7" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qarar S01 E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/o9mka0y0iixm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ds5krtt553k8" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2xkucqbq3w5e" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E25 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/c0m9kibgt9jg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zk3u6lldrbzm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/gh27c4t79ij8" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/pypf2br7fv6e" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E19WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qcnfgwgu4jgs" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lclit8ujll2o" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak Al Elm S03E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/p8hksvo0k5sq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/3nyzsjlh8l6h" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/e4ot8i1tzq8o" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/nqp319n8kfx4" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Jak El Elm S03E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ypwck03x5v7l" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qv9nja3ioih3" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/37oezvmaichu" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E17 -->
<iframe width="600" height="480" src="https://playmogo.com/e/wt9lyu6v5p8v" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/g2jykstd3xkf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/sj4v4x5ivx31" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/k4w6pb7vw0de" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E25 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/erm0v2v3d957" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lyx2a44cjkj6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/s9lk68rpz01g" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0v5478tsbxym" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lg7k4u9mc5dm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/8wujyt90dmi1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/wsg3g5x18a08" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lvqkloc4zp59" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/yk7mn8d1v7xz" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/g95ca0txpk0m" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/oxgadrrd5tfi" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/3as6daxauxbr" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/orzczweib3te" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0w49w7e5ep06" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lx9j9ii31nii" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qd65qlwoot6v" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Watan A Watar 2026 E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/1qfr8b1x72tr" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dsu4lbybfbay" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/o68k3uxb715s" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/fjsple2x83cm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/w757t9fnd9gi" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/omyfievorx1h" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/vjr2571lbr06" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/4cah7auheqp6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/qq2sx7g2o4kf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/u2eegvw3wml1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0udby1vuk1is" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/o6nd84qj3c7s" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/su5pyuyazimm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0qj7ovaogcwf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/3pxk331ztkle" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/x6v55acdwv8m" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/fpbb88itv5ni" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/0r3zewnee7zo" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Al Qafer S01E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/eoa81sq3k4zn" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/i5jktq5cjdv0" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/i9dy1q8ulwl3" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/69k09b8xw8qf" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5wajpteplnfd" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/yfkxjr2g7ftp" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dttua34l4hm5" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ksy76duygbyk" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/oxqk07htiama" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ywrfba2zp9d3" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/pudcfkrd8lhu" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E29 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/luzstpqw9ou6" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/z1xsj4mwg2s2" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/a16oxrgbl7m0" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/nmidg3mkijue" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Anbar 5 S01E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/z3zwp510t3ci" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/y6u7twt0kw5f" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/wcl7cazce373" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/63m1n1zw9gvv" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/chzbu1g3azhq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/mzcdzkxsrcn7" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/029tyjno8xjt" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/oatej3ak7n2c" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/i2bv7rh2x6no" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/zhay7k4bs7yw" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/z9wacjum9g05" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/czs6xqxzhsa0" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/ibf2v7ls9dz7" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/98mbcnyyymcu" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/8ejvv26whcne" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/inec7z1xi38h" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/hidebwd7ell0" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/oojrpq5yemuq" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2kn70ewgk2me" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
<!-- Doroob Al MarjalaS03E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/2d5x50sp2jod" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
"""

pattern = re.compile(r'<!--\s*(.*?)\s*-->\s*<iframe.*?src="(https://playmogo.com/e/[^"]+)".*?</iframe>', re.DOTALL)
all_matches = pattern.findall(raw_data_turn11 + "\n" + raw_data_turn12)
print(f"Total embed tags processed: {len(all_matches)}")

series_episodes = {}

for comment, url in all_matches:
    c_lower = comment.lower()
    series_id = None
    
    if "doroob" in c_lower or "مرجلة" in c_lower:
        series_id = "series-doroob-al-marjala-s03"
    elif "al qafer" in c_lower or "قافر" in c_lower or "قفير" in c_lower:
        series_id = "series-al-qafer-s01"
    elif "bait al tiin" in c_lower or "بيت الطين" in c_lower:
        series_id = "series-bait-al-tiin-s06"
    elif "wadima" in c_lower or "وديمة" in c_lower:
        series_id = "series-wadima-wa-halima-s05"
    elif "anbar 5" in c_lower or "عنبر" in c_lower:
        series_id = "series-anbar-5-s01"
    elif "jak al elm" in c_lower or "jak el elm" in c_lower or "جاك العلم" in c_lower:
        series_id = "series-jak-al-elm-s03"
    elif "watan a watar" in c_lower or "وطن" in c_lower:
        series_id = "series-watan-a-watar-2026"
    elif "qarar" in c_lower or "قرار" in c_lower:
        series_id = "series-al-qarar-s01"
    else:
        print("Unknown:", comment)
        continue

    # Extract episode number
    ep_num = 1
    m = re.search(r'E0*([0-9]+)', comment, re.IGNORECASE)
    if m:
        ep_num = int(m.group(1))
    else:
        m2 = re.search(r'([0-9]+)', comment)
        if m2:
            ep_num = int(m2.group(1))

    if series_id not in series_episodes:
        series_episodes[series_id] = {}
    
    # Store by episode number (dedup)
    series_episodes[series_id][ep_num] = url

for s_id, eps in series_episodes.items():
    print(f"{s_id}: {len(eps)} episodes -> min={min(eps.keys())}, max={max(eps.keys())}")

# Series Definitions with exact categorization
series_meta = {
    "series-doroob-al-marjala-s03": {
        "title": "مسلسل دروب المرجلة - الموسم الثالث (2024)",
        "originalTitle": "Doroob Al Marjala S03",
        "type": "series",
        "category": "series",
        "origin": "yemeni", # Yemen
        "genre": "دراما • تشويق • ملحمة وقبائل يمنية",
        "subGenre": "drama",
        "badge": "دراما يمنية 🇾🇪",
        "quality": "HD 720p",
        "year": "2024",
        "rating": "9.5",
        "overview": "المسلسل اليمني الجماهيري الأضخم، ملحمة من الشهامة والشجاعة والصراعات القبلية والاجتماعية في قالب درامي مشوق، بطولة صلاح الوافي، أشواق علي، زيدون العبيدي، ونخبة من نجوم الدراما اليمنية.",
        "actors": ["صلاح الوافي", "أشواق علي", "زيدون العبيدي", "أمل إسماعيل"]
    },
    "series-al-qafer-s01": {
        "title": "مسلسل القافر (القفير) - الموسم الأول",
        "originalTitle": "Al Qafer S01",
        "type": "series",
        "category": "series",
        "origin": "yemeni", # Yemeni / Gulf section
        "genre": "دراما • إثارة وغموض • تراث",
        "subGenre": "drama",
        "badge": "دراما يمنية وخليجية",
        "quality": "HD 720p",
        "year": "2024",
        "rating": "9.2",
        "overview": "مسلسل درامي تاريخي مشوق مأخوذ عن رائعة تغريبة القافر، يحكي صراع الحياة والماء في زمن الجفاف وعمق أسرار القرية والعلاقات الإنسانية.",
        "actors": ["يعقوب الحارثي", "سعود الخنجري", "سميرة الوهيبي"]
    },
    "series-anbar-5-s01": {
        "title": "مسلسل عنبر 5 - الموسم الأول (2026)",
        "originalTitle": "Anbar 5 S01",
        "type": "series",
        "category": "series",
        "origin": "yemeni", # Yemen
        "genre": "دراما • تشويق وإثارة • قضايا اجتماعية",
        "subGenre": "drama",
        "badge": "دراما يمنية 🇾🇪",
        "quality": "HD 720p",
        "year": "2026",
        "rating": "9.1",
        "overview": "مسلسل درامي يمني تشويقي يكشف النقاب عن الصراعات النفسية والإنسانية وقضايا المجتمع المسكوت عنها من وراء جدران العنبر الخامس، بطولة نبيل حزام وإبراهيم الزبلي وسحر الأصبحي.",
        "actors": ["نبيل حزام", "إبراهيم الزبلي", "سحر الأصبحي", "يحيى إبراهيم"]
    },
    "series-bait-al-tiin-s06": {
        "title": "مسلسل بيت الطين - الموسم السادس",
        "originalTitle": "Bait Al Tiin S06",
        "type": "series",
        "category": "series",
        "origin": "arabic", # Arab
        "genre": "كوميديا • دراما شعبية وتراثية",
        "subGenre": "drama",
        "badge": "دراما عراقية 🍿",
        "quality": "HD 720p",
        "year": "2024",
        "rating": "8.9",
        "overview": "الموسم السادس من المسلسل التراثي الشعبي العراقي الشهير بيت الطين، مواقف عفوية وطريفة تحاكي حياة القرية وبساطة أهلها في قالب كوميدي واجتماعي محبب.",
        "actors": ["حافظ لعيبي", "أنعام الربيعي", "خضير أبو العباس"]
    },
    "series-wadima-wa-halima-s05": {
        "title": "مسلسل وديمة وحليمة - الموسم الخامس",
        "originalTitle": "Wadima and Halima S05",
        "type": "series",
        "category": "series",
        "origin": "arabic", # Arab / Gulf
        "genre": "كوميديا • مواقف عائلية ومقالب",
        "subGenre": "comedy",
        "badge": "كوميديا إماراتية 🍿",
        "quality": "HD 720p",
        "year": "2024",
        "rating": "9.0",
        "overview": "المسلسل الكوميدي الخليجي المحبوب بموسمه الخامس، مواجهات ومناكفات كوميدية ساخرة لا تتوقف بين الجارتين وديمة وحليمة في صراع يومي فكاهي ممتع.",
        "actors": ["سعاد علي", "ملاك الخالدي", "داود حسين"]
    },
    "series-jak-al-elm-s03": {
        "title": "مسلسل جاك العلم - الموسم الثالث",
        "originalTitle": "Jak Al Elm S03",
        "type": "series",
        "category": "series",
        "origin": "arabic", # Arab / Saudi
        "genre": "كوميديا • مواقف فكاهية • أبو صامل وأم صامل",
        "subGenre": "comedy",
        "badge": "كوميديا سعودية 🍿",
        "quality": "HD 720p",
        "year": "2024",
        "rating": "9.0",
        "overview": "يوميات ومقالب أبو صامل وأم صامل في قالب كوميدي ساخر وخفيف الظل يتناول الصراعات والمفارقات الزوجية بطريقة فكاهية ممتعة، من إنتاج MBC.",
        "actors": ["ماجد مطرب فواز", "ريم عبد الله", "حبيب الحبيب"]
    },
    "series-watan-a-watar-2026": {
        "title": "مسلسل وطن ع وتر (2026)",
        "originalTitle": "Watan A Watar 2026",
        "type": "series",
        "category": "series",
        "origin": "arabic", # Arab
        "genre": "كوميديا ساخرة • نقد اجتماعي",
        "subGenre": "comedy",
        "badge": "كوميديا ساخرة 🍿",
        "quality": "HD 720p",
        "year": "2026",
        "rating": "8.8",
        "overview": "اللوحات الكوميدية الساخرة والناقدة لعماد فراجين ونخبة من نجوم الكوميديا، معالجة فكاهية جريئة لأحداث اليوم وهموم الشارع العربي.",
        "actors": ["عماد فراجين", "محمد الطيطي", "معتصم الفحماوي"]
    },
    "series-al-qarar-s01": {
        "title": "مسلسل القرار - الموسم الأول",
        "originalTitle": "Al Qarar S01",
        "type": "series",
        "category": "series",
        "origin": "arabic", # Arab
        "genre": "دراما • حرب وأكشن • تاريخي",
        "subGenre": "drama",
        "badge": "دراما وحرب 🍿",
        "quality": "HD 720p",
        "year": "2026",
        "rating": "8.7",
        "overview": "مسلسل درامي ملحمي يوثق أحداث حرب الكرامة والصمود ومعارك شرق ليبيا ضد الإرهاب وما رافقها من تضحيات أسطورية وبطولات وطنية.",
        "actors": ["زياد صبحي عون", "آية شو", "نورهان أشرف"]
    }
}

# Generate backdrops from official posters
public_dir = "public"
dist_dir = "dist-hd-perfect"

for s_id in series_meta.keys():
    poster_path = os.path.join(public_dir, "posters", f"{s_id}.jpg")
    backdrop_path = os.path.join(public_dir, "backdrops", f"{s_id}.jpg")
    if os.path.exists(poster_path):
        shutil.copyfile(poster_path, backdrop_path)
        print(f"Assigned backdrop for {s_id}")

# Build final JSON items
formatted_series = []

for s_id, meta in series_meta.items():
    eps_dict = series_episodes.get(s_id, {})
    sorted_ep_nums = sorted(eps_dict.keys())
    
    episodes_list = []
    for ep_n in sorted_ep_nums:
        u = eps_dict[ep_n]
        title_str = f"الحلقة {ep_n}"
        if ep_n == sorted_ep_nums[-1] and len(sorted_ep_nums) >= 20:
            title_str += " (الختامية)"
        episodes_list.append({
            "episodeNum": ep_n,
            "title": title_str,
            "embedUrl": u,
            "streamUrl": u,
            "customWidth": 600,
            "customHeight": 480
        })

    first_embed = episodes_list[0]["embedUrl"] if episodes_list else ""

    item = {
        "id": s_id,
        "title": meta["title"],
        "originalTitle": meta["originalTitle"],
        "type": "series",
        "category": "series",
        "duration": f"{len(episodes_list)} حلقة كاملة",
        "genre": meta["genre"],
        "subGenre": meta["subGenre"],
        "badge": meta["badge"],
        "quality": meta["quality"],
        "year": meta["year"],
        "rating": meta["rating"],
        "origin": meta["origin"],
        "embedUrl": first_embed,
        "streamUrl": first_embed,
        "customWidth": 600,
        "customHeight": 480,
        "poster": f"/posters/{s_id}.jpg",
        "backdrop": f"/backdrops/{s_id}.jpg",
        "overview": meta["overview"],
        "actors": meta["actors"],
        "episodesCount": len(episodes_list),
        "episodes": episodes_list
    }
    formatted_series.append(item)

# Update catalog files
curated_path = "public/curated_catalog.json"
catalog_path = "public/catalog.json"
catalog_js_path = "public/catalog.js"

with open(curated_path, "r", encoding="utf-8") as f:
    existing = json.load(f)

# Filter out any old entries with these IDs
ids_to_replace = set(series_meta.keys())
filtered_existing = [x for x in existing if x.get("id") not in ids_to_replace]

# Prepend the newly fully constructed series
final_catalog = formatted_series + filtered_existing

with open(curated_path, "w", encoding="utf-8") as f:
    json.dump(final_catalog, f, ensure_ascii=False, indent=2)

with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(final_catalog, f, ensure_ascii=False, indent=2)

with open(catalog_js_path, "w", encoding="utf-8") as f:
    f.write("window.TADHKIRA_MEDIA = " + json.dumps(final_catalog, ensure_ascii=False, indent=2) + ";")

print(f"Catalog updated successfully! Total items: {len(final_catalog)}")
for fs in formatted_series:
    print(f"  -> {fs['title']} | Origin: {fs['origin']} | Episodes: {fs['episodesCount']}")
