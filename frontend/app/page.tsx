'use client';

import { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useStaking } from '@/hooks/useStaking';
import { useGameEngine } from '@/hooks/useGameEngine';
import WalletConnect from '@/components/WalletConnect';
import StakeForm from '@/components/StakeForm';
import UserStakes from '@/components/UserStakes';
import StatsCard from '@/components/StatsCard';
import Leaderboard from '@/components/Leaderboard';
import Achievements from '@/components/Achievements';
import { Bitcoin, TrendingUp, Users, Award, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isConnected, address } = useWalletStore();
  const { getTotalStaked, getUserStaked, getCurrentAPY } = useStaking();
  const { getUserProfile } = useGameEngine();
  
  const [totalStaked, setTotalStaked] = useState('0');
  const [userStaked, setUserStaked] = useState('0');
  const [currentAPY, setCurrentAPY] = useState('0');
  const [userScore, setUserScore] = useState('0');
  const [userLevel, setUserLevel] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
  }, [isConnected, address, refreshKey]);

  const loadStats = async () => {
    const total = await getTotalStaked();
    if (total) setTotalStaked(total);

    const apy = await getCurrentAPY();
    if (apy) setCurrentAPY(apy);

    if (isConnected) {
      const userStake = await getUserStaked();
      if (userStake) setUserStaked(userStake);

      const profile = await getUserProfile();
      if (profile) {
        setUserScore(profile.total_score);
        setUserLevel(profile.level);
      }
    }
  };

  const formatBTC = (satoshis: string) => {
    return (parseInt(satoshis) / 100000000).toFixed(4);
  };

  const formatAPY = (basisPoints: string) => {
    return (parseInt(basisPoints) / 100).toFixed(2);
  };

  const handleStakeSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-8 h-8 text-bitcoin-500" />
              <h1 className="text-2xl font-bold">Bitcoin Staking</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 mr-8">
              <Link href="/" className="hover:text-bitcoin-500 transition-colors">
                Dashboard
              </Link>
              <Link href="/bridge" className="hover:text-bitcoin-500 transition-colors">
                Bridge
              </Link>
              <Link href="/privacy" className="hover:text-bitcoin-500 transition-colors">
                Privacy
              </Link>
            </nav>

            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Staked"
            value={`${formatBTC(totalStaked)} BTC`}
            icon={Lock}
            color="text-bitcoin-500"
          />
          <StatsCard
            title="Current APY"
            value={`${formatAPY(currentAPY)}%`}
            subtitle="Annual Percentage Yield"
            icon={TrendingUp}
            color="text-green-500"
          />
          <StatsCard
            title="Your Stake"
            value={isConnected ? `${formatBTC(userStaked)} BTC` : '-'}
            icon={Bitcoin}
            color="text-blue-500"
          />
          <StatsCard
            title="Your Level"
            value={isConnected ? `Level ${userLevel}` : '-'}
            subtitle={isConnected ? `${parseInt(userScore).toLocaleString()} points` : 'Not connected'}
            icon={Award}
            color="text-purple-500"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Staking */}
          <div className="lg:col-span-2 space-y-8">
            <StakeForm onSuccess={handleStakeSuccess} />
            <UserStakes key={refreshKey} />
          </div>

          {/* Right Column - Gamification */}
          <div className="space-y-8">
            <Leaderboard />
            <Achievements />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 Bitcoin Staking on Starknet
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="#" className="hover:text-bitcoin-500 transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-bitcoin-500 transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-bitcoin-500 transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}