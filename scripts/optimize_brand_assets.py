from pathlib import Path
from PIL import Image

project = Path("/home/ubuntu/together-daily")
source = project / "assets/images/icon.png"
targets = [
    source,
    project / "assets/images/splash-icon.png",
    project / "assets/images/favicon.png",
    project / "assets/images/android-icon-foreground.png",
]

with Image.open(source) as image:
    optimized = image.convert("RGBA")
    optimized.thumbnail((768, 768), Image.Resampling.LANCZOS)
    for target in targets:
        optimized.save(target, format="PNG", optimize=True, compress_level=9)
