use starknet::ContractAddress;
use starknet::get_caller_address;
use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use core::starknet::storage::Map;
use core::starknet::storage::StorageMapReadAccess;
use core::starknet::storage::StorageMapWriteAccess;

/// Interface for Game Engine (Gamification System)
#[starknet::interface]
pub trait IGameEngine<TContractState> {
    /// Mint achievement NFT
    fn mint_achievement(ref self: TContractState, user: ContractAddress, achievement_type: u8) -> u256;
    /// Update user score
    fn update_score(ref self: TContractState, user: ContractAddress, points: u256);
    /// Get user profile
    fn get_user_profile(self: @ContractState, user: ContractAddress) -> UserProfile;
    /// Get leaderboard
    fn get_leaderboard(self: @ContractState, limit: u8) -> Array<LeaderboardEntry>;
    /// Check and unlock achievements
    fn check_achievements(ref self: TContractState, user: ContractAddress);
    /// Get user achievements
    fn get_user_achievements(self: @ContractState, user: ContractAddress) -> Array<u8>;
    /// Get achievement info
    fn get_achievement_info(self: @ContractState, achievement_type: u8) -> AchievementInfo;
    /// Admin functions
    fn set_achievement_requirements(ref self: TContractState, achievement_type: u8, requirements: AchievementRequirements);
    fn set_nft_contract(ref self: TContractState, nft_contract: ContractAddress);
}

/// User profile structure
#[derive(Drop, Serde, starknet::Store)]
pub struct UserProfile {
    pub total_score: u256,
    pub level: u8,
    pub staking_streak: u64,
    pub total_staked: u256,
    pub achievements_unlocked: u8,
    pub last_activity: u64,
}

/// Leaderboard entry
#[derive(Drop, Serde, starknet::Store)]
pub struct LeaderboardEntry {
    pub user: ContractAddress,
    pub score: u256,
    pub level: u8,
}

/// Achievement information
#[derive(Drop, Serde, starknet::Store)]
pub struct AchievementInfo {
    pub name: felt252,
    pub description: felt252,
    pub points_reward: u256,
    pub nft_uri: felt252,
    pub is_active: bool,
}

/// Achievement requirements
#[derive(Drop, Serde, starknet::Store)]
pub struct AchievementRequirements {
    pub min_stake_amount: u256,
    pub min_staking_duration: u64,
    pub min_score: u256,
    pub min_streak: u64,
}

/// Game Engine Contract
#[starknet::contract]
pub mod GameEngine {
    use super::{
        UserProfile, LeaderboardEntry, AchievementInfo, AchievementRequirements,
        IGameEngine, ContractAddress, get_caller_address
    };
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::storage::Map;
    use core::starknet::storage::StorageMapReadAccess;
    use core::starknet::storage::StorageMapWriteAccess;
    use core::array::ArrayTrait;

    #[storage]
    struct Storage {
        // Admin
        admin: ContractAddress,
        nft_contract: ContractAddress,
        
        // User data
        user_profiles: Map<ContractAddress, UserProfile>,
        user_achievements: Map<(ContractAddress, u8), bool>,
        
        // Achievements
        achievement_info: Map<u8, AchievementInfo>,
        achievement_requirements: Map<u8, AchievementRequirements>,
        
        // Leaderboard
        leaderboard: Map<u256, LeaderboardEntry>,
        leaderboard_size: u256,
        
        // Game parameters
        score_per_satoshi: u256,
        level_threshold: u256,
        max_level: u8,
        
        // External contracts
        staking_vault: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        staking_vault: ContractAddress,
        nft_contract: ContractAddress
    ) {
        self.admin.write(admin);
        self.staking_vault.write(staking_vault);
        self.nft_contract.write(nft_contract);
        self.score_per_satoshi.write(1); // 1 point per satoshi staked
        self.level_threshold.write(1000); // 1000 points per level
        self.max_level.write(100);
        self.leaderboard_size.write(0);
        
        // Initialize default achievements
        self._initialize_achievements();
    }

    #[abi(embed_v0)]
    impl GameEngineImpl of IGameEngine<ContractState> {
        fn mint_achievement(ref self: ContractState, user: ContractAddress, achievement_type: u8) -> u256 {
            let caller = get_caller_address();
            assert(caller == self.admin.read() || caller == self.nft_contract.read(), 'Unauthorized');
            
            let achievement_info = self.achievement_info.read(achievement_type);
            assert(achievement_info.is_active, 'Achievement not active');
            
            // Mark achievement as unlocked
            self.user_achievements.write((user, achievement_type), true);
            
            // Update user profile
            let mut profile = self.user_profiles.read(user);
            profile.achievements_unlocked += 1;
            profile.total_score += achievement_info.points_reward;
            self.user_profiles.write(user, profile);
            
            // Update leaderboard
            self._update_leaderboard(user);
            
            achievement_type.into()
        }

        fn update_score(ref self: ContractState, user: ContractAddress, points: u256) {
            let caller = get_caller_address();
            assert(caller == self.staking_vault.read(), 'Only staking vault');
            
            let mut profile = self.user_profiles.read(user);
            profile.total_score += points;
            profile.last_activity = starknet::get_block_timestamp();
            
            // Check level up
            let new_level = self._calculate_level(profile.total_score);
            if new_level > profile.level {
                profile.level = new_level;
            }
            
            self.user_profiles.write(user, profile);
            self._update_leaderboard(user);
        }

        fn get_user_profile(self: @ContractState, user: ContractAddress) -> UserProfile {
            self.user_profiles.read(user)
        }

        fn get_leaderboard(self: @ContractState, limit: u8) -> Array<LeaderboardEntry> {
            let mut result = ArrayTrait::new();
            let size = self.leaderboard_size.read();
            let actual_limit = if limit.into() < size { limit.into() } else { size };
            
            let mut i = 0;
            while i < actual_limit {
                let entry = self.leaderboard.read(i);
                result.append(entry);
                i += 1;
            };
            
            result
        }

        fn check_achievements(ref self: ContractState, user: ContractAddress) {
            let profile = self.user_profiles.read(user);
            
            // Check each achievement type
            let mut i = 0;
            while i < 10 { // Assuming 10 achievement types
                let achievement_type = i.try_into().unwrap();
                let requirements = self.achievement_requirements.read(achievement_type);
                let already_unlocked = self.user_achievements.read((user, achievement_type));
                
                if !already_unlocked && self._check_achievement_requirements(profile, requirements) {
                    // Unlock achievement
                    self.user_achievements.write((user, achievement_type), true);
                    
                    let mut updated_profile = profile;
                    updated_profile.achievements_unlocked += 1;
                    let achievement_info = self.achievement_info.read(achievement_type);
                    updated_profile.total_score += achievement_info.points_reward;
                    self.user_profiles.write(user, updated_profile);
                };
                
                i += 1;
            };
        }

        fn get_user_achievements(self: @ContractState, user: ContractAddress) -> Array<u8> {
            let mut result = ArrayTrait::new();
            let mut i = 0;
            while i < 10 {
                let achievement_type = i.try_into().unwrap();
                if self.user_achievements.read((user, achievement_type)) {
                    result.append(achievement_type);
                };
                i += 1;
            };
            result
        }

        fn get_achievement_info(self: @ContractState, achievement_type: u8) -> AchievementInfo {
            self.achievement_info.read(achievement_type)
        }

        fn set_achievement_requirements(ref self: ContractState, achievement_type: u8, requirements: AchievementRequirements) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.achievement_requirements.write(achievement_type, requirements);
        }

        fn set_nft_contract(ref self: ContractState, nft_contract: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.nft_contract.write(nft_contract);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _initialize_achievements(ref self: ContractState) {
            // Achievement 0: First Stake
            let first_stake = AchievementInfo {
                name: 'First Stake',
                description: 'Stake your first Bitcoin',
                points_reward: 100,
                nft_uri: 'https://api.bitvault.com/nft/first-stake.json',
                is_active: true,
            };
            self.achievement_info.write(0, first_stake);
            
            let first_stake_req = AchievementRequirements {
                min_stake_amount: 1,
                min_staking_duration: 0,
                min_score: 0,
                min_streak: 0,
            };
            self.achievement_requirements.write(0, first_stake_req);
            
            // Achievement 1: Big Staker
            let big_staker = AchievementInfo {
                name: 'Big Staker',
                description: 'Stake 1 BTC or more',
                points_reward: 500,
                nft_uri: 'https://api.bitvault.com/nft/big-staker.json',
                is_active: true,
            };
            self.achievement_info.write(1, big_staker);
            
            let big_staker_req = AchievementRequirements {
                min_stake_amount: 100000000, // 1 BTC in satoshis
                min_staking_duration: 0,
                min_score: 0,
                min_streak: 0,
            };
            self.achievement_requirements.write(1, big_staker_req);
            
            // Achievement 2: Long Term Holder
            let long_term = AchievementInfo {
                name: 'Long Term Holder',
                description: 'Stake for 365 days',
                points_reward: 1000,
                nft_uri: 'https://api.bitvault.com/nft/long-term.json',
                is_active: true,
            };
            self.achievement_info.write(2, long_term);
            
            let long_term_req = AchievementRequirements {
                min_stake_amount: 0,
                min_staking_duration: 365 * 24 * 60 * 60, // 365 days in seconds
                min_score: 0,
                min_streak: 0,
            };
            self.achievement_requirements.write(2, long_term_req);
        }

        fn _calculate_level(self: @ContractState, score: u256) -> u8 {
            let level_threshold = self.level_threshold.read();
            let level = score / level_threshold;
            let max_level = self.max_level.read();
            
            if level > max_level.into() {
                max_level
            } else {
                level.try_into().unwrap()
            }
        }

        fn _check_achievement_requirements(self: @ContractState, profile: UserProfile, requirements: AchievementRequirements) -> bool {
            profile.total_staked >= requirements.min_stake_amount &&
            profile.staking_streak >= requirements.min_streak &&
            profile.total_score >= requirements.min_score
        }

        fn _update_leaderboard(ref self: ContractState, user: ContractAddress) {
            let profile = self.user_profiles.read(user);
            let entry = LeaderboardEntry {
                user,
                score: profile.total_score,
                level: profile.level,
            };
            
            // Simple insertion sort for leaderboard
            let mut i = 0;
            let size = self.leaderboard_size.read();
            
            while i < size {
                let current_entry = self.leaderboard.read(i);
                if entry.score > current_entry.score {
                    // Insert here
                    self._shift_leaderboard(i);
                    self.leaderboard.write(i, entry);
                    break;
                };
                i += 1;
            };
            
            // If not inserted, add to end
            if i == size && size < 100 { // Max 100 entries
                self.leaderboard.write(size, entry);
                self.leaderboard_size.write(size + 1);
            };
        }

        fn _shift_leaderboard(ref self: ContractState, start_index: u256) {
            let size = self.leaderboard_size.read();
            let mut i = size;
            
            while i > start_index {
                let entry = self.leaderboard.read(i - 1);
                self.leaderboard.write(i, entry);
                i -= 1;
            };
        }
    }
}
