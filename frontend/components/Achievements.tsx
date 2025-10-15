import { useState, useEffect } from 'react';
import { useGameEngine, AchievementInfo } from '@/hooks/useGameEngine';
import { useWalletStore } from '@/store/walletStore';
import { Award, Check, Lock } from 'lucide-react';

export default function Achievements() {
  const { isConnected } = useWalletStore();
  const { getUserAchievements, getAchievementInfo, isLoading } = useGameEngine();
  const [userAchievements, setUserAchievements] = useState<number[]>([]);
  const [allAchievements, setAllAchievements] = useState<Map<number, AchievementInfo>>(new Map());

  useEffect(() => {
    if (isConnected) {
      loadAchievements();
    }
  }, [isConnected]);

  const loadAchievements = async () => {
    // Load user's achievements
    const userAch = await getUserAchievements();
    setUserAchievements(userAch);

    // Load all achievement info (0-9)
    const achMap = new Map<number, AchievementInfo>();
    for (let i = 0; i < 10; i++) {
      const info = await getAchievementInfo(i);
      if (info && info.is_active) {
        achMap.set(i, info);
      }
    }
    setAllAchievements(achMap);
  };

  const feltToString = (felt: any): string => {
    try {
      // Convert felt252 to string
      if (typeof felt === 'string') return felt;
      if (typeof felt === 'bigint' || typeof felt === 'number') {
        const hex = felt.toString(16);
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          const char = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
          if (char !== '\0') str += char;
        }
        return str || felt.toString();
      }
      return String(felt);
    } catch {
      return String(felt);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Connect your wallet to view achievements</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-6 h-6 text-bitcoin-500" />
        <h2 className="text-2xl font-bold">Achievements</h2>
        <span className="ml-auto text-sm text-gray-400">
          {userAchievements.length} / {allAchievements.size} unlocked
        </span>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400">Loading achievements...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(allAchievements.entries()).map(([id, info]) => {
            const isUnlocked = userAchievements.includes(id);
            
            return (
              <div
                key={id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isUnlocked
                    ? 'border-bitcoin-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isUnlocked ? 'bg-bitcoin-500' : 'bg-gray-700'
                  }`}>
                    {isUnlocked ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {feltToString(info.name)}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {feltToString(info.description)}
                    </p>
                    <p className="text-xs text-bitcoin-500 font-semibold">
                      +{info.points_reward} points
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}