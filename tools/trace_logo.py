import os, potrace, numpy as np
from PIL import Image

HOME = os.path.expanduser('~')
SRC  = os.path.join(HOME, 'Downloads', 'logoDark.png')
OUT  = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
os.makedirs(OUT, exist_ok=True)
NAVY = '#1E1353'

im = Image.open(SRC).convert('RGBA')
W, H = im.size
alpha = np.array(im.split()[-1])
bmp = alpha > 128                          # filled = opaque pixels

def trace_to_path(mask):
    bitmap = potrace.Bitmap(mask)
    path = bitmap.trace(turdsize=2, alphamax=1.0, opttolerance=0.2)
    d = []
    for curve in path:
        s = curve.start_point
        d.append(f'M{s.x:.2f} {s.y:.2f}')
        for seg in curve:
            e = seg.end_point
            if seg.is_corner:
                c = seg.c
                d.append(f'L{c.x:.2f} {c.y:.2f}L{e.x:.2f} {e.y:.2f}')
            else:
                c1 = seg.c1; c2 = seg.c2
                d.append(f'C{c1.x:.2f} {c1.y:.2f} {c2.x:.2f} {c2.y:.2f} {e.x:.2f} {e.y:.2f}')
        d.append('Z')
    return ''.join(d)

def bbox(mask):
    ys, xs = np.where(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()

def write_full(name, mask):
    x0,y0,x1,y1 = bbox(mask)
    sub = mask[y0:y1+1, x0:x1+1]
    d = trace_to_path(sub)
    w, h = x1-x0+1, y1-y0+1
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
           f'fill="currentColor" role="img" aria-label="{name}">'
           f'<path fill-rule="evenodd" d="{d}"/></svg>')
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(svg)
    print(name, 'viewBox', w, h, 'bytes', len(svg))
    return (x0,y0,x1,y1), d

# 1) Full faithful logo (symbol + "molonion"), trimmed to ink
write_full('molonion.svg', bmp)

# 2) Symbol only  (columns up to the symbol/wordmark gap at ~489)
SYM_END = 540
write_full('molonion-mark.svg', bmp[:, :SYM_END])

# 3) POS variant: symbol + "moloni" (drop trailing "on" after the wide gap ~2487)
MOLONI_END = 2500
crop = bmp[:, :MOLONI_END]
x0,y0,x1,y1 = bbox(crop)
sub = crop[y0:y1+1, x0:x1+1]
dpath = trace_to_path(sub)
w, h = x1-x0+1, y1-y0+1
# badge geometry, vertically centered on the wordmark, to the right of "moloni"
bh = int(h*0.46); bw = int(bh*2.05); gap = int(h*0.10)
bx = w + gap; by = (h-bh)//2; rad = int(bh*0.22)
fs = int(bh*0.62); tx = bx+bw/2; ty = by+bh/2
TOTW = bx+bw
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTW} {h}" role="img" aria-label="moloni POS">'
       f'<path fill="currentColor" fill-rule="evenodd" d="{dpath}"/>'
       f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="{rad}" fill="#5b5bf0"/>'
       f'<text x="{tx:.0f}" y="{ty:.0f}" text-anchor="middle" dominant-baseline="central" '
       f'font-family="\'Red Hat Display\',system-ui,sans-serif" font-weight="700" '
       f'font-size="{fs}" letter-spacing="{fs*0.06:.0f}" fill="#fff">POS</text></svg>')
open(os.path.join(OUT,'molonion-pos.svg'),'w',encoding='utf-8').write(svg)
print('molonion-pos.svg viewBox', TOTW, h, 'bytes', len(svg))
