import os
import cv2
import numpy as np
import shutil
import glob
import random

source_dir = '/tmp/datasets/charmve/Magnetic-Tile-Defect/MT_Crack/Imgs'
# We have .jpg and .png masks in source_dir

images = glob.glob(os.path.join(source_dir, '*.jpg'))
print(f"Found {len(images)} magnetic tile crack images.")

# We will remove the old cracked.zip images from ml/dataset/images/train|val|test
# wait, it's easier to just append, but old ones are bad (concrete cracks).
# Let's remove them:
for split in ['train', 'val', 'test']:
    for f in glob.glob(f"ml/dataset/images/{split}/cracked_*.jpg"):
        os.remove(f)
    for f in glob.glob(f"ml/dataset/labels/{split}/cracked_*.txt"):
        os.remove(f)

# Split the new images
random.seed(42)
random.shuffle(images)
num_imgs = len(images)
train_split = int(0.8 * num_imgs)
val_split = int(0.9 * num_imgs)

train_imgs = images[:train_split]
val_imgs = images[train_split:val_split]
test_imgs = images[val_split:]

def process_images(img_list, split):
    count = 0
    for img_path in img_list:
        base = os.path.basename(img_path)
        name, _ = os.path.splitext(base)
        mask_path = os.path.join(source_dir, f"{name}.png")
        
        if not os.path.exists(mask_path):
            continue
            
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        if mask is None:
            continue
            
        h, w = mask.shape
        # Find connected components for cracks
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        boxes = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Filter tiny specs
            if bw < 5 or bh < 5:
                continue
            # YOLO format
            cx = (x + bw/2.0) / w
            cy = (y + bh/2.0) / h
            nw = bw / w
            nh = bh / h
            boxes.append(f"2 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}") # Class 2 = cracked_tiles
            
        if not boxes:
            continue
            
        # Save image and label
        new_img_name = f"new_tile_crack_{name}.jpg"
        new_img_path = f"ml/dataset/images/{split}/{new_img_name}"
        shutil.copy(img_path, new_img_path)
        
        new_lbl_path = f"ml/dataset/labels/{split}/new_tile_crack_{name}.txt"
        with open(new_lbl_path, 'w') as f:
            f.write("\n".join(boxes) + "\n")
            
        count += 1
    print(f"Processed {count} images for {split}")

process_images(train_imgs, 'train')
process_images(val_imgs, 'val')
process_images(test_imgs, 'test')
print("Done dataset replacement.")
