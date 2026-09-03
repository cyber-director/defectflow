import torch
from ultralytics import YOLO
import onnx
import onnxruntime as ort
import numpy as np
import os
import shutil

# Make absolute path for dataset YAML
dataset_yaml = os.path.abspath('ml/configs/train.yaml')

# We need to make sure train.yaml has correct paths. Let's rewrite it.
with open(dataset_yaml, 'w') as f:
    f.write(f"""
path: {os.path.abspath('ml/dataset')}
train: images/train
val: images/val
test: images/test

names:
  0: spalling
  1: stagnant_water
  2: cracked_tiles
  3: paint_peeling
""")

model = YOLO('yolov8n.pt')

print("Running 1-epoch smoke test...")
results = model.train(
    data=dataset_yaml,
    epochs=1,
    imgsz=512,
    batch=16,
    seed=42,
    project='ml/runs',
    name='smoke_test',
    exist_ok=True
)

print("Exporting to ONNX...")
onnx_path = model.export(format='onnx', imgsz=512, dynamic=False, half=False, opset=12)

print(f"Checking ONNX model at {onnx_path}...")
onnx_model = onnx.load(onnx_path)
onnx.checker.check_model(onnx_model)

print("Running dummy inference with ONNX Runtime...")
sess = ort.InferenceSession(onnx_path)
input_name = sess.get_inputs()[0].name
input_shape = sess.get_inputs()[0].shape
output_shape = sess.get_outputs()[0].shape

print(f"Input Name: {input_name}, Shape: {input_shape}")
print(f"Output Shape: {output_shape}")

assert output_shape[1] == 8, f"Expected 8 channels (4 coords + 4 classes), got {output_shape[1]}"

dummy_input = np.random.randn(1, 3, 512, 512).astype(np.float32)
out = sess.run(None, {input_name: dummy_input})
print(f"Successfully ran dummy input, output shape: {out[0].shape}")

print("Smoke test PASSED!")
