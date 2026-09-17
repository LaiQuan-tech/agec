#!/usr/bin/env python3
"""
一次性：把舊站「考古題專區」（/zh_tw/link/link5）的檔案搬進新站的 `documents` 表，
讓 /admissions 最下面「考古題專區」卡片的學制連結（/admissions/[program]#files）
能連到真正的考古題檔案。

2026-09-17 執行。舊站那一頁是 4 個 panel（考古題(碩士班)／考古題(碩士班甄試)／
考古題（碩士在職專班）／考古題（博士班），順序即頁面順序，括號半形全形混用），
合計 39 個年度標題（dt）、97 個檔案（dl 底下的科目連結），一次載完、沒有分頁。
檔案在 `/xhr/archive/download?file=<24hex>`，回應一律 `application/octet-stream`，
原始檔名在 `Content-Disposition`——與 import-forms.py 搬 link4 表單是同一套機制，
這支腳本的三步結構、下載與上傳做法都照抄那支。

三步，每一步可以單獨重跑：
  1. 抓 link5 → 39 個 (分組, 年度標題, [科目, file id]) 的清單
  2. 下載到 /tmp/agec-exams/（沿用快取），MIME 由副檔名對照後台上傳路由的 FILE_TYPES
  3. 上傳 Storage `attachments/exams/<file id>.<ext>`（x-upsert，重跑覆蓋同一個物件）
     ＋ 寫 `documents` 列（以 file_url 判斷已存在就跳過）

用法：
  python3 scripts/import-exams.py --dry     # 只做 1、2，印出將要寫的列
  python3 scripts/import-exams.py --write   # 真的上傳＋寫列

⚠️ 用 service-role key（讀 .env.local），繞過 storage.objects 與 documents 的 RLS。
   一次性的匯入從開發者機器跑是對的（沒有已登入的管理員可以借 session），但也
   因此 documents 的稽核 trigger 不會記這批（auth.uid() 為 null 就不寫）——同
   2026-09-15 的表單匯入，supabase/README.md 已經記過這件事。

⚠️ `title` 屬性不是每一列都是乾淨的科目名。考古題（碩士在職專班）那組 43 筆裡有
   21 筆的 `title` 其實是當年上傳時的原始檔名（例如
   「112年碩士在職專班入學試題-管理與經營實務_Final_.pdf」），必須用
   clean_subject_label() 去掉年度／「入學試題」／「_Final_」之類的雜訊才是真正的
   科目名。清理後除了 LABEL_EN 收的 5 種科目，還會出現「管理與經營實務」的 4 種
   變體（字序相反／多「含統計應用」／多一個「學」字）——這是舊站本身逐年命名不
   一致，如實保留、不強行合併，label_en 對不到就是 None。

⚠️ sort_order 公式：分組序×1000 ＋ (150 − 民國年)×10 ＋ 科目序。分組序＝頁面順序
   0–3；科目序＝該年度標題底下第幾個科目，從 1 算（不是整組累加——已核對 39 個
   年度標題，沒有任何一個超過 9 個科目，也沒有分組內重複的年度，這個公式不會撞號）。
   150 是刻意選的民國年上界（西元 2061），理論最大值
   3×1000 + (150−96)×10 + 9 = 3549，在後台表單 sort_order 驗證的 0–9999 範圍內
   （用最舊出現的年份 96 反推的保守上界，不代表真的會算出這個數字）。
"""
import html
import json
import os
import re
import subprocess
import sys
import unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.environ.get("AGEC_EXAMS", "/tmp/agec-exams")
OLD = "https://www.agec.ntu.edu.tw"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")

# 與 app/(admin)/admin/api/upload/route.ts 的 FILE_TYPES 同一份對照（抄自
# import-forms.py，這個專案的一次性腳本本來就各自帶一份，不共用模組）。
FILE_TYPES = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "odt": "application/vnd.oasis.opendocument.text",
    "ods": "application/vnd.oasis.opendocument.spreadsheet",
    "rtf": "application/rtf",
    "zip": "application/zip",
    "7z": "application/x-7z-compressed",
    "rar": "application/vnd.rar",
    "txt": "text/plain",
}

# 舊站年度標題去掉開頭年份之後剩下的字 → description_en 用的英文說法。已經逐一核對
# 過全部 39 個年度標題，只會出現這 4 種，沒有第 5 種、不用 fallback。
TRACK_EN = {
    "碩士班招生考題": "Master's entrance exam",
    "碩士班甄試考題": "Master's screening exam",
    "博士班招生考題": "PhD entrance exam",
    "碩士在職專班入學試題": "Executive master's entrance exam",
}

# 科目 → 英文。對不到的（主要是「管理與經營實務」的幾種變體）label_en 留 None，
# main() 會收集起來在最後印出。
LABEL_EN = {
    "農業經濟學": "Agricultural Economics",
    "經濟學": "Economics",
    "統計學": "Statistics",
    "英文": "English",
    "經濟理論": "Economic Theory",
}

ROC_YEAR_CEILING = 150  # 見檔頭說明：民國年上界，保證 (150 - 年) 恆正。


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", html.unescape(text))
    return re.sub(r"\s+", " ", text).strip()


def env() -> tuple[str, str]:
    values = {}
    for line in open(f"{ROOT}/.env.local", encoding="utf-8"):
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.strip().partition("=")
            values[k] = v.strip().strip('"')
    return values["NEXT_PUBLIC_SUPABASE_URL"], values["SUPABASE_SERVICE_ROLE_KEY"]


def program_for(panel_title: str) -> str:
    """舊站分組原文（半形／全形括號混用，不管；用關鍵字判斷）→ programs.name。"""
    if "碩士在職專班" in panel_title:
        return "碩士在職專班"
    if "博士班" in panel_title:
        return "博士班"
    if "碩士班" in panel_title:  # 涵蓋「碩士班」與「碩士班甄試」
        return "碩士班"
    raise ValueError(f"無法辨識的分組標題：{panel_title!r}")


def fetch_list() -> list[dict]:
    """link5 → [{group_idx, panel_title, program, description, year, title, file_id, ext, seq}]，
    依頁面順序（分頁：實測整頁一次載完 97 筆，沒有 page_no；萬一舊站改版出現分頁，
    下面的數量斷言會直接報錯，不會悄悄漏資料）。"""
    page = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "30", "-A", UA, f"{OLD}/zh_tw/link/link5"],
        capture_output=True, text=True, check=True,
    ).stdout

    panels = re.split(r'(?=<h4 class="panel-title">)', page)
    panels = [p for p in panels if "panel-title" in p]
    if len(panels) != 4:
        raise RuntimeError(f"抓到 {len(panels)} 個 panel，預期 4 個——舊站結構可能變了，需要人工檢查")

    items: list[dict] = []
    panel_programs: list[str] = []
    for group_idx, panel in enumerate(panels):
        title_m = re.search(r'<a[^>]*title="([^"]+)"', panel)
        if not title_m:
            raise RuntimeError(f"第 {group_idx} 個 panel 找不到分組標題")
        panel_title = norm(title_m.group(1))
        program = program_for(panel_title)
        panel_programs.append(program)

        # dt（年度標題）與 dl（科目清單）是同層相鄰的兄弟節點，序列 pairing。
        # 年度標題的標籤名稱本身打錯字（<sapn> 不是 <span>，頭尾都錯但成對），
        # 抓文字不能假設標籤名稱對稱，只認 class。
        pairs = re.findall(
            r'<dt class="i-archive-item-list[^"]*">(.*?)</dt>\s*'
            r'<dl class="i-archive-files-list[^"]*"[^>]*>(.*?)</dl>',
            panel, flags=re.S,
        )
        for dt_html, dl_html in pairs:
            dt_m = re.search(r'i-archive-item-title">\s*([^<]+?)\s*<span', dt_html, flags=re.S)
            if not dt_m:
                continue
            description = norm(dt_m.group(1))
            year_m = re.match(r"^(\d{2,3})", description)
            if not year_m:
                continue
            year = int(year_m.group(1))

            files = re.findall(
                r'<a href="(/xhr/archive/download\?file=([0-9a-f]{24}))"[^>]*'
                r'title="([^"]+)"[^>]*>.*?</a>\s*<span class="label[^"]*">([a-z0-9]+)</span>',
                dl_html, flags=re.S,
            )
            for seq, (_href, file_id, subj_title, ext) in enumerate(files, start=1):
                items.append({
                    "group_idx": group_idx, "panel_title": panel_title, "program": program,
                    "description": description, "year": year,
                    "title": norm(subj_title), "file_id": file_id, "ext": ext, "seq": seq,
                })

    expected = ["碩士班", "碩士班", "碩士在職專班", "博士班"]
    if panel_programs != expected:
        raise RuntimeError(f"panel 順序與預期不符：{panel_programs} != {expected}——sort_order 的分組序假設可能不成立了")
    if len(items) != 97:
        raise RuntimeError(f"抓到 {len(items)} 筆，預期 97 筆——舊站結構可能變了或有分頁，需要人工檢查")
    return items


def download(file_id: str) -> dict | None:
    """下載一個檔，回 {path, filename, ext, mime}；失敗回 None。沿用快取。"""
    os.makedirs(CACHE, exist_ok=True)
    body, hdr = f"{CACHE}/{file_id}.bin", f"{CACHE}/{file_id}.hdr"
    if not (os.path.exists(body) and os.path.exists(hdr) and os.path.getsize(body) > 0):
        result = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "120", "--connect-timeout", "10", "--retry", "1",
             "-A", UA, "-D", hdr, "-o", body,
             f"{OLD}/xhr/archive/download?file={file_id}", "-w", "%{http_code}"],
            capture_output=True, text=True,
        )
        if result.stdout.strip() != "200" or os.path.getsize(body) == 0:
            return None
    headers = open(hdr, encoding="utf-8", errors="ignore").read()
    m = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^"\r\n;]+)"?', headers, flags=re.I)
    filename = norm(m.group(1)) if m else f"{file_id}.bin"
    try:
        from urllib.parse import unquote
        filename = unquote(filename)
    except Exception:
        pass
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mime = FILE_TYPES.get(ext)
    if not mime:
        sniffed = subprocess.run(["file", "-b", "--mime-type", body], capture_output=True, text=True).stdout.strip()
        for e, mm in FILE_TYPES.items():
            if mm == sniffed:
                ext, mime = e, mm
                break
    if not mime:
        return {"path": body, "filename": filename, "ext": ext, "mime": None}
    return {"path": body, "filename": filename, "ext": ext, "mime": mime}


def clean_subject_label(raw_title: str, description: str) -> str:
    """dt/dl 裡 `title` 屬性 → 乾淨的科目名。多數（54/97）本來就乾淨（不以數字開頭），
    原樣回傳；碩士在職專班那組有 21 筆其實是原始檔名（例如
    「112年碩士在職專班入學試題-管理與經營實務_Final_.pdf」），要先砍掉年度標題
    前綴、副檔名、與「_Final_」／「(Final)」這類尾巴雜訊。"""
    t = norm(raw_title)
    if not re.match(r"^\d", t):
        return re.sub(r"\.(pdf|docx?|xlsx?|pptx?)$", "", t, flags=re.I)
    # 先試著把「這一列自己的年度標題原文」當前綴整段砍掉；砍不到（字串對不上）
    # 就退回關鍵字正則。
    stripped = re.sub(rf"^{re.escape(description)}[-_]*", "", t)
    if stripped == t:
        stripped = re.sub(r"^\d{2,3}年?.*?(?:入學試題|招生考題|甄試考題)[-_]*", "", t)
    stripped = re.sub(r"\.(pdf|docx?|xlsx?|pptx?)$", "", stripped, flags=re.I)
    stripped = re.sub(r"[_\s]*\(?[Ff]inal\)?_?\d*\s*$", "", stripped)
    stripped = stripped.strip("_ ")
    return stripped or t  # 保底：清空了就退回原字串，不要生出空白 label


def sort_order_for(group_idx: int, year: int, seq: int) -> int:
    return group_idx * 1000 + (ROC_YEAR_CEILING - year) * 10 + seq


def main() -> None:
    write = "--write" in sys.argv
    if not write and "--dry" not in sys.argv:
        print(__doc__)
        sys.exit(2)

    items = fetch_list()
    prog_counts = Counter(i["program"] for i in items)
    # 年度標題分組數（依 program）：同一個 program 底下可能有兩個舊站分組
    # （碩士班 = 招生 + 甄試），用 (program, description) 去重再數。
    desc_groups = {(i["program"], i["description"]) for i in items}
    desc_counts = Counter(p for p, _d in desc_groups)
    print(f"舊站清單 {len(items)} 筆，program 分布：" + "、".join(f"{p} {n}" for p, n in prog_counts.items()))
    print("年度標題分組數：" + "、".join(f"{p} {n}" for p, n in desc_counts.items()))

    rows, skipped = [], []
    label_en_missing = Counter()
    for item in items:
        got = download(item["file_id"])
        if not got or not got["mime"]:
            skipped.append({**item, "reason": "下載失敗" if not got else f"無法判斷型別（{got['filename']}）"})
            continue

        label = clean_subject_label(item["title"], item["description"])[:60]
        label_en = LABEL_EN.get(label)
        if label_en is None:
            label_en_missing[label] += 1

        track_zh = re.sub(rf"^{item['year']}年?", "", item["description"])
        track_en = TRACK_EN.get(track_zh)
        if track_en is None:
            raise RuntimeError(f"無法辨識的年度標題型態：{item['description']!r}（track_zh={track_zh!r}）")
        description_en = f"AY {item['year']} · {track_en}"[:240]

        sort_order = sort_order_for(item["group_idx"], item["year"], item["seq"])

        rows.append({
            "file_id": item["file_id"], "path": got["path"], "mime": got["mime"], "ext": got["ext"],
            "section": "admissions", "program": item["program"],
            "category": "考古題", "category_en": "Past exam papers",
            "label": label, "label_en": label_en,
            "description": item["description"], "description_en": description_en,
            "file_name": got["filename"][:200], "sort_order": sort_order,
        })

    print(f"\n將寫入 {len(rows)} 列、跳過 {len(skipped)} 筆")
    for r in sorted(rows, key=lambda r: r["sort_order"]):
        en = f"  | {r['label_en']}" if r["label_en"] else "  | (label_en=null)"
        size_kb = os.path.getsize(r["path"]) // 1024
        print(f"  [{r['program']} #{r['sort_order']}] {r['description']} — {r['label']}{en}"
              f"   ← {r['file_name']} ({r['mime']}, {size_kb} KB)")
    for s in skipped:
        print(f"  ✗ {s['program']} {s['description']} {s['title']}: {s['reason']}")
    if label_en_missing:
        print("\nlabel_en 對不到的科目：")
        for label, n in sorted(label_en_missing.items()):
            print(f"  {label}  ×{n}")

    if not write:
        return

    base, key = env()
    auth = ["-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}"]
    stats: Counter = Counter()

    # 既有列：以 file_url 判斷是否已匯入過（重跑不重複寫列）。
    existing = subprocess.run(
        ["curl", "-sS", "--max-time", "20", f"{base}/rest/v1/documents?select=id,file_url", *auth],
        capture_output=True, text=True, check=True,
    ).stdout
    existing_urls = {r["file_url"] for r in json.loads(existing) if r.get("file_url")}

    for r in rows:
        object_key = f"exams/{r['file_id']}.{r['ext']}"
        public_url = f"{base}/storage/v1/object/public/attachments/{object_key}"
        code = subprocess.run(
            ["curl", "-sS", "--max-time", "60", "-X", "POST",
             f"{base}/storage/v1/object/attachments/{object_key}", *auth,
             "-H", f"Content-Type: {r['mime']}", "-H", "x-upsert: true",
             "--data-binary", f"@{r['path']}", "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True,
        ).stdout.strip()
        if code != "200":
            stats[f"上傳失敗-{code}"] += 1
            skipped.append({**r, "reason": f"上傳 {code}"})
            continue
        stats["上傳"] += 1
        if public_url in existing_urls:
            stats["列已存在-跳過"] += 1
            continue
        row = {k: r[k] for k in ("section", "program", "category", "category_en", "label", "label_en",
                                 "description", "description_en", "file_name", "sort_order")}
        row["file_url"] = public_url
        code = subprocess.run(
            ["curl", "-sS", "--max-time", "20", "-X", "POST", f"{base}/rest/v1/documents", *auth,
             "-H", "Content-Type: application/json", "-H", "Prefer: return=minimal",
             "--data-binary", json.dumps(row, ensure_ascii=False), "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True,
        ).stdout.strip()
        stats["寫列" if code == "201" else f"寫列失敗-{code}"] += 1

    print("\n" + "  ".join(f"{k} {v}" for k, v in sorted(stats.items())))
    if skipped:
        print("跳過：")
        for s in skipped:
            print("  ", s.get("description") or "", s.get("title") or s.get("label"), s["reason"])


if __name__ == "__main__":
    main()
