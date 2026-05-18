from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from auth import verify_hash_password, create_access_token, get_current_user, get_hash_password
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
def api_detect_objects(file: UploadFile = File(...), classes: str = Form(""), conf: float = Form(0.25), current_user:str = Depends(get_current_user)):
    
    os.makedirs(f'static/images/{current_user}', exist_ok=True)
    unique_filename = f"{int(time.time())}_{file.filename}"
    temp_path = f"/tmp/{unique_filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    count, tmp_result_image_path = detect_objects(temp_path, classes, conf)
    
    final_image_path = f"static/images/{current_user}/{unique_filename}"
    shutil.move(tmp_result_image_path, final_image_path)
    
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        sql_command = "INSERT INTO detections (username, arquivo, contagem_json) VALUES ( %s, %s, %s)"
        val = (current_user ,unique_filename, json.dumps(count))
        cursor.execute(sql_command, val)
        connection.commit()
    finally:
        cursor.close()
        connection.close()

    os.remove(temp_path)
    return FileResponse(final_image_path)

@app.get("/History")
def get_history(current_user: str = Depends(get_current_user)):
    connection = get_db_connection()
    records = None
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM detections WHERE username = %s ORDER BY id DESC", (current_user,))
        records = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    results = []
    for row in records:
        results.append({
            "id": row[0],
            "username": row[1],
            "data_hora": row[2],
            "arquivo": row[3],
            "contagem_json": json.loads(row[4])
        })
    return results

@app.delete("/History")
def clear_history(current_user: str = Depends(get_current_user)):
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        command = 'DELETE FROM detections WHERE username = %s'
        cursor.execute(command,(current_user,))
        connection.commit()
    finally:
        cursor.close()
        connection.close()
    
    user_dir = f"static/images/{current_user}"
    if os.path.exists(user_dir):
        shutil.rmtree(user_dir)
            
    return {"message": "Histórico limpo com sucesso"}

@app.delete("/deleteUser")
def deleteUser(current_user: str = Depends(get_current_user)):
    if(current_user == 'admin'):
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = 'Usuario admin não pose ser apagado'
        )
    
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        # Apaga registros no banco
        command = 'DELETE FROM detections WHERE username = %s'
        cursor.execute(command,(current_user,))
        
        #Apaga usuario
        command = 'DELETE FROM users WHERE username = %s'
        cursor.execute(command, (current_user,))
        connection.commit()
    finally:
        cursor.close()
        connection.close()    
    #Apaga pasta de fotos
    user_dir = f"static/images/{current_user}"
    if os.path.exists(user_dir):
        shutil.rmtree(user_dir)
        
    return {"message": "Usuário deletado com sucesso"}


@app.get("/statistics")
def get_statistics(current_user: str = Depends(get_current_user)):
    connection = get_db_connection()
    records = None
    try:   
        cursor = connection.cursor()
        command = "SELECT contagem_json FROM detections WHERE username = %s"
        cursor.execute(command, (current_user,))
        records = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()
    
    total_images = len(records)
    total_objects = 0
    classes_count = {}
    
    for row in records:
        if row[0]:
            contagens = json.loads(row[0])
            for classe, qtd in contagens.items():
                classes_count[classe] = classes_count.get(classe, 0) + qtd
                total_objects += qtd
                
    
    classes_count = dict(sorted(classes_count.items(), key=lambda item: item[1], reverse=True))
    
    return {
        "total_images": total_images,
        "total_objects": total_objects,
        "classes_count": classes_count
    }

@app.post('/register', status_code = status.HTTP_201_CREATED)
def register_user(username: str = Form(...), password: str = Form(...)):
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome de usuário já existe"
            )
            
        hashed_pwd = get_hash_password(password)
        cursor.execute("INSERT INTO users (username, hash_password) VALUES (%s, %s)", (username, hashed_pwd))
        connection.commit()
    finally:
        cursor.close()
        connection.close()
    
    return {"message": "Usuário criado com sucesso!"}

@app.post('/token')
def login(form: OAuth2PasswordRequestForm = Depends()):
    connection = get_db_connection()
    hash_password = ''
    try:
        cursor = connection.cursor()
        cursor.execute("""
        SELECT hash_password FROM users
        WHERE username = %s
        """, (form.username,))
        hash_password = cursor.fetchone()
    finally:
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