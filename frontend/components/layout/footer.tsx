"use client"

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-gray-800 font-bold text-xs">S</span>
          </div>
          <span className="text-sm font-medium">Satoshi Vault</span>
        </div>
        
        <div className="text-xs text-gray-400">
          <span>Powered by Starknet</span>
        </div>
      </div>
    </footer>
  )
}

