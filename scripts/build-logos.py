#!/usr/bin/env python3
"""
Build the site's logo SVGs from the client's master identity file.

    python3 scripts/build-logos.py

Writes six files into public/brand/. Re-runnable; the master is never touched.

## Where the artwork comes from

`~/.gemini/File/NTU/台大農經識別（更新）/台大農經識別_完稿檔ol.pdf` — eight
pages, one per approved lockup, pure vector with the type already outlined.

⚠️ An earlier pass concluded the identity set was "white-background PNGs only,
no SVG, no reversed version" and de-backgrounded the PNGs with ImageMagick. That
was wrong: it checked for `inkscape` and `pdf2svg` and missed **`pdftocairo`**,
which is installed and converts these pages to clean vector SVG. There is no
reason to trace a 1182px raster when the vector master is right there.

## Which pages

    p1  mark + AGEC + 國立臺灣大學農業經濟學系 + "Department of …, NTU"
    p7  mark + "Department of / Agricultural Economics / National Taiwan University"

The Chinese site wants p1 **without** that last English line. No page of the
master has that: page 4 drops the English line but drops "AGEC" with it. So the
line is removed here — see `ENGLISH_STRAPLINE_Y`.

## Colours

Three, and the reversed variants treat them differently:

    #F8B62D  gold   the peak            → kept. It is the brand, and it reads
                                          fine on the dark overlay.
    #00692F  green  the road stripe     → white. On --green-deep (#022f21) two
                                          dark greens are indistinguishable.
    #231916  near-black  all type       → white.
"""
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "public", "brand")
MASTER = os.path.expanduser(
    "~/.gemini/File/NTU/台大農經識別（更新）/台大農經識別_完稿檔ol.pdf"
)

# As pdftocairo writes them: percentages, not hex.
GOLD = "rgb(97.254944%, 71.765137%, 17.64679%)"
GREEN = "rgb(0%, 41.175842%, 18.431091%)"
INK = "rgb(13.725281%, 9.803772%, 8.627319%)"

# The brand tokens the rest of the site uses. Rounding the master's percentages
# lands one unit off (#F8B72D), and two golds a shade apart on the same page is
# the kind of thing nobody can name but everybody can see.
BRAND_GOLD = "#F8B62D"
BRAND_GREEN = "#00692F"
BRAND_INK = "#231916"

# Everything below this line on page 1's 283pt canvas is the English strapline.
#
# Derived, not guessed: the page has 56 paths and the lockup accounts for every
# one of them — 2 gold (peak) + 1 green (stripe) + 4 for "AGEC" + 12 Chinese
# glyphs + 37 for "Department of Agricultural Economics, NTU" (36 letters and
# the comma). Exactly 37 paths sit below this line, and dropping them renders
# correctly. If the master is ever redrawn, re-check the count before trusting
# this number.
ENGLISH_STRAPLINE_Y = 169.5
ENGLISH_STRAPLINE_PATHS = 37

# 拿掉小標之後，剩下的字塊要往下移多少才對得齊標誌。
#
# ⚠️ 這一步不能省。母檔八頁的橫式 lockup 有一條一致的規則：**字塊比標誌矮時，
# 字塊的底對齊標誌的腳**，標誌的尖端就高過字。p4（標誌＋中文，無 AGEC）與
# p7（標誌＋三行英文）都是這樣排的；p1 看起來像是上下都齊，只是因為它那四行
# 剛好跟標誌一樣高。所以把 p1 最下面兩行英文刪掉之後，字塊會停在原地、標誌的
# 腳整整多出 23pt —— 畫面上就是「字浮在上面」。
#
# 位移量不寫死，從 p4 推導：p4 是母檔裡唯一「標誌＋中文」的核可版本，它的字塊
# 底比標誌腳低 overhang（中文字沒有下伸部，這個值很小），把它依兩頁的標誌高度
# 換算過來就是 p1 該有的關係。母檔改版時這個數字會自己跟著走。
CHINESE_ONLY_PAGE = 4
CHINESE_ONLY_PATHS = 15  # 2 金 + 1 綠 + 12 個中文字，沒有 AGEC 也沒有英文

# 標誌本身的路徑數：2 條金（山峰）+ 1 條綠（道路條紋）。
# 斷言的用意與 ENGLISH_STRAPLINE_PATHS 相同 —— 母檔改版時要吵，不要靜默產出
# 一個少了半座山的標記檔。
MARK_PATHS = 3


def run(*args: str) -> None:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"失敗：{' '.join(args)}\n{result.stderr}")


def page_to_svg(page: int, dest: str) -> str:
    run("pdftocairo", "-svg", "-f", str(page), "-l", str(page), MASTER, dest)
    return open(dest, encoding="utf-8").read()


def path_bounds(path_tag: str) -> tuple[float, float]:
    """
    Vertical extent of one path, from the raw coordinates in its `d`.

    A superset of the true bounds — bezier control points lie outside the curve
    they describe — which is all this needs: the strapline sits on its own
    baseline, far from anything else, so an approximate box still separates it
    cleanly.
    """
    d = re.search(r'\sd="([^"]+)"', path_tag).group(1)
    ys = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)][1::2]
    return (min(ys), max(ys)) if ys else (0.0, 0.0)


def drop_english_strapline(svg: str) -> str:
    paths = re.findall(r"<path[^>]*/>", svg)
    keep = [p for p in paths if path_bounds(p)[0] < ENGLISH_STRAPLINE_Y]
    dropped = len(paths) - len(keep)
    if dropped != ENGLISH_STRAPLINE_PATHS:
        raise SystemExit(
            f"預期移除 {ENGLISH_STRAPLINE_PATHS} 條英文小標路徑，實際 {dropped} 條。"
            "母檔可能改過了——先重新確認再改 ENGLISH_STRAPLINE_Y。"
        )
    body = re.sub(r"<path[^>]*/>", "", svg)
    return body.replace("</svg>", "\n".join(keep) + "\n</svg>")


def split_mark_and_type(svg: str) -> tuple[list[str], list[str]]:
    """標誌（金＋綠）與文字（近黑）兩堆。顏色是 pdftocairo 尚未換色前的原值。"""
    paths = re.findall(r"<path[^>]*/>", svg)
    mark = [p for p in paths if GOLD in p or GREEN in p]
    return mark, [p for p in paths if p not in mark]


def vertical_bounds(paths: list[str]) -> tuple[float, float]:
    bounds = [path_bounds(p) for p in paths]
    return min(b[0] for b in bounds), max(b[1] for b in bounds)


def type_overhang() -> float:
    """
    p4 的字塊底比標誌腳低多少（以 p4 自己的座標計）。

    這是母檔對「字塊底對齊標誌腳」的實際容差 —— 中文字沒有下伸部，所以只有
    不到 1pt 的視覺溢出。回傳值還沒換算到 p1 的尺度，交給呼叫端做。
    """
    svg = page_to_svg(CHINESE_ONLY_PAGE, "/tmp/agec-logo-build/p4.svg")
    paths = re.findall(r"<path[^>]*/>", svg)
    if len(paths) != CHINESE_ONLY_PATHS:
        raise SystemExit(
            f"母檔 p{CHINESE_ONLY_PAGE} 預期 {CHINESE_ONLY_PATHS} 條路徑，實際 {len(paths)} 條。"
            "這一頁應該是「標誌＋中文」的核可版本，母檔可能改過了。"
        )
    mark, type_ = split_mark_and_type(svg)
    return vertical_bounds(type_)[1] - vertical_bounds(mark)[1]


def bottom_align_type(svg: str, overhang_ratio: float) -> tuple[str, float]:
    """
    把文字路徑整塊下移，讓字塊的底對齊標誌的腳。

    移的是整塊，所以 AGEC 與兩行中文之間的行距維持母檔原樣 —— 那是設計師排的，
    這裡沒有理由重排。標誌一步都不動：它是識別的錨點，動它等於改標誌。
    """
    mark, type_ = split_mark_and_type(svg)
    mark_top, mark_bottom = vertical_bounds(mark)
    type_top, type_bottom = vertical_bounds(type_)
    overhang = overhang_ratio * (mark_bottom - mark_top)
    dy = mark_bottom + overhang - type_bottom

    # <path> 沒有 y 屬性可以調，所以用一層 <g transform> 包起來，路徑資料原封不動。
    body = svg
    for path in type_:
        body = body.replace(path, "", 1)
    group = f'<g transform="translate(0 {dy:.3f})">\n' + "\n".join(type_) + "\n</g>"
    return body.replace("</svg>", group + "\n</svg>"), dy


def build_mark(svg: str) -> str:
    """
    只有標誌、沒有任何文字的版本。

    後台側欄只有 184px 寬（`lg:w-56` 減掉 `px-5`），完整橫式 lockup 是 2.29:1，
    撐滿就是 80px 高 —— 在一條常駐工具欄上太重，而且側欄在 lg 以下會變成橫向
    頂列，那個高度會直接吃掉手機視窗。所以需要一個接近正方的標記。

    標誌的 bbox 是 100.35 × 91.43pt（約 1.10:1），本來就適合當方形標記。

    ⚠️ 不要拿 `agec_loader.svg` 充當這個檔：那是旋轉的載入動畫，不是標誌。
    """
    mark, type_ = split_mark_and_type(svg)
    if len(mark) != MARK_PATHS:
        raise SystemExit(
            f"預期標誌是 {MARK_PATHS} 條路徑（2 金 + 1 綠），實際 {len(mark)} 條。"
            "母檔可能改過了 —— 先確認再改 MARK_PATHS。"
        )
    body = svg
    for path in type_:
        body = body.replace(path, "", 1)
    return body


def trim(svg: str, pad: float = 2.0) -> str:
    """
    Shrink the viewBox from the master's 283×283pt page to the artwork.

    The page is a square sheet with the lockup floating in the middle; left as
    is, every place the logo is used would be mostly empty box, and `height:68px`
    would size the whitespace rather than the mark.
    """
    xs: list[float] = []
    ys: list[float] = []
    for tag in re.findall(r"<path[^>]*/>", svg):
        d = re.search(r'\sd="([^"]+)"', tag).group(1)
        nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
        xs += nums[0::2]
        ys += nums[1::2]
    x0, x1 = min(xs) - pad, max(xs) + pad
    y0, y1 = min(ys) - pad, max(ys) + pad
    svg = re.sub(r'viewBox="[^"]*"', f'viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}"', svg)
    # The pt width/height belong to the sheet, not the art. Dropping them lets
    # CSS size the logo purely from the viewBox's aspect ratio.
    return re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)


def recolour(svg: str, reversed_: bool) -> str:
    svg = svg.replace(GOLD, BRAND_GOLD)
    svg = svg.replace(GREEN, "#FFFFFF" if reversed_ else BRAND_GREEN)
    svg = svg.replace(INK, "#FFFFFF" if reversed_ else BRAND_INK)
    return svg


def label(svg: str, note: str) -> str:
    return svg.replace(
        "<svg", f"<!-- {note}\n     產生自 scripts/build-logos.py，請勿手改。 -->\n<svg", 1
    )


# ---------------------------------------------------------------------------
# 動效版
#
# `public/brand/agec_logo_motion.svg` is hand-authored — 8 @keyframes, three
# gradient-wipe masks over the mark, per-glyph stagger on the type — and it is
# the *template* here, never an output. It is not edited by this script and must
# not be deleted.
#
# What makes the port tractable: the masks only ever touch the mark
# (#agec-peak, #agec-band-o, #agec-band-g), and the mark is identical artwork in
# both language lockups. Only the type block differs, and the type is animated
# with plain opacity/translate classes. So the Chinese version is the template
# minus one group, and the English version is the template with the type
# swapped.
# ---------------------------------------------------------------------------

# Maps `agec_logo_en.svg`'s coordinates onto the motion template's.
#
# Measured, not guessed: `getBBox()` on the mark in each file with animations
# disabled — the template's `.grow-peak` holds a `scaleY(1.022)` on its first
# frame, and measuring through it inflates the vertical scale by exactly that
# 2.2%. Mark bbox is (19.30, 9.71, 100.48, 91.69) in the template and
# (30.88, 102.20, 75.21, 68.53) in the converted page.
EN_TO_MOTION_SCALE_X = 100.48 / 75.21
EN_TO_MOTION_SCALE_Y = 91.69 / 68.53
EN_TO_MOTION_DX = 19.30 - 30.88 * EN_TO_MOTION_SCALE_X
EN_TO_MOTION_DY = 9.71 - 102.20 * EN_TO_MOTION_SCALE_Y

# Where the English lockup's three lines break, in the converted page's own
# coordinates. Checked against the rendered artwork; re-derive if the master is
# redrawn.
EN_LINE_BREAKS = (145.0, 158.0)


def group_span(svg: str, start_tag: str) -> tuple[int, int]:
    """Byte range of one balanced <g …id=…> … </g>."""
    start = svg.index(start_tag)
    depth, i = 0, start
    for m in re.finditer(r"<g\b|</g>", svg[start:]):
        depth += 1 if m.group(0) == "<g" else -1
        i = start + m.end()
        if depth == 0:
            return start, i
    raise SystemExit(f"找不到 {start_tag} 的結尾 </g>")


def build_zh_motion(template: str, dy: float) -> str:
    """
    Template minus the English strapline group, with the rest of the type moved
    down by the same amount the static Chinese lockup moves.

    模板就是 p1 的 1:1 平移（AGEC 25.60pt、中文 35.10pt、小標 19.70pt，三個高度
    與母檔 p1 逐項相符），所以位移量可以直接沿用，不必再換算尺度。

    ⚠️ 位移加在 `#agec-lockup` 上，不是加在個別路徑上：三個遮罩只作用於標誌
    （#agec-peak／#agec-band-o／#agec-band-g），文字是用 opacity/translate 的
    class 做動畫，所以整組平移不會動到任何一個遮罩的對位。
    """
    a, b = group_span(template, '<g id="agec-en"')
    svg = template[:a] + template[b:]
    c, _ = group_span(svg, '<g id="agec-lockup"')
    svg = (
        svg[:c]
        + f'<g id="agec-lockup" transform="translate(0 {dy:.3f})"'
        + svg[c + len('<g id="agec-lockup"'):]
    )
    return label(
        svg,
        "中文動效 lockup（以 agec_logo_motion.svg 為模板，移除英文小標並下移字塊對齊標誌腳）",
    )


def build_en_motion(template: str, en_art: str) -> str:
    """Template with the Chinese type replaced by the English lockup's."""
    paths = [p for p in re.findall(r"<path[^>]*/>", en_art) if "#F8B62D" not in p and "#00692F" not in p]

    lines: list[list[str]] = [[], [], []]
    for path in paths:
        top = path_bounds(path)[0]
        lines[0 if top < EN_LINE_BREAKS[0] else 1 if top < EN_LINE_BREAKS[1] else 2].append(path)
    if not all(lines):
        raise SystemExit(f"英文文字塊沒有分成三行：{[len(l) for l in lines]}")

    # One group per line, staggered — the template's own character is "the type
    # arrives in layers", and three lines of English is the closest equivalent
    # to AGEC-then-Chinese-then-strapline. `--i` drives the delay, same as .cjk.
    inner = "\n".join(
        f'\t\t\t<g class="rise cjk" style="--i:{i * 6}">\n\t\t\t\t'
        + "\n\t\t\t\t".join(line)
        + "\n\t\t\t</g>"
        for i, line in enumerate(lines)
    )
    lockup = (
        f'<g id="agec-lockup" transform="translate({EN_TO_MOTION_DX:.3f} {EN_TO_MOTION_DY:.3f}) '
        f'scale({EN_TO_MOTION_SCALE_X:.6f} {EN_TO_MOTION_SCALE_Y:.6f})">\n{inner}\n\t\t</g>'
    )

    a, b = group_span(template, '<g id="agec-lockup"')
    svg = template[:a] + lockup + template[b:]

    # The English type runs 78% wider than the Chinese relative to the mark, so
    # the template's 255.1 canvas would clip it. Widen to fit; the height and the
    # mark's position are untouched, so the masks still line up.
    right = max(path_bounds_x(p)[1] for p in paths) * EN_TO_MOTION_SCALE_X + EN_TO_MOTION_DX
    return label(
        re.sub(r'viewBox="[^"]*"', f'viewBox="0 0 {right + 6:.1f} 113.4"', svg),
        "英文動效 lockup（模板同上，文字塊換成識別母檔 p7 並換算座標）",
    )


def path_bounds_x(path_tag: str) -> tuple[float, float]:
    d = re.search(r'\sd="([^"]+)"', path_tag).group(1)
    xs = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)][0::2]
    return (min(xs), max(xs)) if xs else (0.0, 0.0)


def main() -> int:
    if not shutil.which("pdftocairo"):
        raise SystemExit("找不到 pdftocairo（brew install poppler）")
    if not os.path.exists(MASTER):
        raise SystemExit(f"找不到識別母檔：{MASTER}")

    tmp = "/tmp/agec-logo-build"
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    p1 = page_to_svg(1, f"{tmp}/p1.svg")
    mark_bounds = vertical_bounds(split_mark_and_type(p1)[0])
    overhang_ratio = type_overhang() / (mark_bounds[1] - mark_bounds[0])
    zh, dy = bottom_align_type(drop_english_strapline(p1), overhang_ratio)
    print(f"  中文字塊下移 {dy:.2f}pt 對齊標誌腳（p4 溢出比 {overhang_ratio:.5f}）")
    en = page_to_svg(7, f"{tmp}/p7.svg")

    built = []
    for name, art, note in (
        ("agec_logo_zh", zh, "中文橫式 lockup（識別母檔 p1，已移除英文小標）"),
        ("agec_logo_en", en, "英文橫式 lockup（識別母檔 p7）"),
    ):
        for suffix, rev in (("", False), ("_reversed", True)):
            svg = label(trim(recolour(art, rev)), note + ("　反白版（深底用）" if rev else ""))
            path = f"{OUT}/{name}{suffix}.svg"
            open(path, "w", encoding="utf-8").write(svg)
            built.append((os.path.basename(path), len(svg)))

    # 只有標誌的方形版本，給後台側欄用（見 build_mark 的說明）。
    # 只產淺底版：後台每一個表面都是白底或 #f6f7f8。
    mark_svg = label(
        trim(recolour(build_mark(p1), False)),
        "標誌（無文字，識別母檔 p1），後台側欄與小尺寸場合用",
    )
    mark_path = f"{OUT}/agec_mark.svg"
    open(mark_path, "w", encoding="utf-8").write(mark_svg)
    built.append((os.path.basename(mark_path), len(mark_svg)))

    template = open(f"{OUT}/agec_logo_motion.svg", encoding="utf-8").read()
    for name, svg in (
        ("agec_logo_zh_motion", build_zh_motion(template, dy)),
        ("agec_logo_en_motion", build_en_motion(template, recolour(en, False))),
    ):
        path = f"{OUT}/{name}.svg"
        open(path, "w", encoding="utf-8").write(svg)
        built.append((os.path.basename(path), len(svg)))

    for n, size in built:
        print(f"  {n:<32} {size // 1024} KB")
    print(f"\n寫入 {len(built)} 個檔到 public/brand/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
