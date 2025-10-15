export const CONTRACTS = {
  STAKING_VAULT: process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS!,
  GAME_ENGINE: process.env.NEXT_PUBLIC_GAME_ENGINE_ADDRESS!,
  PRIVACY_LAYER: process.env.NEXT_PUBLIC_PRIVACY_LAYER_ADDRESS!,
  PAYMENT_ROUTER: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS!,
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_ADDRESS!,
};

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'sepolia';

// ABIs for contracts
export const STAKING_VAULT_ABI = [
  {
    type: 'function',
    name: 'stake_bitcoin',
    inputs: [
      { name: 'amount', type: 'core::integer::u256' },
      { name: 'duration', type: 'core::integer::u64' }
    ],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'unstake',
    inputs: [{ name: 'stake_id', type: 'core::integer::u256' }],
    outputs: [
      { type: 'core::integer::u256' },
      { type: 'core::integer::u256' }
    ],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'claim_rewards',
    inputs: [{ name: 'stake_id', type: 'core::integer::u256' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'get_stake_info',
    inputs: [
      { name: 'user', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'stake_id', type: 'core::integer::u256' }
    ],
    outputs: [{ type: 'StakeInfo' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_total_staked',
    inputs: [],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_user_staked',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_current_apy',
    inputs: [],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
];

export const GAME_ENGINE_ABI = [
  {
    type: 'function',
    name: 'get_user_profile',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'UserProfile' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_leaderboard',
    inputs: [{ name: 'limit', type: 'core::integer::u8' }],
    outputs: [{ type: 'core::array::Array::<LeaderboardEntry>' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_user_achievements',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'core::array::Array::<core::integer::u8>' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_achievement_info',
    inputs: [{ name: 'achievement_type', type: 'core::integer::u8' }],
    outputs: [{ type: 'AchievementInfo' }],
    state_mutability: 'view'
  },
];

export const PRIVACY_LAYER_ABI = [
  {
    type: 'function',
    name: 'create_private_stake',
    inputs: [
      { name: 'encrypted_amount', type: 'core::felt252' },
      { name: 'commitment', type: 'core::felt252' }
    ],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'get_stake_commitment',
    inputs: [{ name: 'stake_id', type: 'core::integer::u256' }],
    outputs: [{ type: 'core::felt252' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_privacy_settings',
    inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ type: 'PrivacySettings' }],
    state_mutability: 'view'
  },
];

export const PAYMENT_ROUTER_ABI = [
  {
    type: 'function',
    name: 'bridge_bitcoin_to_starknet',
    inputs: [
      { name: 'amount', type: 'core::integer::u256' },
      { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' }
    ],
    outputs: [{ type: 'core::integer::u256' }],
    state_mutability: 'external'
  },
  {
    type: 'function',
    name: 'get_supported_chains',
    inputs: [],
    outputs: [{ type: 'core::array::Array::<ChainInfo>' }],
    state_mutability: 'view'
  },
  {
    type: 'function',
    name: 'get_payment_status',
    inputs: [{ name: 'payment_id', type: 'core::integer::u256' }],
    outputs: [{ type: 'PaymentStatus' }],
    state_mutability: 'view'
  },
];