"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatTestPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`])
  }

  const testChat = async () => {
    if (!message.trim()) {
      addLog('Error: Message cannot be empty')
      return
    }

    setIsLoading(true)
    setResponse('')
    addLog(`Sending message: "${message}" to /api/chat`)

    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ content: message }],
          agentId: 'scraper_agent',
          businessId: 'default',
          sessionId: `session_${Date.now()}`,
          stream: false
        }),
      })

      addLog(`Response status: ${chatResponse.status}`)

      if (!chatResponse.ok) {
        let errorText
        try {
          errorText = await chatResponse.text()
          addLog(`Error response: ${errorText}`)
        } catch {
          errorText = 'Unable to parse error response'
          addLog(errorText)
        }
        throw new Error(`HTTP error! status: ${chatResponse.status} - ${errorText}`)
      }

      const data = await chatResponse.json()
      addLog(`Response data: ${JSON.stringify(data, null, 2)}`)
      setResponse(data.response || 'No response received')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      addLog(`Error: ${errorMessage}`)
      setResponse(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPlaygroundConnection = async () => {
    const playgroundUrl = 'http://localhost:7777/v1/playground/status'
    addLog(`Testing playground connection at ${playgroundUrl}...`)

    try {
      const response = await fetch(playgroundUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      addLog(`Playground status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        addLog(`Playground response: ${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await response.text()
        addLog(`❌ Playground server not accessible: ${response.status} ${errorText}`)
      }
    } catch (error) {
      addLog(`❌ Playground connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">ServiceFlow AI Chat Test</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Chat with Contractor Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about contractor services or website..."
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && testChat()}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={testChat} 
                  disabled={isLoading || !message.trim()}
                  className="flex-1"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
                <Button 
                  onClick={testPlaygroundConnection}
                  variant="outline"
                >
                  Test Connection
                </Button>
              </div>
            </div>
            
            {response && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Agent Response:</h3>
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto bg-black text-green-400 p-4 rounded font-mono text-sm">
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Clear Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Test Connection" to verify the playground server is running at http://localhost:7777</li>
            <li>If the playground is not running, start it with: <code className="bg-gray-100 px-2 py-1 rounded">cd Agents && python playground.py</code></li>
            <li>Ensure Next.js is not using `output: export` in next.config.js</li>
            <li>Try sending a message about contractor services or website questions</li>
            <li>Check the debug logs for API communication details</li>
            <li>Expected: Response from the scraper_agent with contractor knowledge</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}