import json, re, os, shutil

raw_data = """
<!-- El Dayiea S01E30 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/p8adgiq7lhft" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E27 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/rukz5xyh3rqi" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E28 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/dzabfkeh3j0t" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E26 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5hvks3hfyxni" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E29 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/k00cbp5mf0fg" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E17 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/kvtsht7flaoc" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E21 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5b4m1bw1x6nl" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E13 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/mtfqjtfijor1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E18 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/nqk4vbhqbah7" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E20 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/bolegfs03qde" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E05 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5ym481ux8wj5" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E15 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/lfuv8b0qu0oa" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E09 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/5q2zcuadu9e5" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E03 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/rbsisff693xz" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E08 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/iyof34u1tiu8" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E07 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/246a4gzkyst7" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E25 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/br2ddd6wicj1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E16 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/jr0k67lswulh" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E24 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/vi9hklfqpamb" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E04 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/nsnycsne7n9z" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E11 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/9dsv9rt1fgkm" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E01 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/55ctpu37wfbl" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E02 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/938ss58cqzar" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E12 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/8e2bgsjp1a76" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E10 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/fj7y8ioi6866" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E22 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/vv5g5ungzm7f" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E19 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/vsnefsq7qafl" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E14 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/36lxiylpn022" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E23 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/uzq218ee5oi1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>

<!-- El Dayiea S01E06 WEB-DL AKWAM -->
<iframe width="600" height="480" src="https://playmogo.com/e/y4pj59a3y43q" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>
"""

pattern = re.compile(r'<!--\s*(.*?)\s*-->\s*<iframe.*?src="(https://playmogo.com/e/[^"]+)".*?</iframe>', re.DOTALL)
matches = pattern.findall(raw_data)
print(f"Found {len(matches)} episode embeds for El Dayiea")

eps_map = {}
for comment, url in matches:
    m = re.search(r'E0*([0-9]+)', comment, re.IGNORECASE)
    if m:
        ep_num = int(m.group(1))
        eps_map[ep_num] = url

print(f"Total unique episodes: {len(eps_map)} -> {sorted(eps_map.keys())}")

episodes_list = []
for ep_n in sorted(eps_map.keys()):
    title_str = f"الحلقة {ep_n}"
    if ep_n == 30:
        title_str += " (الختامية)"
    episodes_list.append({
        "episodeNum": ep_n,
        "title": title_str,
        "embedUrl": eps_map[ep_n],
        "streamUrl": eps_map[ep_n],
        "customWidth": 600,
        "customHeight": 480
    })

new_series = {
    "id": "series-el-dayiea-s01",
    "title": "مسلسل الضايعة - الموسم الأول (2026)",
    "originalTitle": "El Dayiea S01",
    "type": "series",
    "category": "series",
    "origin": "yemeni", # Yemen
    "duration": "30 حلقة كاملة",
    "genre": "كوميديا • دراما اجتماعية وتشويق يمني",
    "subGenre": "comedy",
    "badge": "دراما يمنية 🇾🇪",
    "quality": "HD 720p",
    "year": "2026",
    "rating": "9.4",
    "embedUrl": episodes_list[0]["embedUrl"],
    "streamUrl": episodes_list[0]["embedUrl"],
    "customWidth": 600,
    "customHeight": 480,
    "poster": "/posters/series-el-dayiea-s01.jpg",
    "backdrop": "/backdrops/series-el-dayiea-s01.jpg",
    "overview": "المسلسل الكوميدي الاجتماعي اليمني الضخم، أحداث ومواقف طريفة ومشوقة تدور في إطار شعبي وواقعي حول حكايات الضايعة وصراعاتها الفكاهية، من بطولة النجم محمد قحطان وعبدالله يحيى إبراهيم وكمال طماح.",
    "actors": ["محمد قحطان", "عبدالله يحيى إبراهيم", "كمال طماح", "حسن الجماعي"],
    "episodesCount": len(episodes_list),
    "episodes": episodes_list
}

# Update catalogs
curated_path = "public/curated_catalog.json"
catalog_path = "public/catalog.json"
catalog_js_path = "public/catalog.js"

with open(curated_path, "r", encoding="utf-8") as f:
    cat = json.load(f)

# Filter out if exists
cat = [x for x in cat if x.get("id") != new_series["id"]]

# Prepend new_series right at the top
updated_cat = [new_series] + cat

with open(curated_path, "w", encoding="utf-8") as f:
    json.dump(updated_cat, f, ensure_ascii=False, indent=2)

with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(updated_cat, f, ensure_ascii=False, indent=2)

with open(catalog_js_path, "w", encoding="utf-8") as f:
    f.write("window.TADHKIRA_MEDIA = " + json.dumps(updated_cat, ensure_ascii=False, indent=2) + ";")

print(f"Added {new_series['title']} with {len(episodes_list)} episodes to catalogs! Total items: {len(updated_cat)}")
