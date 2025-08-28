
app - page.tsx

import { CreditWidget } from "@/components/credit-widget"

export default function Page() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <CreditWidget />
      </div>
    </main>
  )
}


app - purchase - page.tsx

import { NextRequest, NextResponse } from "next/server"

// Mock purchase API as a fallback when PAYMENT_CONTRACT_ADDRESS is not set.
// This does NOT touch the blockchain. Replace/remove once your contracts are live.
export async function POST(request: NextRequest) {
  try {
    const { userAddress, packageId, paymentToken } = await request.json()

    if (!userAddress || !packageId || !paymentToken) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Credits mapping per package and payment token
    const id = Number(packageId)
    const credits =
      paymentToken === "USDC"
        ? id === 1
          ? 750
          : id === 2
          ? 8000
          : id === 3
          ? 100000
          : 260000
        : id === 1
        ? 1000
        : id === 2
        ? 10000
        : id === 3
        ? 115000
        : 290000

    const result = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`,
      packageId: id,
      paymentToken,
      creditsReceived: credits,
      userAddress,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error purchasing credits:", error)
    return NextResponse.json({ error: "Failed to purchase credits" }, { status: 500 })
  }
}



Components - credit-widget.tsx

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
const SONIC_LOGO = "/images/sonic-logo.png"
const USDC_LOGO = "/images/usdc-logo.png"
const BRAND_VIDEO = "/brand/logogif.mp4"

type PaymentOption = "USDC" | "S"

type CreditPackage = {
  id: number
  label: string
  priceUSDC: number
  creditsUSDC: number
  priceS: number
  creditsS: number
  popular?: boolean
}

const PACKAGES: CreditPackage[] = [
  { id: 1, label: "Starter",    priceUSDC: 5,    creditsUSDC: 750,    priceS: 5,    creditsS: 1000 },
  { id: 2, label: "Pro",        priceUSDC: 50,   creditsUSDC: 8000,   priceS: 50,   creditsS: 10000, popular: true },
  { id: 3, label: "Business",   priceUSDC: 500,  creditsUSDC: 100000, priceS: 500,  creditsS: 115000 },
  { id: 4, label: "Enterprise", priceUSDC: 1250, creditsUSDC: 260000, priceS: 1250, creditsS: 290000 },
]

// Hex helpers for wallet_switchEthereumChain
const toHexChainId = (id: number) => "0x" + id.toString(16)

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
  const [network, setNetwork] = useState<NetworkKey>("testnet")
  const { publicClient, walletClient, chain } = useViemClients(network)
  const addresses = getAddressesForNetwork(network)

  const [account, setAccount] = useState<Address>()
  const [chainOk, setChainOk] = useState<boolean>(false)

  const [payWith, setPayWith] = useState<PaymentOption>("USDC")
  const [selectedId, setSelectedId] = useState<number>(2) // default "Pro"
  const selected = useMemo(() => PACKAGES.find((p) => p.id === selectedId)!, [selectedId])

  const [usdcBalance, setUsdcBalance] = useState<string>("0.00")
  const [sBalance, setSBalance] = useState<string>("0.0000")
  const [erc1155Credits, setErc1155Credits] = useState<string>("0")

  const [isPurchasing, setIsPurchasing] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined)
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined)

  const priceLabel = useMemo(
    () => (payWith === "USDC" ? `${selected.priceUSDC} USDC` : `${selected.priceS} S`),
    [payWith, selected]
  )

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

  // Fetch balances (USDC, S, ERC1155 credits)
  useEffect(() => {
    if (!publicClient || !account) return
    ;(async () => {
      try {
        const [rawUSDC, rawS, rawCredits] = await Promise.all([
          addresses.USDC
            ? (publicClient.readContract({
                address: addresses.USDC,
                abi: USDC_ABI,
                functionName: "balanceOf",
                args: [account],
              }) as Promise<bigint>)
            : Promise.resolve(0n),
          publicClient.getBalance({ address: account }),
          addresses.CREDITS_ERC1155
            ? (publicClient.readContract({
                address: addresses.CREDITS_ERC1155,
                abi: ERC1155_ABI,
                functionName: "balanceOf",
                args: [account, addresses.CREDIT_TOKEN_ID],
              }) as Promise<bigint>)
            : Promise.resolve(0n),
        ])
        setUsdcBalance(formatUnits(rawUSDC, 6))
        setSBalance(formatUnits(rawS, 18))
        setErc1155Credits(rawCredits.toString())
      } catch (err) {
        console.error("Failed to fetch balances", err)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, account, txHash, addresses.USDC, addresses.CREDITS_ERC1155, addresses.CREDIT_TOKEN_ID])

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

  const buy = async () => {
    if (!account) {
      await connect()
      if (!account) return
    }
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

      if (payWith === "USDC") {
        if (!addresses.USDC || !addresses.PAYMENT) throw new Error("Missing USDC or payment contract address")
        const amount = parseUnits(String(selected.priceUSDC), 6)
        await ensureAllowance(account, addresses.PAYMENT, amount)

        const { request } = await publicClient.simulateContract({
          account,
          address: addresses.PAYMENT,
          abi: PAYMENT_ABI,
          functionName: "buyWithUSDC",
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
        // Pay with native S
        if (!addresses.PAYMENT) throw new Error("Missing payment contract address")
        const value = parseUnits(String(selected.priceS), 18)
        const { request } = await publicClient.simulateContract({
          account,
          address: addresses.PAYMENT,
          abi: PAYMENT_ABI,
          functionName: "buyWithSonic",
          args: [BigInt(selected.id)],
          value,
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
                  Buy Credits
                </div>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Network: {network === "testnet" ? "Sonic Blaze Testnet" : "Sonic Mainnet"} • Chain {chain.id}
                </p>
                <p className="text-xs text-muted-foreground">Pay with USDC or S on Sonic</p>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="USDC" className="flex items-center gap-2">
                <img src={USDC_LOGO || "/placeholder.svg"} alt="USDC logo" className="h-4 w-4" />
                <span>USDC</span>
              </TabsTrigger>
              <TabsTrigger value="S" className="flex items-center gap-2">
                <img src={SONIC_LOGO || "/placeholder.svg"} alt="Sonic logo" className="h-4 w-4" />
                <span>S (Sonic)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="USDC" className="mt-6">
              <BalancesRow token="USDC" balance={usdcBalance} logoSrc={USDC_LOGO} note="USDC on Sonic" />
              <PackageGrid selectedId={selectedId} setSelectedId={setSelectedId} payWith="USDC" />
            </TabsContent>

            <TabsContent value="S" className="mt-6">
              <BalancesRow token="S" balance={sBalance} logoSrc={SONIC_LOGO} note="Native S balance" />
              <PackageGrid selectedId={selectedId} setSelectedId={setSelectedId} payWith="S" />
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
            >
              {isPurchasing ? "Processing..." : `Buy with ${payWith}`}
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
              Tip: We’ll prompt a network switch to {network === "testnet" ? "Sonic Blaze Testnet" : "Sonic Mainnet"}.
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
}: {
  selectedId: number
  setSelectedId: (id: number) => void
  payWith: PaymentOption
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PACKAGES.map((p) => {
        const price = payWith === "USDC" ? `${p.priceUSDC} USDC` : `${p.priceS} S`
        const credits = payWith === "USDC" ? p.creditsUSDC : p.creditsS
        const isSelected = selectedId === p.id
        return (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`text-left rounded-xl border p-4 card-hover glass transition ${
              isSelected ? "border-foreground" : "border-foreground/10 hover:border-foreground/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{p.label}</div>
              {p.popular && <Badge>Popular</Badge>}
            </div>
            <div className="mt-2 text-2xl font-bold">{price}</div>
            <div className="mt-1 text-sm text-muted-foreground">{credits.toLocaleString()} credits</div>
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



lib - brand.ts

export const BRAND = {
  // Swap these to your exact brand palette/typography.
  fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  headline: "#0D0D12",
  gradient: {
    from: "rgba(140, 82, 255, 0.10)", // violet
    via: "rgba(93, 230, 255, 0.10)",  // cyan
    to: "rgba(255, 89, 125, 0.10)",   // pink
  },
  cta: {
    bg: "#111827",
    fg: "#FFFFFF",
  },
}


lib - contracts.ts

import { type Abi } from "viem"

// Minimal ERC20 (USDC) subset
export const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
    stateMutability: "nonpayable",
  },
] as const satisfies Abi

// Example minimal Payment contract ABI
// Replace with your real contract ABI if different.
export const PAYMENT_ABI = [
  {
    inputs: [{ name: "packageId", type: "uint256" }],
    name: "buyWithUSDC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "packageId", type: "uint256" }],
    name: "buyWithSonic",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const satisfies Abi

// Minimal ERC-1155 subset for reading balances
export const ERC1155_ABI = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    name: "balanceOfBatch",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "uri",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const satisfies Abi


lib - network-config.ts

import { type Address, defineChain } from "viem"

export type NetworkKey = "testnet" | "mainnet"

// Sonic Mainnet (id 146)
export const SONIC_MAINNET = defineChain({
  id: 146,
  name: "Sonic",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.soniclabs.com"] } },
  blockExplorers: { default: { name: "SonicScan", url: "https://sonicscan.org" } },
  contracts: {
    multicall3: {
      // typical Multicall3 deployment, replace if different on mainnet
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address,
    },
  },
})

// Sonic Blaze Testnet (id 57054)
export const SONIC_BLAZE_TESTNET = defineChain({
  id: 57054,
  name: "Sonic Blaze Testnet",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.blaze.soniclabs.com"] } },
  blockExplorers: { default: { name: "SonicScan", url: "https://testnet.sonicscan.org" } },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address,
    },
  },
})

// Per-network onchain addresses.
// Fill in your Mainnet values when ready.
export const ADDRESS_BOOK: Record<
  NetworkKey,
  {
    USDC?: Address
    PAYMENT?: Address
    CREDITS_ERC1155?: Address
    CREDIT_TOKEN_ID?: bigint
    explorerBase: string
  }
> = {
  testnet: {
    USDC: "0xA4879Fed32Ecbef99399e5cbC247E533421C4eC6" as Address, // Blaze USDC
    PAYMENT: "0x0000000000000000000000000000000000000000" as Address, // TODO: set your payment contract
    CREDITS_ERC1155: "0x0000000000000000000000000000000000000000" as Address, // TODO: set your ERC-1155
    CREDIT_TOKEN_ID: 1n, // default credits token id
    explorerBase: "https://testnet.sonicscan.org",
  },
  mainnet: {
    USDC: undefined, // TODO: set mainnet USDC address when available
    PAYMENT: "0x0000000000000000000000000000000000000000" as Address, // TODO: set your payment contract
    CREDITS_ERC1155: "0x0000000000000000000000000000000000000000" as Address, // TODO: set your ERC-1155
    CREDIT_TOKEN_ID: 1n,
    explorerBase: "https://sonicscan.org",
  },
}

export function getChainConfig(network: NetworkKey) {
  return network === "testnet" ? SONIC_BLAZE_TESTNET : SONIC_MAINNET
}

export function getAddressesForNetwork(network: NetworkKey) {
  return ADDRESS_BOOK[network]
}



public - brand - logogif.mp4 

C:\Users\PC\ServiceApp\myserviceprovider-app\public\brand\logogif.mp4

public - brand - images 
C:\Users\PC\ServiceApp\myserviceprovider-app\public\images\sonic-logo.png
