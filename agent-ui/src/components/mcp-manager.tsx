"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsItem, TabsList } from "@/components/ui/tabs"
import { Loader2, Plus, RefreshCw, Trash2, Check, X, ExternalLink, Server } from "lucide-react"
import { type McpConfig, type McpType, mcpRegistry } from "@/lib/mcp/add-mcp"

export function McpManager() {
  const [mcpConfigs, setMcpConfigs] = useState<McpConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("existing")
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; data?: any }>>({})
  const [newMcp, setNewMcp] = useState<{
    name: string
    type: McpType
    baseUrl: string
    apiKey: string
    description: string
  }>({
    name: "",
    type: "custom",
    baseUrl: "http://localhost:3000",
    apiKey: "",
    description: "",
  })

  // Load MCP configurations on component mount
  useEffect(() => {
    loadMcpConfigs()
  }, [])

  const loadMcpConfigs = async () => {
    setIsLoading(true)
    try {
      const configs = await mcpRegistry.getAllConfigs()
      setMcpConfigs(configs)
    } catch (error) {
      console.error("Error loading MCP configs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (config: McpConfig) => {
    setIsLoading(true)
    try {
      const result = await mcpRegistry.testConnection(config)
      setTestResults((prev) => ({
        ...prev,
        [config.id]: result,
      }))
    } catch (error) {
      console.error("Error testing connection:", error)
      setTestResults((prev) => ({
        ...prev,
        [config.id]: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleEnabled = async (id: string, isEnabled: boolean) => {
    try {
      await mcpRegistry.setConfigEnabled(id, isEnabled)
      loadMcpConfigs()
    } catch (error) {
      console.error("Error toggling MCP enabled:", error)
    }
  }

  const handleDeleteConfig = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this MCP configuration?")) {
      try {
        const success = await mcpRegistry.deleteConfig(id)
        if (success) {
          loadMcpConfigs()
          setTestResults((prev) => {
            const newResults = { ...prev }
            delete newResults[id]
            return newResults
          })
        } else {
          alert("Cannot delete default MCP configurations")
        }
      } catch (error) {
        console.error("Error deleting MCP config:", error)
        alert("Error deleting MCP configuration")
      }
    }
  }

  const handleAddNewMcp = async () => {
    if (!newMcp.name || !newMcp.baseUrl) {
      alert("Name and Base URL are required")
      return
    }

    setIsLoading(true)
    try {
      await mcpRegistry.addConfig({
        name: newMcp.name,
        type: newMcp.type,
        baseUrl: newMcp.baseUrl,
        apiKey: newMcp.apiKey,
        isEnabled: true,
        description: newMcp.description,
      })

      // Reset form
      setNewMcp({
        name: "",
        type: "custom",
        baseUrl: "http://localhost:3000",
        apiKey: "",
        description: "",
      })

      // Switch to existing tab
      setActiveTab("existing")
      loadMcpConfigs()
    } catch (error) {
      console.error("Error adding MCP config:", error)
      alert("Error adding MCP configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyConfigurations = async () => {
    setIsLoading(true)
    try {
      await mcpRegistry.applyConfigurations()
      alert("MCP configurations applied successfully")
    } catch (error) {
      console.error("Error applying MCP configurations:", error)
      alert("Error applying MCP configurations")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">MCP Server Management</h2>
        <Button onClick={handleApplyConfigurations} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
          Apply Configurations
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsItem value="existing">Existing MCP Servers</TabsItem>
          <TabsItem value="add">Add New MCP Server</TabsItem>
        </TabsList>

        <TabsContent value="existing" className="mt-4">
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
              <span className="ml-2 text-white">Loading MCP configurations...</span>
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mcpConfigs.map((config) => (
                <Card key={config.id} className={config.isEnabled ? "border-sonic-gold" : "border-sonic-gray"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        <CardDescription>{config.description || "No description provided"}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEnabled(config.id, !config.isEnabled)}
                        >
                          {config.isEnabled ? (
                            <>
                              <Check className="mr-1 h-4 w-4 text-green-500" /> Enabled
                            </>
                          ) : (
                            <>
                              <X className="mr-1 h-4 w-4 text-red-500" /> Disabled
                            </>
                          )}
                        </Button>
                        {!config.id.includes("default") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="font-medium">Type:</div>
                        <div className="col-span-2">{config.type}</div>

                        <div className="font-medium">Base URL:</div>
                        <div className="col-span-2 flex items-center">
                          <span className="truncate mr-2">{config.baseUrl}</span>
                          <a
                            href={`${config.baseUrl}/health`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sonic-gold hover:text-sonic-gold/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {config.lastConnected && (
                          <>
                            <div className="font-medium">Last Connected:</div>
                            <div className="col-span-2">{new Date(config.lastConnected).toLocaleString()}</div>
                          </>
                        )}
                      </div>

                      {testResults[config.id] && (
                        <div
                          className={`mt-2 p-2 rounded text-sm ${
                            testResults[config.id].success
                              ? "bg-green-900/20 text-green-400"
                              : "bg-red-900/20 text-red-400"
                          }`}
                        >
                          <div className="font-medium">
                            {testResults[config.id].success ? "Connection Successful" : "Connection Failed"}
                          </div>
                          <div>{testResults[config.id].message}</div>
                          {testResults[config.id].data && (
                            <div className="mt-1 text-xs">
                              <pre className="overflow-x-auto">
                                {JSON.stringify(testResults[config.id].data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(config)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && mcpConfigs.length === 0 && (
            <div className="text-center p-8 border border-sonic-gray rounded-md">
              <p className="text-muted-foreground">No MCP servers configured</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <Card className="bg-sonic-gray border-sonic-gray">
            <CardHeader>
              <CardTitle>Add New MCP Server</CardTitle>
              <CardDescription>
                Configure a new Model Context Protocol server to extend your agent's capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newMcp.name}
                    onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                    placeholder="e.g., Custom Search MCP"
                    className="sonic-input"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={newMcp.type}
                    onChange={(e) => setNewMcp({ ...newMcp, type: e.target.value as McpType })}
                    className="sonic-input"
                  >
                    <option value="defi-llama">DeFi Llama</option>
                    <option value="brave-search">Brave Search</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={newMcp.baseUrl}
                    onChange={(e) => setNewMcp({ ...newMcp, baseUrl: e.target.value })}
                    placeholder="e.g., http://localhost:3000"
                    className="sonic-input"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    value={newMcp.apiKey}
                    onChange={(e) => setNewMcp({ ...newMcp, apiKey: e.target.value })}
                    placeholder="Enter API key if required"
                    type="password"
                    className="sonic-input"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newMcp.description}
                    onChange={(e) => setNewMcp({ ...newMcp, description: e.target.value })}
                    placeholder="Brief description of this MCP server"
                    className="sonic-input"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddNewMcp} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add MCP Server
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}