import torch
from ultralytics import YOLO
import onnx
import onnxruntime as ort
import numpy as np
import os
import shutil

model = YOLO('ml/runs/smoke_test/weights/best.pt')

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
