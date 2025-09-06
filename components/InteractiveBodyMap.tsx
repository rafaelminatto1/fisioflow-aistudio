import React from 'react';
import { PainPoint } from '../types';

interface InteractiveBodyMapProps {
  selectedParts: string[];
  onSelectPart: (part: string) => void;
  points?: PainPoint[];
  onMapClick?: (x: number, y: number, bodyPart: 'front' | 'back') => void;
  onPointClick?: (point: PainPoint) => void;
}

const getIntensityColor = (intensity: number) => {
  if (intensity <= 3) return 'fill-green-500/80 stroke-green-700';
  if (intensity <= 6) return 'fill-yellow-500/80 stroke-yellow-700';
  return 'fill-red-500/80 stroke-red-700';
};

const BodyPart: React.FC<{
  id: string;
  d: string;
  selected: boolean;
  onClick: (id: string) => void;
}> = ({ id, d, selected, onClick }) => (
  <path
    id={id}
    d={d}
    onClick={() => onClick(id)}
    className={`cursor-pointer transition-all duration-200 ${selected ? 'fill-red-500/80 stroke-red-700' : 'fill-slate-300/50 hover:fill-sky-400/50'}`}
    stroke='#64748b'
    strokeWidth='1'
    strokeLinecap='round'
    strokeLinejoin='round'
  />
);

const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({
  selectedParts,
  onSelectPart,
  points = [],
  onMapClick,
  onPointClick,
}) => {
  // Simplified SVG path data for body parts
  const parts = {
    front: [
      { id: 'Cabeça', d: 'M 67,25 A 12,12 0 1 1 43,25 A 12,12 0 1 1 67,25 Z' },
      { id: 'Pescoço', d: 'M 55,37 Q 55,42 60,42 L 50,42 Q 45,42 45,37 Z' },
      { id: 'Ombro Direito', d: 'M 43,43 Q 35,45 32,55 L 45,43 Z' },
      { id: 'Ombro Esquerdo', d: 'M 67,43 Q 75,45 78,55 L 65,43 Z' },
      { id: 'Tórax', d: 'M 45,43 L 65,43 L 63,65 L 47,65 Z' },
      { id: 'Abdômen', d: 'M 47,65 L 63,65 L 60,80 L 50,80 Z' },
      { id: 'Braço Direito', d: 'M 32,55 L 30,75 L 38,75 L 43,50 Z' },
      { id: 'Braço Esquerdo', d: 'M 78,55 L 80,75 L 72,75 L 67,50 Z' },
      { id: 'Pelve', d: 'M 50,80 L 60,80 L 62,90 L 48,90 Z' },
      { id: 'Perna Direita', d: 'M 48,90 L 45,130 L 52,130 L 50,90 Z' },
      { id: 'Perna Esquerda', d: 'M 62,90 L 65,130 L 58,130 L 60,90 Z' },
      { id: 'Mão Direita', d: 'M 30,75 L 28,85 L 38,82 Z' },
      { id: 'Mão Esquerda', d: 'M 80,75 L 82,85 L 72,82 Z' },
      { id: 'Pé Direito', d: 'M 45,130 L 42,135 L 52,135 Z' },
      { id: 'Pé Esquerdo', d: 'M 65,130 L 68,135 L 58,135 Z' },
      { id: 'Joelho Direito', d: 'M 46,105 a 3,3 0 1,1 -6,0 3,3 0 1,1 6,0' },
      { id: 'Joelho Esquerdo', d: 'M 64,105 a 3,3 0 1,1 -6,0 3,3 0 1,1 6,0' },
    ],
    back: [
      { id: 'Costas (Superior)', d: 'M 145,43 L 165,43 L 163,65 L 147,65 Z' },
      { id: 'Costas (Lombar)', d: 'M 147,65 L 163,65 L 160,80 L 150,80 Z' },
    ],
  };

  const handleSvgClick = (
    e: React.MouseEvent<SVGSVGElement>,
    bodyPart: 'front' | 'back'
  ) => {
    if (!onMapClick) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(x, y, bodyPart);
  };

  return (
    <div className='w-full flex justify-center items-start gap-4'>
      <svg
        viewBox='0 0 110 150'
        className='w-1/2 max-w-[150px]'
        onClick={e => handleSvgClick(e, 'front')}
      >
        {parts.front.map(p => (
          <BodyPart
            key={p.id}
            {...p}
            selected={selectedParts.includes(p.id)}
            onClick={onSelectPart}
          />
        ))}
        {points
          .filter(p => p.bodyPart === 'front')
          .map(point => (
            <circle
              key={point.id}
              cx={`${point.x}%`}
              cy={`${point.y}%`}
              r='3'
              className={`cursor-pointer ${getIntensityColor(point.intensity)}`}
              strokeWidth='1'
              onClick={e => {
                e.stopPropagation();
                onPointClick?.(point);
              }}
            />
          ))}
      </svg>
      <svg
        viewBox='100 0 110 150'
        className='w-1/2 max-w-[150px]'
        onClick={e => handleSvgClick(e, 'back')}
      >
        {/* Re-use front parts for the back view outline */}
        {parts.front.map(p => (
          <path
            key={p.id + '_back_outline'}
            d={p.d
              .replace(/M (\d+),/g, (match, p1) => `M ${210 - parseInt(p1)},`)
              .replace(
                /A (\d+),(\d+) 0 1 1 (\d+),/g,
                (match, r1, r2, p1) =>
                  `A ${r1},${r2} 0 1 0 ${210 - parseInt(p1)},`
              )}
            className='fill-slate-200/50'
            stroke='#cbd5e1'
            strokeWidth='0.5'
          />
        ))}
        {/* Back-specific parts */}
        {parts.back.map(p => (
          <BodyPart
            key={p.id}
            {...p}
            selected={selectedParts.includes(p.id)}
            onClick={onSelectPart}
          />
        ))}
        {points
          .filter(p => p.bodyPart === 'back')
          .map(point => (
            <circle
              key={point.id}
              cx={`${210 - point.x}%`}
              cy={`${point.y}%`}
              r='3'
              className={`cursor-pointer ${getIntensityColor(point.intensity)}`}
              strokeWidth='1'
              onClick={e => {
                e.stopPropagation();
                onPointClick?.(point);
              }}
            />
          ))}
      </svg>
    </div>
  );
};

export default InteractiveBodyMap;
