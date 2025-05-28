import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Droplets } from "lucide-react";

export default function TokenFaucet() {
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Token Faucet</CardTitle>
        <Droplets className="h-4 w-4 text-accent opacity-70" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Get Sepolina Testnet tokens to explore D-AI's features
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 border border-gray text-foreground dark:text-white hover:border-accent transition-all hover:-translate-y-0.5"
            onClick={() => window.open('https://faucet.circle.com', '_blank')}
          >
            <span className="flex items-center gap-2">
              DLOOP <ExternalLink className="h-3 w-3" />
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border border-gray text-foreground dark:text-white hover:border-accent transition-all hover:-translate-y-0.5"
            onClick={() => window.open('https://faucet.circle.com', '_blank')}
          >
            <span className="flex items-center gap-2">
              USDC <ExternalLink className="h-3 w-3" />
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border border-gray text-foreground dark:text-white hover:border-accent transition-all hover:-translate-y-0.5"
            onClick={() => window.open('https://faucet.quicknode.com/ethereum/sepolia/?transactionId=682ccfe3617f9d59318139d6', '_blank')}
          >
            <span className="flex items-center gap-2">
              ETH <ExternalLink className="h-3 w-3" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}