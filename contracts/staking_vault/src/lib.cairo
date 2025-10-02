use starknet::ContractAddress;
use starknet::get_caller_address;
use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

/// Interface for Bitcoin Staking Vault
#[starknet::interface]
pub trait IBitcoinStakingVault<TContractState> {
    /// Stake Bitcoin and receive staking tokens
    fn stake_bitcoin(ref self: TContractState, amount: u256, duration: u64) -> u256;
    /// Unstake and claim rewards
    fn unstake(ref self: TContractState, stake_id: u256) -> (u256, u256);
    /// Claim accumulated rewards
    fn claim_rewards(ref self: TContractState, stake_id: u256) -> u256;
    /// Get staking information for a user
    fn get_stake_info(self: @TContractState, user: ContractAddress, stake_id: u256) -> StakeInfo;
    /// Get total staked amount
    fn get_total_staked(self: @TContractState) -> u256;
    /// Get user's total staked amount
    fn get_user_staked(self: @TContractState, user: ContractAddress) -> u256;
    /// Get current APY
    fn get_current_apy(self: @TContractState) -> u256;
    /// Emergency pause/unpause
    fn set_paused(ref self: TContractState, paused: bool);
    /// Admin functions
    fn set_apy(ref self: TContractState, new_apy: u256);
    fn set_min_stake(ref self: TContractState, min_amount: u256);
    fn set_max_stake(ref self: TContractState, max_amount: u256);
}

/// Stake information structure
#[derive(Drop, Serde, starknet::Store)]
pub struct StakeInfo {
    pub amount: u256,
    pub start_time: u64,
    pub duration: u64,
    pub claimed_rewards: u256,
    pub is_active: bool,
    pub apy_at_stake: u256,
}

/// Bitcoin Staking Vault Contract
#[starknet::contract]
pub mod BitcoinStakingVault {
    use super::{StakeInfo, IBitcoinStakingVault, ContractAddress, get_caller_address};
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::storage::Map;
    use core::starknet::storage::StorageMapReadAccess;
    use core::starknet::storage::StorageMapWriteAccess;

    #[storage]
    struct Storage {
        // Admin
        admin: ContractAddress,
        paused: bool,
        
        // Staking parameters
        current_apy: u256,
        min_stake_amount: u256,
        max_stake_amount: u256,
        total_staked: u256,
        
        // User stakes
        user_stakes: Map<(ContractAddress, u256), StakeInfo>,
        user_stake_count: Map<ContractAddress, u256>,
        user_total_staked: Map<ContractAddress, u256>,
        
        // Global stake counter
        next_stake_id: u256,
        
        // Emergency
        emergency_withdraw_enabled: bool,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        initial_apy: u256,
        min_stake: u256,
        max_stake: u256
    ) {
        self.admin.write(admin);
        self.current_apy.write(initial_apy);
        self.min_stake_amount.write(min_stake);
        self.max_stake_amount.write(max_stake);
        self.paused.write(false);
        self.emergency_withdraw_enabled.write(false);
        self.next_stake_id.write(1);
    }

    #[abi(embed_v0)]
    impl BitcoinStakingVaultImpl of IBitcoinStakingVault<ContractState> {
        fn stake_bitcoin(ref self: ContractState, amount: u256, duration: u64) -> u256 {
            let caller = get_caller_address();
            assert(!self.paused.read(), 'Contract is paused');
            assert(amount >= self.min_stake_amount.read(), 'Amount below minimum');
            assert(amount <= self.max_stake_amount.read(), 'Amount above maximum');
            assert(duration >= 30, 'Duration too short'); // Minimum 30 days
            assert(duration <= 365, 'Duration too long'); // Maximum 1 year
            
            let stake_id = self.next_stake_id.read();
            self.next_stake_id.write(stake_id + 1);
            
            let current_time = starknet::get_block_timestamp();
            let apy = self.current_apy.read();
            
            let stake_info = StakeInfo {
                amount,
                start_time: current_time,
                duration,
                claimed_rewards: 0,
                is_active: true,
                apy_at_stake: apy,
            };
            
            self.user_stakes.write((caller, stake_id), stake_info);
            
            // Update counters
            let user_count = self.user_stake_count.read(caller) + 1;
            self.user_stake_count.write(caller, user_count);
            
            let user_total = self.user_total_staked.read(caller) + amount;
            self.user_total_staked.write(caller, user_total);
            
            let total = self.total_staked.read() + amount;
            self.total_staked.write(total);
            
            stake_id
        }

        fn unstake(ref self: ContractState, stake_id: u256) -> (u256, u256) {
            let caller = get_caller_address();
            let mut stake_info = self.user_stakes.read((caller, stake_id));
            
            assert(stake_info.is_active, 'Stake not active');
            
            let current_time = starknet::get_block_timestamp();
            let time_elapsed = current_time - stake_info.start_time;
            
            assert(time_elapsed >= stake_info.duration, 'Stake not matured');
            
            // Calculate rewards
            let rewards = self._calculate_rewards(stake_info);
            
            // Mark as inactive
            stake_info.is_active = false;
            stake_info.claimed_rewards = rewards;
            self.user_stakes.write((caller, stake_id), stake_info);
            
            // Update counters
            let user_total = self.user_total_staked.read(caller) - stake_info.amount;
            self.user_total_staked.write(caller, user_total);
            
            let total = self.total_staked.read() - stake_info.amount;
            self.total_staked.write(total);
            
            (stake_info.amount, rewards)
        }

        fn claim_rewards(ref self: ContractState, stake_id: u256) -> u256 {
            let caller = get_caller_address();
            let mut stake_info = self.user_stakes.read((caller, stake_id));
            
            assert(stake_info.is_active, 'Stake not active');
            
            let rewards = self._calculate_rewards(stake_info);
            stake_info.claimed_rewards = stake_info.claimed_rewards + rewards;
            
            self.user_stakes.write((caller, stake_id), stake_info);
            
            rewards
        }

        fn get_stake_info(self: @ContractState, user: ContractAddress, stake_id: u256) -> StakeInfo {
            self.user_stakes.read((user, stake_id))
        }

        fn get_total_staked(self: @ContractState) -> u256 {
            self.total_staked.read()
        }

        fn get_user_staked(self: @ContractState, user: ContractAddress) -> u256 {
            self.user_total_staked.read(user)
        }

        fn get_current_apy(self: @ContractState) -> u256 {
            self.current_apy.read()
        }

        fn set_paused(ref self: ContractState, paused: bool) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.paused.write(paused);
        }

        fn set_apy(ref self: ContractState, new_apy: u256) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            assert(new_apy <= 5000, 'APY too high'); // Max 50%
            self.current_apy.write(new_apy);
        }

        fn set_min_stake(ref self: ContractState, min_amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.min_stake_amount.write(min_amount);
        }

        fn set_max_stake(ref self: ContractState, max_amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.max_stake_amount.write(max_amount);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _calculate_rewards(self: @ContractState, stake_info: StakeInfo) -> u256 {
            let current_time = starknet::get_block_timestamp();
            let time_elapsed = current_time - stake_info.start_time;
            
            // Calculate rewards based on time elapsed and APY
            let seconds_in_year = 365 * 24 * 60 * 60;
            let time_factor = time_elapsed * 10000 / seconds_in_year; // Basis points
            let apy_basis_points = stake_info.apy_at_stake;
            
            let rewards = stake_info.amount * time_factor * apy_basis_points / 1000000;
            
            rewards - stake_info.claimed_rewards
        }
    }
}
