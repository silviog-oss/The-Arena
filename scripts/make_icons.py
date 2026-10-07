"""Render The Arena logo to PNG icons + iOS splash screens (Pillow only).
Geometry mirrors public/logo.svg (100x100 viewBox)."""
from PIL import Image, ImageDraw, ImageFilter
import os

BG = (7, 8, 13)
C1, C2 = (110, 168, 255), (166, 107, 255)
OUT = os.path.join(os.path.dirname(__file__), '..', 'public')

def gradient(size):
    g = Image.new('RGB', (size, size))
    px = g.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(int(C1[i] + (C2[i] - C1[i]) * t) for i in range(3))
    return g

def line(d, p1, p2, w):
    d.line([p1, p2], fill=255, width=int(w))
    r = w / 2
    for (x, y) in (p1, p2):
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)

def mark_mask(size, scale=1.0):
    """White-on-black mask of the mark, drawn at 4x then downsampled."""
    S = size * 4
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    k = S / 100 * scale
    o = S / 2 - 50 * k  # center offset
    P = lambda x, y: (o + x * k, o + y * k)
    def ring(r, w, alpha=255):
        cx, cy = P(50, 50)
        d.ellipse([cx - r * k, cy - r * k, cx + r * k, cy + r * k], outline=alpha, width=max(1, int(w * k)))
    ring(38 + 2.25, 4.5)
    ring(30 + 0.6, 1.2, 115)
    line(d, P(33, 68), P(50, 32), 6.5 * k)
    line(d, P(50, 32), P(67, 68), 6.5 * k)
    line(d, P(42, 56), P(58, 56), 5 * k)
    return m.resize((size, size), Image.LANCZOS)

def icon(size, scale=1.0, rounded=False, glow=True):
    img = Image.new('RGB', (size, size), BG)
    # subtle radial glow
    if glow:
        g = Image.new('L', (size, size), 0)
        gd = ImageDraw.Draw(g)
        r = size * 0.42 * scale
        gd.ellipse([size/2 - r, size/2 - r, size/2 + r, size/2 + r], fill=70)
        g = g.filter(ImageFilter.GaussianBlur(size * 0.12))
        img = Image.composite(Image.new('RGB', (size, size), (60, 60, 160)), img, g)
    mask = mark_mask(size, scale)
    if glow:
        halo = mask.filter(ImageFilter.GaussianBlur(size * 0.02)).point(lambda v: int(v * 0.6))
        img = Image.composite(gradient(size), img, halo)
    img = Image.composite(gradient(size), img, mask)
    if rounded:
        r = Image.new('L', (size * 4, size * 4), 0)
        ImageDraw.Draw(r).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=size * 4 * 0.22, fill=255)
        r = r.resize((size, size), Image.LANCZOS)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), r)
        return out
    return img

os.makedirs(os.path.join(OUT, 'icons'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'splash'), exist_ok=True)
icon(192).save(os.path.join(OUT, 'icons/icon-192.png'))
icon(512).save(os.path.join(OUT, 'icons/icon-512.png'))
icon(512, scale=0.72).save(os.path.join(OUT, 'icons/maskable-512.png'))  # safe zone
icon(180).save(os.path.join(OUT, 'icons/apple-touch-icon.png'))         # iOS rounds it
icon(32, glow=False).save(os.path.join(OUT, 'favicon.png'))
icon(1024, rounded=True).save(os.path.join(OUT, 'icons/logo-1024.png'))
# Monochrome badge for Android notification bar
b = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
b.putalpha(mark_mask(96, 1.15))
white = Image.new('RGBA', (96, 96), (255, 255, 255, 255))
white.putalpha(mark_mask(96, 1.15))
white.save(os.path.join(OUT, 'icons/badge-96.png'))

# iOS splash screens: logo + wordmark-free (text rendering needs fonts) centered
for w, h in [(1290, 2796), (1179, 2556), (1170, 2532), (1284, 2778), (1125, 2436), (828, 1792), (750, 1334)]:
    s = Image.new('RGB', (w, h), BG)
    size = int(w * 0.36)
    s.paste(icon(size), ((w - size) // 2, (h - size) // 2 - int(h * 0.04)))
    s.save(os.path.join(OUT, f'splash/splash-{w}x{h}.png'), optimize=True)
print('icons + splash generated')
