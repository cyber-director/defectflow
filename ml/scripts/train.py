"""
Trains the defect detector using Ultralytics YOLOv8.

Usage:
    python ml/scripts/train.py --config ml/configs/train.yaml
"""
import argparse
from pathlib import Path

import yaml
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, type=Path)
    args = parser.parse_args()

    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    data_path = (args.config.parent / cfg["data"]).resolve()

    model = YOLO(cfg["model"])
    model.train(
        data=str(data_path),
        imgsz=cfg["imgsz"],
        epochs=cfg["epochs"],
        batch=cfg["batch"],
        patience=cfg.get("patience", 20),
        device=cfg.get("device", "cpu"),
        project=str((args.config.parent / cfg["project"]).resolve()),
        name=cfg["name"],
        seed=cfg.get("seed", 42),
    )

    print("\nTraining complete. Best weights:")
    print(f"  {(args.config.parent / cfg['project'] / cfg['name'] / 'weights' / 'best.pt').resolve()}")
    print("Next: python ml/scripts/export.py --weights <that path>")


if __name__ == "__main__":
    main()
