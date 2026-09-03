import torch
from ultralytics import YOLO
import os
import json
import hashlib

model = YOLO('yolov8n.pt')

dataset_yaml = os.path.abspath('ml/configs/train.yaml')

results = model.train(
    data=dataset_yaml,
    epochs=3,
    imgsz=512,
    batch=16,
    seed=42,
    project='ml/runs',
    name='full_train_fast',
    exist_ok=True
)

onnx_path = model.export(format='onnx', imgsz=512, dynamic=False, half=False, opset=12)

# Also generate the required metadata.json
def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

import datetime
metadata = {
    "model_family": "YOLOv8n",
    "input_size": "512x512",
    "exact_class_order": {
        0: "spalling",
        1: "stagnant_water",
        2: "cracked_tiles",
        3: "paint_peeling"
    },
    "sha256_onnx": get_sha256(onnx_path),
    "training_date": datetime.datetime.now().isoformat(),
    "training_sources": [
        "Spalling and exposed rebar.v1i.yolov8-obb.zip",
        "water.zip",
        "cracked.zip",
        "peeling.zip"
    ],
    "onnx_opset": 12,
    "dynamic": False,
    "builtInNms": False,
    "validation_metrics": {
        "mAP50": float(results.box.map50),
        "mAP50-95": float(results.box.map)
    },
    "known_limitations": "Trained for only 3 epochs due to time constraints."
}

with open('ml/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

metrics = {
    "mAP50": float(results.box.map50),
    "mAP50-95": float(results.box.map),
    "classes": results.names
}
with open('ml/metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

import shutil
shutil.copy(onnx_path, 'defect_detector.onnx')
shutil.copy('ml/runs/full_train_fast/weights/best.pt', 'best.pt')

print("Finished fast full training and export!")
