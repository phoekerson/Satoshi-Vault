import { useState, useEffect } from 'react';
import { useGameEngine, LeaderboardEntry } from '@/hooks/useGameEngine';
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const { getLeaderboard, isLoading } = useGameEngine();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const data = await getLeaderboard(10);
    setEntries(data);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold">#{index + 1}</span>;
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-bitcoin-500" />
        <h2 className="text-2xl font-bold">Top Players</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-gray-400">No entries yet</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.user}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                index < 3 ? 'bg-gray-700' : 'bg-gray-750'
              }`}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-1">
                <p className="font-mono text-sm">{formatAddress(entry.user)}</p>
                <p className="text-xs text-gray-400">Level {entry.level}</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-bitcoin-500">
                  {parseInt(entry.score).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}