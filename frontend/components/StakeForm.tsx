import { useState } from 'react';
import { useStaking } from '@/hooks/useStaking';
import { useWalletStore } from '@/store/walletStore';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StakeForm({ onSuccess }: { onSuccess?: () => void }) {
  const { isConnected } = useWalletStore();
  const { stakeBitcoin, isLoading } = useStaking();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const durationNum = parseInt(duration);
    if (durationNum < 30 || durationNum > 365) {
      toast.error('Duration must be between 30 and 365 days');
      return;
    }

    // Convert amount to satoshis (assuming input is in BTC)
    const amountInSatoshis = Math.floor(parseFloat(amount) * 100000000).toString();

    const result = await stakeBitcoin(amountInSatoshis, durationNum);
    
    if (result) {
      setAmount('');
      setDuration('30');
      onSuccess?.();
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-6 h-6 text-bitcoin-500" />
        <h2 className="text-2xl font-bold">Stake Bitcoin</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (BTC)
          </label>
          <input
            type="number"
            step="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-bitcoin-500 focus:border-transparent outline-none"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum: 0.00001 BTC
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Duration (days)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-bitcoin-500 focus:border-transparent outline-none"
            disabled={isLoading}
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days (3 months)</option>
            <option value="180">180 days (6 months)</option>
            <option value="365">365 days (1 year)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Longer duration = Higher rewards
          </p>
        </div>

        <button
          type="submit"
          disabled={!isConnected || isLoading}
          className="w-full py-3 bg-bitcoin-500 hover:bg-bitcoin-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Staking...' : 'Stake Now'}
        </button>
      </form>
    </div>
  );
}