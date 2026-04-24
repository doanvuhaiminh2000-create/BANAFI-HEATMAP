import React, { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3-hierarchy';
import { AnalysisOption, analyzePoints, PointAnalysis, sum } from '../utils/analytics';
import { Pillar, RevenuePoint } from '../data/mockData';
import { cn } from '../lib/utils';

interface RevenueHeatmapProps {
  pillars: Pillar[];
  option: AnalysisOption;
}

export function RevenueHeatmap({ pillars, option }: RevenueHeatmapProps) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  useEffect(() => {
    if (!containerRef) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0 && entries[0].contentRect.height > 0) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(containerRef);
    return () => observer.disconnect();
  }, [containerRef]);

  const { rootNode, pillarNodes, pointNodes } = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || pillars.length === 0) {
      return { rootNode: null, pillarNodes: [], pointNodes: [] };
    }

    const allPoints = pillars.flatMap(p => p.points);
    if (allPoints.length === 0) {
      return { rootNode: null, pillarNodes: [], pointNodes: [] };
    }
    const analyzedMap = new Map<string, PointAnalysis>();
    analyzePoints(allPoints, option).forEach(ap => analyzedMap.set(ap.point.id, ap));

    const rootData = {
      name: 'Root',
      children: pillars
        .filter(pillar => pillar.points.some(pt => pt.visible !== false))
        .map(pillar => ({
          name: pillar.name,
          isPillar: true,
          children: pillar.points
            .filter(pt => pt.visible !== false)
            .map(point => ({
              name: point.name,
              point,
              pillarName: pillar.name, // Store for tooltip
              analysis: analyzedMap.get(point.id)!,
              value: Math.max(1, sum(point.revenues)) 
            }))
        }))
    };

    const hierarchy = d3.hierarchy<any>(rootData)
      .sum(d => d.children ? 0 : 1) // Equal area for every leaf node
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap<any>()
      .size([dimensions.width, dimensions.height])
      .paddingTop(0)     // Removed header padding
      .paddingInner(2)   
      .paddingOuter(8)   // Small gap between groups
      .round(true);

    treemapLayout(hierarchy);

    const ds = hierarchy.descendants();
    return {
      rootNode: ds.find(n => n.depth === 0),
      pillarNodes: ds.filter(n => n.depth === 1),
      pointNodes: ds.filter(n => n.depth === 2),
    };
  }, [dimensions, pillars, option]);

  if (!rootNode) {
    return (
      <div 
        ref={setContainerRef} 
        className="flex-1 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center min-h-[300px] w-full mt-2"
      >
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="text-slate-400 font-medium">Chưa có dữ liệu hiển thị</span>
        <p className="text-slate-500 text-sm mt-1">Vui lòng cấu hình các mục doanh thu ở tab "Cấu hình".</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Pillar Legend - Scientific grouping info */}
      <div className="flex flex-wrap gap-4 mb-3 bg-white/50 p-3 rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter self-center mr-2">Nhóm:</span>
        {pillars.filter(p => p.points.length > 0).map(p => (
          <div key={p.id} className="flex items-center gap-1.5 whitespace-nowrap bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-xs font-bold text-slate-700">{p.name}</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 rounded-md border border-slate-100">
              {p.points.length}
            </span>
          </div>
        ))}
      </div>

      <div 
        className="flex-1 relative w-full bg-slate-900/10 rounded-xl overflow-hidden select-none border border-slate-200 shadow-inner"
        ref={setContainerRef}
      >
        {/* 1. Subtle Pillar Group Outlines */}
        {pillarNodes.map((node, i) => {
          const width = node.x1 - node.x0;
          const height = node.y1 - node.y0;
          return (
            <div
              key={i}
              className="absolute border border-slate-300/30 rounded-lg pointer-events-none transition-all duration-300"
              style={{
                left: node.x0,
                top: node.y0,
                width,
                height,
                background: 'rgba(255,255,255,0.02)'
              }}
            />
          );
        })}

        {/* 2. Interactive Points Tiles */}
        {pointNodes.map((node, i) => {
          const width = node.x1 - node.x0;
          const height = node.y1 - node.y0;
          const analysis = node.data.analysis as PointAnalysis;
          const isHovered = hoveredNode === node;
          
          const showText = width > 45 && height > 35;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "absolute text-white flex flex-col justify-center items-center overflow-hidden transition-all duration-150 rounded-md cursor-help",
                analysis.colorClass,
                isHovered ? "z-20 shadow-xl ring-2 ring-white scale-[1.01] brightness-110" : "z-10 opacity-90 hover:opacity-100 border border-black/5 shadow-sm"
              )}
              style={{
                left: node.x0 + 2, // Slight offset for padding feel
                top: node.y0 + 2,
                width: Math.max(0, width - 4),
                height: Math.max(0, height - 4),
              }}
            >
              {showText && (
                <div className="flex flex-col items-center px-1 w-full translate-y-[-1px]">
                  <span className="font-bold text-[10px] sm:text-[11px] text-center w-full truncate leading-tight drop-shadow-sm uppercase tracking-tight">
                    {node.data.name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 opacity-90 drop-shadow-sm">
                    <span className="text-[10px] font-extrabold">{analysis.label}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Enhanced Scientific Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-50 pointer-events-none bg-white p-4 rounded-xl shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-100"
            style={{
              left: Math.min(hoveredNode.x0 + (hoveredNode.x1 - hoveredNode.x0) / 2, dimensions.width - 220),
              top: Math.min(hoveredNode.y0 + (hoveredNode.y1 - hoveredNode.y0) / 2, dimensions.height - 120),
              transform: 'translate(-50%, -100%)',
              marginTop: '-15px',
              minWidth: '220px'
            }}
          >
            <div className="flex flex-col gap-0.5 mb-3 border-b border-slate-100 pb-2">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{hoveredNode.data.pillarName}</span>
              <h4 className="font-bold text-sm text-slate-900 leading-tight">{hoveredNode.data.name}</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Doanh thu 7N:</span>
                <span className="font-bold text-slate-900">{sum(hoveredNode.data.point.revenues).toLocaleString()} Tr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Chỉ tiêu tháng:</span>
                <span className="font-bold text-slate-900">{hoveredNode.data.point.monthlyTarget.toLocaleString()} Tr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Lực lượng FTE:</span>
                <span className="font-bold text-slate-900">{hoveredNode.data.point.headCount} ns</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-3 pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 transition-all">
                  <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Phân tích</span>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full text-white", hoveredNode.data.analysis.colorClass)}>
                    {hoveredNode.data.analysis.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
