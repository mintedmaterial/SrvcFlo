export interface TokenPair {
  name: string
  symbol1: string
  symbol2: string
  icon1: string
  icon2: string
  protocol: string
  fees: string
  liquidity: string
  volume24h?: string
  fee24h?: string
  apr: string
}

interface MarketDataTableProps {
  pairs: TokenPair[]
  showVolume?: boolean
  showFees?: boolean
}

export function MarketDataTable({ pairs, showVolume = true, showFees = true }: MarketDataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-sonic-dark">
            <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Name</th>
            <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Liquidity</th>
            {showVolume && (
              <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Volume (24H)</th>
            )}
            {showFees && <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Fee (24H)</th>}
            <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">APR</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, index) => (
            <tr
              key={index}
              className={`${index < pairs.length - 1 ? "border-b border-sonic-dark/20" : ""} hover:bg-sonic-dark/10`}
            >
              <td className="py-3 px-2">
                <div className="flex items-center">
                  <div className="flex -space-x-2 mr-2">
                    <div
                      className={`h-8 w-8 rounded-full ${pair.icon1} flex items-center justify-center text-white text-xs border-2 border-sonic-dark`}
                    >
                      {pair.symbol1}
                    </div>
                    <div
                      className={`h-8 w-8 rounded-full ${pair.icon2} flex items-center justify-center text-white text-xs border-2 border-sonic-dark`}
                    >
                      {pair.symbol2}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white">{pair.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {pair.protocol} - {pair.fees}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-white">{pair.liquidity}</td>
              {showVolume && <td className="py-3 px-2 text-right text-white">{pair.volume24h}</td>}
              {showFees && <td className="py-3 px-2 text-right text-white">{pair.fee24h}</td>}
              <td className="py-3 px-2 text-right text-sonic-gold font-medium">{pair.apr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}