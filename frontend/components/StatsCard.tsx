import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'text-bitcoin-500' 
}: StatsCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-700 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}