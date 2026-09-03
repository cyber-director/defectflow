"""
Exports a trained checkpoint to ONNX at the fixed 512x512 input size
src/lib/inference/preprocess.ts assumes, with a static (non-dynamic)
input shape — required for onnxruntime-web in the browser.

Usage:
    python ml/scripts/export.py --weights ml/runs/defectflow/weights/best.pt
"""
import argparse
from pathlib import Path

from ultralytics import YOLO

MODEL_INPUT_SIZE = 512  # must match src/lib/inference/preprocess.ts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, type=Path)
    parser.add_argument("--opset", type=int, default=12)
    args = parser.parse_args()

    model = YOLO(str(args.weights))
    exported_path = model.export(
        format="onnx",
        imgsz=MODEL_INPUT_SIZE,
        opset=args.opset,
        simplify=True,
        dynamic=False,  # fixed shape — do not change without also updating preprocess.ts/postprocess.ts
    )

    print(f"\nExported: {exported_path}")
    print("Next:")
    print(f"  cp {exported_path} models/defect_detector.onnx")
    print("  npm run model:sync")
    print(
        "\nIf your export doesn't produce a [1, 4+numClasses, numBoxes] output "
        "(e.g. a different architecture, or nms=True at export time), see the "
        "assumption documented at the top of src/lib/inference/postprocess.ts."
    )


if __name__ == "__main__":
    main()
