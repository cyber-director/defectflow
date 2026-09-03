import onnx
import onnxruntime as ort
import numpy as np
from PIL import Image
import json
import glob

onnx_path = 'defect_detector.onnx'

print(f"Loading {onnx_path}...")
model = onnx.load(onnx_path)
onnx.checker.check_model(model)
print("ONNX checker passed!")

sess = ort.InferenceSession(onnx_path)
inputs = sess.get_inputs()
outputs = sess.get_outputs()

input_name = inputs[0].name
input_shape = inputs[0].shape
output_shape = outputs[0].shape

print(f"Input Name: {input_name}, Shape: {input_shape}")
print(f"Output Shape: {output_shape}")

# Verify channels: 4 box coords + 4 class scores = 8 channels
assert output_shape[1] == 8, f"Expected 8 output channels, got {output_shape[1]}"

print("Running dummy inference...")
dummy_input = np.random.randn(1, 3, 512, 512).astype(np.float32)
out = sess.run(None, {input_name: dummy_input})
print(f"Dummy output shape: {out[0].shape}")

print("\nTesting real images...")
def test_image(img_path):
    print(f"\nImage: {img_path}")
    try:
        img = Image.open(img_path).convert('RGB')
        img = img.resize((512, 512))
        img_np = np.array(img).astype(np.float32) / 255.0
        img_np = np.transpose(img_np, (2, 0, 1))
        img_np = np.expand_dims(img_np, axis=0)

        out = sess.run(None, {input_name: img_np})[0]
        # out shape: [1, 8, 5376]
        
        # Parse detections (simplified greedy parsing for logging)
        preds = out[0] # [8, 5376]
        boxes = preds[:4, :]
        scores = preds[4:, :]
        
        max_scores = np.max(scores, axis=0)
        class_ids = np.argmax(scores, axis=0)
        
        # Filter by confidence
        mask = max_scores > 0.1
        valid_boxes = boxes[:, mask].T
        valid_scores = max_scores[mask]
        valid_classes = class_ids[mask]
        
        print(f"Number of detections (conf > 0.1): {len(valid_scores)}")
        
        for i in range(min(5, len(valid_scores))):
            cx, cy, w, h = valid_boxes[i]
            conf = valid_scores[i]
            cls = valid_classes[i]
            print(f"  Det {i+1}: Class {cls}, Conf {conf:.3f}, Box [cx:{cx:.1f} cy:{cy:.1f} w:{w:.1f} h:{h:.1f}]")
    except Exception as e:
        print(f"Error testing image: {e}")

# Find one image from each class in the test set
test_dir = 'ml/dataset/images/test'
for prefix in ['spalling_', 'water_', 'cracked_', 'peeling_']:
    files = glob.glob(f"{test_dir}/{prefix}*.jpg")
    if files:
        test_image(files[0])
    else:
        print(f"No test image found for prefix: {prefix}")
