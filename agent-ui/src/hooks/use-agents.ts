import { useState, useEffect, useCallback } from 'react'
import { agentClient, type Agent } from '@/lib/agent-client'

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    
    try {
      // First check if the playground server is healthy
      const isHealthy = await agentClient.healthCheck()
      
      if (!isHealthy) {
        setStatus('disconnected')
        setError('Unable to connect to playground server')
        // Still try to load agents for development
      }

      const fetchedAgents = await agentClient.getAgents()
      setAgents(fetchedAgents)
      setStatus(isHealthy ? 'connected' : 'disconnected')
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      // Set empty agents array on error
      setAgents([])
    }
  }, [])

  const refreshAgents = useCallback(() => {
    fetchAgents()
  }, [fetchAgents])

  // Initial fetch
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Periodic health checks and agent updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const isHealthy = await agentClient.healthCheck()
        if (isHealthy && status !== 'connected') {
          setStatus('connected')
          setError(null)
          // Refresh agents when connection is restored
          await fetchAgents()
        } else if (!isHealthy && status === 'connected') {
          setStatus('disconnected')
          setError('Lost connection to playground server')
        }
      } catch (error) {
        if (status === 'connected') {
          setStatus('error')
          setError('Health check failed')
        }
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [status, fetchAgents])

  return {
    agents,
    status,
    error,
    refreshAgents,
    isLoading: status === 'connecting',
    isConnected: status === 'connected',
  }
}