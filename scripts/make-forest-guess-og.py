# -*- coding: utf-8 -*-
"""
「친구가 본 내 모리」 초대 링크 미리보기 그림 (2026-10-08).
모든 초대 링크가 같은 그림을 씁니다 — 주인 유형을 그림에 넣지 않는 것은 맞히기 전에 답이 보이면 안 되기 때문입니다.
제목·설명은 숲마다 워커가 바꿉니다(worker/forest.ts forestOgTitle).

  python scripts/make-forest-guess-og.py
출력: public/images/og/forest-guess.png (1200x630)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json as _json
from pathlib import Path as _Path
SITE_DOMAIN = _json.loads((_Path(__file__).resolve().parent.parent / "site.config.json").read_text(encoding="utf-8"))["brand"]["domain"]  # 도메인은 site.config.json

ROOT = Path(__file__).resolve().parent.parent
FONT = str(ROOT / "scripts" / "fonts" / "GothicA1-Bold.ttf")
OUT = ROOT / "public" / "images" / "og" / "forest-guess.png"
CODES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP",
         "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"]

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#fff8ec")
d = ImageDraw.Draw(img)
# 아래로 갈수록 연보라
for y in range(H):
    t = y / H
    c = tuple(int(a + (b - a) * t) for a, b in zip((255, 248, 236), (236, 228, 255)))
    d.line([(0, y), (W, y)], fill=c)

# 오른쪽: 16모리 4x4
cell = 118
x0, y0 = 690, 70
for i, code in enumerate(CODES):
    m = Image.open(ROOT / "public" / "characters" / f"mori-{code.lower()}.webp").convert("RGBA").resize((cell - 10, cell - 10), Image.LANCZOS)
    x = x0 + (i % 4) * cell
    y = y0 + (i // 4) * cell
    d.rounded_rectangle([x, y, x + cell - 6, y + cell - 6], radius=22, fill="#ffffff", outline="#e6dcfb", width=3)
    img.paste(m, (x + 2, y + 2), m)

# 왼쪽: 글
big = ImageFont.truetype(FONT, 78)
mid = ImageFont.truetype(FONT, 40)
small = ImageFont.truetype(FONT, 30)
d.text((70, 120), "나는 어떤", font=big, fill="#1c2034")
d.text((70, 215), "모리 같아?", font=big, fill="#1c2034")
d.text((70, 330), "16모리 중 하나를 골라 맞혀 줘!", font=mid, fill="#4a2fa3")
d.text((70, 395), "고르면 정답이 바로 나와요", font=small, fill="#3a3f55")
d.rounded_rectangle([70, 470, 470, 550], radius=40, fill="#7657d6")
d.text((270, 510), "맞히러 가기 →", font=mid, fill="#ffffff", anchor="mm")
d.text((70, 585), SITE_DOMAIN, font=small, fill="#5a3fb3")

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, optimize=True)
print(OUT, OUT.stat().st_size)
