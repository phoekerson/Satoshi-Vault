"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bitcoin, TrendingUp, Clock, Shield } from "lucide-react"
import { useAccount } from "@starknet-react/core"
import { useStakingVault } from "@/hooks/use-staking-vault"
import { formatUnits } from "starknet"

interface StakeInfo {
  amount: string
  duration: number
  apy: number
  rewards: string
}

export function StakingDashboard() {
  const [stakeAmount, setStakeAmount] = useState("")
  const [stakeDuration, setStakeDuration] = useState(30)
  const [isStaking, setIsStaking] = useState(false)
  const [userStakes, setUserStakes] = useState<any[]>([])

  const { address, status } = useAccount()
  const { 
    stakeBitcoin, 
    unstake, 
    claimRewards, 
    totalStaked, 
    currentAPY 
  } = useStakingVault()

  const minStake = 1000 // 1000 satoshis
  const maxStake = 21000000000000 // 21M BTC in satoshis

  const calculateRewards = (amount: string, duration: number) => {
    if (!amount) return "0"
    const amountNum = parseFloat(amount)
    const apy = currentAPY ? Number(formatUnits(currentAPY, 0)) : 300
    const dailyRate = apy / 36500 // Convert basis points to daily rate
    const rewards = amountNum * dailyRate * duration
    return rewards.toFixed(8)
  }

  const handleStake = async () => {
    if (!address || !stakeBitcoin) return
    
    setIsStaking(true)
    try {
      const amount = BigInt(stakeAmount)
      const duration = BigInt(stakeDuration * 24 * 60 * 60) // Convert days to seconds
      
      await stakeBitcoin({
        args: [amount, duration]
      })
      
      setStakeAmount("")
      // Refresh user stakes
    } catch (error) {
      console.error("Staking failed:", error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (stakeId: string) => {
    if (!address || !unstake) return
    
    try {
      await unstake({
        args: [BigInt(stakeId)]
      })
      // Refresh user stakes
    } catch (error) {
      console.error("Unstaking failed:", error)
    }
  }

  const handleClaimRewards = async (stakeId: string) => {
    if (!address || !claimRewards) return
    
    try {
      await claimRewards({
        args: [BigInt(stakeId)]
      })
      // Refresh user stakes
    } catch (error) {
      console.error("Claiming rewards failed:", error)
    }
  }

  if (status !== "connected") {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="pt-6 text-center">
          <Bitcoin className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Please connect your Starknet wallet to start staking Bitcoin
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Staking Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bitcoin className="w-6 h-6 text-orange-600" />
            <span>Bitcoin Staking</span>
          </CardTitle>
          <CardDescription>
            Stake your Bitcoin and earn rewards with our secure vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Amount to Stake (Satoshi)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount in satoshis"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                sats
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Min: {minStake.toLocaleString()} sats • Max: {(maxStake / 100000000).toFixed(0)} BTC
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Staking Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 90, 180, 365].map((days) => (
                <Button
                  key={days}
                  variant={stakeDuration === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStakeDuration(days)}
                  className="text-xs"
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>

          {/* Rewards Preview */}
          {stakeAmount && (
            <Card className="bg-white/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">APY</span>
                    <span className="font-medium">
                      {currentAPY ? (Number(formatUnits(currentAPY, 0)) / 100).toFixed(2) : "3.00"}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{stakeDuration} days</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Estimated Rewards</span>
                    <span className="text-green-600">
                      {calculateRewards(stakeAmount, stakeDuration)} BTC
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stake Button */}
          <Button
            onClick={handleStake}
            disabled={!stakeAmount || isStaking || parseFloat(stakeAmount) < minStake}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {isStaking ? "Staking..." : "Stake Bitcoin"}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Current APY</p>
                <p className="text-lg font-semibold">
                  {currentAPY ? (Number(formatUnits(currentAPY, 0)) / 100).toFixed(2) : "3.00"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Min Duration</p>
                <p className="text-lg font-semibold">30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Security</p>
                <p className="text-lg font-semibold">ZK Proofs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

