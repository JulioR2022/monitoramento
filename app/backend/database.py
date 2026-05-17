import psycopg2
from psycopg2 import OperationalError
import os
import time
from auth import get_hash_password

def get_db_connection(retries=5, delay=5):
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@db-monitoramento:5432/monitoramento")
    for attempt in range(retries):
        try:
            #return mysql.connector.connect(
             #   host='db-monitoramento',
              #  user='root',
               # password='rootpassword',
                #database='monitoramento'
            #)
            return psycopg2.connect(db_url)
        except OperationalError as err:
            if attempt < retries - 1:
                print(f"Aviso: Banco de dados não está pronto. Tentativa {attempt + 1}/{retries}. Aguardando {delay} segundos...")
                time.sleep(delay)
            else:
                raise err

def run_db():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id SERIAL PRIMARY KEY,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        arquivo VARCHAR(255),
        contagem_json TEXT
    )
""")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        USERNAME varchar(50) NOT NULL,
        hash_password VARCHAR(255) NOT NULL

    )    


    """)

    cursor.execute(""" SELECT COUNT(*) FROM users """)
    count = cursor.fetchone()[0]
    if count == 0:
        admin_hash = get_hash_password('admin')
        cursor.execute("""
            INSERT INTO users (username, hash_password)
            VALUES (%s, %s)
        """, ('admin', admin_hash)) 

    connection.commit()
    cursor.close()
    connection.close()
