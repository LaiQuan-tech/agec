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


def build_zh_motion(template: str) -> str:
    """Template minus the English strapline group."""
    a, b = group_span(template, '<g id="agec-en"')
    return label(
        template[:a] + template[b:],
        "中文動效 lockup（以 agec_logo_motion.svg 為模板，移除英文小標）",
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

    zh = drop_english_strapline(page_to_svg(1, f"{tmp}/p1.svg"))
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

    template = open(f"{OUT}/agec_logo_motion.svg", encoding="utf-8").read()
    for name, svg in (
        ("agec_logo_zh_motion", build_zh_motion(template)),
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
