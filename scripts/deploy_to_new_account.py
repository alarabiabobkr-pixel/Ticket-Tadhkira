#!/usr/bin/env python3
"""
Deploy latest Ticket VIP Cinema catalog & site exclusively to the new Netlify account
Primary Site: https://ticket-vib.netlify.app (7ec7b766-4de7-4eea-81ac-b04bef6caa68)
"""

import os
import sys
import json
import zipfile
import shutil
import urllib.request
import urllib.error

TOKEN = os.environ.get("NETLIFY_TOKEN", "nfp_3FY29ryKCE3nwoHA9uwMii8SFqAjhjwoa39f")
SITE_ID = os.environ.get("NETLIFY_SITE_ID", "7ec7b766-4de7-4eea-81ac-b04bef6caa68")
API_BASE = "https://api.netlify.com/api/v1"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "User-Agent": "TicketVipDeployer/1.0"
}

def prepare_dist():
    print("Preparing dist directory for deploy...")
    dist = "dist-deploy"
    if os.path.exists(dist):
        shutil.rmtree(dist)
    os.makedirs(dist, exist_ok=True)

    # Copy index.html from root
    if os.path.exists("index.html"):
        shutil.copy2("index.html", os.path.join(dist, "index.html"))
        print("+ Copied index.html")

    # Copy files from public/
    if os.path.exists("public"):
        for item in os.listdir("public"):
            if item.endswith(".zip"):
                continue
            s = os.path.join("public", item)
            d = os.path.join(dist, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
            else:
                shutil.copy2(s, d)
        print("+ Synced public/ assets, posters, catalog")

    # Ensure curated_catalog.json and catalog.js exist
    if os.path.exists(os.path.join("public", "catalog.json")) and not os.path.exists(os.path.join(dist, "curated_catalog.json")):
        shutil.copy2(os.path.join("public", "catalog.json"), os.path.join(dist, "curated_catalog.json"))

    # Also sync posters from dist-hd-perfect/posters if any were added there
    if os.path.exists("dist-hd-perfect/posters"):
        shutil.copytree("dist-hd-perfect/posters", os.path.join(dist, "posters"), dirs_exist_ok=True)

    # Create zip file
    zip_path = "site_deploy.zip"
    if os.path.exists(zip_path):
        os.remove(zip_path)

    print("Creating site_deploy.zip...")
    file_count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(dist):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, dist)
                z.write(full_path, rel_path)
                file_count += 1

    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Zip created with {file_count} files, size: {zip_size_mb:.2f} MB")
    return zip_path

def get_or_create_site(site_name="ticket-cinema-vip"):
    print(f"Checking existing sites on account...")
    req = urllib.request.Request(f"{API_BASE}/sites", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            sites = json.loads(r.read().decode())
            print(f"Found {len(sites)} existing sites on account.")
            if sites:
                site = sites[0]
                print(f"Using existing site: {site.get('name')} ({site.get('id')})")
                return site.get("id"), site.get("ssl_url") or site.get("url")
    except Exception as e:
        print(f"Listing sites failed: {e}")

    # Create a new site
    print(f"Creating new site '{site_name}'...")
    body = json.dumps({"name": site_name}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/sites",
        data=body,
        headers={**HEADERS, "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            site = json.loads(r.read().decode())
            print(f"Created site: {site.get('name')} ({site.get('id')})")
            return site.get("id"), site.get("ssl_url") or site.get("url")
    except urllib.error.HTTPError as e:
        # If name is taken, create without name (Netlify assigns unique random slug)
        err = e.read().decode()
        print(f"Site creation with name failed ({e.code}): {err}, creating with auto name...")
        req = urllib.request.Request(
            f"{API_BASE}/sites",
            data=b"{}",
            headers={**HEADERS, "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            site = json.loads(r.read().decode())
            print(f"Created auto-named site: {site.get('name')} ({site.get('id')})")
            return site.get("id"), site.get("ssl_url") or site.get("url")

def deploy_zip(site_id, zip_path):
    print(f"Deploying {zip_path} to site {site_id}...")
    with open(zip_path, "rb") as f:
        zip_data = f.read()

    url = f"{API_BASE}/sites/{site_id}/deploys"
    req = urllib.request.Request(
        url,
        data=zip_data,
        headers={
            **HEADERS,
            "Content-Type": "application/zip",
            "Content-Length": str(len(zip_data))
        }
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        deploy = json.loads(r.read().decode())
        print(f"Deploy response status: {r.status}")
        print(f"Deploy ID: {deploy.get('id')}")
        print(f"Deploy State: {deploy.get('state')}")
        print(f"Deploy URL: {deploy.get('deploy_ssl_url') or deploy.get('url')}")
        return deploy

import hashlib


def collect_site_files():
    print("Collecting site files and computing SHA1 hashes...")
    file_map = {}
    sha1_to_path = {}

    def add_file(rel_web_path, local_path):
        web_key = "/" + rel_web_path.replace("\\", "/").lstrip("/")
        data = open(local_path, "rb").read()
        digest = hashlib.sha1(data).hexdigest()
        file_map[web_key] = digest
        sha1_to_path[digest] = local_path

    if os.path.exists("index.html"):
        add_file("index.html", "index.html")

    if os.path.exists("public"):
        for root, _, files in os.walk("public"):
            for file in files:
                if file.endswith(".zip"):
                    continue
                full_path = os.path.join(root, file)
                rel = os.path.relpath(full_path, "public")
                add_file(rel, full_path)

    if "/curated_catalog.json" not in file_map and os.path.exists(os.path.join("public", "catalog.json")):
        add_file("curated_catalog.json", os.path.join("public", "catalog.json"))

    print(f"+ Indexed {len(file_map)} site files for delta deploy.")
    return file_map, sha1_to_path


def deploy_via_digest(token, site_id, site_name=""):
    file_map, sha1_to_path = collect_site_files()
    url = f"{API_BASE}/sites/{site_id}/deploys"
    payload = json.dumps({"files": file_map}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "TicketVipDeployer/2.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            deploy = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[{site_name}] Digest init error HTTP {e.code}: {err_body[:400]}")
        return None

    deploy_id = deploy.get("id")
    required = deploy.get("required") or []
    print(f"[{site_name}] Deploy {deploy_id} state={deploy.get('state')}, required uploads={len(required)}")

    for idx, sha in enumerate(required, 1):
        local_path = sha1_to_path.get(sha)
        if not local_path:
            continue
        # Find corresponding web path for this sha
        web_paths = [k for k, v in file_map.items() if v == sha]
        if not web_paths:
            continue
        web_path = web_paths[0]
        raw_bytes = open(local_path, "rb").read()
        up_url = f"{API_BASE}/deploys/{deploy_id}/files{web_path}"
        up_req = urllib.request.Request(
            up_url,
            data=raw_bytes,
            method="PUT",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream",
                "User-Agent": "TicketVipDeployer/2.0",
            },
        )
        with urllib.request.urlopen(up_req, timeout=60) as ur:
            _ = ur.read()
        print(f"  [{idx}/{len(required)}] Uploaded {web_path} ({len(raw_bytes)} bytes)")

    # Fetch final deploy state
    status_req = urllib.request.Request(
        f"{API_BASE}/deploys/{deploy_id}",
        headers={"Authorization": f"Bearer {token}", "User-Agent": "TicketVipDeployer/2.0"},
    )
    with urllib.request.urlopen(status_req, timeout=30) as sr:
        final_deploy = json.loads(sr.read().decode())
    print(f"[{site_name}] Final state: {final_deploy.get('state')}, URL: {final_deploy.get('ssl_url') or final_deploy.get('url')}")
    return final_deploy


def main():
    # Exclusive Primary Live Platform: https://ticket-vib.netlify.app
    deploy_via_digest(
        token=TOKEN,
        site_id=SITE_ID,
        site_name="ticket-vib.netlify.app",
    )

    print("==================================================")
    print("🚀 DEPLOYED EXCLUSIVELY TO ticket-vib.netlify.app!")
    print("==================================================")


if __name__ == "__main__":
    main()


