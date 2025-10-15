"use client"

import { ReactNode } from "react"
import { StarknetConfig, publicProvider } from "@starknet-react/core"
import { sepolia } from "@starknet-react/chains"

const chains = [sepolia]

export function StarknetProvider({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      autoConnect
    >
      {children}
    </StarknetConfig>
  )
}
