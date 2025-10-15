"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRightLeft, Bitcoin, Ethereum, Zap, Globe, CreditCard } from "lucide-react"
import { useAccount } from "@starknet-react/core"

interface ChainInfo {
  chainId: number
  name: string
  isActive: boolean
  minAmount: number
  maxAmount: number
  feePercentage: number
}

interface PaymentStatus {
  paymentId: number
  fromChain: number
  toChain: number
  amount: number
  recipient: string
  status: number
  createdAt: number
  completedAt: number
  txHash: string
}

export function PaymentRouterDashboard() {
  const [fromChain, setFromChain] = useState(0) // Bitcoin
  const [toChain, setToChain] = useState(1) // Starknet
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const { address, status } = useAccount()

  const [supportedChains] = useState<ChainInfo[]>([
    {
      chainId: 0,
      name: "Bitcoin",
      isActive: true,
      minAmount: 1000,
      maxAmount: 21000000000000,
      feePercentage: 50 // 0.5%
    },
    {
      chainId: 1,
      name: "Starknet",
      isActive: true,
      minAmount: 1000,
      maxAmount: 1000000000000000,
      feePercentage: 30 // 0.3%
    },
    {
      chainId: 2,
      name: "Ethereum",
      isActive: true,
      minAmount: 1000000000000000,
      maxAmount: 1000000000000000000000,
      feePercentage: 100 // 1%
    }
  ])

  const [recentPayments] = useState<PaymentStatus[]>([
    {
      paymentId: 1,
      fromChain: 0,
      toChain: 1,
      amount: 1000000,
      recipient: "0x1234...5678",
      status: 2, // Completed
      createdAt: Date.now() - 3600000,
      completedAt: Date.now() - 3000000,
      txHash: "0xabc123..."
    },
    {
      paymentId: 2,
      fromChain: 1,
      toChain: 0,
      amount: 500000,
      recipient: "bc1qxy...",
      status: 1, // Processing
      createdAt: Date.now() - 1800000,
      completedAt: 0,
      txHash: "0xdef456..."
    }
  ])

  const getChainIcon = (chainId: number) => {
    switch (chainId) {
      case 0: return Bitcoin
      case 1: return Zap
      case 2: return Ethereum
      default: return Globe
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Pending"
      case 1: return "Processing"
      case 2: return "Completed"
      case 3: return "Failed"
      default: return "Unknown"
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "text-yellow-600"
      case 1: return "text-blue-600"
      case 2: return "text-green-600"
      case 3: return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const calculateFee = (amount: string, fromChain: number, toChain: number) => {
    if (!amount) return "0"
    const chain = supportedChains.find(c => c.chainId === fromChain)
    if (!chain) return "0"
    const fee = parseFloat(amount) * chain.feePercentage / 10000
    return fee.toFixed(8)
  }

  const handleRoutePayment = async () => {
    if (!address) return
    
    setIsProcessing(true)
    try {
      // TODO: Implement actual payment routing with contracts
      console.log("Routing payment:", { fromChain, toChain, amount, recipient })
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Payment routing failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (status !== "connected") {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6 text-center">
          <ArrowRightLeft className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Please connect your Starknet wallet to use payment routing
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Router */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            <span>Multi-Chain Payment Router</span>
          </CardTitle>
          <CardDescription>
            Route payments across different blockchains seamlessly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From Chain</label>
              <div className="space-y-2">
                {supportedChains.map((chain) => {
                  const Icon = getChainIcon(chain.chainId)
                  return (
                    <Button
                      key={chain.chainId}
                      variant={fromChain === chain.chainId ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFromChain(chain.chainId)}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {chain.name}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To Chain</label>
              <div className="space-y-2">
                {supportedChains.map((chain) => {
                  const Icon = getChainIcon(chain.chainId)
                  return (
                    <Button
                      key={chain.chainId}
                      variant={toChain === chain.chainId ? "default" : "outline"}
                      size="sm"
                      onClick={() => setToChain(chain.chainId)}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {chain.name}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Amount and Recipient */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Amount (Satoshi)
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Recipient Address
              </label>
              <Input
                placeholder="Enter recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
          </div>

          {/* Fee Preview */}
          {amount && (
            <Card className="bg-white/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Routing Fee</span>
                    <span className="font-medium">{calculateFee(amount, fromChain, toChain)} sats</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Net Amount</span>
                    <span className="font-medium">
                      {(parseFloat(amount) - parseFloat(calculateFee(amount, fromChain, toChain))).toFixed(8)} sats
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Button */}
          <Button
            onClick={handleRoutePayment}
            disabled={!amount || !recipient || isProcessing || fromChain === toChain}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? "Processing..." : "Route Payment"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <span>Recent Payments</span>
          </CardTitle>
          <CardDescription>
            Your recent cross-chain payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPayments.map((payment) => {
              const FromIcon = getChainIcon(payment.fromChain)
              const ToIcon = getChainIcon(payment.toChain)
              return (
                <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <FromIcon className="w-4 h-4 text-gray-600" />
                      <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                      <ToIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(payment.amount / 100000000).toFixed(8)} BTC
                      </p>
                      <p className="text-xs text-gray-500">{payment.recipient}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Supported Chains */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportedChains.map((chain) => {
          const Icon = getChainIcon(chain.chainId)
          return (
            <Card key={chain.chainId}>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{chain.name}</p>
                    <p className="text-lg font-semibold">{chain.feePercentage / 100}% fee</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

