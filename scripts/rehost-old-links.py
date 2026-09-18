#!/usr/bin/env python3
"""
把消息裡還指向舊站 www.agec.ntu.edu.tw/uploads/… 的圖與檔搬進 Supabase Storage，改寫網址。

    python3 scripts/rehost-old-links.py          # dry-run：列出會動到哪些列、哪些檔
    python3 scripts/rehost-old-links.py --write  # 下載 → 上傳 → PATCH news

為什麼還會有：2026-08-31 搬消息時，附件與封面走的是舊站的公告附件系統
（/xhr/announcements/file/…），但少數幾則的內文與封面直接寫了 /uploads/… 的
相對路徑（在新站等於 404、破圖），上線前測試（http-4／static-4／static-5）抓到
7 處；第二輪又抓到大學部修業規定的 4 張課程圖與 /xhr/announcements/file/ 的附件。
舊站網域一旦切到新站，這些連結全斷，所以要把檔案搬過來。

規則（與 scripts/import-forms.py 相同）：
- 抓舊站要用 Chrome UA（Cloudflare 擋非瀏覽器 UA）；每個請求都有逾時。
- 圖片進 `posters/news/<舊站id>.<ext>`，其他檔進 `attachments/news/<舊站id>.<ext>`，
  `x-upsert: true` 所以可重跑；網址改寫成新的公開網址。
- 只 PATCH 有變動的列，只改 `cover_url` 與 `content_html` 兩欄；attachments 欄位
  本來就是新站網址，不碰。
- `SUPABASE_SERVICE_ROLE_KEY` 只在 --write 時從 .env.local 讀，不印、不存。
  ⚠️ dry-run 用 anon key，套了「只讀 published」的 policy 後看不到草稿列；--write 用
  service role 會連草稿一起處理。兩種模式列出的筆數可能不同，以 --write 為準。
- 用 service role 直接寫不會進稽核日誌（auth.uid() 為 null），同其他匯入腳本。
"""
import json, os, pathlib, re, subprocess, sys, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
WRITE = "--write" in sys.argv
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
OLD = "https://www.agec.ntu.edu.tw"
WORK = ROOT / ".rehost-cache"  # 下載暫存，已在 .gitignore？沒有就手動刪
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
        ".pdf": "application/pdf", ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".odt": "application/vnd.oasis.opendocument.text", ".zip": "application/zip"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
# 兩種舊站檔案路徑：/uploads/<...>/<id>/<name>（CMS 資產）與 /xhr/announcements/file/<id>/<name>
# （公告附件系統）；兩種倒數第二段都是 24 位 hex 的檔案 id。
UPLOAD_RE = re.compile(r'(href|src)="((?:https?://www\.agec\.ntu\.edu\.tw)?/(?:uploads|xhr/announcements/file)/[^"]+)"')


def env():
    out = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"')
    return out


E = env()
URL = E["NEXT_PUBLIC_SUPABASE_URL"]
KEY = E["SUPABASE_SERVICE_ROLE_KEY"] if WRITE else E["NEXT_PUBLIC_SUPABASE_ANON_KEY"]


def rest(path, method="GET", data=None, prefer=None):
    cmd = ["curl", "-sS", "--max-time", "60", "-X", method, f"{URL}/rest/v1/{path}",
           "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}", "-H", "Content-Type: application/json"]
    if prefer:
        cmd += ["-H", f"Prefer: {prefer}"]
    if data is not None:
        cmd += ["--data", json.dumps(data)]
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def rehost(old_path):
    """舊站路徑 → 新公開網址（--write 時真的下載＋上傳）。"""
    abs_url = old_path if old_path.startswith("http") else OLD + old_path
    parts = urllib.parse.urlparse(abs_url).path.split("/")
    old_id, name = parts[-2], urllib.parse.unquote(parts[-1])
    ext = pathlib.Path(name).suffix.lower()
    bucket = "posters" if ext in IMAGE_EXT else "attachments"
    key = f"news/{old_id}{ext}"
    new_url = f"{URL}/storage/v1/object/public/{bucket}/{key}"
    head = subprocess.run(["curl", "-sI", "--max-time", "30", "-L", "-A", UA, abs_url, "-o", "/dev/null", "-w", "%{http_code} %{size_download}"],
                          capture_output=True, text=True).stdout.strip()
    print(f"    {name}  舊站 HEAD {head}  → {bucket}/{key}")
    if not WRITE:
        return new_url
    WORK.mkdir(exist_ok=True)
    local = WORK / f"{old_id}{ext}"
    if not local.exists():
        code = subprocess.run(["curl", "-sS", "-L", "--max-time", "180", "-A", UA, "-o", str(local), "-w", "%{http_code}", abs_url],
                              capture_output=True, text=True).stdout.strip()
        if code != "200":
            raise SystemExit(f"下載失敗 {abs_url} → {code}")
    mime = MIME.get(ext) or subprocess.run(["file", "-b", "--mime-type", str(local)], capture_output=True, text=True).stdout.strip()
    r = subprocess.run(["curl", "-sS", "--max-time", "180", "-X", "POST", f"{URL}/storage/v1/object/{bucket}/{key}",
                        "-H", f"Authorization: Bearer {KEY}", "-H", f"Content-Type: {mime}", "-H", "x-upsert: true",
                        "--data-binary", f"@{local}", "-o", "/dev/null", "-w", "%{http_code}"], capture_output=True, text=True)
    if r.stdout.strip() != "200":
        raise SystemExit(f"上傳失敗 {key}: {r.stdout}")
    return new_url


def main():
    rows = json.loads(rest("news?select=id,title,cover_url,content_html&or=(cover_url.like./uploads/*,cover_url.like.*agec.ntu.edu.tw/uploads*,content_html.like.*/uploads/*,content_html.like.*xhr/announcements/file*)&order=id"))
    print(f"要處理 {len(rows)} 列（{'寫入' if WRITE else 'dry-run'}）")
    touched = 0
    for row in rows:
        patch = {}
        print(f"== {row['id']} {row['title'][:40]}")
        cover = row.get("cover_url") or ""
        if cover.startswith("/uploads/") or "agec.ntu.edu.tw/uploads" in cover:
            patch["cover_url"] = rehost(cover)
        html = row.get("content_html") or ""
        new_html = UPLOAD_RE.sub(lambda m: f'{m.group(1)}="{rehost(m.group(2))}"', html)
        if new_html != html:
            patch["content_html"] = new_html
        if not patch:
            print("    （沒有需要改的欄位）")
            continue
        touched += 1
        if WRITE:
            got = json.loads(rest(f"news?id=eq.{row['id']}", "PATCH", patch, prefer="return=representation"))[0]
            left = len(re.findall(r'/uploads/', (got.get("content_html") or "") + (got.get("cover_url") or "")))
            print(f"    已改 {list(patch)}；殘留舊路徑 {left}")
        else:
            print(f"    會改 {list(patch)}")
    # programs.requirements_html（各學制修業規定）也有同一種殘留：大學部的雙主修／輔系課程圖。
    progs = json.loads(rest("programs?select=id,name,requirements_html&or=(requirements_html.like.*/uploads/*,requirements_html.like.*xhr/announcements/file*)&order=id"))
    for row in progs:
        print(f"== programs {row['id']} {row['name']}")
        html = row.get("requirements_html") or ""
        new_html = UPLOAD_RE.sub(lambda m: f'{m.group(1)}="{rehost(m.group(2))}"', html)
        if new_html == html:
            print("    （沒有需要改的欄位）")
            continue
        touched += 1
        if WRITE:
            got = json.loads(rest(f"programs?id=eq.{row['id']}", "PATCH", {"requirements_html": new_html}, prefer="return=representation"))[0]
            print(f"    已改 requirements_html；殘留舊路徑 {len(re.findall(r'/uploads/|xhr/announcements/file', got.get('requirements_html') or ''))}")
        else:
            print("    會改 requirements_html")
    print(f"完成：{touched} 列{'已更新' if WRITE else '待更新'}")


if __name__ == "__main__":
    main()
