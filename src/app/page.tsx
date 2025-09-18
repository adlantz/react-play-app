import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Home Page</h1>
      <nav className="flex gap-4">
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Home
        </Link>
        <Link href="/uploads" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Uploads
        </Link>
      </nav>
    </div>
  );
}
