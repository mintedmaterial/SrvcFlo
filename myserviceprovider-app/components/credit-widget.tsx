"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  type Address,
  type Hash,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits,
} from "viem"
import { defineChain } from "viem"
import { AlertCircle, CheckCircle2, Wallet, ExternalLink } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BRAND } from "@/lib/brand"
import {
  ERC1155_ABI,
  PAYMENT_ABI,
  USDC_ABI,
} from "@/lib/contracts"
import {
  getChainConfig,
  getAddressesForNetwork,
  type NetworkKey,
  SONIC_MAINNET,
  SONIC_BLAZE_TESTNET,
} from "@/lib/network-config"

// Assets
const SONIC_LOGO = "/icons/sonic-icon.png"
const USDC_LOGO = "/images/usdc-logo.png"
const BRAND_VIDEO = "/logogif.mp4"

type PaymentOption = "USDC" | "wS"
type PurchaseType = "credits" | "inft"

type CreditPackage = {
// Use CreditPackage from credit-system-config

// Hex helpers for wallet_switchEthereumChain
// Hex helpers for wallet_switchEthereumChain
const toHexChainId = (id: number): string => "0x" + id.toString(16)

function useViemClients(selected: NetworkKey) {
  const chain = useMemo(() => getChainConfig(selected), [selected])

  const publicClient = useMemo(
    () => createPublicClient({ chain, transport: http() }),
    [chain]
  )

  const walletClient = useMemo(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return null
    try {
      return createWalletClient({ chain, transport: custom((window as any).ethereum) })
    } catch {
      return null
    }
  }, [chain])

  return { publicClient, walletClient, chain }
}

async function ensureChain(selected: NetworkKey): Promise<void> {
  const ethereum = (window as any).ethereum
  if (!ethereum) throw new Error("No wallet found. Please install MetaMask or a compatible wallet.")

  const cfg = getChainConfig(selected)
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(cfg.id) }],
    })
  } catch (switchError: any) {
    if (switchError?.code === 4902 || (switchError?.data && switchError?.data?.originalError?.code === 4902)) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: toHexChainId(cfg.id),
          chainName: cfg.name,
          nativeCurrency: cfg.nativeCurrency,
          rpcUrls: cfg.rpcUrls.default.http,
          blockExplorerUrls: [cfg.blockExplorers?.default?.url].filter(Boolean),
        }],
      })
    } else {
      throw switchError
    }
  }
}

export function CreditWidget() {
  const { toast } = useToast()

  // Network toggle: "testnet" | "mainnet"
  const [network, setNetwork] = useState<NetworkKey>("mainnet")
  const { publicClient, walletClient, chain } = useViemClients(network)
  const addresses = getAddressesForNetwork(network)

  const [account, setAccount] = useState<Address>()
  const [chainOk, setChainOk] = useState<boolean>(false)

  const [payWith, setPayWith] = useState<PaymentOption>("wS") // Default to Native S
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("inft") // Default to INFT
  const [selectedId, setSelectedId] = useState<string>('pro') // default "Pro"
  const selected = useMemo(() => CREDIT_PACKAGES.find((p: import("@/lib/credit-system-config").CreditPackage) => p.id === selectedId)!, [selectedId])

  const [usdcBalance, setUsdcBalance] = useState<string>("0.00")
  const [wsBalance, setWsBalance] = useState<string>("0.0000")
  const [erc1155Credits, setErc1155Credits] = useState<string>("0")

  const [isPurchasing, setIsPurchasing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined)
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined)

  const priceLabel = useMemo(() => {
    if (!selected) return ""
    if (payWith === "USDC") {
      return `${Number(selected.usdcPrice) / 1e6} USDC`
    } else {
      return `${Number(selected.wsTokenPrice) / 1e18} S`
    }
  }, [payWith, selected])

  // Connect or re-connect when network changes
  useEffect(() => {
    setChainOk(false)
    setAccount(undefined)
    setTxHash(undefined)
    setStatus("idle")
  }, [network])

  // Try to read current account if wallet is connected
  useEffect(() => {
    if (!walletClient) return
    ;(async () => {
      try {
        const [addr] = await walletClient.requestAddresses()
        if (addr) setAccount(addr)
      } catch {
        // ignore
      }
    })()
  }, [walletClient])

  // Fetch balances (USDC, wS, ERC1155 credits)
  useEffect(() => {
    if (!publicClient || !account) return
    ;(async () => {
      try {
        const [rawUSDC, rawNativeS, rawCredits] = await Promise.all([
          addresses.USDC
            ? (publicClient.readContract({
                address: addresses.USDC,
                abi: USDC_ABI,
                functionName: "balanceOf",
                args: [account],
              }) as Promise<bigint>)
            : Promise.resolve(0n),
          // Get native S balance instead of wS ERC-20 balance
          publicClient.getBalance({
            address: account,
          }),
          addresses.CREDITS_ERC1155 && addresses.CREDITS_ERC1155 !== "0x0000000000000000000000000000000000000000"
            ? (publicClient.readContract({
                address: addresses.CREDITS_ERC1155,
                abi: ERC1155_ABI,
                functionName: "balanceOf",
                args: [account, addresses.CREDIT_TOKEN_ID],
              }) as Promise<bigint>)
            : Promise.resolve(0n),
        ])
        setUsdcBalance(formatUnits(rawUSDC, 6))
        setWsBalance(formatUnits(rawNativeS, 18))
        setErc1155Credits(rawCredits.toString())
      } catch (err) {
        console.error("Failed to fetch balances", err)
      }
    })()
  }, [publicClient, account, txHash, network, addresses.USDC, addresses.WS_TOKEN, addresses.CREDITS_ERC1155, addresses.CREDIT_TOKEN_ID])

  const connect = async () => {
    try {
      if (!walletClient) throw new Error("Wallet not available. Please install MetaMask or a compatible wallet.")
      await ensureChain(network)
      setChainOk(true)
      const [addr] = await walletClient.requestAddresses()
      setAccount(addr)
      toast({ title: "Wallet connected", description: `${addr}` })
    } catch (err: any) {
      setChainOk(false)
      toast({ title: "Connection failed", description: err?.message ?? "Could not connect", variant: "destructive" })
    }
  }

  const ensureAllowance = async (owner: Address, spender: Address, amount: bigint) => {
    if (!addresses.USDC) throw new Error("USDC address not set for this network")
    const allowance = (await publicClient.readContract({
      address: addresses.USDC,
      abi: USDC_ABI,
      functionName: "allowance",
      args: [owner, spender],
    })) as bigint

    if (allowance < amount) {
      if (!walletClient) throw new Error("Wallet client not initialized")
      const { request } = await publicClient.simulateContract({
        account: owner,
        address: addresses.USDC,
        abi: USDC_ABI,
        functionName: "approve",
        args: [spender, amount],
      })
      const approveHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
    }
  }

  const ensureAllowanceWS = async (owner: Address, spender: Address, amount: bigint) => {
    if (!addresses.WS_TOKEN) throw new Error("wS token address not set for this network")
    const allowance = (await publicClient.readContract({
      address: addresses.WS_TOKEN,
      abi: USDC_ABI, // Same ERC20 interface
      functionName: "allowance",
      args: [owner, spender],
    })) as bigint

    if (allowance < amount) {
      if (!walletClient) throw new Error("Wallet client not initialized")
      const { request } = await publicClient.simulateContract({
        account: owner,
        address: addresses.WS_TOKEN,
        abi: USDC_ABI, // Same ERC20 interface
        functionName: "approve",
        args: [spender, amount],
      })
      const approveHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
    }
  }

  const buy = async () => {
    if (!account) {
      await connect()
      if (!account) return
    }
    
    console.log("Buy attempt:", {
      network,
      account,
      addresses,
      selectedPackage: selected,
      payWith
    })
    
    try {
      setIsPurchasing(true)
      setStatus("pending")
      setErrorMsg(undefined)
      setTxHash(undefined)

      const hasPaymentContract =
        addresses.PAYMENT && addresses.PAYMENT.toLowerCase() !== "0x0000000000000000000000000000000000000000"

      if (!hasPaymentContract) {
        // Fallback mock flow
        const res = await fetch("/api/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: account, packageId: selected.id, paymentToken: payWith }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? "Mock purchase failed")
        setTxHash(json.transactionHash)
        setStatus("success")
        toast({ title: "Purchase simulated", description: `Credits: ${json.creditsReceived.toLocaleString()}` })
        return
      }

      if (!walletClient) throw new Error("Wallet client not initialized")
      await ensureChain(network)
      setChainOk(true)
      
      // Check if package exists on contract before attempting purchase
      try {
        const packageInfo = await publicClient.readContract({
          address: addresses.PAYMENT,
          abi: [
            {
              inputs: [{ name: "packageId", type: "uint256" }],
              name: "packages",
              outputs: [
                { name: "usdcPrice", type: "uint256" },
                { name: "sonicPrice", type: "uint256" },
                { name: "usdcCredits", type: "uint256" },
                { name: "sonicCredits", type: "uint256" },
                { name: "isActive", type: "bool" }
              ],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: "packages",
          args: [BigInt(selected.id)]
        })
        console.log("Package info from contract:", packageInfo)
      } catch (pkgErr) {
        console.error("Failed to read package info:", pkgErr)
        throw new Error("Package not found on contract. Contract may not be properly initialized.")
      }

      if (payWith === "USDC") {
        if (!addresses.USDC || !addresses.PAYMENT) throw new Error("Missing USDC or payment contract address")
        const amount = parseUnits(String(selected.priceUSDC), 6)
        await ensureAllowance(account, addresses.PAYMENT, amount)

        const { request } = await publicClient.simulateContract({
          account,
          address: addresses.PAYMENT,
          abi: PAYMENT_ABI,
          functionName: "purchaseCreditsWithUSDC",
          args: [BigInt(selected.id)],
        })
        const hash = await walletClient.writeContract(request)
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        setStatus("success")
        toast({
          title: "Purchase complete",
          description: `You received ${selected.creditsUSDC.toLocaleString()} credits.`,
        })
      } else {
        // Pay with native S tokens
        if (!addresses.PAYMENT) throw new Error("Missing payment contract address")
        const amount = parseUnits(String(selected.priceS), 18)

        const { request } = await publicClient.simulateContract({
          account,
          address: addresses.PAYMENT,
          abi: PAYMENT_ABI,
          functionName: "purchaseCreditsWithSonic",
          args: [BigInt(selected.id)],
          value: amount, // Send native S tokens
        })
        const hash = await walletClient.writeContract(request)
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        setStatus("success")
        toast({
          title: "Purchase complete",
          description: `You received ${selected.creditsS.toLocaleString()} credits.`,
        })
      }
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      const msg = err?.shortMessage || err?.message || "Transaction failed"
      setErrorMsg(msg)
      toast({ title: "Purchase failed", description: msg, variant: "destructive" })
    } finally {
      setIsPurchasing(false)
    }
  }

  // UI
  return (
    <div
      className="rounded-2xl p-4 md:p-6"
      style={{
        fontFamily: BRAND.fontFamily,
        background: `linear-gradient(135deg, ${BRAND.gradient.from}, ${BRAND.gradient.via}, ${BRAND.gradient.to})`,
      }}
    >
      <Card className="border-foreground/10 shadow-sm glass">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative h-10 w-10 overflow-hidden rounded-full bg-secondary/70 flex items-center justify-center">
                <img src={SONIC_LOGO || "/placeholder.svg"} alt="Sonic logo" className="h-7 w-7" />
                <span className="sr-only">Sonic</span>
              </span>
              <div>
                <div className="text-xl md:text-2xl font-semibold" style={{ color: BRAND.headline }}>
                  {purchaseType === "inft" ? "Mint AI Agent INFT" : "Buy Credits"}
                </div>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Network: {network === "testnet" ? "Sonic Blaze Testnet" : "Sonic Mainnet"} • Chain {chain.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {purchaseType === "inft" 
                    ? "Mint intelligent AI agents with credits included" 
                    : "Pay with USDC or native S on Sonic"
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NetworkToggle network={network} setNetwork={setNetwork} />
              <Button variant="outline" onClick={connect} className="gap-2">
                <Wallet className="h-4 w-4" />
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect"}
              </Button>
            </div>
          </div>

          {/* Brand motion header (optional) */}
          <div className="relative mt-2 rounded-lg overflow-hidden border hidden md:block">
            <video
              src={BRAND_VIDEO}
              className="w-full h-20 object-cover opacity-80"
              muted
              loop
              autoPlay
              playsInline
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={payWith} onValueChange={(v) => setPayWith(v as PaymentOption)} className="w-full">
            <div className="space-y-4">
              {/* Purchase Type Toggle */}
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-lg border p-1 flex gap-1 bg-background">
                  <button
                    onClick={() => setPurchaseType("credits")}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      purchaseType === "credits" 
                        ? "bg-foreground text-background" 
                        : "hover:bg-muted"
                    }`}
                  >
                    Buy Credits
                  </button>
                  <button
                    onClick={() => setPurchaseType("inft")}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      purchaseType === "inft" 
                        ? "bg-foreground text-background" 
                        : "hover:bg-muted"
                    }`}
                  >
                    Mint INFT Agent
                  </button>
                </div>
              </div>

              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="USDC" 
                  className="flex items-center gap-2 relative"
                  disabled={purchaseType === "inft"}
                >
                  <img src={USDC_LOGO || "/placeholder.svg"} alt="USDC logo" className="h-4 w-4" />
                  <span>USDC</span>
                  {purchaseType === "inft" && (
                    <Badge variant="secondary" className="ml-1 text-xs">Coming Soon</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="wS" className="flex items-center gap-2">
                  <img src={SONIC_LOGO || "/placeholder.svg"} alt="S logo" className="h-4 w-4" />
                  <span>Native S</span>
                  {purchaseType === "inft" && (
                    <Badge variant="default" className="ml-1 text-xs bg-green-600">Available</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="USDC" className="mt-6">
              <BalancesRow token="USDC" balance={usdcBalance} logoSrc={USDC_LOGO} note="USDC on Sonic" />
              {purchaseType === "inft" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>INFT minting with USDC coming soon!</p>
                  <p className="text-sm mt-2">Use Native S to mint INFT agents now.</p>
                </div>
              ) : (
                <PackageGrid 
                  selectedId={selectedId} 
                  setSelectedId={setSelectedId} 
                  payWith="USDC" 
                  purchaseType={purchaseType}
                />
              )}
            </TabsContent>

            <TabsContent value="wS" className="mt-6">
              <BalancesRow token="S" balance={wsBalance} logoSrc={SONIC_LOGO} note="Native S balance" />
              <PackageGrid 
                selectedId={selectedId} 
                setSelectedId={setSelectedId} 
                payWith="wS" 
                purchaseType={purchaseType}
              />
            </TabsContent>
          </Tabs>

          {/* Live ERC-1155 credits */}
          <div className="flex items-center justify-between rounded-lg border p-3 glass">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Credits</Badge>
              <span className="text-sm text-muted-foreground">
                ERC‑1155 token #{Number(addresses.CREDIT_TOKEN_ID ?? 0n)} on {network === "testnet" ? "Blaze" : "Mainnet"}
              </span>
            </div>
            <div className="text-sm">
              Balance: <span className="font-semibold">{Number(erc1155Credits).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">
                {selected.label} • {priceLabel}
              </span>
            </div>
            <Button
              onClick={buy}
              disabled={isPurchasing}
              className="min-w-[160px]"
              style={{ backgroundColor: BRAND.cta.bg, color: BRAND.cta.fg }}
              disabled={isPurchasing || (purchaseType === "inft" && payWith === "USDC")}
            >
              {isPurchasing 
                ? "Processing..." 
                : purchaseType === "inft" 
                  ? `Mint INFT with ${payWith === "USDC" ? "USDC" : "S"}` 
                  : `Buy Credits with ${payWith === "USDC" ? "USDC" : "S"}`
              }
            </Button>
          </div>

          {status === "success" && txHash && (
            <SuccessBanner
              hash={txHash}
              explorerBase={chain.blockExplorers?.default?.url}
            />
          )}

          {status === "error" && <ErrorBanner message={errorMsg ?? "An error occurred"} />}

          {!chainOk && (
            <div className="text-xs text-muted-foreground">
              Tip: We'll prompt a network switch to {network === "testnet" ? "Sonic Blaze Testnet" : "Sonic Mainnet"}.
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

function NetworkToggle({
  network,
  setNetwork,
}: {
  network: NetworkKey
  setNetwork: (n: NetworkKey) => void
}) {
  return (
    <div className="rounded-md border p-1 flex gap-1 bg-background">
      <button
        onClick={() => setNetwork("testnet")}
        className={`px-2.5 py-1 rounded ${network === "testnet" ? "bg-foreground text-background" : "hover:bg-muted"}`}
        aria-pressed={network === "testnet"}
      >
        Blaze Testnet
      </button>
      <button
        onClick={() => setNetwork("mainnet")}
        className={`px-2.5 py-1 rounded ${network === "mainnet" ? "bg-foreground text-background" : "hover:bg-muted"}`}
        aria-pressed={network === "mainnet"}
      >
        Mainnet
      </button>
    </div>
  )
}

function BalancesRow({
  token,
  balance,
  note,
  logoSrc,
}: {
  token: string
  balance: string
  note?: string
  logoSrc?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 glass">
      <div className="flex items-center gap-3">
        {logoSrc ? <img src={logoSrc || "/placeholder.svg"} alt={`${token} logo`} className="h-5 w-5" /> : null}
        <Badge variant="secondary">{token}</Badge>
        <span className="text-sm text-muted-foreground">{note}</span>
      </div>
      <div className="text-sm">
        Balance: <span className="font-semibold">{Number(balance).toLocaleString()}</span> {token}
      </div>
    </div>
  )
}

function PackageGrid({
  selectedId,
  setSelectedId,
  payWith,
  purchaseType,
}: {
  selectedId: string
  setSelectedId: (id: string) => void
  payWith: PaymentOption
  purchaseType: PurchaseType
}) {
  // Get model costs
  const imageCost = MODEL_COSTS.find((m: import("@/lib/credit-system-config").ModelCost) => m.type === 'image' && m.quality !== 'free')?.credits ?? 200
  const videoCost = MODEL_COSTS.find((m: import("@/lib/credit-system-config").ModelCost) => m.type === 'video')?.credits ?? 500
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CREDIT_PACKAGES.map((p: import("@/lib/credit-system-config").CreditPackage) => {
        const price = payWith === "USDC" ? `${Number(p.usdcPrice) / 1e6} USDC` : `${Number(p.wsTokenPrice) / 1e18} S`
        const credits = payWith === "USDC" ? p.usdcCredits : p.wsCredits
        const isSelected = selectedId === p.id
        // Calculate generations
        const imageGenerations = Math.floor(credits / imageCost)
        const videoGenerations = Math.floor(credits / videoCost)
        // Access logic
        const allModels = Number(p.usdcPrice) >= 50 * 1e6 || Number(p.wsTokenPrice) >= 150 * 1e18
        return (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`text-left rounded-xl border p-4 card-hover glass transition ${
              isSelected ? "border-foreground" : "border-foreground/10 hover:border-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{p.name} AI Agent</div>
              {p.popular && <Badge>Popular</Badge>}
            </div>
            <div className="mt-2 text-2xl font-bold">{price}</div>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-muted-foreground">{credits.toLocaleString()} credits included</div>
              <div className="text-xs"><span className="font-medium">Image Generations:</span> ~{imageGenerations}</div>
              <div className="text-xs"><span className="font-medium">Video Generations:</span> ~{videoGenerations}</div>
              <div className="text-xs"><span className="font-medium">Model Access:</span> {allModels ? 'All Models & Collections' : 'Basic Models Only'}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SuccessBanner({ hash, explorerBase }: { hash: string; explorerBase?: string }) {
  const url = explorerBase ? `${explorerBase}/tx/${hash}` : undefined
  return (
    <div className="w-full rounded-md border bg-green-50 p-3 text-green-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Purchase successful</span>
        </div>
        {url && (
          <a
            className="inline-flex items-center gap-1 text-xs rounded-full border px-2 py-1 bg-white hover:bg-gray-50"
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label="View on SonicScan"
            title="View on SonicScan"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View on SonicScan</span>
          </a>
        )}
      </div>
      <div className="mt-1 text-xs break-all">{hash}</div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="w-full rounded-md border bg-red-50 p-3 text-red-900">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Purchase failed</span>
      </div>
      <div className="mt-1 text-sm">{message}</div>
    </div>
  )
}