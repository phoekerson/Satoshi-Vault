import { useWalletStore } from '@/store/walletStore';
import { Contract, cairo } from 'starknet';
import stakingVaultAbi from '@/abi/BitcoinStakingVault.json';
import { ADDRESSES } from '@/lib/addresses';
import { getProvider } from '@/lib/provider';

export const useStaking = () => {
  const { account, isConnected } = useWalletStore();

  // Contract pour les lectures (view functions)
  const getReadContract = () => {
    const provider = getProvider();
    return new Contract(stakingVaultAbi as any, ADDRESSES.STAKING_VAULT, provider);
  };

  // Contract pour les écritures (external functions)
  const getWriteContract = () => {
    if (!account) throw new Error('Wallet not connected');
    return new Contract(stakingVaultAbi as any, ADDRESSES.STAKING_VAULT, account);
  };

  const stakeBitcoin = async (amountInSatoshis: string, durationInDays: number) => {
    try {
      console.log('🔄 Starting stake transaction...');
      console.log('Amount (satoshis):', amountInSatoshis);
      console.log('Duration (days):', durationInDays);
      
      const contract = getWriteContract();
      
      // Convertir le montant en u256 Cairo
      const amountU256 = cairo.uint256(amountInSatoshis);
      console.log('Amount u256:', amountU256);
      
      // Vérifier que la durée est valide (30-365 jours selon le contrat)
      if (durationInDays < 30 || durationInDays > 365) {
        throw new Error('Duration must be between 30 and 365 days');
      }
      
      // Invoquer la fonction stake_bitcoin
      console.log('📝 Invoking stake_bitcoin...');
      const call = contract.populate('stake_bitcoin', [amountU256, durationInDays]);
      
      const tx = await contract.stake_bitcoin(amountU256, durationInDays);
      console.log('✅ Transaction submitted:', tx.transaction_hash);
      
      // Attendre la confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await account!.waitForTransaction(tx.transaction_hash);
      console.log('✅ Transaction confirmed!');
      console.log('Receipt:', receipt);
      
      return tx.transaction_hash;
    } catch (error: any) {
      console.error('❌ Stake error:', error);
      
      // Extraire et formatter les messages d'erreur du contrat
      if (error.message?.includes('Contract is paused')) {
        throw new Error('Staking is currently paused');
      } else if (error.message?.includes('Amount below minimum')) {
        throw new Error('Amount is below the minimum stake requirement');
      } else if (error.message?.includes('Amount above maximum')) {
        throw new Error('Amount exceeds the maximum stake limit');
      } else if (error.message?.includes('Duration too short')) {
        throw new Error('Staking duration must be at least 30 days');
      } else if (error.message?.includes('Duration too long')) {
        throw new Error('Staking duration cannot exceed 365 days');
      } else if (error.message?.includes('insufficient')) {
        throw new Error('Insufficient balance in your wallet');
      } else if (error.message?.includes('rejected') || error.message?.includes('abort')) {
        throw new Error('Transaction cancelled by user');
      }
      
      throw new Error(error.message || 'Failed to stake Bitcoin');
    }
  };

  const unstake = async (stakeId: string) => {
    try {
      console.log('🔄 Starting unstake transaction for stake ID:', stakeId);
      
      const contract = getWriteContract();
      const stakeIdU256 = cairo.uint256(stakeId);
      
      const tx = await contract.unstake(stakeIdU256);
      console.log('✅ Transaction submitted:', tx.transaction_hash);
      
      await account!.waitForTransaction(tx.transaction_hash);
      console.log('✅ Unstake successful!');
      
      return tx.transaction_hash;
    } catch (error: any) {
      console.error('❌ Unstake error:', error);
      
      if (error.message?.includes('Stake not active')) {
        throw new Error('This stake is not active');
      } else if (error.message?.includes('Stake not matured')) {
        throw new Error('Stake period has not completed yet');
      }
      
      throw new Error(error.message || 'Failed to unstake');
    }
  };

  const claimRewards = async (stakeId: string) => {
    try {
      console.log('🔄 Claiming rewards for stake ID:', stakeId);
      
      const contract = getWriteContract();
      const stakeIdU256 = cairo.uint256(stakeId);
      
      const tx = await contract.claim_rewards(stakeIdU256);
      console.log('✅ Transaction submitted:', tx.transaction_hash);
      
      await account!.waitForTransaction(tx.transaction_hash);
      console.log('✅ Rewards claimed!');
      
      return tx.transaction_hash;
    } catch (error: any) {
      console.error('❌ Claim rewards error:', error);
      
      if (error.message?.includes('Stake not active')) {
        throw new Error('This stake is not active');
      }
      
      throw new Error(error.message || 'Failed to claim rewards');
    }
  };

  const getStakeInfo = async (userAddress: string, stakeId: string) => {
    try {
      const contract = getReadContract();
      const stakeIdU256 = cairo.uint256(stakeId);
      
      const result = await contract.get_stake_info(userAddress, stakeIdU256);
      
      return {
        amount: result.amount?.toString() || '0',
        start_time: Number(result.start_time || 0),
        duration: Number(result.duration || 0),
        claimed_rewards: result.claimed_rewards?.toString() || '0',
        is_active: Boolean(result.is_active),
        apy_at_stake: result.apy_at_stake?.toString() || '0',
      };
    } catch (error: any) {
      console.error('❌ Get stake info error:', error);
      return null;
    }
  };

  const getTotalStaked = async () => {
    try {
      const contract = getReadContract();
      const result = await contract.get_total_staked();
      return result.toString();
    } catch (error) {
      console.error('❌ Get total staked error:', error);
      return '0';
    }
  };

  const getUserStaked = async () => {
    try {
      if (!account) return '0';
      const contract = getReadContract();
      const result = await contract.get_user_staked(account.address);
      return result.toString();
    } catch (error) {
      console.error('❌ Get user staked error:', error);
      return '0';
    }
  };

  const getCurrentAPY = async () => {
    try {
      const contract = getReadContract();
      const result = await contract.get_current_apy();
      return result.toString();
    } catch (error) {
      console.error('❌ Get current APY error:', error);
      return '0';
    }
  };

  return {
    stakeBitcoin,
    unstake,
    claimRewards,
    getStakeInfo,
    getTotalStaked,
    getUserStaked,
    getCurrentAPY,
    isConnected,
  };
};