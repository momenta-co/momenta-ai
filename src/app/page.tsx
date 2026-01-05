import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Momenta Boutique
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Todo lo que necesitas para romper la rutina y llenar de magia tus días
        </p>
        <Link
          href="/intelligence-demo"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Demo
        </Link>
      </div>
    </div>
  );
}
