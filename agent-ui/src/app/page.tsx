export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">ServiceFlow</h1>
        <p className="text-xl mb-8">Agent UI System</p>
        <div className="bg-neutral-800 p-6 rounded-lg max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <p className="text-green-400">✅ Next.js Frontend: Online</p>
          <p className="text-blue-400">🚀 Railway Deployment: Success</p>
        </div>
        <div className="mt-8">
          <a
            href="/agents"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-colors text-lg"
          >
            Enter ServiceFlow Agent UI →
          </a>
        </div>
      </div>
    </div>
  )
}
