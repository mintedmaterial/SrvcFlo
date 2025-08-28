import { CREDIT_PACKAGES, MODEL_COSTS } from "@/lib/credit-system-config"

export function CreditPackagePricingTable() {
  const imageCost = MODEL_COSTS.find((m: any) => m.type === 'image' && m.quality !== 'free')?.credits ?? 200
  const videoCost = MODEL_COSTS.find((m: any) => m.type === 'video')?.credits ?? 500
  return (
    <table className="w-full border rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-muted">
          <th className="p-2">Package</th>
          <th className="p-2">Credits</th>
          <th className="p-2">Images (~)</th>
          <th className="p-2">Videos (~)</th>
          <th className="p-2">Model Access</th>
        </tr>
      </thead>
      <tbody>
        {CREDIT_PACKAGES.map((pkg: any) => {
          const allModels = Number(pkg.usdcPrice) >= 50 * 1e6 || Number(pkg.wsTokenPrice) >= 150 * 1e18
          return (
            <tr key={pkg.id} className="border-t">
              <td className="p-2 font-semibold">{pkg.name}</td>
              <td className="p-2">{pkg.usdcCredits}</td>
              <td className="p-2">{Math.floor(pkg.usdcCredits / imageCost)}</td>
              <td className="p-2">{Math.floor(pkg.usdcCredits / videoCost)}</td>
              <td className="p-2">{allModels ? 'All Models & Collections' : 'Basic Models Only'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
