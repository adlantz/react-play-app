import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <h1 className="text-4xl font-bold p-8 text-center">react play app</h1>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Link href="/uploads" className="px-6 py-3 text-green-400 border border-white rounded hover:text-green-300">
          Upload a File
        </Link>
      </div>
    </div>
  );
}
