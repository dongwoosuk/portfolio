"""Optimize Frit Pattern assets (2/17-2/20).
- JPG targets: 1500x1125 max, quality 85, progressive
- Gem Test PNG (massive 36614px wide) -> 1400x225 JPG
- Creates _web.jpg files and updates index.html references
"""
from PIL import Image
import os
import re

Image.MAX_IMAGE_PIXELS = None

HTML_PATH = 'index.html'
MAX_DIM = 1500
QUALITY = 85

# Gem Test gets special treatment (extreme aspect, tiny display target)
GEM_TEST_KEY = 'Gem Test.png'
GEM_TARGET_W = 1400
GEM_TARGET_H = 225

FRIT_DIR = 'assets/images/rir/04_frit_pattern'
BG_COLOR = (255, 255, 255)

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Find all frit pattern image refs in HTML
refs = set(re.findall(r'src="(' + re.escape(FRIT_DIR) + r'/[^"]+\.(?:jpe?g|png|PNG|JPG))"', html))
print(f'Found {len(refs)} Frit image references')

replacements = {}
total_before = 0
total_after = 0

for ref in sorted(refs):
    if '_web.' in ref:
        continue
    if not os.path.exists(ref):
        print(f'  SKIP (not found): {ref}')
        continue

    filename = os.path.basename(ref)
    dirname = os.path.dirname(ref)
    base, _ext = os.path.splitext(filename)
    web_filename = base + '_web.jpg'
    web_p = os.path.join(dirname, web_filename)
    web_ref = ref.rsplit('.', 1)[0] + '_web.jpg'

    orig_kb = os.path.getsize(ref) // 1024

    if os.path.exists(web_p):
        replacements[ref] = web_ref
        print(f'  EXISTS: {web_filename}')
        continue

    try:
        im = Image.open(ref)
        w, h = im.size
        # Flatten transparency
        if im.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', im.size, BG_COLOR)
            if im.mode == 'P':
                im = im.convert('RGBA')
            bg.paste(im, mask=im.split()[-1] if im.mode == 'RGBA' else None)
            im = bg
        elif im.mode != 'RGB':
            im = im.convert('RGB')

        # Special case: Gem Test
        if filename == GEM_TEST_KEY:
            im = im.resize((GEM_TARGET_W, GEM_TARGET_H), Image.LANCZOS)
        elif max(w, h) > MAX_DIM:
            ratio = MAX_DIM / max(w, h)
            im = im.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

        im.save(web_p, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        new_kb = os.path.getsize(web_p) // 1024
        total_before += orig_kb
        total_after += new_kb
        replacements[ref] = web_ref
        pct = 100 * (1 - new_kb / max(orig_kb, 1))
        print(f'  OK {filename:60s} {orig_kb:>6}KB -> {new_kb:>5}KB ({pct:>3.0f}%)')
    except Exception as e:
        print(f'  ERR {ref}: {e}')

print(f'\nImage total: {total_before/1024:.2f} MB -> {total_after/1024:.2f} MB ({100*(1-total_after/max(total_before,1)):.0f}% saved)')

# Apply replacements to index.html
new_html = html
n = 0
for old, new in replacements.items():
    if old in new_html:
        new_html = new_html.replace(old, new)
        n += 1

if new_html != html:
    with open(HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f'Updated {n} references in {HTML_PATH}')
else:
    print('No HTML changes needed')
