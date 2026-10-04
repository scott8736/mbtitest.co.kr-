# -*- coding: utf-8 -*-
"""모리 16유형 캐릭터 → 사이트 자산.

원본은 에보링크(nano-banana-2)로 만든 1024px PNG 16장입니다(2026-10-04, A 화풍 = 둥근 3D,
INFP 견본을 기준 이미지로 넣어 그림체를 맞췄습니다). 원본은 저장소 밖에 둡니다.

  python scripts/make_mori_assets.py [원본폴더]

출력
  public/characters/mori-<code>.webp   720px, 결과 화면·공유 페이지·카드 합성용
  public/images/og/mori/<code>.jpg      1200x630, 공유 링크 미리보기(카톡·스레드)
  public/characters/tests/<slug>-<key>.webp   다른 테스트 결과 전용 모리(A 시험, 원본 폴더 옆 테스트_A/)

글꼴은 scripts/fonts/NotoSansKR-Bold.ttf (make-og.mjs 와 같은 것)를 씁니다.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else r"D:\00 cloud\mbtitest.co.kr\캐릭터_견본\16유형_A"
CHAR_DIR = os.path.join(ROOT, "public", "characters")
OG_DIR = os.path.join(ROOT, "public", "images", "og", "mori")
FONT = os.path.join(ROOT, "scripts", "fonts", "NotoSansKR-Bold.ttf")

# lib/mori.ts 의 MORI 와 같은 값입니다. 이름은 lib/mbti-data.ts 의 typeData.name 입니다.
TYPES = {
    "ISTJ": ("#a9c4ec", "묵묵한 약속 지킴이"), "ISFJ": ("#f6b48f", "포근한 돌봄 요정"),
    "INFJ": ("#8fd8c8", "조용한 마음 등대"), "INTJ": ("#5b63c9", "큰그림 설계자"),
    "ISTP": ("#6f7d96", "척척 해결사"), "ISFP": ("#8fae8a", "감성 산책가"),
    "INFP": ("#b9a3e3", "몽글몽글 이야기꾼"), "INTP": ("#9cc9ef", "궁금증 탐구가"),
    "ESTP": ("#f99a3d", "직진 행동대장"), "ESFP": ("#f26b6b", "신나는 분위기 메이커"),
    "ENFP": ("#f2d23c", "반짝반짝 아이디어 뱅크"), "ENTP": ("#a6d83c", "기발한 반전 토론가"),
    "ESTJ": ("#b98a5e", "똑부러진 현장 반장"), "ESFJ": ("#f5a9bd", "다정한 모임 호스트"),
    "ENFJ": ("#c85bd6", "든든한 응원단장"), "ENTJ": ("#b5303f", "거침없는 목표 지휘관"),
}


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def font(size, weight=800):
    # 이 파일은 이름과 달리 가변 글꼴이라 기본 굵기가 Thin(100)입니다. 굵기를 직접 줍니다.
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


os.makedirs(CHAR_DIR, exist_ok=True)
os.makedirs(OG_DIR, exist_ok=True)
for code, (color, name) in TYPES.items():
    src = Image.open(os.path.join(SRC, f"{code}.png")).convert("RGB")
    src.resize((720, 720), Image.LANCZOS).save(os.path.join(CHAR_DIR, f"mori-{code.lower()}.webp"), "WEBP", quality=82, method=6)

    # 1200x630: 왼쪽 캐릭터, 오른쪽 글. 카톡·스레드 미리보기는 가운데가 잘리므로 글을 크게 둡니다.
    og = Image.new("RGB", (1200, 630), mix(hex_rgb(color), (255, 255, 255), 0.82))
    og.paste(src.resize((630, 630), Image.LANCZOS), (0, 0))
    d = ImageDraw.Draw(og)
    ink = (28, 32, 52)
    accent = mix(hex_rgb(color), (0, 0, 0), 0.35)
    d.text((680, 120), "나는", font=font(40, 600), fill=ink)
    d.text((680, 172), f"{code} 모리", font=font(96), fill=accent)
    name_font = font(44 if len(name) <= 9 else 36)
    d.text((684, 300), name, font=name_font, fill=ink)
    d.rounded_rectangle((680, 430, 1140, 520), radius=45, fill=ink)
    d.text((910, 475), "너는 어떤 모리? →", font=font(38), fill=(255, 255, 255), anchor="mm")
    d.text((684, 556), "mbtitest.co.kr 무료 MBTI 검사", font=font(26, 600), fill=(98, 104, 120))
    og.save(os.path.join(OG_DIR, f"{code.lower()}.jpg"), "JPEG", quality=86)
    print(code)
print("done")

# 다른 테스트 결과 전용 모리(A, 2026-10-04 상위 3개 테스트 12장). lib/mori.ts 의 TEST_MORI 와 짝입니다.
TEST_SRC = os.path.join(os.path.dirname(SRC), "테스트_A")
TEST_DIR = os.path.join(CHAR_DIR, "tests")
if os.path.isdir(TEST_SRC):
    os.makedirs(TEST_DIR, exist_ok=True)
    for f in sorted(os.listdir(TEST_SRC)):
        if f.endswith(".png"):
            Image.open(os.path.join(TEST_SRC, f)).convert("RGB").resize((720, 720), Image.LANCZOS).save(
                os.path.join(TEST_DIR, f[:-4] + ".webp"), "WEBP", quality=82, method=6)
            print("test", f[:-4])
