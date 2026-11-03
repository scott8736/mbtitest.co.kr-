"""그림 카드(1200x630) — Flow 그림 위에 글자를 얹는다 (2026-11-03).

글자만 있는 카드(make-og.mjs·make_page_og.py) 대신 그림을 깐 카드가 필요한 테스트에 쓴다.
결과 화면·공유 결과 쪽·카톡/스레드 미리보기가 모두 이 파일을 읽는다.
두 생성기는 여기서 구운 파일을 덮지 않는다(make-og.mjs ART_SLUGS, 매니페스트 "art": true).

  python scripts/make_art_og.py marriage-charm [--src 그림폴더]

그림폴더에는 s01.jpg(대표) 다음으로 결과 순서대로 s02.jpg… 가 있어야 한다.
그림은 오른쪽에 인물, 왼쪽이 빈 벽이 되게 뽑는다 — 글자는 왼쪽에 놓는다.
"""
import argparse
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "scripts", "fonts", "NotoSansKR-Bold.ttf")
SITE_DOMAIN = json.load(open(os.path.join(ROOT, "site.config.json"), encoding="utf-8"))["brand"]["domain"]
W, H = 1200, 630
INK = (40, 34, 38)
LEFT = 96
TEXT_W = 470  # 글자는 덮개(solid) 안에서 끝낸다

# 테스트마다: 그림 폴더 기본값, 대표 카드 문구, 결과 순서(s02~), 결과별 문구
ARTS = {
    "marriage-charm": {
        "src": os.path.join(os.path.dirname(ROOT), "결혼매력_그림", "img"),
        "page": {"label": "성향 테스트", "title": ["결혼하면 더 반하는", "나의 매력은?"], "sub": "16문항 · 3분 · 둘이 같이 해 보세요"},
        "order": ["steady", "thanks", "ally", "spark"],
        "eyebrow": "결혼하면 더 반하는 매력",
    },
}


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])  # 가변 글꼴이라 기본이 Thin 이다
    return f


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cover(path):
    im = Image.open(path).convert("RGB")
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x = (im.width - W) // 2
    y = (im.height - H) // 2
    return im.crop((x, y, x + W, y + H)).convert("RGBA")


def veil(bg, solid=560, fade=300):
    """왼쪽을 크림색으로 덮어 글자가 그림 위에서도 읽히게 한다. solid 까지는 거의 불투명, 그 뒤 fade 만큼 흐려진다."""
    layer = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(layer)
    for x in range(solid + fade):
        a = 238 if x < solid else round(238 * (1 - (x - solid) / fade) ** 1.4)
        d.line([(x, 0), (x, H)], fill=(255, 248, 240, a))
    return Image.alpha_composite(bg, layer)


def fit(d, text, size, max_w, weight=800):
    while size > 28:
        f = font(size, weight)
        if d.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return font(size, weight)


def result_card(src, eyebrow, result, out):
    color = hex_rgb(result["color"])
    bg = veil(cover(src))
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle((LEFT, 70, LEFT + 96, 80), radius=5, fill=color)
    d.text((LEFT, 104), eyebrow, font=font(30, 700), fill=color)
    d.text((LEFT, 150), result["name"], font=fit(d, result["name"], 86, TEXT_W), fill=INK)
    tag = result["tagline"]
    d.text((LEFT, 278), tag, font=fit(d, tag, 34, TEXT_W, 700), fill=INK)
    x = LEFT
    cf = font(28, 700)
    for t in result["traits"][:3]:
        w = d.textlength(t, font=cf) + 48
        d.rounded_rectangle((x, 380, x + w, 436), radius=28, fill=color + (230,))
        d.text((x + w / 2, 408), t, font=cf, fill=(255, 255, 255), anchor="mm")
        x += w + 14
    d.text((LEFT, 520), "나도 테스트하기", font=font(32, 800), fill=INK, anchor="lm")
    d.text((LEFT + 268, 520), SITE_DOMAIN, font=font(28, 600), fill=(110, 100, 104), anchor="lm")
    # 파일 이름이 .png 로 고정이라(결과 화면·공유 쪽 코드) 256색으로 줄여 무게만 낮춘다
    bg.convert("RGB").quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(out, "PNG", optimize=True)


def page_card(src, page, color, out):
    bg = veil(cover(src), 600, 300)
    d = ImageDraw.Draw(bg)
    lf = font(32)
    lw = d.textlength(page["label"], font=lf)
    d.rounded_rectangle((LEFT, 88, LEFT + lw + 52, 88 + 62), radius=31, fill=color)
    d.text((LEFT + 26, 88 + 31), page["label"], font=lf, fill=(255, 255, 255), anchor="lm")
    y = 190
    for ln in page["title"]:
        d.text((LEFT, y), ln, font=fit(d, ln, 76, TEXT_W), fill=INK)
        y += 100
    d.text((LEFT, y + 22), page["sub"], font=fit(d, page["sub"], 32, TEXT_W, 700), fill=(90, 80, 84))
    d.rounded_rectangle((LEFT, 520, LEFT + 90, 530), radius=5, fill=color)
    d.text((LEFT, 562), SITE_DOMAIN, font=font(32, 700), fill=INK, anchor="lm")
    bg.convert("RGB").save(out, "JPEG", quality=84, optimize=True, progressive=True)


def load_results(slug):
    """lib 의 결과 문구를 그대로 쓴다 — node 로 TS 를 묶어 JSON 으로 받는다."""
    import subprocess
    code = (
        "const {build}=require('esbuild');"
        "build({stdin:{contents:'export { genericTests } from \"./lib/generic-tests\"',resolveDir:process.cwd(),loader:'ts'},"
        "bundle:true,format:'cjs',platform:'node',write:false}).then(r=>{const m={exports:{}};"
        "new Function('module','exports',r.outputFiles[0].text)(m,m.exports);"
        f"process.stdout.write(JSON.stringify(m.exports.genericTests['{slug}'].results))}})"
    )
    out = subprocess.run(["node", "-e", code], cwd=ROOT, capture_output=True, check=True)
    return json.loads(out.stdout.decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", choices=sorted(ARTS))
    ap.add_argument("--src")
    args = ap.parse_args()
    cfg = ARTS[args.slug]
    src = args.src or cfg["src"]
    results = load_results(args.slug)

    r_dir = os.path.join(ROOT, "public", "images", "og", "r")
    p_dir = os.path.join(ROOT, "public", "images", "og", "pages")
    first = results[cfg["order"][0]]
    page_card(os.path.join(src, "s01.jpg"), cfg["page"], hex_rgb(first["color"]),
              os.path.join(p_dir, f"tests-{args.slug}.jpg"))
    for i, key in enumerate(cfg["order"], start=2):
        result_card(os.path.join(src, f"s{i:02d}.jpg"), cfg["eyebrow"], results[key],
                    os.path.join(r_dir, f"{args.slug}-{key}.png"))
    print(f"{args.slug}: 대표 1장 + 결과 {len(cfg['order'])}장")


if __name__ == "__main__":
    main()
