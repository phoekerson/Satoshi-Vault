import { create } from 'zustand';
import { connect, disconnect } from '@starknet-io/get-starknet';
import type { AccountInterface } from 'starknet';

interface WalletState {
  account: AccountInterface | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  account: null,
  address: null,
  isConnected: false,
  isConnecting: false,

  connectWallet: async () => {
    try {
      set({ isConnecting: true });
      
      const starknet = await connect();

      if (!starknet) {
        throw new Error('No wallet found');
      }

      // Le wallet retourné a déjà account après connect()
      // On utilise un type assertion pour accéder aux propriétés
      const walletAccount = (starknet as any).account;
      const walletAddress = (starknet as any).selectedAddress || walletAccount?.address;

      if (walletAccount && walletAddress) {
        set({
          account: walletAccount as AccountInterface,
          address: walletAddress,
          isConnected: true,
          isConnecting: false,
        });
      } else {
        throw new Error('Failed to get account from wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnectWallet: async () => {
    try {
      await disconnect({ clearLastWallet: true });
      set({
        account: null,
        address: null,
        isConnected: false,
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  },
}));
