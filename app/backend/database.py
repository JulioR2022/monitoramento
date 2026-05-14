import mysql.connector
import os
import time

def get_db_connection(retries=5, delay=5):
    for attempt in range(retries):
        try:
            return mysql.connector.connect(
                host='db-monitoramento',
                user='root',
                password='rootpassword',
                database='monitoramento'
            )
        except mysql.connector.Error as err:
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
        id INT AUTO_INCREMENT PRIMARY KEY,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        arquivo VARCHAR(255),
        contagem_json TEXT
    )
""")

    connection.commit()
    cursor.close()
    connection.close()
