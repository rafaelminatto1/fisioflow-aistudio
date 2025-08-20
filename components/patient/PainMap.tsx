// components/patient/PainMap.tsx
import React, { useState, useRef } from 'react';
import { PainPoint } from '../../types';
import { bodyPaths } from './bodyPaths'; // Using external paths for cleanliness

interface PainMapProps {
    points: PainPoint[];
    onMapClick: (x: number, y: number, bodyPart: 'front' | 'back') => void;
    onPointClick: (point: PainPoint) => void;
}

const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'fill-green-500/80 stroke-green-700';
    if (intensity <= 6) return 'fill-yellow-500/80 stroke-yellow-700';
    return 'fill-red-500/80 stroke-red-700';
};

const PainMap: React.FC<PainMapProps> = ({ points, onMapClick, onPointClick }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>, bodyPart: 'front' | 'back') => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onMapClick(x, y, bodyPart);
    };

    const handleMouseEnter = (e: React.MouseEvent, point: PainPoint) => {
        const content = `Intensidade: ${point.intensity}/10\nTipo: ${point.type}\nData: ${new Date(point.date).toLocaleDateString()}`;
        setTooltip({ content, x: e.pageX, y: e.pageY });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="relative">
            <div className="flex justify-center gap-4">
                {['front', 'back'].map(view => (
                    <div key={view} className="w-1/2">
                        <h4 className="text-center font-semibold text-sm text-slate-600 mb-1 capitalize">{view === 'front' ? 'Frente' : 'Costas'}</h4>
                         <svg
                            ref={svgRef}
                            viewBox="0 0 200 500"
                            onClick={(e) => handleSvgClick(e, view as 'front' | 'back')}
                            className="w-full cursor-crosshair"
                        >
                            <path d={bodyPaths[view as 'front' | 'back']} className="fill-slate-200" stroke="#94a3b8" strokeWidth="1" />
                            {points.filter(p => p.bodyPart === view).map(point => (
                                <circle
                                    key={point.id}
                                    cx={`${point.x}%`}
                                    cy={`${point.y}%`}
                                    r="5"
                                    className={`cursor-pointer transition-all hover:r-7 ${getIntensityColor(point.intensity)}`}
                                    strokeWidth="1.5"
                                    onClick={(e) => { e.stopPropagation(); onPointClick(point); }}
                                    onMouseEnter={(e) => handleMouseEnter(e, point)}
                                    onMouseLeave={handleMouseLeave}
                                />
                            ))}
                        </svg>
                    </div>
                ))}
            </div>
            {tooltip && (
                <div
                    style={{ top: tooltip.y, left: tooltip.x }}
                    className="absolute z-10 p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg pointer-events-none transform -translate-y-full -translate-x-1/2 whitespace-pre-wrap"
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

export default PainMap;
