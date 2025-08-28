"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Plus, Play, Pause, Trash2, Edit, MessageSquare, TrendingUp, Users, Clock, Zap } from "lucide-react"

interface Agent {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "training"
  type: "customer-service" | "lead-generation" | "scheduling" | "sales"
  conversations: number
  successRate: number
  lastActive: string
  businessId: string
}

export function AgnoAgentManager() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "1",
      name: "Customer Support Bot",
      description: "Handles customer inquiries and support tickets",
      status: "active",
      type: "customer-service",
      conversations: 1247,
      successRate: 94,
      lastActive: "2 minutes ago",
      businessId: "business-1",
    },
    {
      id: "2",
      name: "Lead Qualifier",
      description: "Qualifies and scores incoming leads",
      status: "active",
      type: "lead-generation",
      conversations: 856,
      successRate: 87,
      lastActive: "5 minutes ago",
      businessId: "business-1",
    },
    {
      id: "3",
      name: "Appointment Scheduler",
      description: "Manages appointment booking and scheduling",
      status: "inactive",
      type: "scheduling",
      conversations: 432,
      successRate: 91,
      lastActive: "2 hours ago",
      businessId: "business-1",
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "training":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: Agent["type"]) => {
    switch (type) {
      case "customer-service":
        return <MessageSquare className="h-4 w-4" />
      case "lead-generation":
        return <Users className="h-4 w-4" />
      case "scheduling":
        return <Clock className="h-4 w-4" />
      case "sales":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const toggleAgentStatus = (agentId: string) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: agent.status === "active" ? "inactive" : "active" } : agent,
      ),
    )
  }

  const deleteAgent = (agentId: string) => {
    setAgents(agents.filter((agent) => agent.id !== agentId))
  }

  const testAgent = async (agentId: string) => {
    try {
      const response = await fetch("/api/agno/test-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Agent test successful: ${result.message}`)
      } else {
        alert("Agent test failed")
      }
    } catch (error) {
      console.error("Error testing agent:", error)
      alert("Error testing agent")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agno Agent Manager</h2>
          <p className="text-muted-foreground">Create, manage, and deploy AI agents for your business automation</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">{agents.filter((a) => a.status === "active").length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.conversations, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length)}%
            </div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((a) => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Agents currently running</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(agent.type)}
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
              </div>
              <CardDescription>{agent.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Conversations</p>
                  <p className="font-semibold">{agent.conversations.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{agent.successRate}%</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Last Active</p>
                <p className="font-semibold">{agent.lastActive}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={agent.status === "active" ? "destructive" : "default"}
                  onClick={() => toggleAgentStatus(agent.id)}
                  className="flex-1"
                >
                  {agent.status === "active" ? (
                    <>
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      Start
                    </>
                  )}
                </Button>

                <Button size="sm" variant="outline" onClick={() => testAgent(agent.id)}>
                  <MessageSquare className="h-3 w-3" />
                </Button>

                <Button size="sm" variant="outline" onClick={() => setSelectedAgent(agent)}>
                  <Edit className="h-3 w-3" />
                </Button>

                <Button size="sm" variant="outline" onClick={() => deleteAgent(agent.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Agent</CardTitle>
              <CardDescription>Set up a new AI agent for your business automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="e.g., Customer Support Bot"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Agent Type</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option value="customer-service">Customer Service</option>
                  <option value="lead-generation">Lead Generation</option>
                  <option value="scheduling">Scheduling</option>
                  <option value="sales">Sales</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Describe what this agent will do..."
                />
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1" onClick={() => setIsCreating(false)}>
                  Create Agent
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
