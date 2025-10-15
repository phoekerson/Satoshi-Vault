'use client';

import { useWalletStore } from '@/store/walletStore';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWalletStore();

  // Auto-reconnect si le wallet était déjà connecté
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Vérifier si un wallet était déjà connecté
        const { getAvailableWallets } = await import('@starknet-io/get-starknet');
        const wallets = getAvailableWallets();
        
        if (wallets.length > 0 && !isConnected) {
          // Tentative de reconnexion silencieuse
          console.log('Checking for existing connection...');
        }
      } catch (error) {
        console.log('No previous connection found');
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!', {
        icon: '✅',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Afficher un message d'erreur personnalisé
      if (error.message?.includes('install')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">No wallet found</p>
            <p className="text-sm">Please install Argent X or Braavos extension</p>
          </div>,
          { duration: 5000, icon: <AlertCircle className="w-5 h-5" /> }
        );
      } else if (error.message?.includes('cancelled') || error.message?.includes('abort')) {
        toast.error('Connection cancelled', { duration: 2000 });
      } else {
        toast.error(error.message || 'Failed to connect wallet', { duration: 4000 });
      }
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected', {
      icon: '👋',
      duration: 2000,
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-mono">{formatAddress(address)}</span>
        </div>
        
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-semibold"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-6 py-3 bg-bitcoin-500 hover:bg-bitcoin-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
    >
      <Wallet className="w-5 h-5" />
      {isConnecting ? (
        <>
          <span>Connecting...</span>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}