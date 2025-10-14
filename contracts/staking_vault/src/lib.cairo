use starknet::ContractAddress;
use starknet::get_caller_address;

#[starknet::interface]
pub trait IBitcoinStakingVault<TContractState> {
    fn stake_bitcoin(ref self: TContractState, amount: u256, duration: u64) -> u256;
    fn unstake(ref self: TContractState, stake_id: u256) -> (u256, u256);
    fn claim_rewards(ref self: TContractState, stake_id: u256) -> u256;
    fn get_stake_info(self: @TContractState, user: ContractAddress, stake_id: u256) -> StakeInfo;
    fn get_total_staked(self: @TContractState) -> u256;
    fn get_user_staked(self: @TContractState, user: ContractAddress) -> u256;
    fn get_current_apy(self: @TContractState) -> u256;
    fn set_paused(ref self: TContractState, paused: bool);
    fn set_apy(ref self: TContractState, new_apy: u256);
    fn set_min_stake(ref self: TContractState, min_amount: u256);
    fn set_max_stake(ref self: TContractState, max_amount: u256);
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct StakeInfo {
    pub amount: u256,
    pub start_time: u64,
    pub duration: u64,
    pub claimed_rewards: u256,
    pub is_active: bool,
    pub apy_at_stake: u256,
}

#[starknet::contract]
pub mod BitcoinStakingVault {
    use super::{StakeInfo, IBitcoinStakingVault, ContractAddress, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StorageMapReadAccess, StorageMapWriteAccess
    };

    #[storage]
    struct Storage {
        admin: ContractAddress,
        paused: bool,
        current_apy: u256,
        min_stake_amount: u256,
        max_stake_amount: u256,
        total_staked: u256,
        user_stakes: Map<(ContractAddress, u256), StakeInfo>,
        user_stake_count: Map<ContractAddress, u256>,
        user_total_staked: Map<ContractAddress, u256>,
        next_stake_id: u256,
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
            assert(duration >= 30, 'Duration too short');
            assert(duration <= 365, 'Duration too long');
            
            let stake_id = self.next_stake_id.read();
            self.next_stake_id.write(stake_id + 1);
            
            let current_time = starknet::get_block_timestamp();
            let apy = self.current_apy.read();
            let duration_secs = duration * 24 * 60 * 60;
            
            let stake_info = StakeInfo {
                amount,
                start_time: current_time,
                duration: duration_secs,
                claimed_rewards: 0,
                is_active: true,
                apy_at_stake: apy,
            };
            
            self.user_stakes.write((caller, stake_id), stake_info);
            
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
            let stake_info = self.user_stakes.read((caller, stake_id));
            
            assert(stake_info.is_active, 'Stake not active');
            
            let current_time = starknet::get_block_timestamp();
            let time_elapsed = current_time - stake_info.start_time;
            
            assert(time_elapsed >= stake_info.duration, 'Stake not matured');
            
            let rewards = self._calculate_rewards(stake_info);
            
            let updated_stake = StakeInfo {
                amount: stake_info.amount,
                start_time: stake_info.start_time,
                duration: stake_info.duration,
                claimed_rewards: rewards,
                is_active: false,
                apy_at_stake: stake_info.apy_at_stake,
            };
            self.user_stakes.write((caller, stake_id), updated_stake);
            
            let user_total = self.user_total_staked.read(caller) - stake_info.amount;
            self.user_total_staked.write(caller, user_total);
            
            let total = self.total_staked.read() - stake_info.amount;
            self.total_staked.write(total);
            
            (stake_info.amount, rewards)
        }

        fn claim_rewards(ref self: ContractState, stake_id: u256) -> u256 {
            let caller = get_caller_address();
            let stake_info = self.user_stakes.read((caller, stake_id));
            
            assert(stake_info.is_active, 'Stake not active');
            
            let rewards = self._calculate_rewards(stake_info);
            
            let updated_stake = StakeInfo {
                amount: stake_info.amount,
                start_time: stake_info.start_time,
                duration: stake_info.duration,
                claimed_rewards: stake_info.claimed_rewards + rewards,
                is_active: stake_info.is_active,
                apy_at_stake: stake_info.apy_at_stake,
            };
            self.user_stakes.write((caller, stake_id), updated_stake);
            
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
            assert(new_apy <= 5000, 'APY too high');
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
            let current_time: u64 = starknet::get_block_timestamp();
            let time_elapsed: u64 = current_time - stake_info.start_time;
            
            let seconds_in_year: u256 = 365 * 24 * 60 * 60;
            let time_elapsed_u256: u256 = time_elapsed.into();
            let apy_basis_points: u256 = stake_info.apy_at_stake;
            
            let time_ratio_bp: u256 = (time_elapsed_u256 * 10000) / seconds_in_year;
            let rewards_bp: u256 = (stake_info.amount * apy_basis_points * time_ratio_bp) / 10000;
            
            if rewards_bp > stake_info.claimed_rewards {
                rewards_bp - stake_info.claimed_rewards
            } else {
                0
            }
        }
    }
}