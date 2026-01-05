'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';

interface MomentumGraphProps {
  actions: (PlayByPlayV3Action & { wallTimeOffset: number })[];
  totalDuration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function MomentumGraph({ actions, totalDuration, currentTime, onSeek }: MomentumGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 100 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 100,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const dataPoints = useMemo(() => {
    if (actions.length === 0) return [];

    // Filter for scoring actions or just take all actions to be safe
    // and map them to [timeOffset, margin]
    const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    
    let lastMargin = 0;
    actions.forEach((action) => {
      const homeScore = parseInt(action.scoreHome) || 0;
      const awayScore = parseInt(action.scoreAway) || 0;
      const margin = homeScore - awayScore;
      
      points.push({
        x: action.wallTimeOffset,
        y: margin,
      });
      lastMargin = margin;
    });

    // Add final point
    points.push({ x: totalDuration, y: lastMargin });

    return points;
  }, [actions, totalDuration]);

  const { pathData, maxMargin } = useMemo(() => {
    if (dataPoints.length === 0 || dimensions.width === 0) {
      return { pathData: '', maxMargin: 10 };
    }

    // Filter points to only show up to currentTime to avoid spoilers
    const visiblePoints = dataPoints.filter(p => p.x <= currentTime);
    
    // Add a virtual point at the current time to make the line continuous
    const lastPoint = visiblePoints[visiblePoints.length - 1];
    if (lastPoint && lastPoint.x < currentTime && currentTime <= totalDuration) {
      visiblePoints.push({ x: currentTime, y: lastPoint.y });
    }

    // Use only visible points for maxMargin to avoid spoilers in the label/scale
    const visibleMargins = visiblePoints.map(p => Math.abs(p.y));
    const currentMax = Math.max(...visibleMargins, 10); 

    const getX = (time: number) => (time / totalDuration) * dimensions.width;
    const getY = (margin: number) => (dimensions.height / 2) - (margin / currentMax) * (dimensions.height / 2);

    if (visiblePoints.length === 0) return { pathData: '', maxMargin: 10 };

    let d = `M ${getX(visiblePoints[0].x)} ${getY(visiblePoints[0].y)}`;
    
    for (let i = 1; i < visiblePoints.length; i++) {
      // Use "stepping" line for score changes
      d += ` L ${getX(visiblePoints[i].x)} ${getY(visiblePoints[i-1].y)}`;
      d += ` L ${getX(visiblePoints[i].x)} ${getY(visiblePoints[i].y)}`;
    }

    return { pathData: d, maxMargin: currentMax };
  }, [dataPoints, totalDuration, dimensions, currentTime]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    handleSeek(e);
  };

  const handleSeek = (e: React.PointerEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / dimensions.width));
    onSeek(percentage * totalDuration);
  };

  const currentX = (currentTime / totalDuration) * dimensions.width;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>Momentum Graph</span>
        <span>Max Margin: ±{maxMargin}</span>
      </div>
      <div 
        ref={containerRef}
        className="relative h-[100px] bg-slate-50 rounded-xl border border-slate-200 cursor-crosshair overflow-hidden group"
        onPointerDown={handleSeek}
        onPointerMove={handlePointerMove}
      >
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Zero line */}
          <line 
            x1="0" y1={dimensions.height / 2} 
            x2={dimensions.width} y2={dimensions.height / 2} 
            stroke="#e2e8f0" 
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          
          {/* Margin Path */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Current Time Indicator */}
          <line
            x1={currentX}
            y1="0"
            x2={currentX}
            y2={dimensions.height}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-all duration-100 ease-linear"
          />
          <circle
            cx={currentX}
            cy={(dimensions.height / 2) - ((dataPoints.findLast(p => p.x <= currentTime)?.y || 0) / maxMargin) * (dimensions.height / 2)}
            r="4"
            fill="#1e293b"
            className="transition-all duration-100 ease-linear"
          />
        </svg>

        {/* Hover overlay for seeking */}
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors pointer-events-none" />
      </div>
    </div>
  );
}
