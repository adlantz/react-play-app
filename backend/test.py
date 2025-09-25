from supabase.client import create_client, Client
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

supabase_user = create_client(supabase_url, supabase_anon_key)

# Authenticate user
email = os.getenv("TEST_USER_EMAIL")
password = os.getenv("TEST_USER_PASSWORD")

auth_response = supabase_user.auth.sign_in_with_password({"email": email, "password": password})
print(f"Authenticated as: {auth_response.user.email}")

# Find first PDF file in uploads directory
uploads_dir = "uploads"
pdf_file = None
for filename in os.listdir(uploads_dir):
    if filename.endswith(".pdf"):
        pdf_file = filename
        break

if pdf_file:
    file_path = os.path.join(uploads_dir, pdf_file)
    unique_filename = f"{uuid.uuid4()}.pdf"
    
    with open(file_path, "rb") as f:
        file_content = f.read()
    
    storage_response = supabase_user.storage.from_("uploaded_files").upload(
        unique_filename, file_content
    )
    
    print(f"Upload response: {storage_response}")
else:
    print("No PDF file found in uploads directory")

# Sign out to clean up session
supabase_user.auth.sign_out()
