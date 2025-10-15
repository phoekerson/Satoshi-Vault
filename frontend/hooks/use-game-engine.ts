"use client"

import { useContract, useContractWrite, useContractRead } from "@starknet-react/core"
import { ContractAddress } from "starknet"

const GAME_ENGINE_ADDRESS = process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS as ContractAddress

const GAME_ENGINE_ABI = [
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
  },
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
  },
  {
    "type": "function",
    "name": "get_user_achievements",
    "inputs": [{ "name": "user", "type": "ContractAddress" }],
    "outputs": [{ "type": "array", "member": { "type": "u8" } }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_achievement_info",
    "inputs": [{ "name": "achievement_type", "type": "u8" }],
    "outputs": [
      {
        "type": "struct",
        "name": "AchievementInfo",
        "members": [
          { "name": "name", "type": "felt252" },
          { "name": "description", "type": "felt252" },
          { "name": "points_reward", "type": "u256" },
          { "name": "nft_uri", "type": "felt252" },
          { "name": "is_active", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "check_achievements",
    "inputs": [{ "name": "user", "type": "ContractAddress" }],
    "outputs": [],
    "stateMutability": "external"
  }
]

export function useGameEngine() {
  const { contract } = useContract({
    abi: GAME_ENGINE_ABI,
    address: GAME_ENGINE_ADDRESS
  })

  const { writeAsync: checkAchievements } = useContractWrite({
    calls: contract ? [contract.check_achievements] : []
  })

  return {
    contract,
    checkAchievements
  }
}
