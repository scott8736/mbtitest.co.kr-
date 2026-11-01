# -*- coding: utf-8 -*-
"""MBTI 궁합 쪽 공유 미리보기(1200x630) (2026-11-01).

/compatibility/ 에 og 가 없어 홈의 「무료 MBTI 검사」 카드와 og:url(홈)을 물려받았다.
스레드 연애 유형 글(못 잊는 유형 12.2만 등)의 CTA·프로필 링크가 이 쪽으로 가므로,
미리보기도 「검사」가 아니라 「궁합」으로 보이게 모리 둘 + 하트 카드로 만든다.
틀·색·안전 영역(x 150~1050)은 make_mori_og.py 와 같다. 이미지 글자에 「모리」는 쓰지 않는다.

  python scripts/make_compat_og.py
"""
import os

from PIL import Image, ImageDraw

import make_mori_og as base  # 모듈을 읽으면 기본 카드도 다시 그려진다(같은 그림이라 바뀌지 않음)

OUT = os.path.join(base.ROOT, "public", "images", "og", "mbti-compat-og.jpg")
W, H, INK, VIOLET, font = base.W, base.H, base.INK, base.VIOLET, base.font
PINK = (232, 84, 128)

bg = Image.new("RGBA", (W, H))
top, bottom = (241, 236, 255), (255, 236, 226)
for yy in range(H):
    t = yy / H
    ImageDraw.Draw(bg).line([(0, yy), (W, yy)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
deco = ImageDraw.Draw(bg)
deco.ellipse((700, -180, 1240, 360), fill=(226, 216, 255, 255))
deco.ellipse((-120, 470, 180, 770), fill=(255, 221, 205, 255))

# 오른쪽: 마주 보는 두 모리 + 가운데 하트
# 쪽의 대표 궁합 짝(INTJ × ENFP) — 색이 파랑·노랑으로 갈려 둘로 읽힌다
base.paste_with_shadow(bg, base.tile("INTJ", 220, -6), 590, 160)
base.paste_with_shadow(bg, base.tile("ENFP", 220, 6), 790, 200)


def heart(d, cx, cy, r, fill):
    d.ellipse((cx - r, cy - r, cx, cy), fill=fill)
    d.ellipse((cx, cy - r, cx + r, cy), fill=fill)
    d.polygon([(cx - r + 2, cy - r // 3), (cx + r - 2, cy - r // 3), (cx, cy + r)], fill=fill)


d = ImageDraw.Draw(bg)
heart(d, 818, 138, 46, (255, 255, 255, 255))
heart(d, 818, 138, 36, PINK + (255,))

L = 160
d.rounded_rectangle((L, 100, L + 300, 152), radius=26, fill=(255, 255, 255, 255))
d.text((L + 150, 126), "16유형 · 연애·친구", font=font(26, 800), fill=VIOLET, anchor="mm")
d.text((L - 4, 176), "MBTI", font=font(84, 900), fill=VIOLET)
d.text((L - 4, 280), "궁합", font=font(84, 900), fill=INK)
d.text((L, 412), "우리 둘은", font=font(36, 800), fill=INK)
d.text((L, 460), "어떻게 맞을까?", font=font(36, 800), fill=INK)
d.text((L, 530), base.SITE_DOMAIN, font=font(26, 700), fill=(98, 104, 120))

bg.convert("RGB").save(OUT, "JPEG", quality=88)
print(OUT)
