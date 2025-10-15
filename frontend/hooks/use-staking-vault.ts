"use client"

import { useContract, useContractWrite, useContractRead } from "@starknet-react/core"
import { ContractAddress } from "starknet"

// Adresses des contrats depuis .env.local
const STAKING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS as ContractAddress
const GAME_ENGINE_ADDRESS = process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS as ContractAddress
const PRIVACY_LAYER_ADDRESS = process.env.NEXT_PUBLIC_PRIVACY_LAYER_ADDRESS as ContractAddress
const PAYMENT_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS as ContractAddress

// ABI simplifié pour les contrats
const STAKING_VAULT_ABI = [
  {
    "type": "function",
    "name": "stake_bitcoin",
    "inputs": [
      { "name": "amount", "type": "u256" },
      { "name": "duration", "type": "u64" }
    ],
    "outputs": [{ "type": "u256" }],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "unstake",
    "inputs": [{ "name": "stake_id", "type": "u256" }],
    "outputs": [
      { "type": "u256" },
      { "type": "u256" }
    ],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "claim_rewards",
    "inputs": [{ "name": "stake_id", "type": "u256" }],
    "outputs": [{ "type": "u256" }],
    "stateMutability": "external"
  },
  {
    "type": "function",
    "name": "get_stake_info",
    "inputs": [
      { "name": "user", "type": "ContractAddress" },
      { "name": "stake_id", "type": "u256" }
    ],
    "outputs": [
      {
        "type": "struct",
        "name": "StakeInfo",
        "members": [
          { "name": "amount", "type": "u256" },
          { "name": "start_time", "type": "u64" },
          { "name": "duration", "type": "u64" },
          { "name": "claimed_rewards", "type": "u256" },
          { "name": "is_active", "type": "bool" },
          { "name": "apy_at_stake", "type": "u256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_total_staked",
    "inputs": [],
    "outputs": [{ "type": "u256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_staked",
    "inputs": [{ "name": "user", "type": "ContractAddress" }],
    "outputs": [{ "type": "u256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_current_apy",
    "inputs": [],
    "outputs": [{ "type": "u256" }],
    "stateMutability": "view"
  }
]

export function useStakingVault() {
  const { contract } = useContract({
    abi: STAKING_VAULT_ABI,
    address: STAKING_VAULT_ADDRESS
  })

  const { writeAsync: stakeBitcoin } = useContractWrite({
    calls: contract ? [contract.stake_bitcoin] : []
  })

  const { writeAsync: unstake } = useContractWrite({
    calls: contract ? [contract.unstake] : []
  })

  const { writeAsync: claimRewards } = useContractWrite({
    calls: contract ? [contract.claim_rewards] : []
  })

  const { data: totalStaked } = useContractRead({
    address: STAKING_VAULT_ADDRESS,
    abi: STAKING_VAULT_ABI,
    functionName: "get_total_staked",
    args: []
  })

  const { data: currentAPY } = useContractRead({
    address: STAKING_VAULT_ADDRESS,
    abi: STAKING_VAULT_ABI,
    functionName: "get_current_apy",
    args: []
  })

  return {
    contract,
    stakeBitcoin,
    unstake,
    claimRewards,
    totalStaked,
    currentAPY
  }
}
