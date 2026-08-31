#!/usr/bin/env python3
"""
Step 4a of the news migration: download every image and attachment the parsed
bodies reference.

Split from the upload half because these are the two failure modes that need
different responses. A download failure is usually the old site's problem and
some of them are permanent — a quarter of the inline images point at hosts that
are already dead. An upload failure is ours. Mixing them makes it impossible to
tell, from a summary line, whether anything needs fixing.

Writes `data/assets.json`: one entry per source URL with the local path, the
real filename (from Content-Disposition, which is the only place the old CMS
puts it — the title attribute in the markup drops the extension on half of
them), the sniffed mime, and the byte count. Failures are recorded rather than
raised: the run has to finish so the list of dead links is complete.
"""
import json
import os
import re
import subprocess
import sys
import urllib.parse
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.environ.get("AGEC_ASSETS") or "/tmp/agec-assets"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")

IMG_RE = re.compile(r'<img[^>]*\ssrc="([^"]+)"')
DISPOSITION_RE = re.compile(r'filename\*?=(?:UTF-8\'\')?"?([^"\r\n;]+)"?', re.I)


def key_for(url: str) -> str:
    """
    A stable, filesystem-safe name for a source URL.

    Both of the old CMS's asset paths embed a 24-hex object id
    (/uploads/asset/data/<hex>/… and /xhr/announcements/file/<hex>/…), which is
    already unique and already safe — much better than the filename, which is
    percent-encoded Chinese and collides across records. External hotlinks have
    no such id, so they fall back to a hash of the URL.
    """
    m = re.search(r"/([0-9a-f]{24})/", url)
    if m:
        return m.group(1)
    import hashlib
    return "ext-" + hashlib.sha1(url.encode()).hexdigest()[:16]


def download(url: str, dest: str) -> dict:
    """curl, not urllib: Cloudflare answers Python's default agent with a 403."""
    p = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "60", "--retry", "1", "-A", UA,
         "-D", dest + ".hdr", "-o", dest, "-w", "%{http_code}", url],
        capture_output=True, text=True,
    )
    code = p.stdout.strip()
    size = os.path.getsize(dest) if os.path.exists(dest) else 0
    headers = ""
    if os.path.exists(dest + ".hdr"):
        headers = open(dest + ".hdr", encoding="utf-8", errors="replace").read()

    filename = None
    m = re.search(r"content-disposition:([^\r\n]+)", headers, re.I)
    if m:
        f = DISPOSITION_RE.search(m.group(1))
        if f:
            filename = urllib.parse.unquote(f.group(1)).strip()

    # `file` sniffs the bytes. The old CMS serves every attachment as
    # application/octet-stream, so its Content-Type header is worthless here.
    mime = ""
    if size:
        mime = subprocess.run(["file", "-b", "--mime-type", dest],
                              capture_output=True, text=True).stdout.strip()
    return {"http": code, "size": size, "filename": filename, "mime": mime}


def main() -> int:
    rows = json.load(open(f"{HERE}/data/news-parsed.json", encoding="utf-8"))
    os.makedirs(STORE, exist_ok=True)

    wanted: dict[str, dict] = {}
    for r in rows:
        for src in IMG_RE.findall(r["content_html"]):
            # Three bodies inline a data: URI. There is nothing to fetch and
            # nothing to re-host; the sanitiser drops them (img is restricted to
            # http/https) and they are counted, not chased.
            if src.startswith("data:"):
                continue
            url = src if src.startswith("http") else "https://www.agec.ntu.edu.tw" + src
            wanted.setdefault(url, {"url": url, "kind": "image", "used_by": []})
            wanted[url]["used_by"].append(r["id"])
        for a in r["attachments"]:
            wanted.setdefault(a["src"], {"url": a["src"], "kind": "file", "used_by": []})
            wanted[a["src"]]["used_by"].append(r["id"])
            wanted[a["src"]]["label"] = a["name"]

    print(f"待抓 {len(wanted)} 個檔案"
          f"（圖 {sum(1 for w in wanted.values() if w['kind']=='image')}、"
          f"附件 {sum(1 for w in wanted.values() if w['kind']=='file')}）", flush=True)

    out, stats, dead = [], Counter(), []
    for n, w in enumerate(wanted.values(), 1):
        dest = f"{STORE}/{key_for(w['url'])}"
        if os.path.exists(dest) and os.path.getsize(dest) > 0 and os.path.exists(dest + ".meta"):
            meta = json.load(open(dest + ".meta", encoding="utf-8"))
            stats["快取"] += 1
        else:
            meta = download(w["url"], dest)
            json.dump(meta, open(dest + ".meta", "w", encoding="utf-8"), ensure_ascii=False)
            stats["新抓"] += 1

        ok = meta["http"] == "200" and meta["size"] > 0 and not meta["mime"].startswith("text/html")
        entry = {**w, "path": dest, **meta, "ok": ok}
        out.append(entry)
        if ok:
            stats[f"成功-{w['kind']}"] += 1
        else:
            stats[f"失敗-{w['kind']}"] += 1
            dead.append({"url": w["url"], "http": meta["http"], "mime": meta["mime"],
                         "used_by": w["used_by"]})
        if n % 50 == 0:
            print(f"  … {n}/{len(wanted)}", flush=True)

    json.dump(out, open(f"{HERE}/data/assets.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump(dead, open(f"{HERE}/data/assets-dead.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    print("\n" + "  ".join(f"{k} {v}" for k, v in sorted(stats.items())))
    if dead:
        print(f"\n抓不到 {len(dead)} 個，依主機分組：")
        for host, c in Counter(re.sub(r"^(https?://[^/]+).*", r"\1", d["url"]) for d in dead).most_common():
            print(f"  {c:>3}  {host}")
    print("\n實際副檔名（來自 Content-Disposition，非標記裡的 title）：")
    for ext, c in Counter(
        (e["filename"] or e["url"]).rsplit(".", 1)[-1].lower()[:12]
        for e in out if e["ok"] and e["kind"] == "file"
    ).most_common():
        print(f"  {c:>3}  .{ext}")
    print("\n實際 mime：")
    for m, c in Counter(e["mime"] for e in out if e["ok"]).most_common():
        print(f"  {c:>3}  {m}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
