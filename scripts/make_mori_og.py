# -*- coding: utf-8 -*-
"""사이트 기본 공유 미리보기(1200x630) — 모리 캐릭터판 (2026-10-04).

예전 기본 이미지(mbti-test-share.jpg)는 남색 바탕에 글자만 있어 스레드·카톡 미리보기에서
"촌스럽다"는 평을 받았다. 16유형 모리 캐릭터를 모아 귀엽게 바꾼다.
홈·MBTI 검사·유형 페이지 등 27곳이 쓰는 이미지라, 카톡·스레드의 옛 미리보기 캐시를 피하려고
새 파일 이름(mbti-mori-share.jpg)으로 만든다.

  python scripts/make_mori_og.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, "public", "characters")
OUT = os.path.join(ROOT, "public", "images", "og", "mbti-mori-share.jpg")
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
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    shadow.putalpha(im.getchannel("A").point(lambda a: int(a * 0.28)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(shadow, (x + 6, y + 14))
    canvas.alpha_composite(im, (x, y))


# 바탕: 연보라 → 복숭아 대각 그라데이션 + 큰 동그라미 두 개
bg = Image.new("RGBA", (W, H))
top, bottom = (241, 236, 255), (255, 236, 226)
for yy in range(H):
    t = yy / H
    ImageDraw.Draw(bg).line([(0, yy), (W, yy)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
deco = ImageDraw.Draw(bg)
deco.ellipse((760, -160, 1320, 400), fill=(226, 216, 255, 255))
deco.ellipse((-120, 470, 180, 770), fill=(255, 221, 205, 255))

# 오른쪽: 가운데 큰 모리 + 둘레 작은 모리들
layout = [
    ("INFP", 250, -4, 805, 150),
    ("ENFP", 150, 8, 660, 40),
    ("ISTJ", 140, -9, 1035, 30),
    ("ESFP", 140, 7, 1050, 380),
    ("INTJ", 130, -6, 655, 400),
    ("ISFJ", 120, 10, 935, 470),
]
for code, size, angle, x, y in layout[1:] + layout[:1]:  # 큰 것을 맨 위에
    paste_with_shadow(bg, tile(code, size, angle), x, y)

d = ImageDraw.Draw(bg)
# 왼쪽 글
d.rounded_rectangle((70, 92, 432, 148), radius=28, fill=(255, 255, 255, 255))
d.text((251, 120), "40문항 · 약 4분 · 무료", font=font(28, 800), fill=VIOLET, anchor="mm")
d.text((66, 172), "무료", font=font(96, 900), fill=INK)
d.text((276, 172), "MBTI", font=font(96, 900), fill=VIOLET)
d.text((66, 290), "검사", font=font(96, 900), fill=INK)
d.text((70, 430), "16가지 모리 중", font=font(40, 800), fill=INK)
d.text((70, 482), "나는 누구일까?", font=font(40, 800), fill=INK)
d.text((70, 560), "mbtitest.co.kr", font=font(28, 700), fill=(98, 104, 120))

bg.convert("RGB").save(OUT, "JPEG", quality=88)
print(OUT)
