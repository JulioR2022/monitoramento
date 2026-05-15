from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from model_loader import detect_objects
from database import get_db_connection, run_db
import json
import shutil
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    run_db()

@app.post("/detect")
async def api_detect_objects(file: UploadFile = File(...), classes: str = Form(""), conf: float = Form(0.25), background_tasks: BackgroundTasks = BackgroundTasks()):
    temp_path = f"/tmp/temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    count, result_image_path = detect_objects(temp_path, classes, conf)
    
    #
    connection = get_db_connection()
    cursor = connection.cursor()
    sql_command = "INSERT INTO detections (arquivo, contagem_json) VALUES (%s, %s)"
    val = (file.filename, json.dumps(count))
    cursor.execute(sql_command, val)
    connection.commit()
    cursor.close()
    connection.close()

    os.remove(temp_path)
    background_tasks.add_task(os.remove, result_image_path)
    return FileResponse(result_image_path)

@app.get("/History")
async def get_history():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM detections ORDER BY id DESC")
    records = cursor.fetchall()
    results = []
    for row in records:
        results.append({
            "id": row[0],
            "data_hora": row[1],
            "arquivo": row[2],
            "contagem_json": json.loads(row[3])
        })
    cursor.close()
    connection.close()
    return results

@app.delete("/History")
async def clear_history():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("TRUNCATE TABLE detections")
    connection.commit()
    cursor.close()
    connection.close()
    return {"message": "Histórico limpo com sucesso"}

@app.get("/statistics")
async def get_statistics():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT contagem_json FROM detections")
    records = cursor.fetchall()
    
    total_images = len(records)
    total_objects = 0
    classes_count = {}
    
    for row in records:
        if row[0]:
            contagens = json.loads(row[0])
            for classe, qtd in contagens.items():
                classes_count[classe] = classes_count.get(classe, 0) + qtd
                total_objects += qtd
                
    cursor.close()
    connection.close()
    
    classes_count = dict(sorted(classes_count.items(), key=lambda item: item[1], reverse=True))
    
    return {
        "total_images": total_images,
        "total_objects": total_objects,
        "classes_count": classes_count
    }