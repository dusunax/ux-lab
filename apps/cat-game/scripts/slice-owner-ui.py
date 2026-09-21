#!/usr/bin/env python3
"""assets/sheet-ui.webp(집사 아바타·이미지 버튼)와 assets/sheet-owner.webp(네비 아이콘 판)를
잘라 public/sprites/ 에 투명 PNG로 저장한다. 두 시트 모두 배경이 투명하며,
sheet_utils.load_transparent 가 알파 잔상을 정리한다.
사용법: python3 apps/cat-game/scripts/slice-owner-ui.py   (Pillow, numpy, scipy 필요)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from sheet_utils import ALPHA_MIN, crop_component, find_components, load_transparent

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / 'assets' / 'sheet-ui.webp'
SHEET_OWNER = ROOT / 'assets' / 'sheet-owner.webp'
OUT = ROOT / 'public' / 'sprites'

HEAD_RATIO = 0.66  # 채팅 아바타용: 전신의 위쪽 2/3(얼굴·어깨)

# 자동 분리된 조각 번호(행 → 열) → 집사 아바타 id
OWNER_COMPONENTS = {0: 'glasses', 2: 'smile', 3: 'wave'}
# 붙어 있어 자동 분리가 안 되는 아바타는 (x0, y0, x1, y1) 직접 지정
OWNER_RECTS = {
    'backpack': (824, 12, 963, 250),
    'phone': (964, 12, 1102, 250),
    'happy': (1102, 12, 1238, 250),
}

# 이미지 버튼 (텍스트 포함): (x0, y0, x1, y1)
BUTTONS = {
    'btn-start': (24, 428, 280, 522),
    'btn-select': (281, 428, 536, 522),
    'btn-decide': (537, 428, 795, 522),
    'btn-back': (796, 428, 1044, 522),
}


# 하단 네비 아이콘(둥근 사각 판): sheet-owner.webp(1500×1000) 오른쪽의 홈·기록·도감 줄, (x0, y0, x1, y1)
NAV_PLATES = {
    'nav-plate-home': (1186, 539, 1289, 602),
    'nav-plate-book': (1289, 539, 1388, 602),
    'nav-plate-cat': (1388, 539, 1483, 602),
}

# sheet-owner.webp 에서 자르는 그 밖의 조각: 초록 새로고침 버튼, 테이프 붙은 메모 판(랜딩 안내문 배경)
ICON_BUTTONS = {
    'btn-refresh': (1336, 599, 1415, 669),
    'ui-note': (232, 638, 457, 792),
}


def trim(img: Image.Image) -> Image.Image:
    box = img.getchannel('A').point(lambda v: 255 if v > ALPHA_MIN else 0).getbbox()
    return img.crop(box) if box else img


def keep_largest(img: Image.Image) -> Image.Image:
    """가장 큰 덩어리만 남기고 배경 제거 때 남은 잔여 픽셀을 지운다 (버튼처럼 한 덩어리인 조각용)."""
    arr = np.array(img)
    labels, n = ndimage.label(arr[..., 3] > ALPHA_MIN)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
        arr[..., 3] = np.where(labels == int(np.argmax(sizes)) + 1, arr[..., 3], 0)
    return trim(Image.fromarray(arr))


def save_owner(name: str, sprite: Image.Image) -> None:
    sprite.save(OUT / f'owner-{name}.png')
    head = sprite.crop((0, 0, sprite.width, int(sprite.height * HEAD_RATIO)))
    trim(head).save(OUT / f'owner-{name}-head.png')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = load_transparent(SHEET)
    found, labels, fg = find_components(sheet)

    for index, name in OWNER_COMPONENTS.items():
        save_owner(name, crop_component(sheet, labels, fg, found[index]))
    for name, (x0, y0, x1, y1) in OWNER_RECTS.items():
        save_owner(name, trim(sheet.crop((x0, y0, x1, y1))))
    for name, (x0, y0, x1, y1) in BUTTONS.items():
        keep_largest(sheet.crop((x0, y0, x1, y1))).save(OUT / f'{name}.png')

    owner_sheet = load_transparent(SHEET_OWNER)
    for name, (x0, y0, x1, y1) in NAV_PLATES.items():
        keep_largest(owner_sheet.crop((x0, y0, x1, y1))).save(OUT / f'{name}.png')

    for name, (x0, y0, x1, y1) in ICON_BUTTONS.items():
        keep_largest(owner_sheet.crop((x0, y0, x1, y1))).save(OUT / f'{name}.png')

    for f in sorted(OUT.glob('owner-*.png')) + sorted(OUT.glob('btn-*.png')) + sorted(OUT.glob('nav-plate-*.png')):
        print(f.name, Image.open(f).size)


if __name__ == '__main__':
    main()
