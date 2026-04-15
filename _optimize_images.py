"""Web-optimize all oversized images referenced in index.html.
- Creates _web.jpg version next to original
- Max 2000px on longest side (2x retina for 1000px display)
- JPG quality 85, black background for transparency
- Skips already-optimized files
"""
from PIL import Image
import os
import re
import sys

Image.MAX_IMAGE_PIXELS = None  # silence decompression warning

HTML_PATH = 'index.html'
MAX_DIM = 2000
QUALITY = 85
BG_COLOR = (10, 10, 15)  # near-black, matches slide bg

# Parse HTML for image/video references
with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all asset paths: src="assets/..."
refs = set(re.findall(r'src="(assets/images/[^"]+\.(?:jpe?g|png|PNG|JPG))"', html))
print(f'Found {len(refs)} image references in index.html')

# Files to optimize (oversized AND referenced)
targets = []
for ref in refs:
    if '_web.' in ref:
        continue
    p = ref  # relative to portfolio/
    if not os.path.exists(p):
        continue
    size_kb = os.path.getsize(p) // 1024
    try:
        im = Image.open(p)
        w, h = im.size
    except Exception as e:
        print(f'  skip {ref}: {e}')
        continue
    if size_kb > 300 or max(w, h) > MAX_DIM:
        targets.append((p, ref, size_kb, w, h))

print(f'{len(targets)} files to optimize')

total_before = 0
total_after = 0
created = []
replacements = {}  # old_ref -> new_ref

for p, ref, orig_kb, w, h in targets:
    # Generate _web.jpg path
    dirname, filename = os.path.split(p)
    base, _ext = os.path.splitext(filename)
    web_filename = base + '_web.jpg'
    web_p = os.path.join(dirname, web_filename)
    web_ref = ref.rsplit('.', 1)[0] + '_web.jpg'

    if os.path.exists(web_p):
        replacements[ref] = web_ref
        continue

    try:
        im = Image.open(p)
        # Handle transparency
        if im.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', im.size, BG_COLOR)
            if im.mode == 'P':
                im = im.convert('RGBA')
            bg.paste(im, mask=im.split()[-1] if im.mode == 'RGBA' else None)
            im = bg
        elif im.mode != 'RGB':
            im = im.convert('RGB')

        # Resize keeping aspect
        if max(w, h) > MAX_DIM:
            ratio = MAX_DIM / max(w, h)
            new_w = int(w * ratio)
            new_h = int(h * ratio)
            im = im.resize((new_w, new_h), Image.LANCZOS)

        im.save(web_p, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        new_kb = os.path.getsize(web_p) // 1024
        total_before += orig_kb
        total_after += new_kb
        created.append((ref, web_ref, orig_kb, new_kb))
        replacements[ref] = web_ref
        print(f'  OK {ref.split("/")[-1]}: {orig_kb}KB -> {new_kb}KB')
    except Exception as e:
        print(f'  ERR {ref}: {e}')

print(f'\nCreated {len(created)} _web files')
print(f'Total: {total_before/1024:.1f}MB -> {total_after/1024:.1f}MB ({100*(1-total_after/max(total_before,1)):.0f}% reduction)')

# Apply replacements to index.html
new_html = html
n_replaced = 0
for old, new in replacements.items():
    if old in new_html:
        new_html = new_html.replace(old, new)
        n_replaced += 1

if new_html != html:
    with open(HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f'Updated {n_replaced} references in index.html')
else:
    print('No HTML changes needed')
