"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet/wallet-connect"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satoshi Vault</h1>
          <p className="text-sm text-gray-500">Bitcoin Staking on Starknet</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}

