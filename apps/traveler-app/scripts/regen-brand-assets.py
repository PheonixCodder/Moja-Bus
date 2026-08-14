from pathlib import Path
from PIL import Image

ROOT = Path(r"C:\dev\moja-buss\apps\traveler-app")
LOGO_DIR = ROOT / "assets" / "logo"
IMG_DIR = ROOT / "assets" / "images"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

WHITE = (255, 255, 255, 255)
CANVAS_BG = WHITE


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def flatten_black_to_white(img: Image.Image, thresh: int = 28) -> Image.Image:
    """Replace solid black backdrop pixels with white (for marks on black)."""
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                px[x, y] = (*CANVAS_BG[:3], 255)
                continue
            if r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (*CANVAS_BG[:3], 255)
    return out


def trim_non_bg(img: Image.Image, bg: tuple[int, int, int, int] = WHITE, thresh: int = 18) -> Image.Image:
    """Trim margins that match the canvas background."""
    px = img.load()
    w, h = img.size
    br, bg_, bb, _ = bg
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if abs(r - br) <= thresh and abs(g - bg_) <= thresh and abs(b - bb) <= thresh:
                continue
            if x < min_x:
                min_x = x
            if y < min_y:
                min_y = y
            if x > max_x:
                max_x = x
            if y > max_y:
                max_y = y
    if max_x < min_x:
        return img
    pad = 2
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)
    return img.crop((min_x, min_y, max_x + 1, max_y + 1))


def place_centered(canvas_size: int, content: Image.Image, fill_ratio: float) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), CANVAS_BG)
    cw, ch = content.size
    target = int(canvas_size * fill_ratio)
    scale = target / max(cw, ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = content.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (canvas_size - nw) // 2
    y = (canvas_size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def recolor_logo_for_white_bg(img: Image.Image) -> Image.Image:
    """Keep pink accents; turn near-white wordmark into dark ink for white bg."""
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            # keep brand pink / magenta
            if r > 140 and g < 120 and b > 80:
                continue
            # near-white wordmark ink -> dark charcoal on white
            if min(r, g, b) > 200:
                px[x, y] = (17, 17, 17, a)
    return out


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = img.convert("RGBA")
    out.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({out.size[0]}x{out.size[1]})")


def save_webp(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = img.convert("RGBA")
    out.save(path, "WEBP", quality=92, method=4)
    print(f"wrote {path.relative_to(ROOT)} ({out.size[0]}x{out.size[1]})")


def main() -> None:
    # Flatten black backdrops from prior black-theme exports, then trim content.
    raw_icon = load_rgba(LOGO_DIR / "moja-icon.png")
    icon_on_white = flatten_black_to_white(raw_icon)
    icon_src = trim_non_bg(icon_on_white, bg=WHITE)

    logo_path = LOGO_DIR / "moja-logo.png"
    raw_logo = load_rgba(logo_path)
    logo_on_white = flatten_black_to_white(raw_logo)
    logo_src = trim_non_bg(recolor_logo_for_white_bg(logo_on_white), bg=WHITE)
    print(f"trimmed icon content: {icon_src.size}, logo: {logo_src.size}")

    icon_size = 1024
    # Smaller launcher mark (~48%) so adaptive masks don't look oversized
    icon_1024 = place_centered(icon_size, icon_src, fill_ratio=0.48)
    adaptive_1024 = place_centered(icon_size, icon_src, fill_ratio=0.46)

    save_png(icon_1024, IMG_DIR / "icon.png")
    save_png(adaptive_1024, IMG_DIR / "adaptive-icon.png")

    save_png(icon_1024, LOGO_DIR / "android-chrome-512x512.png")
    save_png(place_centered(192, icon_src, 0.72), LOGO_DIR / "android-chrome-192x192.png")
    save_png(place_centered(180, icon_src, 0.72), LOGO_DIR / "apple-touch-icon.png")
    save_png(place_centered(32, icon_src, 0.85), IMG_DIR / "favicon.png")
    save_png(place_centered(32, icon_src, 0.85), LOGO_DIR / "favicon-32x32.png")
    save_png(place_centered(16, icon_src, 0.9), LOGO_DIR / "favicon-16x16.png")
    save_png(place_centered(512, icon_src, 0.78), LOGO_DIR / "moja-icon.png")

    # Splash asset: wide banner filled by wordmark on white
    splash_w = 1600
    lw, lh = logo_src.size
    target_w = int(splash_w * 0.92)
    scale = target_w / lw
    nw, nh = target_w, max(1, int(lh * scale))
    pad_y = int(nh * 0.55)
    splash_h = nh + pad_y * 2
    splash = Image.new("RGBA", (splash_w, splash_h), CANVAS_BG)
    logo_big = logo_src.resize((nw, nh), Image.Resampling.LANCZOS)
    splash.alpha_composite(logo_big, ((splash_w - nw) // 2, pad_y))
    save_png(splash, IMG_DIR / "splash.png")

    splash_draws = {
        "drawable-mdpi": 192,
        "drawable-hdpi": 288,
        "drawable-xhdpi": 384,
        "drawable-xxhdpi": 576,
        "drawable-xxxhdpi": 768,
    }
    for folder, size in splash_draws.items():
        save_png(place_centered(size, icon_src, 0.82), RES / folder / "splashscreen_logo.png")

    fg_sizes = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }
    for folder, size in fg_sizes.items():
        save_webp(place_centered(size, icon_src, 0.42), RES / folder / "ic_launcher_foreground.webp")
        full = place_centered(size, icon_src, 0.62)
        save_webp(full, RES / folder / "ic_launcher.webp")
        save_webp(full, RES / folder / "ic_launcher_round.webp")

    print("DONE")


if __name__ == "__main__":
    main()
