#!/usr/bin/env python3
"""
Step 3 of the news migration: cached HTML → structured rows.

No network. Reads whatever fetch-news.py cached and writes
`data/news-parsed.json`, so it can be re-run freely while the extraction rules
are being tightened.

The old CMS renders every announcement from one template, which is what makes
this tractable:

    <h1 class="s-annc__show-title">          title
    <span class="s-annc__date">              published_at
    <div class="s-annc__sub-img"><img>       cover — empty on all 428 rows
    <div class="s-annc__post-body">          content_html
    <a class="s-annc__flie-title" title=…>    one attachment

⚠️ What comes out of here is *not* safe to store yet. The bodies are raw CMS
output — Word residue, hard-coded table widths, absolute URLs pointing at the
old host. Sanitising happens in import-news.ts, which imports the one allowlist
in lib/sanitize.ts; doing it here would be a second copy of that list.
"""
import html
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get("AGEC_CACHE") or "/tmp/agec-news-cache"
BASE = "https://www.agec.ntu.edu.tw"

TITLE_RE = re.compile(r'<h1[^>]*class="[^"]*s-annc__show-title[^"]*"[^>]*>(.*?)</h1>', re.S)
DATE_RE = re.compile(r'<span[^>]*class="[^"]*s-annc__date[^"]*"[^>]*>\s*([\d]{4}-[\d]{2}-[\d]{2})', re.S)
FILE_RE = re.compile(
    r'<a[^>]*class="[^"]*s-annc__flie-title[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]*)"', re.S
)


def extract_div(page: str, class_name: str) -> str | None:
    """
    The inner HTML of the first <div> carrying `class_name`.

    A regex cannot do this: the post bodies contain their own <div>s, and
    `.*?</div>` stops at the first inner one. So find the opening tag, then walk
    forward keeping a depth count.
    """
    open_re = re.compile(r'<div[^>]*class="[^"]*' + re.escape(class_name) + r'[^"]*"[^>]*>')
    m = open_re.search(page)
    if not m:
        return None

    depth, i, start, end = 1, m.end(), m.end(), None
    tag = re.compile(r"</?div\b", re.I)
    while depth and (t := tag.search(page, i)):
        if t.group(0).startswith("</"):
            depth -= 1
            end = t.start()      # ⚠️ start(), not end(): the pattern matches
        else:                    # "</div" without the ">", so subtracting
            depth += 1           # len("</div>") from t.end() cuts one character
        i = t.end()              # too many. That one character is the closing
                                 # ">" of whatever tag ended the body — and 92%
                                 # of the talks end in <img>, so the off-by-one
                                 # silently destroyed most of the images.
    return page[start:end] if depth == 0 and end is not None else page[start:]


def clean_title(raw: str) -> str:
    """Tags out, entities decoded, whitespace collapsed — including U+3000."""
    t = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"[\s　]+", " ", html.unescape(t)).strip()


def parse(page: str) -> dict:
    m = TITLE_RE.search(page)
    title = clean_title(m.group(1)) if m else ""

    m = DATE_RE.search(page)
    date = m.group(1) if m else None

    body = extract_div(page, "s-annc__post-body") or ""

    # The CMS emits one <a> per file, and repeats the original filename in both
    # the title attribute and the link text. Take the attribute: link text is
    # occasionally truncated with an ellipsis.
    attachments, seen = [], set()
    for href, name in FILE_RE.findall(page):
        url = href if href.startswith("http") else BASE + href
        if url in seen:
            continue
        seen.add(url)
        attachments.append({"src": url, "name": html.unescape(name).strip()})

    # 100% empty across the corpus, but read it rather than assume — if the
    # office starts using it, this picks it up without a code change.
    sub = extract_div(page, "s-annc__sub-img") or ""
    m = re.search(r'<img[^>]*src="([^"]+)"', sub)
    cover = m.group(1) if m and m.group(1).strip() else None

    return {"title": title, "date": date, "content_html": body,
            "attachments": attachments, "cover": cover}


# --------------------------------------------------------------------------
# 演講公告 metadata
#
# 92% of the talks are a poster image and nothing else — the speaker, the time
# and the room exist only as pixels. The headline is the one place the CMS
# reliably repeats them, so that is what gets parsed. Two shapes dominate:
#
#   【農經系演講公告】115年6月8日(一)14:30 Roger H. von Haefen教授 … 蒞臨演講
#   【農經企業領航講座】本系將於12月2日(六)16:00-18:00邀請林建甫博士蒞臨演講
#
# The venue is never in the headline. It stays null rather than being guessed.
# --------------------------------------------------------------------------

ROC_DATE = re.compile(r"(?:(\d{2,3})年)?\s*(\d{1,2})月(\d{1,2})日")
TIME_RE = re.compile(r"(\d{1,2})[:：](\d{2})")
# Everything between the time and the closing verb is the speaker and their
# affiliation. Non-greedy, and bounded on both sides, so a headline that never
# says 蒞臨/演講 yields nothing instead of the whole string.
SPEAKER_RE = re.compile(
    r"(?:\d{1,2}[:：]\d{2}(?:\s*[-–~]\s*\d{1,2}[:：]\d{2})?)\s*"
    r"(?:邀請|敬邀|由)?\s*(.+?)\s*(?:蒞臨演講|蒞臨|演講|主講|專題演講)\s*$"
)
# Fallback for headlines that name a speaker but no time — 「【農業經濟討論講座】
# 邀請勤業眾信策略財務顧問 黃齡潔顧問蒞臨演講」. Anchored on 邀請…蒞臨 rather
# than on a bare 演講, because half the corpus has 演講 in the bracketed prefix
# and matching that would return the headline itself.
SPEAKER_FALLBACK_RE = re.compile(r"(?:邀請|敬邀)\s*(.+?)\s*(?:蒞臨演講|蒞臨|主講)\s*$")

# What counts as a plausible speaker string. The upper bound is generous on
# purpose: a headline like
#   「Roger H. von Haefen教授 (Department of Agricultural and Resource
#     Economics, North Carolina State University) 蒞臨演講」
# is 100 characters and every one of them is the answer — cutting at 60 threw
# away exactly the visiting speakers whose affiliation matters most. The real
# guard against nonsense is the time prefix the pattern above requires, not
# length.
SPEAKER_MIN, SPEAKER_MAX = 2, 120


def parse_talk(title: str, published_at: str) -> dict:
    out = {"speaker": None, "event_at": None}

    md = ROC_DATE.search(title)
    mt = TIME_RE.search(title)
    if md:
        roc, month, day = md.groups()
        if roc:
            year = int(roc) + 1911          # 民國 → 西元
        else:
            # No year in the headline. The talk is announced before it happens,
            # so it is in the announcement's year — unless the month has already
            # gone by, which means the announcement crossed into the next year.
            pub_y, pub_m = int(published_at[:4]), int(published_at[5:7])
            year = pub_y + 1 if int(month) < pub_m - 6 else pub_y
        hh, mm = (int(mt.group(1)), int(mt.group(2))) if mt else (0, 0)
        try:
            # Taipei is UTC+8 year-round; no DST to get wrong.
            out["event_at"] = (
                f"{year:04d}-{int(month):02d}-{int(day):02d}T{hh:02d}:{mm:02d}:00+08:00"
            )
        except ValueError:
            out["event_at"] = None

    ms = SPEAKER_RE.search(title) or SPEAKER_FALLBACK_RE.search(title)
    if ms:
        s = ms.group(1).strip(" 　,，、-–")
        if SPEAKER_MIN <= len(s) <= SPEAKER_MAX:
            out["speaker"] = s
    return out


def main() -> int:
    listing = json.load(open(f"{HERE}/data/news-list.json", encoding="utf-8"))
    rows, missing, stats = [], [], Counter()

    for it in listing:
        path = f"{CACHE}/{it['id']}.html"
        if not os.path.exists(path):
            missing.append(it["id"])
            continue

        p = parse(open(path, encoding="utf-8", errors="replace").read())
        if not p["title"]:
            missing.append(it["id"])
            continue

        row = {
            "id": it["id"],
            "category": it["category"],
            "title": p["title"],
            # The detail page's own date beats the list page's, which the CMS
            # prints in its own "2026-08/31" format.
            "published_at": p["date"] or it["published_at"],
            "content_html": p["content_html"],
            "attachments": p["attachments"],
            "cover": p["cover"],
            "source_url": it["url"],
        }
        if it["category"] == "演講公告":
            row.update(parse_talk(p["title"], row["published_at"]))
            stats["演講"] += 1
            if row.get("speaker"):
                stats["演講-解出講者"] += 1
            if row.get("event_at"):
                stats["演講-解出時間"] += 1

        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", row["content_html"])).strip()
        stats["有附件"] += bool(row["attachments"])
        stats["附件總數"] += len(row["attachments"])
        stats["內文有圖"] += "<img" in row["content_html"]
        stats["內文有表格"] += "<table" in row["content_html"]
        stats["內文有iframe"] += "<iframe" in row["content_html"]
        stats["內文純文字<40字"] += len(text) < 40
        rows.append(row)

    with open(f"{HERE}/data/news-parsed.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)

    print(f"解析 {len(rows)} / {len(listing)} 則" + (f"，缺 {len(missing)}: {missing}" if missing else ""))
    for k, v in stats.items():
        print(f"  {k:<16} {v}")
    if stats["演講"]:
        print(f"  演講講者解析率     {stats['演講-解出講者'] / stats['演講']:.0%}")
        print(f"  演講時間解析率     {stats['演講-解出時間'] / stats['演講']:.0%}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
