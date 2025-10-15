import { useWalletStore } from '@/store/walletStore';
import { Contract, cairo } from 'starknet';
import paymentRouterAbi from '@/abi/PaymentRouter.json';
import { ADDRESSES } from '@/lib/addresses';
import { getProvider } from '@/lib/provider';

export function usePaymentRouter() {
  const { account } = useWalletStore();

  const getReadContract = () => {
    return new Contract(paymentRouterAbi as any, ADDRESSES.PAYMENT_ROUTER, getProvider());
  };

  const getWriteContract = () => {
    if (!account) throw new Error('Wallet not connected');
    return new Contract(paymentRouterAbi as any, ADDRESSES.PAYMENT_ROUTER, account);
  };

  const bridgeBitcoinToStarknet = async (amount: string, recipient: string) => {
    const contract = getWriteContract();
    const amountU256 = cairo.uint256(amount);
    const tx = await contract.bridge_bitcoin_to_starknet(amountU256, recipient);
    await account!.waitForTransaction(tx.transaction_hash);
    return tx.transaction_hash;
  };

  const getSupportedChains = async () => {
    const contract = getReadContract();
    const res = await contract.get_supported_chains();
    return res;
  };

  const getPaymentStatus = async (paymentId: string) => {
    const contract = getReadContract();
    const id = cairo.uint256(paymentId);
    return await contract.get_payment_status(id);
  };

  return {
    bridgeBitcoinToStarknet,
    getSupportedChains,
    getPaymentStatus,
  };
}

