from ultralytics import YOLO
import cv2
import os

model = YOLO('yolov8n.pt')

def detect_objects(image_path):
    results = model(image_path)
    count = {}
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            count[label] = count.get(label,0) + 1
    
    # Save the image with detections
    plotted = results[0].plot()
    out_path = f"out_{os.path.basename(image_path)}"
    cv2.imwrite(out_path, plotted)
    return count, out_path