from ultralytics import YOLO
import cv2
import os

model = YOLO('yolov8n.pt')

def detect_objects(image_path, classes, conf=0.5):
    target_classes = None
    if classes:
        target_classes = []
        name_to_id = {name.lower(): id for id, name in model.names.items()}
        for class_name in classes.split(','):
            class_name = class_name.strip().lower()
            if class_name in name_to_id:
                target_classes.append(name_to_id[class_name])
                    
    results = model(image_path, classes=target_classes, conf=conf)
    count = {}
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            count[label] = count.get(label,0) + 1
    
    plotted = results[0].plot()
    out_path = f"/tmp/out_{os.path.basename(image_path)}"
    cv2.imwrite(out_path, plotted)
    return count, out_path
