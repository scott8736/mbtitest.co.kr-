# -*- coding: utf-8 -*-
"""사이트 기본 공유 미리보기(1200x630) — 모리 캐릭터판 (2026-10-04).

예전 기본 이미지(mbti-test-share.jpg)는 남색 바탕에 글자만 있어 스레드·카톡 미리보기에서
"촌스럽다"는 평을 받았다. 16유형 모리 캐릭터를 모아 귀엽게 바꾼다.
홈·MBTI 검사·유형 페이지 등 27곳이 쓰는 이미지라, 카톡·스레드의 옛 미리보기 캐시를 피하려고
새 파일 이름(mbti-mori-share.jpg)으로 만든다.

안전 영역: 카톡·네이버 미리보기는 1.91:1 이미지를 약 1.67:1(네이버 블로그 링크 카드)까지 좌우로 잘라 보여 준다.
첫 판은 글자를 x=66, 모리를 x=1200 끝까지 붙여 양옆이 잘렸다(10-04 사용자 지적). 모든 글자·모리를
가운데 x 150~1050 안에 둔다 — 1.4:1 까지 잘려도 안 깨진다.

  python scripts/make_mori_og.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import json as _json
from pathlib import Path as _Path
SITE_DOMAIN = _json.loads((_Path(__file__).resolve().parent.parent / "site.config.json").read_text(encoding="utf-8"))["brand"]["domain"]  # 도메인은 site.config.json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, "public", "characters")
# 10-04 둘째 판(안전 영역)부터 mbti-mori-og.jpg. 첫 판 이름(mbti-mori-share.jpg)에도 같은 그림을 써서
# 이미 퍼진 미리보기가 다시 읽힐 때 고쳐지게 한다.
OUT = os.path.join(ROOT, "public", "images", "og", "mbti-mori-og.jpg")
OLD = os.path.join(ROOT, "public", "images", "og", "mbti-mori-share.jpg")
FONT = os.path.join(ROOT, "scripts", "fonts", "NotoSansKR-Bold.ttf")
W, H = 1200, 630
INK = (28, 32, 52)
VIOLET = (118, 87, 214)


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])  # 가변 글꼴이라 기본이 Thin 입니다
    return f


def tile(code, size, angle):
    """모리 그림을 둥근 타일 + 흰 테두리 + 그림자로. 살짝 기울여 스티커처럼."""
    im = Image.open(os.path.join(CHAR, f"mori-{code.lower()}.webp")).convert("RGBA").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=size // 5, fill=255)
    border = 8
    out = Image.new("RGBA", (size + border * 2, size + border * 2), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle((0, 0, size + border * 2, size + border * 2), radius=size // 5 + border, fill=(255, 255, 255, 255))
    out.paste(im, (border, border), mask)
    return out.rotate(angle, resample=Image.BICUBIC, expand=True)


def paste_with_shadow(canvas, im, x, y):
    # 그림자 판을 여백(pad)만큼 키워서 흐린다 — 타일 크기 그대로 흐리면 가장자리가 네모로 잘려 얼룩이 된다
    pad = 40
    alpha = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0)
    alpha.paste(im.getchannel("A").point(lambda a: int(a * 0.28)), (pad, pad))
    shadow = Image.new("RGBA", alpha.size, (40, 30, 90, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(12)))
    canvas.alpha_composite(shadow, (x + 6 - pad, y + 14 - pad))
    canvas.alpha_composite(im, (x, y))


# 바탕: 연보라 → 복숭아 대각 그라데이션 + 큰 동그라미 두 개
bg = Image.new("RGBA", (W, H))
top, bottom = (241, 236, 255), (255, 236, 226)
for yy in range(H):
    t = yy / H
    ImageDraw.Draw(bg).line([(0, yy), (W, yy)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
deco = ImageDraw.Draw(bg)
deco.ellipse((700, -180, 1240, 360), fill=(226, 216, 255, 255))
deco.ellipse((-120, 470, 180, 770), fill=(255, 221, 205, 255))

# 오른쪽: 가운데 큰 모리 + 둘레 작은 모리들
layout = [  # (유형, 크기, 기울기, x, y) — 기울인 뒤 바깥 끝이 1050 을 넘지 않게
    ("INFP", 240, -4, 760, 170),
    ("ENFP", 140, 8, 625, 50),
    ("ISTJ", 130, -9, 890, 40),
    ("ESFP", 130, 7, 895, 400),
    ("INTJ", 125, -6, 615, 405),
    ("ISFJ", 110, 10, 770, 475),
]
for code, size, angle, x, y in layout[1:] + layout[:1]:  # 큰 것을 맨 위에
    paste_with_shadow(bg, tile(code, size, angle), x, y)

d = ImageDraw.Draw(bg)
# 왼쪽 글
L = 160
d.rounded_rectangle((L, 100, L + 330, 152), radius=26, fill=(255, 255, 255, 255))
d.text((L + 165, 126), "40문항 · 약 4분 · 무료", font=font(26, 800), fill=VIOLET, anchor="mm")
d.text((L - 4, 176), "무료", font=font(84, 900), fill=INK)
d.text((L + 180, 176), "MBTI", font=font(84, 900), fill=VIOLET)
d.text((L - 4, 280), "검사", font=font(84, 900), fill=INK)
d.text((L, 412), "16가지 모리 중", font=font(36, 800), fill=INK)
d.text((L, 460), "나는 누구일까?", font=font(36, 800), fill=INK)
d.text((L, 530), SITE_DOMAIN, font=font(26, 700), fill=(98, 104, 120))

for path in (OUT, OLD):
    bg.convert("RGB").save(path, "JPEG", quality=88)
print(OUT)
