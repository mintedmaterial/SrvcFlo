import { CreditWidget } from "@/components/credit-widget"

export default function CreditsPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <CreditWidget />
      </div>
    </main>
  )
}