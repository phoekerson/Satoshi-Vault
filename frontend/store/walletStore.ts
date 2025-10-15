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
      
      // Options pour la connexion
      const starknet = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark"
      });
      
      if (!starknet) {
        throw new Error('No wallet extension found. Please install Argent X or Braavos.');
      }

      // Enable le wallet (demande la permission)
      await starknet.enable({ starknetVersion: "v5" });

      // Vérifier que le wallet est bien connecté
      if (!starknet.isConnected) {
        throw new Error('Wallet connection failed');
      }

      // Récupérer le compte
      const account = starknet.account;
      
      if (!account) {
        throw new Error('No account found in wallet');
      }

      // Récupérer l'adresse
      const address = account.address || starknet.selectedAddress;
      
      if (!address) {
        throw new Error('No address found');
      }

      console.log('Wallet connected successfully:', address);

      set({
        account: account as AccountInterface,
        address: address,
        isConnected: true,
        isConnecting: false,
      });

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      set({ 
        isConnecting: false,
        account: null,
        address: null,
        isConnected: false
      });
      
      // Message d'erreur plus explicite
      if (error.message?.includes('No wallet')) {
        throw new Error('Please install Argent X or Braavos wallet extension');
      } else if (error.message?.includes('User abort')) {
        throw new Error('Connection cancelled by user');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
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
      // Forcer la déconnexion même en cas d'erreur
      set({
        account: null,
        address: null,
        isConnected: false,
      });
    }
  },
}));