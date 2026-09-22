"""
public/backgrounds의 큰 배경 WebP를 재인코딩해 용량을 줄인다.
원본 해상도는 유지하고(각 배경이 실제 CSS에서 cover/커버되는 크기가 커서 다운스케일은 하지 않는다),
quality=82(웹에서 통상 '육안상 손실 없음'으로 보는 값), method=6(최고 압축 탐색)로 다시 인코딩한다.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BACKGROUNDS = ROOT / "public" / "backgrounds"
QUALITY = 82


def optimize(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    img = Image.open(path)
    img.load()
    img.save(path, format="WEBP", quality=QUALITY, method=6)
    after = path.stat().st_size
    return before, after


def main() -> None:
    total_before = total_after = 0
    for path in sorted(BACKGROUNDS.glob("*.webp")):
        before, after = optimize(path)
        total_before += before
        total_after += after
        print(f"  {path.name}: {before:,} -> {after:,} ({(1 - after / before) * 100:.0f}% 감소)")
    print(f"\n총합: {total_before:,} -> {total_after:,} bytes ({(1 - total_after / total_before) * 100:.1f}% 감소)")


if __name__ == "__main__":
    main()
