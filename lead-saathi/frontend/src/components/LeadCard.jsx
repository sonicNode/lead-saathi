import React from 'react';
import ScoreMeter from './ScoreMeter';
import { User, DollarSign, Clock, Target } from 'lucide-react';

const LeadCard = ({ analysis, score, category }) => {
  const Badge = ({ text }) => {
    let color = 'bg-gray-700 text-gray-300';
    if (text.includes('Hot')) color = 'bg-green-500/20 text-green-400 border border-green-500/50';
    if (text.includes('Warm')) color = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    if (text.includes('Cold')) color = 'bg-red-500/20 text-red-400 border border-red-500/50';

    return <span className={`px-4 py-1 rounded-full text-sm font-bold ${color}`}>{text}</span>;
  };

  const bantItems = [
    { icon: <DollarSign size={16} />, label: "Budget", value: analysis?.budget },
    { icon: <Target size={16} />, label: "Need", value: analysis?.need },
    { icon: <User size={16} />, label: "Authority", value: analysis?.authority },
    { icon: <Clock size={16} />, label: "Timeline", value: analysis?.timeline },
  ];

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Qualification Profile</h3>
        <Badge text={category || 'Unknown'} />
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        {bantItems.map((item, i) => (
          <div key={i} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-xs text-gray-400 flex items-center gap-2 mb-1">
              {item.icon} {item.label}
            </span>
            <span className={`font-semibold text-white truncate ${!item.value ? 'text-gray-500 italic' : ''}`} title={item.value || 'Waiting for context...'}>
              {item.value || 'Waiting for context...'}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10 mt-auto">
        <ScoreMeter score={score || 0} />
      </div>
    </div>
  );
};
export default LeadCard;
