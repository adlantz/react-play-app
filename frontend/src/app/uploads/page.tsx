"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface FileData {
  id: string;
  filename: string;
  uploaded_time: string;
  file_size: number;
  bucket_url: string;
}

export default function Uploads() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [progress, setProgress] = useState(0);


  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchFiles = async () => {
    try {
      const token = await getAuthToken();

      if (!token) return;

      const response = await fetch('http://localhost:8000/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      setFiles(result.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = await getAuthToken();
    if (!token) return;

    setUploading(true);
    setUploadingFileName(file.name);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 100);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const result = await response.json();
      console.log('Upload successful:', result);
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        fetchFiles();
      }, 200);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }

    clearInterval(progressInterval);

    // Clear the input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`http://localhost:8000/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      console.log('Delete successful:', result);
      fetchFiles();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Link href="/" className="fixed top-4 left-4 text-xl hover:text-gray-600">
        Home
      </Link>

      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-96 h-96 border border-white rounded px-4 pt-2 pb-4 overflow-y-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          {files.map((file, index) => (
            <div
              key={index}
              className="py-1 text-sm flex justify-between items-center"
              onMouseEnter={() => setHoveredFile(file.id)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <span>{file.filename}</span>
              {hoveredFile === file.id && (
                <Image
                  src="/trash_svg_icon.svg"
                  alt="Delete"
                  width={16}
                  height={16}
                  className="cursor-pointer hover:opacity-70"
                  onClick={() => handleDeleteFile(file.id)}
                />
              )}
            </div>
          ))}
          {uploading && (
            <div className="py-1 text-sm">
              <div className="font-mono text-xs">
                {"█".repeat(Math.max(0, Math.min(20, Math.floor(progress / 5))))}
                {"░".repeat(Math.max(0, 20 - Math.floor(progress / 5)))}
                {" "}{Math.floor(progress)}%
              </div>
            </div>
          )}
          <div
            className="py-1 text-2xl cursor-pointer hover:text-gray-400"
            onClick={() => fileInputRef.current?.click()}
          >
            +
          </div>
        </div>
      </div>
    </div>
  );
}