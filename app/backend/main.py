from fastapi import FastAPI, UploadFile, File
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
async def api_detect_objects(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    count, result_image_path = detect_objects(temp_path)
    
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
    return FileResponse(result_image_path)