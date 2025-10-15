"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Trophy, Award, Users } from "lucide-react"
import { useAccount } from "@starknet-react/core"
import { useGameEngine } from "@/hooks/use-game-engine"
import { useContractRead } from "@starknet-react/core"
import { formatUnits } from "starknet"

interface UserProfile {
  totalScore: number
  level: number
  stakingStreak: number
  totalStaked: number
  achievementsUnlocked: number
  lastActivity: number
}

interface Achievement {
  id: number
  name: string
  description: string
  pointsReward: number
  nftUri: string
  isActive: boolean
  unlocked: boolean
}

interface LeaderboardEntry {
  user: string
  score: number
  level: number
}

export function GamificationDashboard() {
  const { address, status } = useAccount()
  const { checkAchievements } = useGameEngine()
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    totalScore: 0,
    level: 1,
    stakingStreak: 0,
    totalStaked: 0,
    achievementsUnlocked: 0,
    lastActivity: Date.now()
  })

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // Fetch user profile from contract
  const { data: userProfileData } = useContractRead({
    address: process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS as any,
    abi: [
      {
        "type": "function",
        "name": "get_user_profile",
        "inputs": [{ "name": "user", "type": "ContractAddress" }],
        "outputs": [
          {
            "type": "struct",
            "name": "UserProfile",
            "members": [
              { "name": "total_score", "type": "u256" },
              { "name": "level", "type": "u8" },
              { "name": "staking_streak", "type": "u64" },
              { "name": "total_staked", "type": "u256" },
              { "name": "achievements_unlocked", "type": "u8" },
              { "name": "last_activity", "type": "u64" }
            ]
          }
        ],
        "stateMutability": "view"
      }
    ],
    functionName: "get_user_profile",
    args: address ? [address] : []
  })

  // Fetch leaderboard
  const { data: leaderboardData } = useContractRead({
    address: process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS as any,
    abi: [
      {
        "type": "function",
        "name": "get_leaderboard",
        "inputs": [{ "name": "limit", "type": "u8" }],
        "outputs": [
          {
            "type": "array",
            "member": {
              "type": "struct",
              "name": "LeaderboardEntry",
              "members": [
                { "name": "user", "type": "ContractAddress" },
                { "name": "score", "type": "u256" },
                { "name": "level", "type": "u8" }
              ]
            }
          }
        ],
        "stateMutability": "view"
      }
    ],
    functionName: "get_leaderboard",
    args: [10]
  })

  useEffect(() => {
    if (userProfileData) {
      setUserProfile({
        totalScore: Number(formatUnits(userProfileData.total_score, 0)),
        level: userProfileData.level,
        stakingStreak: userProfileData.staking_streak,
        totalStaked: Number(formatUnits(userProfileData.total_staked, 0)),
        achievementsUnlocked: userProfileData.achievements_unlocked,
        lastActivity: userProfileData.last_activity
      })
    }
  }, [userProfileData])

  useEffect(() => {
    if (leaderboardData) {
      setLeaderboard(leaderboardData.map((entry: any, index: number) => ({
        user: entry.user === address ? "You" : `${entry.user.slice(0, 6)}...${entry.user.slice(-4)}`,
        score: Number(formatUnits(entry.score, 0)),
        level: entry.level
      })))
    }
  }, [leaderboardData, address])

  const handleCheckAchievements = async () => {
    if (!address || !checkAchievements) return
    
    try {
      await checkAchievements({
        args: [address]
      })
    } catch (error) {
      console.error("Failed to check achievements:", error)
    }
  }

  if (status !== "connected") {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6 text-center">
          <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Please connect your Starknet wallet to view your gamification profile
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatSatoshi = (satoshi: number) => {
    return (satoshi / 100000000).toFixed(8)
  }

  const getLevelProgress = (score: number) => {
    const levelThreshold = 1000
    const currentLevelScore = score % levelThreshold
    return (currentLevelScore / levelThreshold) * 100
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-purple-600" />
            <span>Your Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{userProfile.level}</p>
              <p className="text-sm text-gray-600">Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{userProfile.totalScore}</p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{userProfile.stakingStreak}</p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{formatSatoshi(userProfile.totalStaked)}</p>
              <p className="text-sm text-gray-600">BTC Staked</p>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Level Progress</span>
              <span>{getLevelProgress(userProfile.totalScore).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getLevelProgress(userProfile.totalScore)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span>Achievements</span>
          </CardTitle>
          <CardDescription>
            Unlock achievements by staking Bitcoin and reaching milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlocked 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'
                    }`}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                    <p className="text-xs text-gray-400">+{achievement.pointsReward} points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Leaderboard</span>
          </CardTitle>
          <CardDescription>
            Top stakers and their scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.user === "You" ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-800' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      entry.user === "You" ? 'text-blue-800' : 'text-gray-700'
                    }`}>
                      {entry.user}
                    </p>
                    <p className="text-sm text-gray-500">Level {entry.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-700">{entry.score}</p>
                  <p className="text-sm text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

