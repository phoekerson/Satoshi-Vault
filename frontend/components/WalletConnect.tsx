import { useWalletStore } from '@/store/walletStore';
import { Wallet, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletConnect() {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWalletStore();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-mono">
          {formatAddress(address)}
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-6 py-3 bg-bitcoin-500 hover:bg-bitcoin-600 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Wallet className="w-5 h-5" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}