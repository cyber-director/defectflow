import os
import shutil
import zipfile
import random
from pathlib import Path

random.seed(42)

DOWNLOADS = Path('/home/pyxis-insta/Downloads')
ML_DATASET = Path('ml/dataset')

if ML_DATASET.exists():
    shutil.rmtree(ML_DATASET)

for split in ['train', 'val', 'test']:
    (ML_DATASET / 'images' / split).mkdir(parents=True, exist_ok=True)
    (ML_DATASET / 'labels' / split).mkdir(parents=True, exist_ok=True)

datasets = {
    'spalling': {'zip': DOWNLOADS / 'Spalling and exposed rebar.v1i.yolov8-obb.zip', 'map': {1: 0}, 'obb': True},
    'water': {'zip': DOWNLOADS / 'water.zip', 'map': {0: 1}, 'obb': False},
    'cracked': {'zip': DOWNLOADS / 'cracked.zip', 'map': {0: 2}, 'obb': False},
    'peeling': {'zip': DOWNLOADS / 'peeling.zip', 'map': {2: 3}, 'obb': False}
}

def obb_to_aabb(x1, y1, x2, y2, x3, y3, x4, y4):
    xs, ys = [x1, x2, x3, x4], [y1, y2, y3, y4]
    xmin, xmax = max(0.0, min(1.0, min(xs))), max(0.0, min(1.0, max(xs)))
    ymin, ymax = max(0.0, min(1.0, min(ys))), max(0.0, min(1.0, max(ys)))
    return xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, xmax - xmin, ymax - ymin

for ds_name, ds_info in datasets.items():
    print(f"Processing {ds_name}...")
    
    valid_samples = []
    
    with zipfile.ZipFile(ds_info['zip'], 'r') as z:
        for file in z.namelist():
            if file.endswith('.jpg') or file.endswith('.png') or file.endswith('.jpeg'):
                label_file = file.replace('images/', 'labels/').rsplit('.', 1)[0] + '.txt'
                
                try:
                    label_content = z.read(label_file).decode('utf-8')
                except KeyError:
                    continue
                
                lines = label_content.strip().split('\n')
                new_lines = []
                for line in lines:
                    parts = line.strip().split()
                    if not parts: continue
                    class_id = int(parts[0])
                    if class_id in ds_info['map']:
                        new_class = ds_info['map'][class_id]
                        if ds_info['obb']:
                            xc, yc, w, h = obb_to_aabb(*map(float, parts[1:9]))
                        else:
                            xc, yc, w, h = map(float, parts[1:5])
                        
                        xc, yc, w, h = [max(0.0, min(1.0, v)) for v in [xc, yc, w, h]]
                        new_lines.append(f"{new_class} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                
                if new_lines:
                    valid_samples.append((file, label_file, new_lines))
        
        # Shuffle and split
        random.shuffle(valid_samples)
        n = len(valid_samples)
        n_val = max(1, int(n * 0.15))
        n_test = max(1, int(n * 0.15))
        
        splits = {
            'val': valid_samples[:n_val],
            'test': valid_samples[n_val : n_val + n_test],
            'train': valid_samples[n_val + n_test:]
        }
        
        for split, samples in splits.items():
            for file, label_file, new_lines in samples:
                img_out = ML_DATASET / 'images' / split / f"{ds_name}_{Path(file).name}"
                lbl_out = ML_DATASET / 'labels' / split / f"{ds_name}_{Path(label_file).name}"
                
                with open(img_out, 'wb') as f:
                    f.write(z.read(file))
                with open(lbl_out, 'w') as f:
                    f.write('\n'.join(new_lines) + '\n')

print("Done preparing dataset!")
