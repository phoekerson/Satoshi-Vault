"use client"

import { useState } from "react"
import { StakingDashboard } from "@/components/staking/staking-dashboard"
import { GamificationDashboard } from "@/components/gamification/gamification-dashboard"
import { PrivacyDashboard } from "@/components/privacy/privacy-dashboard"
import { PaymentRouterDashboard } from "@/components/payment-router/payment-router-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bitcoin, Trophy, Shield, ArrowRightLeft } from "lucide-react"

type TabType = "staking" | "gamification" | "privacy" | "payment"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("staking")

  const tabs = [
    { id: "staking" as TabType, name: "Staking", icon: Bitcoin },
    { id: "gamification" as TabType, name: "Gamification", icon: Trophy },
    { id: "privacy" as TabType, name: "Privacy", icon: Shield },
    { id: "payment" as TabType, name: "Payment Router", icon: ArrowRightLeft },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "staking":
        return <StakingDashboard />
      case "gamification":
        return <GamificationDashboard />
      case "privacy":
        return <PrivacyDashboard />
      case "payment":
        return <PaymentRouterDashboard />
      default:
        return <StakingDashboard />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Welcome to Satoshi Vault</CardTitle>
          <CardDescription className="text-orange-100">
            The future of Bitcoin staking on Starknet with privacy, gamification, and multi-chain support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold">3%</p>
              <p className="text-sm text-orange-100">Current APY</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">ZK</p>
              <p className="text-sm text-orange-100">Privacy Layer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-orange-100">Chains Supported</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 justify-start"
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </Button>
          )
        })}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  )
}