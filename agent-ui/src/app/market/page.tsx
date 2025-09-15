"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SonicLogo } from "@/components/sonic-icon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircleDollarSign, TrendingUp, ArrowUpDown, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { MarketDataTable } from "@/components/market-data-table"
import type { TokenPair } from "@/components/market-data-table"

export default function MarketPage() {
  // State for each DEX's data
  const [sonicPairs, setSonicPairs] = useState<TokenPair[]>([])
  const [beetsPairs, setBeetsPairs] = useState<TokenPair[]>([])
  const [shadowPairs, setShadowPairs] = useState<TokenPair[]>([])
  const [metroPairs, setMetroPairs] = useState<TokenPair[]>([])
  const [equalizerPairs, setEqualizerPairs] = useState<TokenPair[]>([])

  // Loading states for each DEX
  const [loadingDexScreener, setLoadingDexScreener] = useState(true)
  const [loadingBeets, setLoadingBeets] = useState(true)
  const [loadingShadow, setLoadingShadow] = useState(true)
  const [loadingMetro, setLoadingMetro] = useState(true)
  const [loadingEqualizer, setLoadingEqualizer] = useState(true)

  // Error states for each DEX
  const [dexScreenerError, setDexScreenerError] = useState<string | null>(null)
  const [beetsError, setBeetsError] = useState<string | null>(null)
  const [shadowError, setShadowError] = useState<string | null>(null)
  const [metroError, setMetroError] = useState<string | null>(null)
  const [equalizerError, setEqualizerError] = useState<string | null>(null)

  // Fetch data for DexScreener
  const fetchDexScreenerData = async () => {
    try {
      setLoadingDexScreener(true)
      setDexScreenerError(null)

      const response = await fetch("/api/dex-pairs")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setSonicPairs(data.pairs)
    } catch (err) {
      console.error("Failed to fetch DexScreener data:", err)
      setDexScreenerError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoadingDexScreener(false)
    }
  }

  // Fetch data for Beets
  const fetchBeetsData = async () => {
    try {
      setLoadingBeets(true)
      setBeetsError(null)

      const response = await fetch("/api/beets-pools")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setBeetsPairs(data.pairs)
    } catch (err) {
      console.error("Failed to fetch Beets data:", err)
      setBeetsError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoadingBeets(false)
    }
  }

  // Fetch data for Shadow
  const fetchShadowData = async () => {
    try {
      setLoadingShadow(true)
      setShadowError(null)

      const response = await fetch("/api/shadow-pools")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setShadowPairs(data.pairs)
    } catch (err) {
      console.error("Failed to fetch Shadow data:", err)
      setShadowError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoadingShadow(false)
    }
  }

  // Fetch data for Metro
  const fetchMetroData = async () => {
    try {
      setLoadingMetro(true)
      setMetroError(null)

      console.log("Fetching Metro data...")
      const response = await fetch("/api/metro-pools")

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Metro data received:", data)
      if (data.pairs) {
        console.log(`Setting ${data.pairs.length} Metro pairs`)
        if (data.pairs.length === 0) {
          console.warn("Received empty pairs array from Metro API")
        } else {
          console.log("First Metro pair:", data.pairs[0])
        }
        setMetroPairs(data.pairs)
      } else {
        console.error("Metro API response missing pairs property:", data)
        throw new Error("Invalid data format: missing pairs property")
      }
    } catch (err) {
      console.error("Failed to fetch Metro data:", err)
      setMetroError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoadingMetro(false)
    }
  }

  // Fetch data for Equalizer
  const fetchEqualizerData = async () => {
    try {
      setLoadingEqualizer(true)
      setEqualizerError(null)

      const response = await fetch("/api/equalizer-pools")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      // Check if there's an error message in the response
      if (data.error) {
        console.warn("Equalizer API returned an error but with fallback data:", data.error)
        setEqualizerError(data.error)
      }

      // Use the pairs data even if there was an error (fallback data)
      if (Array.isArray(data.pairs)) {
        setEqualizerPairs(data.pairs)
      } else {
        throw new Error("Invalid data format: pairs is not an array")
      }
    } catch (err) {
      console.error("Failed to fetch Equalizer data:", err)
      setEqualizerError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoadingEqualizer(false)
    }
  }

  // Fetch all data on component mount
  useEffect(() => {
    fetchDexScreenerData()
    fetchBeetsData()
    fetchShadowData()
    fetchMetroData()
    fetchEqualizerData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-sonic-gradient">
      <Header />

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <SonicLogo size={48} showText={false} />
          <div>
            <h1 className="text-3xl font-bold text-white">Market</h1>
            <p className="text-muted-foreground">Real-time market data and analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-sonic-gray border-sonic-gray">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-sonic-gold" />
                  Beets DEX Top Pairs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBeetsData}
                  disabled={loadingBeets}
                  className="h-8 px-2"
                >
                  {loadingBeets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBeets ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
                  <span className="ml-2 text-white">Loading market data...</span>
                </div>
              ) : beetsError ? (
                <div className="p-4 text-red-400 bg-red-900/20 rounded-md border border-red-800">
                  <p>Error loading market data: {beetsError}</p>
                </div>
              ) : (
                <MarketDataTable pairs={beetsPairs} showVolume={true} showFees={true} />
              )}
            </CardContent>
          </Card>

          <Card className="bg-sonic-gray border-sonic-gray">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <ArrowUpDown className="mr-2 h-5 w-5 text-sonic-gold" />
                  Shadow DEX Top Pairs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchShadowData}
                  disabled={loadingShadow}
                  className="h-8 px-2"
                >
                  {loadingShadow ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingShadow ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
                  <span className="ml-2 text-white">Loading market data...</span>
                </div>
              ) : shadowError ? (
                <div className="p-4 text-red-400 bg-red-900/20 rounded-md border border-red-800">
                  <p>Error loading market data: {shadowError}</p>
                </div>
              ) : (
                <MarketDataTable pairs={shadowPairs} showVolume={false} showFees={false} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-sonic-gray border-sonic-gray">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <ArrowUpDown className="mr-2 h-5 w-5 text-sonic-gold" />
                  Metro DEX Top Pairs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMetroData}
                  disabled={loadingMetro}
                  className="h-8 px-2"
                >
                  {loadingMetro ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMetro ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
                  <span className="ml-2 text-white">Loading market data...</span>
                </div>
              ) : metroError ? (
                <div className="p-4 text-amber-400 bg-amber-900/20 rounded-md border border-amber-800 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                    <p>Warning: {metroError}</p>
                  </div>
                  {metroPairs.length > 0 && <p className="text-sm mt-2">Showing fallback or partial data</p>}
                </div>
              ) : null}

              {!loadingMetro && metroPairs.length === 0 ? (
                <div className="p-4 text-red-400 bg-red-900/20 rounded-md border border-red-800">
                  <p>No Metro pairs available</p>
                </div>
              ) : !loadingMetro && metroPairs.length > 0 ? (
                <MarketDataTable pairs={metroPairs} showVolume={true} showFees={true} />
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-sonic-gray border-sonic-gray">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <ArrowUpDown className="mr-2 h-5 w-5 text-sonic-gold" />
                  Equalizer DEX Top Pairs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEqualizerData}
                  disabled={loadingEqualizer}
                  className="h-8 px-2"
                >
                  {loadingEqualizer ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEqualizer ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
                  <span className="ml-2 text-white">Loading market data...</span>
                </div>
              ) : equalizerError ? (
                <div className="p-4 text-amber-400 bg-amber-900/20 rounded-md border border-amber-800 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                    <p>Warning: {equalizerError}</p>
                  </div>
                  {equalizerPairs.length > 0 && <p className="text-sm mt-2">Showing fallback or partial data</p>}
                </div>
              ) : null}

              {!loadingEqualizer && equalizerPairs.length === 0 ? (
                <div className="p-4 text-red-400 bg-red-900/20 rounded-md border border-red-800">
                  <p>No Equalizer pairs available</p>
                </div>
              ) : !loadingEqualizer && equalizerPairs.length > 0 ? (
                <MarketDataTable pairs={equalizerPairs} showVolume={true} showFees={true} />
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* DexScreener pairs card at the bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-sonic-gray border-sonic-gray lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <CircleDollarSign className="mr-2 h-5 w-5 text-sonic-gold" />
                  Sonic DexScreener Pairs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDexScreenerData}
                  disabled={loadingDexScreener}
                  className="h-8 px-2"
                >
                  {loadingDexScreener ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDexScreener ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sonic-gold" />
                  <span className="ml-2 text-white">Loading market data...</span>
                </div>
              ) : dexScreenerError ? (
                <div className="p-4 text-red-400 bg-red-900/20 rounded-md border border-red-800">
                  <p>Error loading market data: {dexScreenerError}</p>
                </div>
              ) : (
                <MarketDataTable pairs={sonicPairs} showVolume={true} showFees={true} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-sonic-gray py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          <p>© 2023 Sonic AI Quant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}