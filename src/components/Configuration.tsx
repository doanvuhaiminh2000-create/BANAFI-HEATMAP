import React, { useState } from 'react';
import { Pillar, RevenuePoint } from '../data/mockData';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfigurationProps {
  pillars: Pillar[];
  setPillars: React.Dispatch<React.SetStateAction<Pillar[]>>;
}

const PILLAR_STRUCTURE: Record<string, string[]> = {
  "Cáp treo": ["Cáp treo"],
  "F&B": ["Buffet", "Alacarte", "Coffee Shop", "Food Cart"],
  "Vui chơi giải trí": ["Wowpass", "Game", "Retail"],
  "Hợp tác kinh doanh": ["F&B", "Retail", "Game", "Khác"],
  "Doanh thu khác": ["Cho thuê mặt bằng", "Doanh thu khác"]
};

// Guarantee layout order
const PILLAR_ORDER = [
  "Cáp treo",
  "F&B",
  "Vui chơi giải trí",
  "Hợp tác kinh doanh",
  "Doanh thu khác"
];

export function Configuration({ pillars, setPillars }: ConfigurationProps) {

  const handleToggle = (pillarId: string, pointId: string) => {
    setPillars(prev => prev.map(p => {
      if (p.id === pillarId) {
        return {
          ...p,
          points: p.points.map(pt => pt.id === pointId ? { ...pt, visible: pt.visible === false ? true : false } : pt)
        };
      }
      return p;
    }));
  };

  const handleToggleGroup = (pillarId: string, pointIds: string[], targetState: boolean) => {
    setPillars(prev => prev.map(p => {
      if (p.id === pillarId) {
        return {
          ...p,
          points: p.points.map(pt => pointIds.includes(pt.id) ? { ...pt, visible: targetState } : pt)
        };
      }
      return p;
    }));
  };

  // Convert current pillars list into a map for fast cross-referencing against strict structure
  const pillarsMap = new Map(pillars.map(p => [p.name, p]));

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Cấu hình Hiện thị Heatmap</h2>
          <p className="text-sm text-slate-500 mt-1">Danh mục được tích chọn sẽ xuất hiện trên màn hình báo cáo tổng quan. Bỏ tích để ẩn đi.</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {PILLAR_ORDER.map((pillarName) => {
            const pillarData = pillarsMap.get(pillarName) || { id: `mock-${pillarName}`, name: pillarName, points: [] };
            return (
              <PillarConfigCard 
                key={pillarData.id} 
                pillar={pillarData} 
                expectedGroups={PILLAR_STRUCTURE[pillarName]}
                onToggle={(pointId) => handleToggle(pillarData.id, pointId)}
                onToggleGroup={(pointIds, state) => handleToggleGroup(pillarData.id, pointIds, state)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PillarConfigCard({ 
  pillar, 
  expectedGroups,
  onToggle,
  onToggleGroup
}: { 
  pillar: Pillar, 
  expectedGroups: string[],
  onToggle: (pid: string) => void,
  onToggleGroup: (pids: string[], state: boolean) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group strictly by expected groups
  const groups: { [key: string]: RevenuePoint[] } = {};
  expectedGroups.forEach(g => {
    groups[g] = [];
  });

  const ungrouped: RevenuePoint[] = [];

  pillar.points.forEach(pt => {
    const match = pt.name.match(/^\[(.*?)\] (.*)$/);
    if (match) {
      const gName = match[1];
      // Try to find the exact group, fallback to unexpected or other
      const targetGroup = expectedGroups.find(eg => eg.toUpperCase() === gName.toUpperCase());
      if (targetGroup) {
        groups[targetGroup].push({ ...pt, name: match[2] }); // Strip the prefix for display
      } else {
        ungrouped.push(pt);
      }
    } else {
      ungrouped.push(pt);
    }
  });

  const totalPoints = pillar.points.length;
  const visibleCount = pillar.points.filter(p => p.visible !== false).length;
  const isAllChecked = visibleCount === totalPoints && totalPoints > 0;
  const isSomeChecked = visibleCount > 0 && visibleCount < totalPoints;

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (totalPoints > 0) {
        onToggleGroup(pillar.points.map(p => p.id), !isAllChecked);
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="text-slate-400 hover:text-blue-600 transition-colors w-6 flex justify-center">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <input 
            type="checkbox"
            checked={isAllChecked}
            disabled={totalPoints === 0}
            ref={input => { if (input) input.indeterminate = isSomeChecked; }}
            onChange={toggleAll}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
        />
        <div className="flex-1 flex items-center justify-between ml-2">
          <span className={cn("font-bold text-sm uppercase tracking-tight", totalPoints > 0 ? "text-slate-800" : "text-slate-400")}>{pillar.name}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
            {visibleCount}/{totalPoints}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="pl-14 pr-4 pb-4 pt-1 space-y-1 bg-white">
          {expectedGroups.map(gName => (
            <GroupConfig 
              key={gName} 
              groupName={gName} 
              points={groups[gName] || []} 
              onToggle={onToggle}
              onToggleGroup={onToggleGroup}
            />
          ))}

          {ungrouped.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2">Điểm kinh doanh ngoài danh mục</span>
              <div className="space-y-1">
                 {ungrouped.map(pt => (
                   <PointRow key={pt.id} point={pt} onToggle={() => onToggle(pt.id)} />
                 ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupConfig({ 
  groupName, 
  points, 
  onToggle,
  onToggleGroup 
}: { 
  groupName: string, 
  points: RevenuePoint[], 
  onToggle: (id: string) => void,
  onToggleGroup: (ids: string[], state: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false);
  
  const visibleCount = points.filter(p => p.visible !== false).length;
  const isAllChecked = visibleCount === points.length && points.length > 0;
  const isSomeChecked = visibleCount > 0 && visibleCount < points.length;

  const toggleGroup = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (points.length === 0) return;
    onToggleGroup(points.map(p => p.id), !isAllChecked);
  };

  return (
    <div className="flex flex-col border border-transparent rounded-lg hover:border-slate-100 transition-colors">
      <div 
        className="flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-slate-300 hover:text-blue-500 transition-colors w-4 flex justify-center">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <input 
            type="checkbox"
            checked={isAllChecked}
            disabled={points.length === 0}
            ref={input => { if (input) input.indeterminate = isSomeChecked; }}
            onChange={toggleGroup}
            onClick={e => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
        />
        <div className="flex-1 flex justify-between items-center ml-1">
           <span className={cn("text-xs font-semibold", points.length > 0 ? "text-slate-700" : "text-slate-400")}>{groupName}</span>
           {points.length > 0 && (
             <span className="text-[10px] text-slate-400">{visibleCount}/{points.length}</span>
           )}
        </div>
      </div>
      
      {expanded && points.length > 0 && (
        <div className="pl-8 pr-2 py-1 space-y-0.5">
          {points.map(pt => (
            <PointRow key={pt.id} point={pt} onToggle={() => onToggle(pt.id)} />
          ))}
        </div>
      )}
      
      {expanded && points.length === 0 && (
        <div className="pl-8 py-1 pb-2 text-[10px] text-slate-400 italic">
           Không có dữ liệu
        </div>
      )}
    </div>
  );
}

function PointRow({ point, onToggle }: { point: RevenuePoint, onToggle: () => void }) {
  const isVisible = point.visible !== false;
  return (
    <label className={cn(
      "flex items-center gap-2 p-1.5 rounded-md text-xs border border-transparent hover:bg-blue-50 transition-all cursor-pointer",
      !isVisible ? "opacity-50" : ""
    )}>
      <input 
        type="checkbox"
        checked={isVisible}
        onChange={onToggle}
        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
      />
      <span className={cn("font-medium", isVisible ? "text-slate-800" : "text-slate-500 line-through")}>
         {point.name}
      </span>
    </label>
  );
}
