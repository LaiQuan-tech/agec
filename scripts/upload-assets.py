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
    "application/vnd.oasis.opendocument.text": "odt",
    "application/vnd.oasis.opendocument.spreadsheet": "ods",
    # 一份叫 .doc 的檔案，位元組其實是 RTF。照真實型別存，不照副檔名硬塞成
    # msword——mime 是給瀏覽器判斷怎麼開的，寫錯就是騙它。
    "text/rtf": "rtf",
    "application/rtf": "rtf",
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


# posters / photos / blog 的上限。超過就縮，不是跳過。
IMAGE_LIMIT = 10 * 1024 * 1024
# 縮到這個長邊。舊站有一張 18MB、直接從 Photoshop 匯出的原圖——那種東西掛在
# 消息內文上，讀者要先下載 18MB 才看得到一張照片，這是缺陷不是規格。
# 2000px 在 Retina 的全寬版位上仍然銳利。
MAX_EDGE = 2000


def shrink(path: str) -> str | None:
    """
    Downscale an oversized image to a web-serving copy, and return its path.

    ⚠️ Writes a new file; the original download is left untouched. Re-running is
    safe, and the byte-for-byte original is still in the asset cache if anyone
    needs it.

    Returns None when sips is unavailable or fails — the caller then skips the
    file and reports it, rather than uploading something it has not checked.
    """
    out = path + ".web.jpg"
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return out
    r = subprocess.run(
        ["sips", "-Z", str(MAX_EDGE), "-s", "format", "jpeg",
         "-s", "formatOptions", "80", path, "--out", out],
        capture_output=True, text=True,
    )
    return out if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) else None


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

        source = entry["path"]
        if entry["kind"] == "image" and entry["size"] > IMAGE_LIMIT:
            smaller = shrink(source)
            if not smaller:
                stats["跳過-過大且縮圖失敗"] += 1
                skipped.append({"url": entry["url"], "size": entry["size"],
                                "reason": "超過 bucket 上限，sips 縮圖失敗"})
                continue
            print(f"  縮圖 {entry['size'] // 1048576}MB → "
                  f"{os.path.getsize(smaller) // 1024}KB  {entry['url'][-48:]}", flush=True)
            source, mime, ext = smaller, "image/jpeg", "jpg"
            object_key = f"news/{os.path.basename(entry['path'])}.jpg"
            stats["縮圖"] += 1

        result = subprocess.run(
            ["curl", "-sS", "-X", "POST",
             f"{base}/storage/v1/object/{bucket}/{object_key}",
             "-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}",
             "-H", f"Content-Type: {mime}",
             # Overwrite rather than fail, so a re-run is a no-op instead of an
             # error per already-uploaded file.
             "-H", "x-upsert: true",
             "--data-binary", f"@{source}",
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
            # The size actually served, which is what the download label on an
            # attachment shows — not the size of what came off the old site.
            "size": os.path.getsize(source),
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
