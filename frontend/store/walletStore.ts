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
      
      // Connexion avec get-starknet v3
      const starknet = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark"
      });
      
      if (!starknet) {
        throw new Error('No wallet extension found. Please install Argent X or Braavos.');
      }

      // Enable le wallet (demande la permission à l'utilisateur)
      await (starknet as any).enable();

      // Vérifier que le wallet est bien connecté
      if (!(starknet as any).isConnected) {
        throw new Error('Wallet connection failed');
      }

      // Récupérer le compte - l'account est maintenant directement disponible
      const account = (starknet as any).account as AccountInterface;
      
      if (!account) {
        throw new Error('No account found in wallet');
      }

      // Récupérer l'adresse depuis l'account
      const address = account.address;
      
      if (!address) {
        throw new Error('No address found');
      }

      console.log('✅ Wallet connected successfully');
      console.log('Address:', address);
      console.log('Chain ID:', (starknet as any).chainId);

      set({
        account: account,
        address: address,
        isConnected: true,
        isConnecting: false,
      });

    } catch (error: any) {
      console.error('❌ Failed to connect wallet:', error);
      set({ 
        isConnecting: false,
        account: null,
        address: null,
        isConnected: false
      });
      
      // Messages d'erreur plus explicites
      if (error.message?.includes('No wallet')) {
        throw new Error('Please install Argent X or Braavos wallet extension');
      } else if (error.message?.includes('abort') || error.message?.includes('reject') || error.message?.includes('cancel')) {
        throw new Error('Connection cancelled by user');
      } else if (error.message?.includes('network')) {
        throw new Error('Wrong network. Please switch to Sepolia Testnet');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
    }
  },

  disconnectWallet: async () => {
    try {
      await disconnect({ clearLastWallet: true });
      console.log('👋 Wallet disconnected');
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