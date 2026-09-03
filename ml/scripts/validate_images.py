import onnxruntime as ort
import numpy as np
import cv2
import glob
import os

onnx_path = 'defect_detector_new.onnx'
session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

prefixes = ['spalling', 'water', 'cracked', 'peeling']

def test_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    shape = img.shape[:2]
    r = min(512 / shape[0], 512 / shape[1])
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = (512 - new_unpad[0]) / 2, (512 - new_unpad[1]) / 2

    if shape[::-1] != new_unpad:
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
    
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))

    img = img.transpose((2, 0, 1))[::-1]
    img = np.ascontiguousarray(img)
    img = img.astype(np.float32) / 255.0
    img = np.expand_dims(img, axis=0)

    outputs = session.run([output_name], {input_name: img})
    out = outputs[0]
    
    if np.isnan(out).any():
        print(f"FAILED: NaN found in output for {img_path}")
        return False
        
    print(f"SUCCESS: Preprocessed and ran {os.path.basename(img_path)} (Output shape: {out.shape})")
    return True

print("Validating real images...")
for p in prefixes:
    imgs = glob.glob(f"ml/training/defectflow_4class/images/val/{p}_*.*")
    if imgs:
        test_image(imgs[0])
print("Validation complete.")
