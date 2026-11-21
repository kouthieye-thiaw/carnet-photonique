"""Convertit les rendus PNG (transparents) en WebP plus légers. Usage : uv run --with pillow python blender/to_webp.py"""
import glob, os
from PIL import Image
for f in glob.glob(os.path.join(os.path.dirname(__file__), "..", "assets", "img", "*.png")):
    im = Image.open(f)
    if max(im.size) > 1400:
        im.thumbnail((1400, 1400))
    out = f[:-4] + ".webp"
    im.save(out, "WEBP", quality=86, method=6)
    print(os.path.basename(out), os.path.getsize(out) // 1024, "ko")
