"""
Splits a flat folder of labeled images (images/ + one YOLO-format .txt
label file per image, same stem) into train/val/test folders in the
layout ml/configs/defects.yaml expects.

Label format per line (YOLO):
    <class_index> <x_center> <y_center> <width> <height>
all normalized 0-1. class_index must match ml/configs/defects.yaml /
src/config/defects.ts's CLASS_INDEX (0=spalling, 1=stagnant_water,
2=cracked_tiles, 3=paint_peeling).

Usage:
    python ml/scripts/prepare_dataset.py \
        --images path/to/raw/images \
        --labels path/to/raw/labels \
        --out ml/dataset \
        --val-frac 0.15 --test-frac 0.15
"""
import argparse
import random
import shutil
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", required=True, type=Path)
    parser.add_argument("--labels", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--val-frac", type=float, default=0.15)
    parser.add_argument("--test-frac", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    image_files = sorted(p for p in args.images.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS)
    if not image_files:
        raise SystemExit(f"No images found in {args.images}")

    random.Random(args.seed).shuffle(image_files)

    n = len(image_files)
    n_val = max(1, int(n * args.val_frac))
    n_test = max(1, int(n * args.test_frac))
    splits = {
        "val": image_files[:n_val],
        "test": image_files[n_val : n_val + n_test],
        "train": image_files[n_val + n_test :],
    }

    for split, files in splits.items():
        (args.out / "images" / split).mkdir(parents=True, exist_ok=True)
        (args.out / "labels" / split).mkdir(parents=True, exist_ok=True)

        missing_labels = 0
        for img_path in files:
            label_path = args.labels / (img_path.stem + ".txt")
            shutil.copy2(img_path, args.out / "images" / split / img_path.name)
            if label_path.exists():
                shutil.copy2(label_path, args.out / "labels" / split / label_path.name)
            else:
                missing_labels += 1

        print(f"{split}: {len(files)} images" + (f" ({missing_labels} missing labels!)" if missing_labels else ""))


if __name__ == "__main__":
    main()
