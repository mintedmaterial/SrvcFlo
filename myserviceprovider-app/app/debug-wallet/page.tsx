import { WalletDebug } from '@/components/wallet-debug'

export default function DebugWalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Wallet Connection Debug</h1>
        <WalletDebug />
      </div>
    </div>
  )
}