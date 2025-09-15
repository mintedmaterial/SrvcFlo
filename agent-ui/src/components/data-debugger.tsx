"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsItem, TabsList } from "@/components/ui/tabs"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"

export function DataDebugger() {
  const [activeTest, setActiveTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async (testName: string) => {
    setActiveTest(testName)
    setIsLoading(true)
    setError(null)

    try {
      // Get endpoint from localStorage or use default
      const endpoint = localStorage.getItem("sonicEndpoint") || ""
      const apiKey = localStorage.getItem("sonicApiKey") || ""

      // Use relative URL if no endpoint is specified
      const apiUrl = endpoint ? `${endpoint}/api/debug/${testName}` : `/api/debug/${testName}`

      console.log(`Running test: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${response.status} - ${response.statusText || errorText}`)
      }

      const data = await response.json()
      setTestResults(data)
    } catch (err) {
      console.error(`Error running test ${testName}:`, err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const tests = [
    { id: "data-fetch", name: "Data Fetching Test" },
    { id: "llm-integration", name: "LLM Integration Test" },
    { id: "mcp-connection", name: "MCP Connection Test" },
    { id: "brave-search", name: "Brave Search Test" },
    { id: "all-mcp", name: "All MCP Test" },
  ]

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
        <h3 className="font-medium text-amber-800">Testing Information</h3>
        <p className="text-sm text-amber-700 mt-1">
          These tests will check if your MCP servers and LLM integration are working correctly. If you don't have the
          MCP servers running locally, the tests will use mock data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test) => (
          <Card
            key={test.id}
            className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
              activeTest === test.id ? "border-primary" : ""
            }`}
            onClick={() => runTest(test.id)}
          >
            <div className="font-medium">{test.name}</div>
            <div className="text-sm text-muted-foreground mt-1">Test {test.id} functionality</div>
          </Card>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <div className="font-medium">Error running test</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Running test...</span>
        </div>
      )}

      {testResults && !isLoading && (
        <div className="mt-6 border rounded-md">
          <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
            <h3 className="font-medium">Test Results: {activeTest}</h3>
            <Button variant="outline" size="sm" onClick={() => runTest(activeTest!)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Again
            </Button>
          </div>

          <div className="p-4">
            <Tabs defaultValue="results">
              <TabsList>
                <TabsItem value="results">Results</TabsItem>
                <TabsItem value="raw">Raw Data</TabsItem>
              </TabsList>

              <TabsContent value="results" className="mt-4">
                <ResultsDisplay results={testResults} />
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultsDisplay({ results }: { results: any }) {
  if (!results) return null

  // Format the results based on the structure
  return (
    <div className="space-y-4">
      {results.success ? (
        <div className="bg-green-50 text-green-800 p-3 rounded-md flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          Test completed successfully
        </div>
      ) : (
        <div className="bg-red-50 text-red-800 p-3 rounded-md flex items-center">
          <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
          Test failed
        </div>
      )}

      {results.steps && (
        <div className="space-y-2">
          <h4 className="font-medium">Test Steps</h4>
          <div className="space-y-2">
            {results.steps.map((step: any, index: number) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center">
                  {step.success ? (
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                  )}
                  <div className="font-medium">{step.name}</div>
                </div>
                {step.message && <div className="text-sm text-muted-foreground mt-1">{step.message}</div>}
                {step.data && (
                  <div className="mt-2 text-xs">
                    <div className="font-semibold">Data:</div>
                    <pre className="bg-muted p-2 rounded-md overflow-auto mt-1">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.message && (
        <div className="text-sm">
          <div className="font-medium">Message:</div>
          <div className="mt-1">{results.message}</div>
        </div>
      )}
    </div>
  )
}