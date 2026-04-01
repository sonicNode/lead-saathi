import React from 'react';

const ScoreMeter = ({ score }) => {
  const percentage = (score / 10) * 100;
  
  let color = 'bg-red-500';
  if (score >= 7) color = 'bg-green-500';
  else if (score >= 4) color = 'bg-yellow-500';

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between text-sm mb-1 text-gray-400">
        <span>Intent Score</span>
        <span className="font-bold text-white">{score}/10</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3">
        <div 
          className={`${color} h-3 rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
export default ScoreMeter;
