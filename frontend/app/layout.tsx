import { Layout } from "@/components/layout/layout"
import { Providers } from "@/components/providers/providers"
import "./globals.css"

export const metadata = {
  title: "Satoshi Vault - Bitcoin Staking on Starknet",
  description: "The future of Bitcoin staking with privacy, gamification, and multi-chain support",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  )
}