"""Make the web versions of the background photos used by the frontend.

Usage (needs Pillow: pip install pillow):
    python tools/optimize_images.py path/to/photo.jpg paving-sunset

Writes frontend/public/images/<name>-{640,1280,1920,2560}.{webp,jpg}.
Then update the width/height (at 1280 px wide) in frontend/components/ResponsivePicture.tsx if the aspect changed.
"""
import sys
from pathlib import Path

from PIL import Image

WIDTHS = (640, 1280, 1920, 2560)
OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images"


def main(source: str, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGB")
    for width in WIDTHS:
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.LANCZOS)
        resized.save(OUT / f"{name}-{width}.webp", "WEBP", quality=72, method=6)
        resized.save(OUT / f"{name}-{width}.jpg", "JPEG", quality=74, optimize=True, progressive=True)
        print(f"{name}-{width}: {width}x{height}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
