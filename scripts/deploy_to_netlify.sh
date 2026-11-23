#!/bin/bash
set -e

# Netlify automated deployment script
NETLIFY_TOKEN="nfp_3FY29ryKCE3nwoHA9uwMii8SFqAjhjwoa39f"
SITE_ID="7ec7b766-4de7-4eea-81ac-b04bef6caa68"
SITE_NAME="ticket-vib"

echo "Building fresh FHD package..."
python3 -c '
import os, zipfile, shutil

dist_dir = "dist-hd-perfect"
if os.path.exists(dist_dir):
    shutil.rmtree(dist_dir)

os.makedirs(os.path.join(dist_dir, "posters"), exist_ok=True)
os.makedirs(os.path.join(dist_dir, "backdrops"), exist_ok=True)
os.makedirs(os.path.join(dist_dir, "actors"), exist_ok=True)
os.makedirs(os.path.join(dist_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(dist_dir, "js"), exist_ok=True)

# Copy base files & images
base_files = [
    "index.html", "googleaaffbd287cd065c7.html", "catalog.js", "catalog.json", 
    "curated_catalog.json", "robots.txt", "sitemap.xml", "manifest.webmanifest", 
    "_redirects", "netlify.toml", "icon.svg", "favicon.ico", "favicon.png", 
    "favicon-48x48.png", "favicon-96x96.png", "pwa-192x192.png", "pwa-512x512.png", 
    "pwa-maskable-512x512.png", "apple-touch-icon.png", "logo-circle.png", 
    "logo.png", "logo.webp", "og-image.jpg"
]
for f in base_files:
    src = os.path.join("public", f) if os.path.exists(os.path.join("public", f)) else f
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(dist_dir, f))

# Copy css & js
for f in os.listdir("public/css"):
    shutil.copy2(os.path.join("public/css", f), os.path.join(dist_dir, "css", f))
for f in os.listdir("public/js"):
    shutil.copy2(os.path.join("public/js", f), os.path.join(dist_dir, "js", f))

# Copy all actor avatars
for f in os.listdir("public/actors"):
    shutil.copy2(os.path.join("public/actors", f), os.path.join(dist_dir, "actors", f))

# Copy all original posters
for f in os.listdir("public/posters"):
    shutil.copy2(os.path.join("public/posters", f), os.path.join(dist_dir, "posters", f))

# Copy top backdrops
import json
with open("public/curated_catalog.json") as f:
    cat = json.load(f)
for item in cat[:30]:
    b = item.get("backdrop", "")
    if b.startswith("/backdrops/"):
        fname = b.replace("/backdrops/", "")
        src = os.path.join("public/backdrops", fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(dist_dir, "backdrops", fname))

zip_name = "public/ticket-website-fhd.zip"
with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            full = os.path.join(root, file)
            rel = os.path.relpath(full, dist_dir)
            z.write(full, rel)
'

echo "Deploying directly to Netlify ($SITE_NAME)..."
RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $NETLIFY_TOKEN" \
     -H "Content-Type: application/zip" \
     --data-binary "@public/ticket-website-fhd.zip" \
     "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys")

echo "$RESPONSE" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    deploy_id = data.get("id")
    state = data.get("state")
    ssl_url = data.get("ssl_url") or data.get("url")
    print(f"DEPLOY SUCCESS: ID={deploy_id}, State={state}, URL={ssl_url}")
except Exception as e:
    print("Response parse note:", e)
'

