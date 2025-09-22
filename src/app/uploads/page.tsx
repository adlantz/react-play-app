"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

interface FileData {
  filename: string;
  upload_time: string;
}

export default function Uploads() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'time'>('time');

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files');
      const result = await response.json();
      setFiles(result.files);
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('Upload successful:', result);
      fetchFiles();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/files/${filename}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      console.log('Delete successful:', result);
      fetchFiles();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'name') {
      return a.filename.localeCompare(b.filename);
    } else {
      return new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime();
    }
  });

  return (
    <div className="min-h-screen">
      <Link href="/" className="fixed top-4 left-4 text-xl hover:text-gray-600">
        Home
      </Link>

      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-96 h-96 border border-white rounded px-4 pt-2 pb-4 overflow-y-auto">
          <div className="flex gap-2 mb-2 text-xs">
            <button 
              onClick={() => setSortBy('time')}
              className={`px-2 py-1 rounded ${sortBy === 'time' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Time
            </button>
            <button 
              onClick={() => setSortBy('name')}
              className={`px-2 py-1 rounded ${sortBy === 'name' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Name
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          {sortedFiles.map((file, index) => (
            <div 
              key={index} 
              className="py-1 text-sm flex justify-between items-center"
              onMouseEnter={() => setHoveredFile(file.filename)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <span>{file.filename}</span>
              {hoveredFile === file.filename && (
                <Image
                  src="/trash_svg_icon.svg"
                  alt="Delete"
                  width={16}
                  height={16}
                  className="cursor-pointer hover:opacity-70"
                  onClick={() => handleDeleteFile(file.filename)}
                />
              )}
            </div>
          ))}
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