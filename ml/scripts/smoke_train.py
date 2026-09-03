from ultralytics import YOLO
import onnxruntime as ort
import numpy as np
import os

model = YOLO('yolov8n.pt')

results = model.train(
    data='ml/training/defectflow_4class/defects.yaml',
    epochs=1,
    imgsz=512,
    batch=16,
    project='ml/runs/smoke',
    name='train',
    exist_ok=True,
    device='cpu'
)

print("Training finished.")

# Export ONNX
success = model.export(format='onnx', imgsz=512, opset=12, dynamic=False, half=False, simplify=True)
onnx_path = 'ml/runs/smoke/train/weights/best.onnx'

if os.path.exists(onnx_path):
    print("ONNX export succeeded.")
else:
    print("ONNX export failed.")
    exit(1)

# Dummy inference
session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

dummy_input = np.random.randn(1, 3, 512, 512).astype(np.float32)
outputs = session.run([output_name], {input_name: dummy_input})

print(f"Input shape: {session.get_inputs()[0].shape}")
print(f"Output shape: {outputs[0].shape}")

if outputs[0].shape == (1, 8, 5376):
    print("Smoke test SUCCESS.")
else:
    print("Smoke test FAILED shape check.")
    exit(1)
