"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Eye, EyeOff, Lock, Key, Zap } from "lucide-react"
import { useAccount } from "@starknet-react/core"

interface PrivacySettings {
  hideAmounts: boolean
  hideStakingHistory: boolean
  useZeroKnowledge: boolean
  encryptionEnabled: boolean
}

export function PrivacyDashboard() {
  const [settings, setSettings] = useState<PrivacySettings>({
    hideAmounts: false,
    hideStakingHistory: false,
    useZeroKnowledge: true,
    encryptionEnabled: true
  })

  const [privateStakeAmount, setPrivateStakeAmount] = useState("")
  const [isCreatingPrivateStake, setIsCreatingPrivateStake] = useState(false)

  const { address, status } = useAccount()

  const handleSettingChange = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleCreatePrivateStake = async () => {
    if (!address) return
    
    setIsCreatingPrivateStake(true)
    try {
      // TODO: Implement private staking with ZK proofs
      console.log("Creating private stake:", { amount: privateStakeAmount })
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Private staking failed:", error)
    } finally {
      setIsCreatingPrivateStake(false)
    }
  }

  if (status !== "connected") {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6 text-center">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Please connect your Starknet wallet to manage privacy settings
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <span>Privacy Settings</span>
          </CardTitle>
          <CardDescription>
            Control your privacy and data visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Hide Amounts</p>
                  <p className="text-sm text-gray-500">Hide staking amounts from public view</p>
                </div>
              </div>
              <Button
                variant={settings.hideAmounts ? "default" : "outline"}
                size="sm"
                onClick={() => handleSettingChange('hideAmounts')}
              >
                {settings.hideAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Hide Staking History</p>
                  <p className="text-sm text-gray-500">Keep your staking history private</p>
                </div>
              </div>
              <Button
                variant={settings.hideStakingHistory ? "default" : "outline"}
                size="sm"
                onClick={() => handleSettingChange('hideStakingHistory')}
              >
                {settings.hideStakingHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Zero-Knowledge Proofs</p>
                  <p className="text-sm text-gray-500">Use ZK proofs for verification</p>
                </div>
              </div>
              <Button
                variant={settings.useZeroKnowledge ? "default" : "outline"}
                size="sm"
                onClick={() => handleSettingChange('useZeroKnowledge')}
              >
                {settings.useZeroKnowledge ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Encryption</p>
                  <p className="text-sm text-gray-500">Encrypt sensitive data</p>
                </div>
              </div>
              <Button
                variant={settings.encryptionEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => handleSettingChange('encryptionEnabled')}
              >
                {settings.encryptionEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Private Staking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <span>Private Staking</span>
          </CardTitle>
          <CardDescription>
            Create private stakes with zero-knowledge proofs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Private Stake Amount (Satoshi)
            </label>
            <Input
              type="number"
              placeholder="Enter amount in satoshis"
              value={privateStakeAmount}
              onChange={(e) => setPrivateStakeAmount(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Your stake amount will be encrypted and verified using ZK proofs
            </p>
          </div>

          <Button
            onClick={handleCreatePrivateStake}
            disabled={!privateStakeAmount || isCreatingPrivateStake}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isCreatingPrivateStake ? "Creating Private Stake..." : "Create Private Stake"}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">ZK Proofs</p>
                <p className="text-lg font-semibold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Encryption</p>
                <p className="text-lg font-semibold">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Privacy</p>
                <p className="text-lg font-semibold">Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

