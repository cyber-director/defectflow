import json
from pathlib import Path

TARGET = Path('ml/training/defectflow_4class')
classes = ['spalling', 'stagnant_water', 'cracked_tiles', 'paint_peeling']

audit = {
    "total_images": {"train": 0, "val": 0, "test": 0},
    "classes": {
        c: {"train": {"images": 0, "boxes": 0}, "val": {"images": 0, "boxes": 0}, "test": {"images": 0, "boxes": 0}}
        for c in classes
    }
}

for split in ['train', 'val', 'test']:
    lbl_dir = TARGET / 'labels' / split
    if not lbl_dir.exists(): continue
    for lbl_file in lbl_dir.glob('*.txt'):
        audit["total_images"][split] += 1
        
        with open(lbl_file, 'r') as f:
            lines = f.read().strip().split('\n')
            
        found_classes = set()
        for line in lines:
            pts = line.strip().split()
            if not pts: continue
            c_id = int(pts[0])
            c_name = classes[c_id]
            audit["classes"][c_name][split]["boxes"] += 1
            found_classes.add(c_name)
            
        for c_name in found_classes:
            audit["classes"][c_name][split]["images"] += 1

with open('dataset_audit.json', 'w') as f:
    json.dump(audit, f, indent=2)

print("Audit complete:")
for c in classes:
    t = audit["classes"][c]["train"]["images"]
    v = audit["classes"][c]["val"]["images"]
    te = audit["classes"][c]["test"]["images"]
    print(f"{c:15s} | train: {t} | val: {v} | test: {te}")
