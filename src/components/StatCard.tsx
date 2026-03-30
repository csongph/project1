import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' }
};

export const StatCard = ({ title, value, icon: Icon, color, subtitle }: StatCardProps) => {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-semibold mb-2">{title}</p>
          <p className={`text-3xl font-black ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
        </div>
        <div className={`${colors.bg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};
