from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from auth import verify_hash_password, create_access_token, get_current_user
from model_loader import detect_objects
from database import get_db_connection, run_db
import json
import shutil
import os
import time

os.makedirs("static/images", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory="static/images"), name="images")

@app.on_event("startup")
def startup():
    run_db()

@app.post("/detect")
async def api_detect_objects(file: UploadFile = File(...), classes: str = Form(""), conf: float = Form(0.25), current_user:str = Depends(get_current_user)):
    
    unique_filename = f"{int(time.time())}_{file.filename}"
    temp_path = f"/tmp/{unique_filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    count, tmp_result_image_path = detect_objects(temp_path, classes, conf)
    
    final_image_path = f"static/images/{unique_filename}"
    shutil.move(tmp_result_image_path, final_image_path)
    
    connection = get_db_connection()
    cursor = connection.cursor()
    sql_command = "INSERT INTO detections (arquivo, contagem_json) VALUES (%s, %s)"
    val = (unique_filename, json.dumps(count))
    cursor.execute(sql_command, val)
    connection.commit()
    cursor.close()
    connection.close()

    os.remove(temp_path)
    return FileResponse(final_image_path)

@app.get("/History")
async def get_history(current_user: str = Depends(get_current_user)):
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
async def clear_history(current_user: str = Depends(get_current_user)):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("TRUNCATE TABLE detections")
    connection.commit()
    cursor.close()
    connection.close()
    
    for filename in os.listdir("static/images"):
        file_path = os.path.join("static/images", filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
            
    return {"message": "Histórico limpo com sucesso"}

@app.get("/statistics")
async def get_statistics(current_user: str = Depends(get_current_user)):
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

@app.post('/token')
async def login(form: OAuth2PasswordRequestForm = Depends()):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("""
    SELECT hash_password FROM users
    WHERE username = %s
    """, (form.username,))
    hash_password = cursor.fetchone()
    cursor.close()
    connection.close()

    if not hash_password:
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED,
                            detail= "Usuario ou senha incorretos",
                            headers= {'WWW-Authenticate': "Bearer"},)

    hash_password = hash_password[0]

    if not verify_hash_password(plain_password=form.password,
                                hash_password=hash_password):
        raise HTTPException(
            status_code= status.HTTP_401_UNAUTHORIZED,
            detail= "Usuario ou senha incorretos",
            headers= {'WWW-Authenticate': "Bearer"}
        )
    
    access_token = create_access_token(data={'sub':form.username})
    return {'access_token': access_token, 'token_type':'bearer'}