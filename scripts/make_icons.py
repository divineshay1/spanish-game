"""Draws the app icons as 32x32 pixel art and scales them up with no blur.
Run: python3 scripts/make_icons.py
"""
from PIL import Image
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
LAV, PINK, BLUSH, CREAM, WHITE, STAR, PLUM, LILAC = (
    (179,153,245),(251,158,205),(252,180,219),(246,228,248),(255,247,252),(255,224,102),(107,79,168),(217,198,247))
BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]

def base(n=32, moon_scale=1.0):
    im = Image.new('RGB', (n, n))
    px = im.load()
    stops = [(0, LAV), (0.45, PINK), (0.8, BLUSH), (1, CREAM)]
    for y in range(n):
        t = y / (n - 1)
        i = 0
        while i < len(stops) - 2 and t > stops[i+1][0]: i += 1
        f = (t - stops[i][0]) / (stops[i+1][0] - stops[i][0])
        for x in range(n):
            th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
            px[x, y] = stops[i+1][1] if f > th else stops[i][1]
    # crescent moon
    r = 9 * moon_scale; cx, cy = n/2 - 1, n/2
    kx, ky, kr = cx + r*0.55, cy - r*0.35, r*0.85
    for y in range(n):
        for x in range(n):
            d = math.hypot(x+.5-cx, y+.5-cy); e = math.hypot(x+.5-kx, y+.5-ky)
            if d <= r and e >= kr:
                px[x, y] = CREAM if (d > r-1.2 or e < kr+0.9) else WHITE
    # sparkle
    sx, sy = int(n*0.72), int(n*0.3)
    for dx, dy, c in [(0,0,WHITE),(1,0,LILAC),(-1,0,LILAC),(0,1,LILAC),(0,-1,LILAC),(2,0,STAR),(-2,0,STAR),(0,2,STAR),(0,-2,STAR)]:
        px[sx+dx, sy+dy] = c
    for (x, y) in [(5,5),(25,22),(8,24),(27,8),(14,4)]:
        px[x, y] = WHITE
    return im

os.makedirs(OUT, exist_ok=True)
icon = base()
for size, name in [(192,'icon-192.png'),(512,'icon-512.png'),(180,'apple-touch-icon.png')]:
    icon.resize((size, size), Image.NEAREST).save(os.path.join(OUT, name))
base(32, 0.75).resize((512, 512), Image.NEAREST).save(os.path.join(OUT, 'icon-maskable-512.png'))
print('icons written to', os.path.abspath(OUT))
