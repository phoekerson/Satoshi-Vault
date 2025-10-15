"use client"

import { ReactNode } from "react"
import { StarknetProvider } from "./starknet-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StarknetProvider>
      {children}
    </StarknetProvider>
  )
}
