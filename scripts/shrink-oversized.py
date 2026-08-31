#!/usr/bin/env python3
"""
Step 6 (optional, re-runnable): downscale the imported images that are far
larger than any layout can use, and replace them in Storage.

The old CMS stored whatever was uploaded. A hundred of the 376 migrated images
are wider than 2000px and together account for 337MB of the 487MB total —
posters exported straight from Photoshop, some over 7MB, one at 17MB. The
column they render into (`.post-body`) is 760px wide, so even 1600px is already
a 2× retina image; 4000px is bytes nobody can see.

Deliberately narrow, so this cannot damage anything:
  · only images wider than MAX_EDGE — the rest are left byte-for-byte alone
  · the format is preserved, so the object key is unchanged and neither
    `news.cover_url` nor the `<img src>` inside `content_html` needs rewriting
  · the downloaded original stays in the asset cache untouched; this writes a
    sibling file
  · upsert, so re-running is a no-op

⚠️ Not a general "optimise the images" pass. Converting the 73 oversized PNG
posters to JPEG would save another ~60MB, but that changes the extension, which
changes the object key, which means rewriting every reference in the database —
a different job with a different risk profile.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# 2.6× the 760px prose column. Comfortably past what any display can resolve
# there, and far enough from the source widths that nothing visibly softens.
MAX_EDGE = 2000


def env() -> tuple[str, str]:
    values = {}
    for line in open(f"{ROOT}/.env.local", encoding="utf-8"):
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.strip().partition("=")
            values[k] = v.strip().strip('"')
    return values["NEXT_PUBLIC_SUPABASE_URL"], values["SUPABASE_SERVICE_ROLE_KEY"]


def width_of(path: str) -> int:
    out = subprocess.run(["sips", "-g", "pixelWidth", path],
                         capture_output=True, text=True).stdout
    for line in out.splitlines():
        if "pixelWidth:" in line:
            return int(line.split(":")[1].strip())
    return 0


def main() -> int:
    base, key = env()
    url_map = json.load(open(f"{HERE}/data/url-map.json", encoding="utf-8"))
    assets = {e["url"]: e for e in json.load(open(f"{HERE}/data/assets.json", encoding="utf-8"))}

    before = after = 0
    done = skipped = failed = 0

    for src_url, mapped in url_map.items():
        if mapped["kind"] != "image":
            continue
        entry = assets.get(src_url)
        if not entry or not entry["ok"]:
            continue
        if width_of(entry["path"]) <= MAX_EDGE:
            skipped += 1
            continue

        smaller = entry["path"] + f".{MAX_EDGE}"
        if not (os.path.exists(smaller) and os.path.getsize(smaller)):
            r = subprocess.run(["sips", "-Z", str(MAX_EDGE), entry["path"], "--out", smaller],
                               capture_output=True, text=True)
            if r.returncode != 0 or not os.path.exists(smaller):
                failed += 1
                print(f"  ✗ 縮圖失敗 {src_url[-50:]}", flush=True)
                continue

        # Same object key as the original upload — the extension has not
        # changed, so nothing in the database points anywhere new.
        object_key = mapped["url"].split("/public/", 1)[1].split("/", 1)[1]
        bucket = mapped["url"].split("/public/", 1)[1].split("/", 1)[0]

        code = subprocess.run(
            ["curl", "-sS", "-X", "POST",
             f"{base}/storage/v1/object/{bucket}/{object_key}",
             "-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}",
             "-H", f"Content-Type: {mapped['mime']}", "-H", "x-upsert: true",
             "--data-binary", f"@{smaller}", "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True,
        ).stdout.strip()

        if code != "200":
            failed += 1
            print(f"  ✗ 上傳 {code} {object_key}", flush=True)
            continue

        before += entry["size"]
        after += os.path.getsize(smaller)
        done += 1
        if done % 20 == 0:
            print(f"  … 已處理 {done}", flush=True)

    mb = lambda n: f"{n / 1048576:.0f}MB"
    print(f"\n縮圖 {done} 張、略過 {skipped} 張（本來就不大）、失敗 {failed} 張")
    if done:
        print(f"{mb(before)} → {mb(after)}（省下 {mb(before - after)}，{1 - after / before:.0%}）")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
