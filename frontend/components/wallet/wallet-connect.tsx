"use client"

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core"
import { Button } from "@/components/ui/button"
import { Wallet, User, ChevronDown } from "lucide-react"

export function WalletConnect() {
  const { account, address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (status === "connected") {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(address || "")}
          </span>
          <span className="text-xs text-green-600">Connected</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => disconnect()}>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => {
          if (connectors.length > 0) {
            connect({ connector: connectors[0] })
          }
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    </div>
  )
}
