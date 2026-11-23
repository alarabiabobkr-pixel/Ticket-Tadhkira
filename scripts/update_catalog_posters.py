import json

target_ids = {
    "movie-love-with-its-details-2023", "movie-esaaf-2025", "movie-el-shater-2025",
    "movie-abo-nasab-2023", "movie-restart-2025", "movie-rocky-el-ghalaba-2025",
    "movie-groom-and-two-brides-2025", "movie-ghomeda-2025", "movie-seeking-haven-for-mr-rambo",
    "play-al-signor-oqdat-al-khawaja", "movie-el-qesas-2024", "movie-the-system-2024",
    "movie-el-hana-elly-ana-feeh", "play-sambosa-chapati-2025", "movie-shabab-el-bomb-2-2025",
    "movie-pension-dalal-2024", "movie-fakhr-al-suwaidi-2024", "movie-a-matter-of-life-and-death",
    "movie-darweesh-2025", "play-tallaqni-2025", "movie-al-dawr-al-sabe",
    "movie-gergasha-the-movie", "movie-family-business-2026", "movie-qashmoo-2024",
    "movie-bershama-2025", "movie-ahmed-wa-ahmed-2025", "movie-en-ghab-el-kot-2025",
    "movie-mr-ex-2023", "play-anistoona-2024", "play-al-sada-al-afadel",
    "movie-sakr-w-kanarya-2026", "movie-the-fakenapping-2025", "movie-feeha-eh-yaani-2025",
    "play-da-sot-eh-da-2026", "movie-the-gang-of-el-max-2024", "movie-bath-mobasher-2017",
    "movie-egybest-2026", "movie-al-mahytya-2026", "movie-alzarfah-hanhounia-hell-2025",
    "movie-waqt-edafy-2024"
}

def update_catalog_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    count = 0
    for item in data:
        if item.get("id") in target_ids:
            item["poster"] = f"/posters/{item['id']}.jpg"
            item["backdrop"] = f"/backdrops/{item['id']}.jpg"
            count += 1
            
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}: modified {count} items")
    return data

curated = update_catalog_file("public/curated_catalog.json")
cat = update_catalog_file("public/catalog.json")

# Write catalog.js
with open("public/catalog.js", "w", encoding="utf-8") as f:
    f.write("window.TADHKIRA_MEDIA = " + json.dumps(cat, ensure_ascii=False, indent=2) + ";\n")
    f.write("window.CURATED_CATALOG = window.TADHKIRA_MEDIA;\n")

print("Successfully updated public/catalog.js!")
