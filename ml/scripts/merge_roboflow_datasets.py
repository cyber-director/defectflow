"""
Merges one or more Roboflow YOLOv8-format exports into the unified
4-class dataset structure ml/configs/defects.yaml expects, remapping
each donor dataset's own class names onto DefectFlow's global scheme:

    0 = spalling
    1 = stagnant_water
    2 = cracked_tiles
    3 = paint_peeling

Each donor dataset can be multi-class — you tell this script which of
ITS class names corresponds to which DefectFlow class, and every other
class in that donor is dropped (images that end up with none of the
wanted classes are skipped entirely, so unrelated labeled objects never
leak into your dataset). Run it once per donor dataset; images
accumulate in --out across runs, so downloading four single-purpose
datasets (one per defect) just means running this script four times.

Usage (a donor with classes ["Rebar","crack","spall"] where only
"spall" is wanted, mapped onto DefectFlow's spalling class):

    python ml/scripts/merge_roboflow_datasets.py \
        --source path/to/concrete_export --map spall:spalling \
        --out ml/dataset

A donor can map more than one of its classes at once, e.g. if it
already separates "cracked_tile" and "tile_delamination" and you want
both folded into cracked_tiles:

    --map cracked_tile:cracked_tiles tile_delamination:cracked_tiles
"""
import argparse
import shutil
from pathlib import Path

import yaml

DEFECTFLOW_CLASSES = {"spalling": 0, "stagnant_water": 1, "cracked_tiles": 2, "paint_peeling": 3}
# Roboflow exports use "valid"; DefectFlow's pipeline (and Ultralytics'
# convention) uses "val".
SPLIT_ALIASES = {"train": "train", "valid": "val", "val": "val", "test": "test"}


def parse_mapping(pairs):
    mapping = {}
    for pair in pairs:
        if ":" not in pair:
            raise SystemExit(f"--map values must look like SourceClassName:defectflow_class, got: {pair}")
        source_name, target = pair.split(":", 1)
        if target not in DEFECTFLOW_CLASSES:
            raise SystemExit(f"'{target}' isn't a DefectFlow class. Use one of: {list(DEFECTFLOW_CLASSES)}")
        mapping[source_name] = target
    return mapping


def find_split_dirs(source: Path):
    """Roboflow exports typically look like <source>/train/images,
    <source>/valid/images, <source>/test/images."""
    found = {}
    for child in source.iterdir():
        if child.is_dir():
            normalized = SPLIT_ALIASES.get(child.name.lower())
            if normalized and (child / "images").is_dir():
                found[normalized] = child
    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path, help="Roboflow export folder")
    parser.add_argument(
        "--map",
        required=True,
        nargs="+",
        help='One or more "SourceClassName:defectflow_class" pairs, e.g. spall:spalling',
    )
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    mapping = parse_mapping(args.map)

    data_yaml = args.source / "data.yaml"
    if not data_yaml.exists():
        raise SystemExit(f"No data.yaml found in {args.source} — is this a Roboflow YOLOv8 export?")
    source_names = yaml.safe_load(data_yaml.read_text())["names"]

    index_map = {i: DEFECTFLOW_CLASSES[mapping[name]] for i, name in enumerate(source_names) if name in mapping}
    if not index_map:
        raise SystemExit(f"None of {list(mapping)} matched this dataset's classes: {source_names}")

    splits = find_split_dirs(args.source)
    if not splits:
        raise SystemExit(f"Couldn't find train/valid/test folders under {args.source}")

    prefix = args.source.name
    for split, split_dir in splits.items():
        images_out = args.out / "images" / split
        labels_out = args.out / "labels" / split
        images_out.mkdir(parents=True, exist_ok=True)
        labels_out.mkdir(parents=True, exist_ok=True)

        images_in = split_dir / "images"
        labels_in = split_dir / "labels"

        kept = 0
        for img_path in images_in.iterdir():
            if img_path.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue

            label_path = labels_in / f"{img_path.stem}.txt"
            remapped_lines = []
            if label_path.exists():
                for line in label_path.read_text().splitlines():
                    parts = line.split()
                    if not parts:
                        continue
                    src_class = int(parts[0])
                    if src_class in index_map:
                        parts[0] = str(index_map[src_class])
                        remapped_lines.append(" ".join(parts))

            if not remapped_lines:
                continue  # none of the classes we want appear in this image

            new_stem = f"{prefix}_{img_path.stem}"
            shutil.copy2(img_path, images_out / f"{new_stem}{img_path.suffix}")
            (labels_out / f"{new_stem}.txt").write_text("\n".join(remapped_lines) + "\n")
            kept += 1

        print(f"[{split}] {prefix}: kept {kept} images with a mapped class")

    print(f"\nMerged into {args.out}. Run this script again for each additional donor dataset.")


if __name__ == "__main__":
    main()
