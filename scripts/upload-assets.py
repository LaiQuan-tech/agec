#!/usr/bin/env python3
"""
Step 4b of the news migration: downloaded files → Supabase Storage.

Reads `data/assets.json` (what fetch-assets.py managed to retrieve) and writes
`data/url-map.json`, an old-URL → new-URL table the import step uses to rewrite
the article bodies.

Idempotent by construction: the object key is derived from the source URL's own
24-hex CMS id, so re-running overwrites the same object rather than making a
second copy, and a run interrupted halfway can simply be repeated.

Two buckets:
  posters      inline images. The department's announcements are overwhelmingly
               event posters, which is what that bucket is named for.
  attachments  everything offered as a download.

⚠️ Uses the service-role key, which bypasses the `is_admin()` policy on
storage.objects. That is the right call for a one-off import run from a
developer's machine — there is no signed-in admin to borrow a session from —
but it is the reason this script is not something to leave wired into anything
that runs on its own.
"""
import json
import os
import subprocess
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# `file` sniffs these; Storage needs the mime that matches the extension a
# reader will end up saving. Anything not listed is refused rather than guessed:
# an object stored as the wrong type downloads with the wrong extension and
# opens in the wrong application.
EXT_FOR_MIME = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/zip": "zip",
    "application/x-7z-compressed": "7z",
    "application/x-rar": "rar",
    "application/x-rar-compressed": "rar",
    "application/vnd.rar": "rar",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
}

# `file` reports these; Storage wants the canonical name on the left.
MIME_ALIASES = {
    "application/x-rar": "application/vnd.rar",
    "application/CDFV2": "application/msword",
    "application/octet-stream": None,   # unusable — see below
}


def env() -> tuple[str, str]:
    values = {}
    for line in open(f"{ROOT}/.env.local", encoding="utf-8"):
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.strip().partition("=")
            values[k] = v.strip().strip('"')
    return values["NEXT_PUBLIC_SUPABASE_URL"], values["SUPABASE_SERVICE_ROLE_KEY"]


def resolve_mime(entry: dict) -> tuple[str | None, str]:
    """The mime to store under, and the extension to give the object key."""
    mime = MIME_ALIASES.get(entry["mime"], entry["mime"])
    if mime is None:
        # Fall back to the original filename's extension when the bytes are
        # unrecognisable. The old CMS's Office files sometimes sniff as
        # octet-stream, and the extension is the only remaining signal.
        name = (entry.get("filename") or entry.get("label") or "").lower()
        for candidate_mime, ext in EXT_FOR_MIME.items():
            if name.endswith("." + ext):
                return candidate_mime, ext
        return None, ""
    return (mime, EXT_FOR_MIME[mime]) if mime in EXT_FOR_MIME else (None, "")


def main() -> int:
    base, key = env()
    assets = json.load(open(f"{HERE}/data/assets.json", encoding="utf-8"))

    url_map, stats, skipped = {}, Counter(), []

    for n, entry in enumerate([a for a in assets if a["ok"]], 1):
        mime, ext = resolve_mime(entry)
        if not mime:
            stats["跳過-無法判斷型別"] += 1
            skipped.append({"url": entry["url"], "sniffed": entry["mime"],
                            "filename": entry.get("filename")})
            continue

        bucket = "posters" if entry["kind"] == "image" else "attachments"
        # The CMS object id, already unique across the whole corpus.
        object_key = f"news/{os.path.basename(entry['path'])}.{ext}"

        result = subprocess.run(
            ["curl", "-sS", "-X", "POST",
             f"{base}/storage/v1/object/{bucket}/{object_key}",
             "-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}",
             "-H", f"Content-Type: {mime}",
             # Overwrite rather than fail, so a re-run is a no-op instead of an
             # error per already-uploaded file.
             "-H", "x-upsert: true",
             "--data-binary", f"@{entry['path']}",
             "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True,
        )
        code = result.stdout.strip()
        if code != "200":
            stats[f"上傳失敗-{code}"] += 1
            skipped.append({"url": entry["url"], "http": code, "mime": mime})
            continue

        url_map[entry["url"]] = {
            "url": f"{base}/storage/v1/object/public/{bucket}/{object_key}",
            "kind": entry["kind"],
            "name": entry.get("filename") or entry.get("label") or object_key,
            "size": entry["size"],
            "mime": mime,
        }
        stats[f"上傳-{entry['kind']}"] += 1
        if n % 50 == 0:
            print(f"  … {n}", flush=True)

    json.dump(url_map, open(f"{HERE}/data/url-map.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump(skipped, open(f"{HERE}/data/upload-skipped.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    print("\n" + "  ".join(f"{k} {v}" for k, v in sorted(stats.items())))
    if skipped:
        print(f"\n沒上傳的 {len(skipped)} 個：")
        for s in skipped[:20]:
            print(f"  {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
