from PIL import Image
import os

base = 'assets/images/'
oversized = []
for root, dirs, files in os.walk(base):
    for f in files:
        if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        if '_web.' in f.lower():
            continue
        p = os.path.join(root, f)
        size_kb = os.path.getsize(p) // 1024
        try:
            im = Image.open(p)
            w, h = im.size
        except Exception:
            continue
        if size_kb > 500 or max(w, h) > 2500:
            rel = os.path.relpath(p, base).replace(os.sep, '/')
            oversized.append((size_kb, w, h, rel))

oversized.sort(key=lambda x: -x[0])
total = sum(x[0] for x in oversized)
print(f'{len(oversized)} oversized files, total {total/1024:.1f}MB')
for s, w, h, r in oversized:
    print(f'  {s:>6}KB  {w}x{h}  {r}')
