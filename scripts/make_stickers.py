# -*- coding: utf-8 -*-
"""mbtitest.co.kr 마스코트 스티커 생성기.

검사 화면·CTA·결과 카드에 쓸 캐릭터 스티커를 제미나이로 만든다.

왜 직접 만드나
  GIPHY 는 약관상 상업적 이용과 자체 호스팅을 금지한다(2026-09-13 확인). 무료
  일러스트 사이트도 표기 조건이 제각각이라 100개 테스트에 일관되게 깔기 어렵다.
  직접 만들면 저작권이 우리 것이고, 화풍이 하나로 고정되고, 재사용이 무제한이다.

화풍을 하나로 고정하는 법
  프롬프트의 STYLE 문자열을 모든 장에 똑같이 붙인다. 캐릭터 묘사(CHARACTER)도
  고정하고 표정·포즈만 바꾼다. 이걸 안 하면 20장이 20가지 그림체가 된다.

사용법
    python scripts/make_stickers.py --test      # 1장만 만들어 품질 확인
    python scripts/make_stickers.py             # 전체 생성 (이미 있는 파일은 건너뜀)
    python scripts/make_stickers.py --force     # 전부 다시 생성

출력: public/sticker/<이름>.png
"""
import argparse
import os
import sys

sys.path.insert(0, r"D:\00 cloud")
from gemi import generate_image  # noqa: E402

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "public", "sticker")

# 사이트 팔레트(globals.css)에서 가져온 색. 캐릭터가 사이트에 얹혔을 때 겉돌지 않게 한다.
STYLE = (
    "Flat vector sticker illustration, thick uniform dark-green outline, "
    "simple solid fills with no gradients and no shading, "
    "muted sage green (#738b6d) body, deep forest green (#15372f) outline and eyes, "
    "warm cream (#f7f8f3) background, soft rounded shapes, "
    "minimal children's-book style, centered single subject, "
    "generous empty margin around the subject, no text, no letters, no watermark, "
    "no drop shadow, clean and simple."
)

# 캐릭터 설명도 고정한다. 표정과 포즈만 SCENES 에서 바꾼다.
CHARACTER = (
    "A small friendly mascot shaped like a soft rounded brain with gentle folds, "
    "with two tiny dot eyes, a very small simple mouth, "
    "short simple arms and two stubby legs. Cute but not babyish."
)

# (파일명, 장면) — 검사 흐름에서 실제로 쓸 자리를 먼저 채웠다.
SCENES = [
    # 시작 화면 · CTA
    ("hello",        "waving one arm cheerfully, friendly welcoming smile"),
    ("point",        "pointing forward with one arm, encouraging expression"),
    ("start",        "running forward eagerly, small motion lines"),

    # 문항 화면 — 감정별. 문항마다 바꿔 끼운다.
    ("think",        "tilting head with one arm on chin, thoughtful curious expression"),
    ("confused",     "shrugging with both arms up, puzzled expression, small question mark shape above"),
    ("surprise",     "leaning back slightly with wide round eyes, surprised open mouth"),
    ("happy",        "jumping with both arms raised, bright happy expression"),
    ("shy",          "looking down and away, both arms tucked in, bashful expression"),
    ("tired",        "slouching with droopy posture, sleepy half-closed eyes"),
    ("calm",         "sitting cross-legged peacefully, eyes closed, serene expression"),
    ("worried",      "hugging itself with both arms, small worried frown"),
    ("excited",      "leaning forward with sparkling wide eyes, eager expression"),

    # 결과 화면
    ("celebrate",    "throwing both arms up in celebration, confetti shapes around"),
    ("heart",        "holding a simple heart shape with both arms, warm smile"),
    ("star",         "holding a simple star shape above its head, proud expression"),
    ("gift",         "holding a small wrapped gift box, delighted expression"),
    ("magnify",      "holding a simple magnifying glass, curious investigating expression"),

    # 공유 · 안내
    ("phone",        "holding a simple smartphone shape, showing it to the viewer"),
    ("camera",       "holding a simple camera, about to take a photo"),
    ("write",        "holding a large pencil and writing, focused expression"),
]


def build_prompt(scene):
    return "%s %s The mascot is %s" % (STYLE, CHARACTER, scene)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="1장만 만들어 본다")
    parser.add_argument("--force", action="store_true", help="이미 있는 파일도 다시 만든다")
    args = parser.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    scenes = SCENES[:1] if args.test else SCENES

    made, skipped, failed = 0, 0, []
    for name, scene in scenes:
        path = os.path.join(OUT_DIR, name + ".png")
        if os.path.exists(path) and not args.force:
            print("  건너뜀 (이미 있음): %s.png" % name)
            skipped += 1
            continue
        try:
            generate_image(build_prompt(scene), path, aspect_ratio="1:1")
            size = os.path.getsize(path)
            print("  만듦: %s.png (%.0f KB)" % (name, size / 1024))
            made += 1
        except Exception as exc:                      # noqa: BLE001
            print("  실패: %s.png - %s" % (name, str(exc)[:160]))
            failed.append(name)

    print("")
    print("완료 - 생성 %d장 / 건너뜀 %d장 / 실패 %d장" % (made, skipped, len(failed)))
    if failed:
        print("실패 목록: %s" % ", ".join(failed))
    print("출력 위치: %s" % OUT_DIR)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
