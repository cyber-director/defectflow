import os
import shutil
import random
from pathlib import Path

random.seed(42)

TARGET = Path('ml/training/defectflow_4class')
if TARGET.exists():
    shutil.rmtree(TARGET)

for split in ['train', 'val', 'test']:
    (TARGET / 'images' / split).mkdir(parents=True, exist_ok=True)
    (TARGET / 'labels' / split).mkdir(parents=True, exist_ok=True)

sources = [
    {'name': 'spalling', 'dir': 'ml/datasets/spalling', 'map': {1: 0}},
    {'name': 'water', 'dir': 'ml/datasets/water', 'map': {0: 1}},
    {'name': 'cracked', 'dir': 'ml/datasets/cracked', 'map': {0: 2}},
    {'name': 'peeling', 'dir': 'ml/datasets/peeling', 'map': {2: 3}}
]

def get_aabb(pts):
    # pts is [x1, y1, x2, y2, ...]
    xs = pts[0::2]
    ys = pts[1::2]
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    return xmin + (xmax-xmin)/2, ymin + (ymax-ymin)/2, xmax-xmin, ymax-ymin

counts = {'spalling': 0, 'water': 0, 'cracked': 0, 'peeling': 0}

for src in sources:
    print(f"Processing {src['name']}...")
    valid_samples = []
    
    img_dirs = []
    for split in ['train', 'valid', 'val', 'test']:
        for d in [Path(src['dir']) / split / 'images', Path(src['dir']) / 'images' / split]:
            if d.exists():
                img_dirs.extend(d.glob('*.jpg'))
                img_dirs.extend(d.glob('*.png'))
                img_dirs.extend(d.glob('*.jpeg'))
            
    if not img_dirs:
        for ext in ['*.jpg', '*.png', '*.jpeg']:
            img_dirs.extend(Path(src['dir']).rglob(ext))
        
    for img_path in img_dirs:
        parts = list(img_path.parts)
        if 'images' in parts:
            parts[parts.index('images')] = 'labels'
            lbl_path = Path(*parts).with_suffix('.txt')
        else:
            lbl_path = img_path.with_suffix('.txt')
            
        if not lbl_path.exists():
            continue
            
        with open(lbl_path, 'r') as f:
            lines = f.read().strip().split('\n')
            
        new_lines = []
        for line in lines:
            pts = line.strip().split()
            if not pts: continue
            c_id = int(pts[0])
            if c_id in src['map']:
                new_c = src['map'][c_id]
                coords = list(map(float, pts[1:]))
                if len(coords) < 4:
                    continue # Invalid
                if len(coords) == 4:
                    # Already cx, cy, w, h
                    xc, yc, w, h = coords
                else:
                    # Polygon or OBB -> convert to AABB
                    xc, yc, w, h = get_aabb(coords)
                    
                xc, yc, w, h = [max(0.0, min(1.0, v)) for v in [xc, yc, w, h]]
                new_lines.append(f"{new_c} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                
        if new_lines:
            valid_samples.append((img_path, new_lines))
            
    random.shuffle(valid_samples)
    if len(valid_samples) > 1000:
        valid_samples = valid_samples[:1000]
        
    n = len(valid_samples)
    n_val = max(1, int(n * 0.15))
    n_test = max(1, int(n * 0.15))
    
    splits = {
        'val': valid_samples[:n_val],
        'test': valid_samples[n_val : n_val+n_test],
        'train': valid_samples[n_val+n_test:]
    }
    
    for split_name, samples in splits.items():
        for img_p, lines in samples:
            out_img = TARGET / 'images' / split_name / f"{src['name']}_{img_p.name}"
            out_lbl = TARGET / 'labels' / split_name / f"{src['name']}_{img_p.stem}.txt"
            shutil.copy(img_p, out_img)
            with open(out_lbl, 'w') as f:
                f.write('\n'.join(lines) + '\n')
            counts[src['name']] += 1

print(f"Dataset compiled: {counts}")

yaml_content = """path: /home/pyxis-insta/Downloads/defectflow-complete(3)/defectflow-complete (Copy)/ml/training/defectflow_4class
train: images/train
val: images/val
test: images/test

names:
  0: spalling
  1: stagnant_water
  2: cracked_tiles
  3: paint_peeling
"""
with open(TARGET / 'defects.yaml', 'w') as f:
    f.write(yaml_content)
    
print("YAML created.")
