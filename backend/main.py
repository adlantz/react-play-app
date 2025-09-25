from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime
from supabase.client import create_client, Client
from dotenv import load_dotenv
import uuid
import jwt
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE")
supabase = create_client(supabase_url, supabase_service_key)


async def get_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]

    try:
        # Decode JWT to get user ID (without verification for simplicity)
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), user_id: str = Depends(get_user_id)
):
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = (
        f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    )

    # Upload to Supabase Storage
    file_content = await file.read()
    storage_response = supabase.storage.from_("uploaded_files").upload(
        f"{user_id}/{unique_filename}", file_content
    )

    if storage_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to upload file")

    # Get public URL
    bucket_url = supabase.storage.from_("uploaded_files").get_public_url(
        f"{user_id}/{unique_filename}"
    )

    # Clean URL of query parameters
    clean_bucket_url = bucket_url.split("?")[0]

    # Insert record into database
    db_response = (
        supabase.table("files")
        .insert(
            {
                "user_id": user_id,
                "filename": file.filename,
                "uploaded_time": datetime.now().isoformat(),
                "file_size": len(file_content),
                "bucket_url": clean_bucket_url,
            }
        )
        .execute()
    )

    if not db_response.data:
        raise HTTPException(status_code=500, detail="Failed to save file record")

    return {"filename": file.filename, "message": "File uploaded successfully"}


@app.get("/files")
async def list_files(user_id: str = Depends(get_user_id)):
    # Get user's files from database
    response = supabase.table("files").select("*").eq("user_id", user_id).execute()

    return {"files": response.data}


@app.delete("/files/{file_id}")
async def delete_file(file_id: str, user_id: str = Depends(get_user_id)):
    # Get file record
    file_response = (
        supabase.table("files")
        .select("*")
        .eq("id", file_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not file_response.data:
        raise HTTPException(status_code=404, detail="File not found")

    file_record = file_response.data[0]

    # Extract file path from bucket_url
    # URL format: https://...supabase.co/storage/v1/object/public/uploaded_files/user_id/filename
    url_parts = file_record["bucket_url"].split("/")
    # Get the part after 'uploaded_files/'
    bucket_index = url_parts.index("uploaded_files")
    file_path = "/".join(url_parts[bucket_index + 1 :])

    # Delete from storage
    supabase.storage.from_("uploaded_files").remove([file_path])

    # Delete from database
    supabase.table("files").delete().eq("id", file_id).eq("user_id", user_id).execute()

    return {"message": "File deleted successfully"}
