from ultralytics import YOLO
import onnxruntime as ort
import numpy as np
import os
import json
import shutil
import hashlib

def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

model = YOLO('yolov8n.pt')

# Train
results = model.train(
    data='ml/training/defectflow_4class/defects.yaml',
    epochs=20,
    patience=6,
    imgsz=512,
    batch=16,
    project='ml/runs/full',
    name='train',
    exist_ok=True,
    device='cpu',
    amp=True
)

print("Full training finished.")

# Evaluate
metrics = model.val()
mAP50 = metrics.box.map50
mAP50_95 = metrics.box.map

# Export ONNX
model.export(format='onnx', imgsz=512, opset=12, dynamic=False, half=False, simplify=True)
onnx_path = 'ml/runs/full/train/weights/best.onnx'

if not os.path.exists(onnx_path):
    print("ONNX export failed.")
    exit(1)

# Validate ONNX
import onnx
onnx_model = onnx.load(onnx_path)
onnx.checker.check_model(onnx_model)

session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name
input_shape = session.get_inputs()[0].shape
output_shape = session.get_outputs()[0].shape

print(f"Input shape: {input_shape}")
print(f"Output shape: {output_shape}")

if output_shape != [1, 8, 5376] and output_shape != (1, 8, 5376):
    print(f"FAILED output shape check: {output_shape}")
    exit(1)

# Save New ONNX safely
shutil.copy(onnx_path, 'defect_detector_new.onnx')
new_sha = get_sha256('defect_detector_new.onnx')

# Prepare metrics.json
with open('metrics.json', 'w') as f:
    json.dump({
        "mAP50": mAP50,
        "mAP50-95": mAP50_95,
        "per_class": metrics.box.maps.tolist() if hasattr(metrics.box.maps, 'tolist') else metrics.box.maps
    }, f, indent=2)

print(f"NEW SHA256: {new_sha}")
