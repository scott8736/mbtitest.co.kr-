# -*- coding: utf-8 -*-
"""쪽마다 다른 공유 미리보기(1200x630) — 운세·성향 테스트·자가진단·타로 (2026-10-14).

네이버 검색 썸네일은 og:image 가 쪽마다 달라야 잘 붙는다. 예전에는 147쪽이 사이트 공통 이미지
(mbti-mori-og.jpg) 한 장을 같이 써서 썸네일이 전부 같았다.

  scripts/page-og-manifest.json  ->  public/images/og/pages/<슬러그>.jpg
  슬러그 = 경로의 앞뒤 / 를 떼고 나머지 / 를 - 로 (lib/page-og.ts 의 pageOgSlug 와 같은 규칙)

색·글꼴·분위기는 make_mori_og.py 를 따른다(연보라 -> 복숭아 바탕, NotoSansKR Bold, 안전 영역 가운데 x 150~1050).
쪽마다 포인트 색(12가지)과 도형(8가지)을 슬러그 해시로 달리해 서로 구분되게 한다. 이미지 글자에 「모리」는 쓰지 않는다.

  python scripts/make_page_og.py
"""
import hashlib
import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "scripts", "fonts", "NotoSansKR-Bold.ttf")
MANIFEST = os.path.join(ROOT, "scripts", "page-og-manifest.json")
OUT_DIR = os.path.join(ROOT, "public", "images", "og", "pages")
SITE_DOMAIN = json.load(open(os.path.join(ROOT, "site.config.json"), encoding="utf-8"))["brand"]["domain"]
W, H = 1200, 630
INK = (28, 32, 52)
SAFE_L, SAFE_R = 150, 1050  # 카톡·네이버가 좌우를 잘라도 안 깨지는 가운데 영역

# 포인트 색 12가지 (진한 색, 연한 바탕색 = 도형이 얹히는 색)
ACCENTS = [
    ((118, 87, 214), (226, 216, 255)),  # 보라
    ((226, 94, 120), (255, 223, 230)),  # 장미
    ((240, 140, 60), (255, 230, 205)),  # 주황
    ((222, 170, 30), (255, 241, 196)),  # 노랑
    ((88, 170, 90), (216, 240, 214)),   # 초록
    ((30, 160, 150), (205, 241, 236)),  # 청록
    ((52, 130, 220), (212, 230, 255)),  # 파랑
    ((98, 100, 220), (222, 224, 255)),  # 남보라
    ((196, 90, 200), (246, 220, 248)),  # 자주
    ((214, 90, 70), (255, 221, 212)),   # 산호
    ((120, 150, 40), (232, 242, 200)),  # 라임
    ((70, 120, 160), (214, 232, 244)),  # 강청
]


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])  # 가변 글꼴이라 기본이 Thin 입니다
    return f


def slug_of(path):
    return path.strip("/").replace("/", "-")


def hnum(slug, salt):
    return int(hashlib.md5((slug + salt).encode("utf-8")).hexdigest()[:8], 16)


def short_title(title):
    # 허브 쪽 제목은 길다: 「A — B」 꼴이면 앞쪽만. 접미사(| MBTI 검사 등)는 매니페스트에서 이미 뗐다.
    if len(title) > 20 and " — " in title:
        title = title.split(" — ")[0]
    return title.strip()


def wrap(draw, text, fnt, max_w):
    """공백 단위로 줄바꿈하되 한 단어가 넘치면 글자 단위로 자른다."""
    lines, cur = [], ""
    for word in text.split(" "):
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
            continue
        if cur:
            lines.append(cur)
            cur = ""
        for ch in word:
            if draw.textlength(cur + ch, font=fnt) <= max_w:
                cur += ch
            else:
                lines.append(cur)
                cur = ch
    if cur:
        lines.append(cur)
    return lines


def fit_title(draw, text, max_w):
    for size in (92, 80, 70, 62):
        fnt = font(size)
        lines = wrap(draw, text, fnt, max_w)
        if len(lines) <= 2:
            return fnt, lines, size
    fnt = font(62)  # 그래도 3줄이면 2줄로 줄이고 말줄임
    lines = wrap(draw, text, fnt, max_w)[:2]
    while draw.textlength(lines[1] + "…", font=fnt) > max_w:
        lines[1] = lines[1][:-1]
    lines[1] += "…"
    return fnt, lines, 62


def draw_shape(layer, kind, cx, cy, r, color, light, rot):
    d = ImageDraw.Draw(layer)
    if kind == 0:  # 겹친 동그라미 셋
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=light + (255,))
        d.ellipse((cx - r * 0.2, cy - r * 0.2, cx + r * 0.9, cy + r * 0.9), fill=color + (200,))
        d.ellipse((cx - r * 0.9, cy + r * 0.1, cx - r * 0.1, cy + r * 0.9), fill=color + (110,))
    elif kind == 1:  # 둥근 마름모 겹침
        for i, a in enumerate((0, 22)):
            s = r * (1 - 0.25 * i)
            pts = [(cx, cy - s), (cx + s, cy), (cx, cy + s), (cx - s, cy)]
            d.polygon(_rot(pts, cx, cy, rot + a), fill=(light if i == 0 else color) + (255 if i == 0 else 190,))
    elif kind == 2:  # 별
        pts = []
        for i in range(10):
            rr = r if i % 2 == 0 else r * 0.45
            ang = math.radians(rot - 90 + i * 36)
            pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
        d.polygon(pts, fill=color + (230,))
        d.ellipse((cx - r * 0.28, cy - r * 0.28, cx + r * 0.28, cy + r * 0.28), fill=light + (255,))
    elif kind == 3:  # 동심원 고리
        for i, k in enumerate((1.0, 0.72, 0.44)):
            rr = r * k
            d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=color + (230 - 50 * i,), width=22 - 5 * i)
    elif kind == 4:  # 삼각형 둘
        a = [(cx, cy - r), (cx + r * 0.95, cy + r * 0.7), (cx - r * 0.95, cy + r * 0.7)]
        d.polygon(_rot(a, cx, cy, rot), fill=light + (255,))
        b = [(cx, cy - r * 0.55), (cx + r * 0.52, cy + r * 0.4), (cx - r * 0.52, cy + r * 0.4)]
        d.polygon(_rot(b, cx, cy + r * 0.1, rot + 180), fill=color + (210,))
    elif kind == 5:  # 점 격자
        n = 5
        gap = r * 2 / (n - 1)
        for i in range(n):
            for j in range(n):
                rr = 9 + 7 * ((i + j) % 3)
                x, y = cx - r + i * gap, cy - r + j * gap
                d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(color if (i + j) % 2 == 0 else light) + (235,))
    elif kind == 6:  # 육각형
        pts = [(cx + r * math.cos(math.radians(60 * i + rot)), cy + r * math.sin(math.radians(60 * i + rot))) for i in range(6)]
        d.polygon(pts, fill=light + (255,))
        pts2 = [(cx + r * 0.6 * math.cos(math.radians(60 * i + rot + 30)), cy + r * 0.6 * math.sin(math.radians(60 * i + rot + 30))) for i in range(6)]
        d.polygon(pts2, fill=color + (210,))
    else:  # 물결 띠
        for i in range(3):
            pts = []
            for x in range(-int(r), int(r) + 1, 8):
                pts.append((cx + x, cy + (i - 1) * r * 0.55 + math.sin((x / r) * math.pi * 1.6 + math.radians(rot)) * r * 0.22))
            d.line(pts, fill=(color if i != 1 else light) + (235,), width=26, joint="curve")


def _rot(pts, cx, cy, deg):
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca) for x, y in pts]


def make(entry):
    path, label, title = entry["path"], entry["label"], short_title(entry["title"])
    slug = slug_of(path)
    color, light = ACCENTS[hnum(slug, "c") % len(ACCENTS)]
    kind = hnum(slug, "s") % 8
    rot = hnum(slug, "r") % 60

    bg = Image.new("RGBA", (W, H))
    top = tuple(round(255 - (255 - c) * 0.10) for c in light)
    bottom = (255, 240, 230)
    bd = ImageDraw.Draw(bg)
    for yy in range(H):
        t = yy / H
        bd.line([(0, yy), (W, yy)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    # 큰 배경 동그라미 (make_mori_og 와 같은 분위기)
    bd.ellipse((700, -180, 1240, 360), fill=light + (255,))
    bd.ellipse((-120, 470, 180, 770), fill=(255, 221, 205, 255))

    # 오른쪽 아래 도형 (안전 영역 안: 바깥 끝이 1050 을 넘지 않게)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_shape(layer, kind, 905, 420, 125, color, light, rot)
    bg.alpha_composite(layer)

    d = ImageDraw.Draw(bg)
    # 분야 라벨 알약
    lf = font(36)
    lw = d.textlength(label, font=lf)
    d.rounded_rectangle((SAFE_L, 92, SAFE_L + lw + 56, 92 + 70), radius=35, fill=color + (255,))
    d.text((SAFE_L + 28, 92 + 35), label, font=lf, fill=(255, 255, 255), anchor="lm")

    # 제목 (2줄 이내)
    tf, lines, size = fit_title(d, title, SAFE_R - SAFE_L)
    y = 215
    for ln in lines:
        d.text((SAFE_L, y), ln, font=tf, fill=INK)
        y += int(size * 1.28)

    # 포인트 막대 + 도메인
    d.rounded_rectangle((SAFE_L, 520, SAFE_L + 90, 530), radius=5, fill=color + (255,))
    d.text((SAFE_L, 560), SITE_DOMAIN, font=font(34, 700), fill=(*INK[:3],), anchor="lm")

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, slug + ".jpg")
    bg.convert("RGB").save(out, "JPEG", quality=82, optimize=True, progressive=True)
    return out


if __name__ == "__main__":
    entries = json.load(open(MANIFEST, encoding="utf-8"))
    total = 0
    for e in entries:
        total += os.path.getsize(make(e))
    print(f"{len(entries)}장 -> {OUT_DIR} ({total // 1024} KB)")
