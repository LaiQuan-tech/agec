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

# Which of the old site's lists to migrate, keyed by the name the crawler
# recorded for each row.
#
# The first four live under 「最新消息」. The rest are a separate section of the
# old site — /zh_tw/recruit/recruit1…5 — split six ways by degree programme.
#
# All six collapse to one `招生` category here. The site has a single 招生 filter
# tab, and six tabs for one topic would overflow the pill row on a phone; the
# programme is still in every one of those headlines
# （「115學年度博士班招生簡章公告」）, so nothing is actually lost.
CATEGORY_MAP = {
    "最新公告": "最新公告",
    "演講公告": "演講公告",
    "求職徵才": "求職徵才",
    "活動剪影": "活動剪影",
    "大學部招生資訊": "招生",
    "招生資訊-大學部招生（個人申請）": "招生",
    "招生資訊-碩士班招生": "招生",
    "招生資訊-博士班招生": "招生",
    "招生資訊-碩士在職專班": "招生",
    "招生資訊-國際專班": "招生",
}
WANTED = set(CATEGORY_MAP)

# ⚠️ Deduplication below is "first one wins", and the old CMS lists the same
# record under several paths. A row reachable from both /recruit and 最新公告
# should be tagged 招生 — the more specific of the two — so the recruit lists
# are visited first.
CATEGORY_ORDER = {c: i for i, c in enumerate(
    [k for k, v in CATEGORY_MAP.items() if v == "招生"]
    + [k for k, v in CATEGORY_MAP.items() if v != "招生"]
)}

# The trailing digits of a detail URL are the CMS record id. The same record is
# reachable from several list paths (/news, /news/news1, /phd/phd1 …), so this
# is what deduplicates them — the URL string alone does not.
ID_RE = re.compile(r"-(\d+)/?$")


def main() -> int:
    rows = [r for r in json.load(open(SOURCE, encoding="utf-8")) if r["cat"] in WANTED]
    rows.sort(key=lambda r: CATEGORY_ORDER[r["cat"]])   # see CATEGORY_ORDER

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
            # The mapped name, not the crawler's. The source `cat` records
            # *which list this row came from*, which is evidence and stays
            # verbatim in the crawl output; "six admission lists become one
            # category" is this repo's decision and belongs here.
            "category": CATEGORY_MAP[r["cat"]],
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
