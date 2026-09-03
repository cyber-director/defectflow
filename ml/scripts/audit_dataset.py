import json
from pathlib import Path

ML_DATASET = Path('ml/dataset')

classes = [0, 1, 2, 3]
class_names = ["spalling", "stagnant_water", "cracked_tiles", "paint_peeling"]

audit = {
    "total_images": {"train": 0, "val": 0, "test": 0},
    "positive_images": {c: {"train": 0, "val": 0, "test": 0} for c in classes},
    "box_counts": {c: {"train": 0, "val": 0, "test": 0} for c in classes},
    "errors": []
}

for split in ['train', 'val', 'test']:
    images_dir = ML_DATASET / 'images' / split
    labels_dir = ML_DATASET / 'labels' / split
    
    if not images_dir.exists(): continue
    
    for img in images_dir.glob('*.*'):
        audit["total_images"][split] += 1
        label_file = labels_dir / (img.stem + '.txt')
        
        if not label_file.exists():
            audit["errors"].append(f"Missing label for {img.name}")
            continue
        
        with open(label_file, 'r') as f:
            lines = f.read().strip().split('\n')
        
        found_classes = set()
        for line in lines:
            parts = line.strip().split()
            if not parts: continue
            if len(parts) != 5:
                audit["errors"].append(f"Malformed line in {label_file.name}: {line}")
                continue
            
            c = int(parts[0])
            if c not in classes:
                audit["errors"].append(f"Invalid class {c} in {label_file.name}")
                continue
            
            x, y, w, h = map(float, parts[1:])
            if not (0 <= x <= 1 and 0 <= y <= 1 and 0 <= w <= 1 and 0 <= h <= 1):
                audit["errors"].append(f"Invalid coords in {label_file.name}: {line}")
                continue
            
            found_classes.add(c)
            audit["box_counts"][c][split] += 1
        
        for c in found_classes:
            audit["positive_images"][c][split] += 1

print(json.dumps(audit, indent=2))
with open('ml/dataset_audit.json', 'w') as f:
    json.dump(audit, f, indent=2)

