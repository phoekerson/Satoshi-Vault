import { useState, useCallback } from 'react';
import { Contract } from 'starknet';
import { useWalletStore } from '@/store/walletStore';
import { CONTRACTS, GAME_ENGINE_ABI } from '@/config/contracts';

export interface UserProfile {
  total_score: string;
  level: number;
  staking_streak: number;
  total_staked: string;
  achievements_unlocked: number;
  last_activity: number;
}

export interface LeaderboardEntry {
  user: string;
  score: string;
  level: number;
}

export interface AchievementInfo {
  name: string;
  description: string;
  points_reward: string;
  nft_uri: string;
  is_active: boolean;
}

export function useGameEngine() {
  const { account, address } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const getUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!account || !address) return null;

    try {
      setIsLoading(true);
      const contract = new Contract(GAME_ENGINE_ABI, CONTRACTS.GAME_ENGINE, account);
      const result = await contract.get_user_profile(address);
      
      return {
        total_score: result.total_score.toString(),
        level: Number(result.level),
        staking_streak: Number(result.staking_streak),
        total_staked: result.total_staked.toString(),
        achievements_unlocked: Number(result.achievements_unlocked),
        last_activity: Number(result.last_activity),
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account, address]);

  const getLeaderboard = useCallback(async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    if (!account) return [];

    try {
      setIsLoading(true);
      const contract = new Contract(GAME_ENGINE_ABI, CONTRACTS.GAME_ENGINE, account);
      const result = await contract.get_leaderboard(limit);
      
      return result.map((entry: any) => ({
        user: entry.user,
        score: entry.score.toString(),
        level: Number(entry.level),
      }));
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const getUserAchievements = useCallback(async (): Promise<number[]> => {
    if (!account || !address) return [];

    try {
      setIsLoading(true);
      const contract = new Contract(GAME_ENGINE_ABI, CONTRACTS.GAME_ENGINE, account);
      const result = await contract.get_user_achievements(address);
      
      return result.map((id: any) => Number(id));
    } catch (error) {
      console.error('Get user achievements error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [account, address]);

  const getAchievementInfo = useCallback(async (achievementType: number): Promise<AchievementInfo | null> => {
    if (!account) return null;

    try {
      const contract = new Contract(GAME_ENGINE_ABI, CONTRACTS.GAME_ENGINE, account);
      const result = await contract.get_achievement_info(achievementType);
      
      return {
        name: result.name,
        description: result.description,
        points_reward: result.points_reward.toString(),
        nft_uri: result.nft_uri,
        is_active: result.is_active,
      };
    } catch (error) {
      console.error('Get achievement info error:', error);
      return null;
    }
  }, [account]);

  return {
    getUserProfile,
    getLeaderboard,
    getUserAchievements,
    getAchievementInfo,
    isLoading,
  };
}