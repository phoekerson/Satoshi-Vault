import { useState, useEffect } from 'react';
import { useStaking, StakeInfo } from '@/hooks/useStaking';
import { useWalletStore } from '@/store/walletStore';
import { Clock, TrendingUp, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserStakes() {
  const { isConnected } = useWalletStore();
  const { unstake, claimRewards, getStakeInfo, isLoading } = useStaking();
  const [stakes, setStakes] = useState<Array<{ id: string; info: StakeInfo }>>([]);
  const [loadingStakes, setLoadingStakes] = useState(true);

  useEffect(() => {
    if (isConnected) {
      loadStakes();
    }
  }, [isConnected]);

  const loadStakes = async () => {
    setLoadingStakes(true);
    // Try to load stakes 1-10 (you might want to track this differently)
    const loadedStakes: Array<{ id: string; info: StakeInfo }> = [];
    
    for (let i = 1; i <= 10; i++) {
      const info = await getStakeInfo(i.toString());
      if (info && info.is_active) {
        loadedStakes.push({ id: i.toString(), info });
      }
    }
    
    setStakes(loadedStakes);
    setLoadingStakes(false);
  };

  const handleUnstake = async (stakeId: string) => {
    const result = await unstake(stakeId);
    if (result) {
      loadStakes();
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    const result = await claimRewards(stakeId);
    if (result) {
      loadStakes();
    }
  };

  const formatBTC = (satoshis: string) => {
    return (parseInt(satoshis) / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getDaysRemaining = (startTime: number, duration: number) => {
    const endTime = startTime + duration;
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    return Math.max(0, Math.ceil(remaining / 86400));
  };

  const isMatured = (startTime: number, duration: number) => {
    return getDaysRemaining(startTime, duration) === 0;
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view your stakes</p>
      </div>
    );
  }

  if (loadingStakes) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Loading your stakes...</p>
      </div>
    );
  }

  if (stakes.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">No active stakes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Your Active Stakes</h2>
      
      {stakes.map(({ id, info }) => (
        <div key={id} className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Stake #{id}</h3>
              <p className="text-2xl font-bold text-bitcoin-500">
                {formatBTC(info.amount)} BTC
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isMatured(info.start_time, info.duration) 
                ? 'bg-green-900 text-green-300' 
                : 'bg-blue-900 text-blue-300'
            }`}>
              {isMatured(info.start_time, info.duration) ? 'Matured' : 'Active'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Started:</span>
              <span>{formatDate(info.start_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">APY:</span>
              <span>{(parseInt(info.apy_at_stake) / 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Unlock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Days remaining:</span>
              <span>{getDaysRemaining(info.start_time, info.duration)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Rewards claimed:</span>
              <span>{formatBTC(info.claimed_rewards)} BTC</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleClaimRewards(id)}
              disabled={isLoading}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-semibold"
            >
              Claim Rewards
            </button>
            <button
              onClick={() => handleUnstake(id)}
              disabled={isLoading || !isMatured(info.start_time, info.duration)}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-semibold"
            >
              {isMatured(info.start_time, info.duration) ? 'Unstake' : 'Not Matured'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}