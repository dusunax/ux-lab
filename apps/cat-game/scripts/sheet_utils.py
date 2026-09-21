"""배경이 투명한 스프라이트 시트를 불러와 알파를 정리하고 조각을 분리하는 공용 함수."""
import numpy as np
from PIL import Image
from scipy import ndimage

ALPHA_MIN = 20            # 이 값 이하는 배경(가장자리 잔상 포함)으로 본다
ALPHA_SOLID = 240         # 이 값 이상은 완전 불투명으로 올린다 (손실 압축으로 252~254로 저장돼 있음)
MERGE_ITERATIONS = 5
MIN_AREA = 500
ROW_BUCKET = 90


def load_transparent(path) -> Image.Image:
    """알파가 낮은 잔상 픽셀은 지우고, 사실상 불투명한 픽셀은 완전 불투명으로 맞춘다."""
    img = np.array(Image.open(path).convert('RGBA'))
    alpha = img[..., 3]
    alpha = np.where(alpha <= ALPHA_MIN, 0, np.where(alpha >= ALPHA_SOLID, 255, alpha))
    img[..., 3] = alpha
    # 완전 투명한 픽셀의 색이 가장자리에 번지지 않도록 흰색 대신 0으로 맞춘다
    img[alpha == 0, :3] = 0
    return Image.fromarray(img)


def find_components(img: Image.Image):
    """(y0, x0, y1, x1, label) 목록(행 → 열 순)과 라벨 배열, 전경 마스크를 돌려준다."""
    fg = np.array(img)[..., 3] > ALPHA_MIN
    labels, _ = ndimage.label(ndimage.binary_dilation(fg, iterations=MERGE_ITERATIONS))
    found = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (y1 - y0) * (x1 - x0) >= MIN_AREA:
            found.append((y0, x0, y1, x1, i))
    found.sort(key=lambda r: (r[0] // ROW_BUCKET, r[1]))
    return found, labels, fg


def crop_component(img: Image.Image, labels, fg, box) -> Image.Image:
    y0, x0, y1, x1, label = box
    mask = (labels[y0:y1, x0:x1] == label) & fg[y0:y1, x0:x1]
    piece = np.array(img.crop((x0, y0, x1, y1)))
    piece[..., 3] = np.where(mask, piece[..., 3], 0)
    out = Image.fromarray(piece)
    bbox = out.getchannel('A').point(lambda v: 255 if v > ALPHA_MIN else 0).getbbox()
    return out.crop(bbox) if bbox else out
