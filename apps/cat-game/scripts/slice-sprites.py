#!/usr/bin/env python3
"""assets/sprite-sheet.webp 에서 게임에 쓰는 스프라이트를 잘라 public/sprites/ 에 투명 PNG로 저장한다.

사용법: python3 apps/cat-game/scripts/slice-sprites.py   (Pillow, numpy, scipy 필요)
조각 번호는 시트를 알파 채널로 연결 성분 분리한 뒤 (행 → 열) 순으로 매긴 값이다.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / 'assets' / 'sprite-sheet.webp'
OUT = ROOT / 'public' / 'sprites'

ALPHA_MIN = 20
MERGE_ITERATIONS = 7
MIN_AREA = 500
ROW_BUCKET = 90

# 자동 분리된 조각 번호 → 파일명
COMPONENTS = {
    0: 'cat-idle',
    1: 'cat-happy',
    5: 'cat-curious',
    7: 'cat-back',
    8: 'cat-sleep',
    9: 'cat-scared',
    10: 'cat-excited',
    12: 'cat-think',
    15: 'cat-eat',
    20: 'cat-angry',
    21: 'cat-curled',
    22: 'item-fish',
    23: 'item-drumstick',
    24: 'item-can',
    25: 'item-magnifier',
    26: 'item-leaf',
    27: 'item-heart',
    28: 'item-star',
    29: 'item-sparkle',
    30: 'item-note',
    31: 'item-drop',
    32: 'item-bulb',
    33: 'item-scribble',
    34: 'fx-puff',
    65: 'fx-sparkle',
    66: 'fx-hearts',
    50: 'bubble-dots',
    51: 'bubble-alert',
    52: 'bubble-question',
    57: 'deco-grass',
    58: 'deco-flower',
    60: 'deco-bush',
    61: 'deco-stump',
    62: 'deco-fence',
    63: 'deco-sign',
}

# 타입별 프로필: 여러 조각을 합치거나(장난꾸러기: 고양이 + 음표) 같은 조각을 재사용한다
PROFILES = {
    'profile-timid': [19],
    'profile-playful': [17, 18],
    'profile-aloof': [14],
    'profile-glutton': [16],
    'profile-explorer': [12],
}

# 채팅 말풍선 아바타: 시트의 얼굴 아이콘 줄(주황·회색·흰색·삼색·초록 순)을 잘라 타입에 매핑
FACE_ROW = (660, 508, 1165, 622)  # x0, y0, x1, y1
FACES = ['face-glutton', 'face-timid', 'face-aloof', 'face-playful', 'face-explorer']

# 체력 하트: 시트의 하트 줄(빨강 ×3, 검정 ×1)에서 가득/빈 하트를 자른다
HEART_ROW = (1210, 428, 1470, 498)  # x0, y0, x1, y1
HEART_NAMES = {0: 'heart-full', 3: 'heart-empty'}

# 자동 분리가 어려운 조각은 (x0, y0, x1, y1) 직접 지정
MANUAL = {
    'icon-hunger': (1192, 506, 1243, 550),
    'icon-energy': (1192, 550, 1243, 590),
    'icon-affection': (1192, 590, 1243, 630),
    'ui-board': (28, 738, 420, 894),
    'nav-home': (866, 430, 937, 502),
    'nav-book': (946, 430, 1015, 502),
}


def trim(img: Image.Image) -> Image.Image:
    box = img.getchannel('A').point(lambda v: 255 if v > ALPHA_MIN else 0).getbbox()
    return img.crop(box) if box else img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET).convert('RGBA')
    fg = np.array(sheet)[..., 3] > ALPHA_MIN
    labels, _ = ndimage.label(ndimage.binary_dilation(fg, iterations=MERGE_ITERATIONS))

    found = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (y1 - y0) * (x1 - x0) >= MIN_AREA:
            found.append((y0, x0, y1, x1, i))
    found.sort(key=lambda r: (r[0] // ROW_BUCKET, r[1]))

    for index, name in COMPONENTS.items():
        y0, x0, y1, x1, label = found[index]
        mask = (labels[y0:y1, x0:x1] == label) & fg[y0:y1, x0:x1]
        piece = np.array(sheet.crop((x0, y0, x1, y1)))
        piece[..., 3] = np.where(mask, piece[..., 3], 0)
        trim(Image.fromarray(piece)).save(OUT / f'{name}.png')

    for name, indexes in PROFILES.items():
        canvas = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
        for index in indexes:
            y0, x0, y1, x1, label = found[index]
            mask = (labels == label) & fg
            part = np.array(sheet)
            part[..., 3] = np.where(mask, part[..., 3], 0)
            canvas.alpha_composite(Image.fromarray(part))
        trim(canvas).save(OUT / f'{name}.png')

    x0, y0, x1, y1 = FACE_ROW
    row_labels, _ = ndimage.label(fg[y0:y1, x0:x1])
    plates = []
    for i, sl in enumerate(ndimage.find_objects(row_labels), start=1):
        if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) > 2000:
            plates.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, i))
    plates.sort()
    assert len(plates) == len(FACES), f'얼굴 아이콘 {len(plates)}개 검출 (기대 {len(FACES)}개)'
    for name, (px0, py0, px1, py1, label) in zip(FACES, plates):
        piece = np.array(sheet.crop((x0 + px0, y0 + py0, x0 + px1, y0 + py1)))
        mask = row_labels[py0:py1, px0:px1] == label
        piece[..., 3] = np.where(mask, piece[..., 3], 0)
        trim(Image.fromarray(piece)).save(OUT / f'{name}.png')

    hx0, hy0, hx1, hy1 = HEART_ROW
    heart_labels, _ = ndimage.label(fg[hy0:hy1, hx0:hx1])
    hearts = sorted(
        (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, i)
        for i, sl in enumerate(ndimage.find_objects(heart_labels), start=1)
        if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) > 400
    )
    assert len(hearts) == 4, f'하트 {len(hearts)}개 검출 (기대 4개)'
    for index, name in HEART_NAMES.items():
        px0, py0, px1, py1, label = hearts[index]
        piece = np.array(sheet.crop((hx0 + px0, hy0 + py0, hx0 + px1, hy0 + py1)))
        piece[..., 3] = np.where(heart_labels[py0:py1, px0:px1] == label, piece[..., 3], 0)
        trim(Image.fromarray(piece)).save(OUT / f'{name}.png')

    for name, box in MANUAL.items():
        trim(sheet.crop(box)).save(OUT / f'{name}.png')

    for f in sorted(OUT.glob('*.png')):
        print(f.name, Image.open(f).size)


if __name__ == '__main__':
    main()
