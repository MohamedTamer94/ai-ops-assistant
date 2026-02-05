from app.config import settings
import os

STORAGE_DIR = settings.storage_dir

def save_ingestion_text(ingestion_id: str, text: str):
    os.makedirs(os.path.join(STORAGE_DIR, "ingestions"), exist_ok=True)
    file_path = os.path.join(STORAGE_DIR, "ingestions", f"{ingestion_id}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    return file_path

def read_ingestion_text(ingestion_id: str) -> str:
    file_path = os.path.join(STORAGE_DIR, "ingestions", f"{ingestion_id}.txt")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Ingestion text file for ID {ingestion_id} not found.")
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()