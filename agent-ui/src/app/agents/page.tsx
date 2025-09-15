export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">ServiceFlow Agent UI</h1>
        <p className="text-lg mb-4">Welcome to the ServiceFlow Agent UI system.</p>
        <div className="bg-neutral-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <p className="text-green-400">✅ Agent UI Frontend: Online</p>
          <p className="text-yellow-400">⚠️ Agent Backend: Coming Soon</p>
          <p className="text-blue-400">🚀 Railway Deployment: Success</p>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
