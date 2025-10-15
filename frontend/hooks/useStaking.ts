import { useState, useCallback } from 'react';
import { Contract } from 'starknet';
import { useWalletStore } from '@/store/walletStore';
import { CONTRACTS, STAKING_VAULT_ABI } from '@/config/contracts';
import toast from 'react-hot-toast';

export interface StakeInfo {
  amount: string;
  start_time: number;
  duration: number;
  claimed_rewards: string;
  is_active: boolean;
  apy_at_stake: string;
}

export function useStaking() {
  const { account, address } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const stakeBitcoin = useCallback(async (amount: string, duration: number) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      setIsLoading(true);
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      
      const result = await contract.stake_bitcoin(amount, duration);
      await account.waitForTransaction(result.transaction_hash);
      
      toast.success('Bitcoin staked successfully!');
      return result;
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error(error.message || 'Failed to stake Bitcoin');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const unstake = useCallback(async (stakeId: string) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      setIsLoading(true);
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      
      const result = await contract.unstake(stakeId);
      await account.waitForTransaction(result.transaction_hash);
      
      toast.success('Unstaked successfully!');
      return result;
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.message || 'Failed to unstake');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const claimRewards = useCallback(async (stakeId: string) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      setIsLoading(true);
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      
      const result = await contract.claim_rewards(stakeId);
      await account.waitForTransaction(result.transaction_hash);
      
      toast.success('Rewards claimed successfully!');
      return result;
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Failed to claim rewards');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const getStakeInfo = useCallback(async (stakeId: string): Promise<StakeInfo | null> => {
    if (!account || !address) return null;

    try {
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      const result = await contract.get_stake_info(address, stakeId);
      
      return {
        amount: result.amount.toString(),
        start_time: Number(result.start_time),
        duration: Number(result.duration),
        claimed_rewards: result.claimed_rewards.toString(),
        is_active: result.is_active,
        apy_at_stake: result.apy_at_stake.toString(),
      };
    } catch (error) {
      console.error('Get stake info error:', error);
      return null;
    }
  }, [account, address]);

  const getUserStaked = useCallback(async (): Promise<string | null> => {
    if (!account || !address) return null;

    try {
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      const result = await contract.get_user_staked(address);
      return result.toString();
    } catch (error) {
      console.error('Get user staked error:', error);
      return null;
    }
  }, [account, address]);

  const getTotalStaked = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      const result = await contract.get_total_staked();
      return result.toString();
    } catch (error) {
      console.error('Get total staked error:', error);
      return null;
    }
  }, [account]);

  const getCurrentAPY = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const contract = new Contract(STAKING_VAULT_ABI, CONTRACTS.STAKING_VAULT, account);
      const result = await contract.get_current_apy();
      return result.toString();
    } catch (error) {
      console.error('Get APY error:', error);
      return null;
    }
  }, [account]);

  return {
    stakeBitcoin,
    unstake,
    claimRewards,
    getStakeInfo,
    getUserStaked,
    getTotalStaked,
    getCurrentAPY,
    isLoading,
  };
}