
import React from 'react';
import { Frown, Meh, Smile } from 'lucide-react';

interface PainScaleProps {
  selectedScore: number | undefined;
  onSelectScore: (score: number) => void;
}

const PainScale: React.FC<PainScaleProps> = ({ selectedScore, onSelectScore }) => {
  
  const getPainInfo = (score: number) => {
    if (score >= 0 && score <= 3) return { color: 'text-green-600', bgColor: 'bg-green-100', hoverBg: 'hover:bg-green-200', icon: <Smile className="w-5 h-5" /> };
    if (score >= 4 && score <= 6) return { color: 'text-amber-600', bgColor: 'bg-amber-100', hoverBg: 'hover:bg-amber-200', icon: <Meh className="w-5 h-5" /> };
    if (score >= 7 && score <= 10) return { color: 'text-red-600', bgColor: 'bg-red-100', hoverBg: 'hover:bg-red-200', icon: <Frown className="w-5 h-5" /> };
    return { color: 'text-slate-600', bgColor: 'bg-slate-100', hoverBg: 'hover:bg-slate-200', icon: null };
  };

  return (
    <div>
      <label className="text-sm font-semibold text-teal-700 mb-2 block">Escala Visual de Dor (EVA)</label>
      <div className="flex items-center justify-between space-x-1 bg-slate-50 p-2 rounded-lg">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
          const isSelected = selectedScore === score;
          const { color, bgColor, hoverBg } = getPainInfo(score);
          
          return (
            <button
              key={score}
              type="button"
              onClick={() => onSelectScore(score)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200
                ${isSelected 
                  ? `${color} ${bgColor} ring-2 ring-offset-1 ring-current` 
                  : `text-slate-600 ${hoverBg}`
                }
              `}
              title={`Dor nível ${score}`}
            >
              {score}
            </button>
          );
        })}
      </div>
      {selectedScore !== undefined && (
        <div className="mt-2 flex items-center justify-center p-2 rounded-md bg-slate-100">
           <div className={`mr-2 ${getPainInfo(selectedScore).color}`}> {getPainInfo(selectedScore).icon}</div>
           <p className={`text-sm font-semibold ${getPainInfo(selectedScore).color}`}>
            Nível de dor selecionado: {selectedScore}
           </p>
        </div>
      )}
    </div>
  );
};

export default PainScale;