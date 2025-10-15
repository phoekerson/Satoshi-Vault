"use client"

import { Home, Grid3X3, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Hub", href: "/hub", icon: Grid3X3 },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Satoshi Vault</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.name === "Home" 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Powered by Starknet</span>
          </div>
        </div>
      </div>
    </div>
  )
}

