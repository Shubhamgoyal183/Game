# App icon + native splash images banata hai (Android res folder mein)
import glob, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
RES = os.path.join(HERE, "..", "android", "app", "src", "main", "res")
icon = Image.open(os.path.join(ROOT, "icons", "icon-512.png")).convert("RGBA")
mask = Image.open(os.path.join(ROOT, "icons", "maskable-512.png")).convert("RGBA")

# Launcher icons
for d, s in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    folder = os.path.join(RES, f"mipmap-{d}")
    icon.resize((s, s), Image.LANCZOS).save(os.path.join(folder, "ic_launcher.png"))
    # Gol icon
    m = Image.new("L", (s * 4, s * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, s * 4, s * 4], fill=255)
    r = mask.resize((s, s), Image.LANCZOS); r.putalpha(m.resize((s, s), Image.LANCZOS))
    r.save(os.path.join(folder, "ic_launcher_round.png"))
    # Adaptive icon ka foreground (108dp)
    fg = int(s * 108 / 48)
    mask.resize((fg, fg), Image.LANCZOS).save(os.path.join(folder, "ic_launcher_foreground.png"))

# Adaptive background ka rang
bg = os.path.join(RES, "values", "ic_launcher_background.xml")
open(bg, "w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#7C3AED</color>\n</resources>\n')

# Splash: andhera background + logo + naam
def font(sz, bold=True):
    for f in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
        p = os.path.join("C:/Windows/Fonts", f)
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def splash(w, h):
    img = Image.new("RGB", (w, h), (11, 12, 29))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    m = min(w, h)
    for i in range(30, 0, -1):
        a = int(5 * (31 - i) / 3)
        rr = m * 0.02 * i
        gd.ellipse([w / 2 - rr * 1.4, h * 0.44 - rr, w / 2 + rr * 1.4, h * 0.44 + rr], fill=(124, 58, 237, a))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    ic = int(m * 0.26)
    img.alpha_composite(icon.resize((ic, ic), Image.LANCZOS), (w // 2 - ic // 2, int(h * 0.44 - ic * 0.7)))
    d = ImageDraw.Draw(img)
    t1, t2 = font(int(m * 0.075)), font(int(m * 0.035), False)
    y = int(h * 0.44 + ic * 0.45)
    w1 = d.textlength("Game ", font=t1); w2 = d.textlength("Zone", font=t1)
    x = w / 2 - (w1 + w2) / 2
    d.text((x, y), "Game ", font=t1, fill=(245, 245, 255))
    d.text((x + w1, y), "Zone", font=t1, fill=(255, 204, 51))
    d.text((w / 2, y + int(m * 0.1)), "by Shubham Goyal", font=t2, fill=(199, 201, 240), anchor="ma")
    return img.convert("RGB")

n = 0
for f in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    w, h = Image.open(f).size
    splash(w, h).save(f)
    n += 1
print("icons done, splash images:", n)
