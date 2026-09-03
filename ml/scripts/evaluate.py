"""
Evaluates a trained checkpoint on the held-out test split and prints
per-class precision/recall/mAP50 — the numbers that belong in your
final report's evaluation section.

Usage:
    python ml/scripts/evaluate.py --weights ml/runs/defectflow/weights/best.pt
"""
import argparse
from pathlib import Path

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, type=Path)
    parser.add_argument("--data", type=Path, default=Path("ml/configs/defects.yaml"))
    args = parser.parse_args()

    model = YOLO(str(args.weights))
    metrics = model.val(data=str(args.data), split="test")

    print("\nPer-class mAP50:")
    for i, class_name in metrics.names.items():
        print(f"  {class_name}: {metrics.box.ap50[i]:.3f}")

    print(f"\nOverall mAP50:    {metrics.box.map50:.3f}")
    print(f"Overall mAP50-95: {metrics.box.map:.3f}")


if __name__ == "__main__":
    main()
