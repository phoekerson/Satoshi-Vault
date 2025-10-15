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
    <div className="min-h-screen relative">
      {/* Accent background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(247,147,26,0.15),_transparent_60%)] blur-2xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gray-800/80 border border-white/10 flex items-center justify-center shadow-sm">
                <Bitcoin className="w-5 h-5 text-bitcoin-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">Bitcoin Staking</h1>
                <p className="text-xs text-gray-400">On Starknet Sepolia</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2 mr-3">
              <Link href="/" className="px-3 py-1.5 rounded-full text-sm border border-white/10 bg-gray-800/60 hover:bg-gray-700/60 transition-colors">Dashboard</Link>
              <Link href="/bridge" className="px-3 py-1.5 rounded-full text-sm border border-white/10 hover:bg-gray-800/60 transition-colors">Bridge</Link>
              <Link href="/privacy" className="px-3 py-1.5 rounded-full text-sm border border-white/10 hover:bg-gray-800/60 transition-colors">Privacy</Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block px-3 py-1.5 rounded-full text-xs border border-white/10 text-gray-300">Sepolia</div>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
            <StatsCard
              title="Total Staked"
              value={`${formatBTC(totalStaked)} BTC`}
              icon={Lock}
              color="text-bitcoin-500"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
            <StatsCard
              title="Current APY"
              value={`${formatAPY(currentAPY)}%`}
              subtitle="Annual Percentage Yield"
              icon={TrendingUp}
              color="text-green-500"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
            <StatsCard
              title="Your Stake"
              value={isConnected ? `${formatBTC(userStaked)} BTC` : '-'}
              icon={Bitcoin}
              color="text-blue-500"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
            <StatsCard
              title="Your Level"
              value={isConnected ? `Level ${userLevel}` : '-'}
              subtitle={isConnected ? `${parseInt(userScore).toLocaleString()} points` : 'Not connected'}
              icon={Award}
              color="text-purple-500"
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Staking */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
              <StakeForm onSuccess={handleStakeSuccess} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
              <UserStakes key={refreshKey} />
            </div>
          </div>

          {/* Right Column - Gamification */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
              <Leaderboard />
            </div>
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
              <Achievements />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 Bitcoin Staking on Starknet
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <a href="#" className="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors">Docs</a>
              <a href="#" className="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors">GitHub</a>
              <a href="#" className="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}