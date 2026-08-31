#!/usr/bin/env python3
"""
Step 1+2 of the news migration: build the work list, then fetch every detail page.

Kept separate from the transform step because this is the slow, flaky half —
428 requests against a CMS that is not ours. Pages are cached to disk and the
script skips whatever it already has, so it can be re-run until the failure
list is empty without re-fetching what already worked.

curl, not urllib: Cloudflare answers Python's default user agent with a 403.
"""
import json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get("AGEC_CACHE") or "/tmp/agec-news-cache"
SOURCE = os.environ["AGEC_SOURCE"]          # the crawler's 600-row list
BASE = "https://www.agec.ntu.edu.tw"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# The four lists under 舊站「最新消息」. Their Chinese names are the values
# `news.category` stores — never the English labels, which are display-only.
WANTED = {"最新公告", "演講公告", "求職徵才", "活動剪影"}

# The trailing digits of a detail URL are the CMS record id. The same record is
# reachable from several list paths (/news, /news/news1, /phd/phd1 …), so this
# is what deduplicates them — the URL string alone does not.
ID_RE = re.compile(r"-(\d+)/?$")


def main() -> int:
    rows = [r for r in json.load(open(SOURCE, encoding="utf-8")) if r["cat"] in WANTED]

    items, seen = [], set()
    for r in rows:
        m = ID_RE.search(r["url"])
        if not m:
            print(f"  ⚠️  無法取出記錄 id，略過：{r['url']}", file=sys.stderr)
            continue
        rid = m.group(1)
        if rid in seen:
            continue
        seen.add(rid)
        # "2026-08/31" is how the CMS prints its dates. Postgres wants a real date.
        items.append({
            "id": rid,
            "category": r["cat"],
            "title": r["title"],
            "published_at": r["date"].replace("/", "-"),
            "url": BASE + r["url"],
        })

    os.makedirs(f"{HERE}/data", exist_ok=True)
    with open(f"{HERE}/data/news-list.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)

    by_cat = {}
    for i in items:
        by_cat[i["category"]] = by_cat.get(i["category"], 0) + 1
    print(f"清單：{len(items)} 則  " + "  ".join(f"{k} {v}" for k, v in by_cat.items()))

    os.makedirs(CACHE, exist_ok=True)
    fetched = cached = failed = 0
    failures = []

    for n, it in enumerate(items, 1):
        path = f"{CACHE}/{it['id']}.html"
        if os.path.exists(path) and os.path.getsize(path) > 10_000:
            cached += 1
            continue
        p = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "40", "--retry", "2",
             "--retry-delay", "2", "-A", UA, "-o", path, "-w", "%{http_code}",
             it["url"]],
            capture_output=True, text=True,
        )
        code = p.stdout.strip()
        size = os.path.getsize(path) if os.path.exists(path) else 0
        if code != "200" or size < 10_000:
            failed += 1
            failures.append({**it, "http": code, "bytes": size})
            print(f"  ✗ {n}/{len(items)} {code} {size}B {it['id']}", flush=True)
        else:
            fetched += 1
        if n % 25 == 0:
            print(f"  … {n}/{len(items)}  新抓 {fetched} 快取 {cached} 失敗 {failed}", flush=True)
        time.sleep(0.25)   # the CMS is the department's live site; do not hammer it

    with open(f"{HERE}/data/fetch-failures.json", "w", encoding="utf-8") as f:
        json.dump(failures, f, ensure_ascii=False, indent=1)

    print(f"\n完成：新抓 {fetched}、沿用快取 {cached}、失敗 {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
