from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Save metadata
    metadata_path = os.path.join(UPLOAD_DIR, "metadata.json")
    metadata = {}
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
    
    metadata[file.filename] = {
        "upload_time": datetime.now().isoformat(),
        "filename": file.filename
    }
    
    with open(metadata_path, "w") as f:
        json.dump(metadata, f)
    
    return {"filename": file.filename, "message": "File uploaded successfully"}

@app.get("/files")
async def list_files():
    metadata_path = os.path.join(UPLOAD_DIR, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        files = [metadata[filename] for filename in metadata if os.path.exists(os.path.join(UPLOAD_DIR, filename))]
    else:
        files = [{"filename": f, "upload_time": None} for f in os.listdir(UPLOAD_DIR) if f != "metadata.json"]
    return {"files": files}

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
        # Remove from metadata
        metadata_path = os.path.join(UPLOAD_DIR, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
            if filename in metadata:
                del metadata[filename]
            with open(metadata_path, "w") as f:
                json.dump(metadata, f)
        
        return {"message": "File deleted successfully"}
    return {"error": "File not found"}