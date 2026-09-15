#!/usr/bin/env python3
"""
一次性：把舊站「常用表格」（/zh_tw/link/link4）的檔案搬進新站的 `documents` 表。

2026-09-15 執行。舊站那一頁是 5 組 39 份表單（其他／國際碩士專班／碩博相關／
招生相關／課程相關），檔案在 `/xhr/archive/download?file=<24hex>`，回應一律
`application/octet-stream`，原始檔名在 `Content-Disposition`。

三步，每一步可以單獨重跑：
  1. 抓 link4 → (分組, 標題, file id)
  2. 下載到 /tmp/agec-forms/（沿用快取），MIME 由副檔名對照後台上傳路由的 FILE_TYPES
  3. 上傳 Storage `attachments/forms/<file id>.<ext>`（x-upsert，重跑覆蓋同一個物件）
     ＋ 寫 `documents` 列（以 file_url 判斷已存在就跳過）

用法：
  python3 scripts/import-forms.py --dry     # 只做 1、2，印出將要寫的列
  python3 scripts/import-forms.py --write   # 真的上傳＋寫列

⚠️ 用 service-role key（讀 .env.local），繞過 storage.objects 與 documents 的 RLS。
   一次性的匯入從開發者機器跑是對的（沒有已登入的管理員可以借 session），但也
   因此 documents 的稽核 trigger 不會記這批（auth.uid() 為 null 就不寫）——
   supabase/README.md 有註明。同 upload-assets.py。

⚠️ 舊站已經有兩份在新站上了（系辦 2026-09 自己上傳的「學生報告書」與
   「碩博士班研究生指導教授同意書-20230908」）：不重複匯入，改用 --write 時
   替那兩列補上分類與排序（TWO_EXISTING）。
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
CACHE = os.environ.get("AGEC_FORMS", "/tmp/agec-forms")
OLD = "https://www.agec.ntu.edu.tw"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")

# 與 app/(admin)/admin/api/upload/route.ts 的 FILE_TYPES 同一份對照：後台上傳
# 會存成什麼 MIME，這裡就存什麼，讀者下載時副檔名才會一致。
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

# 舊站分組名 → 新站分類（中文原值就是分組鍵）與英文。順序 = 舊站頁面上的順序，
# 前台的分組順序跟著每組第一張卡的 sort_order 走，所以組序乘 100 就能重現。
GROUPS = [
    ("常用表格(其他)", "其他", "Other"),
    ("常用表格(國際碩士專班 International Master’s Program)", "國際碩士專班", "International Master’s Program"),
    ("常用表格(碩博相關)", "碩博相關", "Graduate"),
    ("常用表格(招生相關)", "招生相關", "Admissions"),
    ("常用表格(課程相關)", "課程相關", "Courses"),
]

# 舊站標題用底線代替斜線與括號，機器分不出「_輔系_」是括號還是斜線；這幾筆
# 人工給定（key 是舊站的 file id）。其他 #101/#102 的舊標題只有「補助辦法」「申請書」，
# 從檔名補回全名。
LABEL_OVERRIDES = {
    "65717cce74ccc30b6ca297e3": "母系學生出國參與學術研討會補助辦法",
    "65717c4274ccc30b6ca297cf": "母系學生出國參與學術研討會補助申請書",
    "5a0528a5609d6e23da0001af": "轉系／輔系／雙主修申請意願書（106 學年度後適用）",
    "5a053517609d6e0e720001bd": "博／碩士班研究生成績審核表",
    "5a053587609d6e23da0001ed": "博士班學科考申請書（含個體經濟、總體經濟資格考申請書）",
    "5a052835609d6e23da0001a7": "大學個人申請應繳資料（106 學年度／2017 年）",
}

# 新站上已經有的兩份（id → 分類、組內序）。標題比對用 norm() 之後的字。
TWO_EXISTING = {
    "學生報告書": (4, "課程相關"),
    "碩博士班研究生指導教授同意書-20230908": (5, "碩博相關"),
}


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


def fetch_list() -> list[dict]:
    """link4 → [{group, group_en, title, file_id}]，依頁面順序。"""
    page = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "30", "-A", UA, f"{OLD}/zh_tw/link/link4"],
        capture_output=True, text=True, check=True,
    ).stdout
    start = page.find("常用表格</h1>")
    body = page[start:] if start > 0 else page
    by_old = {norm(old): (zh, en) for old, zh, en in GROUPS}
    items, current = [], None
    for m in re.finditer(r"<h4[^>]*>(.*?)</h4>|<a\b([^>]*)>(.*?)</a>", body, flags=re.S | re.I):
        if m.group(1) is not None:
            current = by_old.get(norm(re.sub(r"<[^>]+>", "", m.group(1))))
            continue
        if current is None:
            continue
        href = re.search(r'href="([^"]*)"', m.group(2) or "")
        fid = re.search(r"download\?file=([0-9a-f]{24})", href.group(1)) if href else None
        title = norm(re.sub(r"<[^>]+>", "", m.group(3)))
        if not fid or not title:
            continue
        items.append({"group": current[0], "group_en": current[1], "title": title, "file_id": fid.group(1)})
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


def split_bilingual(title: str) -> tuple[str, str | None]:
    """國際碩士專班那組的標題是「中文 English」：在第一個拉丁字母處切開。
    中文那一半尾端的「_英」「（英）」只是在說這是英文版表單，拿掉。"""
    m = re.search(r"[A-Za-z]", title)
    if not m or m.start() == 0:
        return title, None
    zh, en = title[: m.start()].strip(" -–:：_"), title[m.start():].strip()
    zh = re.sub(r"[\s_（(]*英[）)]?\s*$", "", zh).strip()
    return (zh or title), (en or None)


def clean_label(title: str) -> str:
    """去副檔名、把底線式的括號還原成全形括號。"""
    label = re.sub(r"\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|odt|ods|rtf|txt)$", "", title, flags=re.I)
    label = re.sub(r"^_碩博__", "[碩博] ", label)
    label = re.sub(r"_([^_]+)_", r"（\1）", label)
    label = label.replace("_", " ").strip()
    return label


def main() -> None:
    write = "--write" in sys.argv
    if not write and "--dry" not in sys.argv:
        print(__doc__)
        sys.exit(2)

    items = fetch_list()
    counts = Counter(i["group"] for i in items)
    print(f"舊站清單 {len(items)} 筆：" + "、".join(f"{g} {n}" for g, n in counts.items()))

    rows, skipped = [], []
    group_index = {zh: i + 1 for i, (_, zh, _) in enumerate(GROUPS)}
    per_group = Counter()
    for item in items:
        per_group[item["group"]] += 1
        seq = per_group[item["group"]]
        sort_order = group_index[item["group"]] * 100 + seq
        key = norm(clean_label(item["title"]))
        if key in TWO_EXISTING:
            rows.append({"existing_id": TWO_EXISTING[key][0], "category": item["group"],
                         "category_en": item["group_en"], "sort_order": sort_order, "title": item["title"]})
            continue
        got = download(item["file_id"])
        if not got or not got["mime"]:
            skipped.append({**item, "reason": "下載失敗" if not got else f"無法判斷型別（{got['filename']}）"})
            continue
        if item["group"] == "國際碩士專班":
            label, label_en = split_bilingual(clean_label(item["title"]))
        else:
            label, label_en = clean_label(item["title"]), None
        label = LABEL_OVERRIDES.get(item["file_id"], label)
        rows.append({
            "file_id": item["file_id"], "path": got["path"], "mime": got["mime"], "ext": got["ext"],
            "section": "courses", "label": label[:60], "label_en": (label_en or None) and label_en[:120],
            "description": None, "description_en": None,
            "file_name": got["filename"][:200], "category": item["group"], "category_en": item["group_en"],
            "program": None, "sort_order": sort_order,
        })

    print(f"\n將寫入 {sum(1 for r in rows if 'file_id' in r)} 列、更新既有 {sum(1 for r in rows if 'existing_id' in r)} 列、跳過 {len(skipped)} 筆")
    for r in rows:
        if "existing_id" in r:
            print(f"  [更新 id={r['existing_id']}] {r['category']} #{r['sort_order']}  {r['title']}")
        else:
            en = f"  | {r['label_en']}" if r["label_en"] else ""
            print(f"  [{r['category']} #{r['sort_order']}] {r['label']}{en}   ← {r['file_name']} ({r['mime']}, {os.path.getsize(r['path']) // 1024} KB)")
    for s in skipped:
        print(f"  ✗ {s['group']} {s['title']}: {s['reason']}")
    if not write:
        return

    base, key = env()
    auth = ["-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}"]
    stats = Counter()

    # 既有列：以 file_url 判斷是否已匯入過（重跑不重複）。
    existing = subprocess.run(
        ["curl", "-sS", f"{base}/rest/v1/documents?select=id,file_url", *auth],
        capture_output=True, text=True, check=True,
    ).stdout
    existing_urls = {r["file_url"] for r in json.loads(existing) if r.get("file_url")}

    for r in rows:
        if "existing_id" in r:
            patch = json.dumps({"category": r["category"], "category_en": r["category_en"], "sort_order": r["sort_order"]})
            code = subprocess.run(
                ["curl", "-sS", "-X", "PATCH", f"{base}/rest/v1/documents?id=eq.{r['existing_id']}", *auth,
                 "-H", "Content-Type: application/json", "-H", "Prefer: return=minimal",
                 "--data-binary", patch, "-o", "/dev/null", "-w", "%{http_code}"],
                capture_output=True, text=True,
            ).stdout.strip()
            stats["更新既有" if code == "204" else f"更新失敗-{code}"] += 1
            continue

        object_key = f"forms/{r['file_id']}.{r['ext']}"
        public_url = f"{base}/storage/v1/object/public/attachments/{object_key}"
        code = subprocess.run(
            ["curl", "-sS", "-X", "POST", f"{base}/storage/v1/object/attachments/{object_key}", *auth,
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
        row = {k: r[k] for k in ("section", "label", "label_en", "description", "description_en",
                                 "file_name", "category", "category_en", "program", "sort_order")}
        row["file_url"] = public_url
        code = subprocess.run(
            ["curl", "-sS", "-X", "POST", f"{base}/rest/v1/documents", *auth,
             "-H", "Content-Type: application/json", "-H", "Prefer: return=minimal",
             "--data-binary", json.dumps(row, ensure_ascii=False), "-o", "/dev/null", "-w", "%{http_code}"],
            capture_output=True, text=True,
        ).stdout.strip()
        stats["寫列" if code == "201" else f"寫列失敗-{code}"] += 1

    print("\n" + "  ".join(f"{k} {v}" for k, v in sorted(stats.items())))
    if skipped:
        print("跳過：")
        for s in skipped:
            print("  ", s.get("title") or s.get("label"), s["reason"])


if __name__ == "__main__":
    main()
