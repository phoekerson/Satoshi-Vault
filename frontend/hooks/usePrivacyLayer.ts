import { useWalletStore } from '@/store/walletStore';
import { Contract, cairo } from 'starknet';
import privacyLayerAbi from '@/abi/PrivacyLayer.json';
import { ADDRESSES } from '@/lib/addresses';
import { getProvider } from '@/lib/provider';

export function usePrivacyLayer() {
  const { account } = useWalletStore();

  const getReadContract = () => {
    return new Contract(privacyLayerAbi as any, ADDRESSES.PRIVACY_LAYER, getProvider());
  };

  const getWriteContract = () => {
    if (!account) throw new Error('Wallet not connected');
    return new Contract(privacyLayerAbi as any, ADDRESSES.PRIVACY_LAYER, account);
  };

  const createPrivateStake = async (encryptedAmount: string, commitment: string) => {
    const contract = getWriteContract();
    const tx = await contract.create_private_stake(encryptedAmount, commitment);
    await account!.waitForTransaction(tx.transaction_hash);
    return tx.transaction_hash;
  };

  const getStakeCommitment = async (stakeId: string) => {
    const contract = getReadContract();
    const id = cairo.uint256(stakeId);
    return await contract.get_stake_commitment(id);
  };

  const getPrivacySettings = async (user: string) => {
    const contract = getReadContract();
    return await contract.get_privacy_settings(user);
  };

  return {
    createPrivateStake,
    getStakeCommitment,
    getPrivacySettings,
  };
}

