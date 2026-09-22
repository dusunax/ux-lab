#!/usr/bin/env python3
"""public/sprites, public/backgrounds 의 모든 이미지 픽셀 크기를 모아
src/features/cat/spriteSizes.ts 를 생성한다.

<Sprite> 컴포넌트가 이 값으로 aspect-ratio를 계산해, 한쪽 크기(width 또는 height)만
지정해도 이미지가 로딩되기 전에 나머지 크기를 예약해 레이아웃 쉬프트를 막는다.
스프라이트를 추가·교체한 뒤에는 이 스크립트를 다시 돌린다.

사용법: python3 apps/cat-game/scripts/gen-sprite-sizes.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'features' / 'cat' / 'spriteSizes.ts'


def main() -> None:
    sizes: dict[str, tuple[int, int]] = {}
    for f in sorted((ROOT / 'public' / 'sprites').glob('*.png')):
        sizes[f.stem] = Image.open(f).size
    for f in sorted((ROOT / 'public' / 'backgrounds').glob('*.webp')):
        sizes[f'bg-{f.stem}'] = Image.open(f).size

    lines = [
        "/** 스프라이트·배경 원본 픽셀 크기. scripts/gen-sprite-sizes.py 로 생성 — 수정하지 말고 스크립트를 다시 돌린다.",
        " * <Sprite>가 이 값으로 aspect-ratio를 미리 계산해, 이미지가 아직 로딩 중이어도 레이아웃이 밀리지 않게 한다. */",
        "export const SPRITE_SIZES: Record<string, [number, number]> = {",
        *(f"  '{name}': [{w}, {h}]," for name, (w, h) in sizes.items()),
        "}",
        "",
    ]
    OUT.write_text("\n".join(lines))
    print(f"{len(sizes)} entries written to {OUT.relative_to(ROOT)}")


if __name__ == '__main__':
    main()
