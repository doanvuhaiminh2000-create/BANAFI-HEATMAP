import React, { useState, useMemo } from 'react';
import { subDays, differenceInDays, addDays, format, parseISO } from 'date-fns';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { RevenueHeatmap } from './RevenueHeatmap';
import { Configuration } from './Configuration';
import { DataImport } from './DataImport';
import { MOCK_DATA, Pillar, RevenuePoint } from '../data/mockData';
import { AnalysisOption, sum } from '../utils/analytics';
import { REVENUE_CATALOG, CatalogItem } from '../data/revenueCatalog';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'data'>('overview');
  const [selectedOption, setSelectedOption] = useState<AnalysisOption>('RUN_RATE');
  
  // Timeframe state - default to full year 2026 to match report
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 11, 31));
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  const [lastRefreshDate, setLastRefreshDate] = useState<Date | undefined>(undefined);
  
  // Selected points organized by pillar
  const [selectedPillars, setSelectedPillars] = useState<Pillar[]>(MOCK_DATA);

  const handleDataLoaded = (pillars: Pillar[], newStart?: Date, newEnd?: Date) => {
    setSelectedPillars(pillars);
    if (newStart && newEnd) {
      setStartDate(newStart);
      setEndDate(newEnd);
      setLastRefreshDate(newEnd);
    }
  };

  const timeFilteredPillars = useMemo(() => {
    return selectedPillars.map(pillar => ({
      ...pillar,
      points: pillar.points.map(pt => {
        if (!pt.revenuesRaw) return pt; 
        
        const filteredRevenues: number[] = [];
        const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
        for (let i = 0; i < days; i++) {
           const d = format(addDays(startDate, i), 'yyyy-MM-dd');
           filteredRevenues.push(pt.revenuesRaw[d] || 0);
        }
        return {
          ...pt,
          revenues: filteredRevenues
        };
      })
    }));
  }, [selectedPillars, startDate, endDate]);

  const allVisiblePoints = useMemo(() => 
    timeFilteredPillars.flatMap(p => p.points.filter(pt => pt.visible !== false)), 
  [timeFilteredPillars]);
  
  const totalRev = useMemo(() => allVisiblePoints.reduce((acc, p) => acc + sum(p.revenues), 0), [allVisiblePoints]);
  const totalTarget = useMemo(() => allVisiblePoints.reduce((acc, p) => acc + p.monthlyTarget, 0), [allVisiblePoints]);
  const totalHeadcount = useMemo(() => allVisiblePoints.reduce((acc, p) => acc + p.headCount, 0), [allVisiblePoints]);
  
  const totalActYTD = useMemo(() => allVisiblePoints.reduce((acc, p) => acc + (p.actYTD || 0), 0), [allVisiblePoints]);
  const totalBudgetYTD = useMemo(() => allVisiblePoints.reduce((acc, p) => acc + (p.budgetYTD || 0), 0), [allVisiblePoints]);
  const ytdProgress = totalBudgetYTD > 0 ? (totalActYTD / totalBudgetYTD * 100) : 0;

  const estimatedRunRate = totalTarget > 0 ? ((totalRev / Math.max(1, differenceInDays(endDate, startDate) + 1)) * 31 / totalTarget) * 100 : 0;
  const fteProductivity = totalHeadcount > 0 ? (totalRev / totalHeadcount) : 0;
  
  const topPerformer = useMemo(() => [...allVisiblePoints].sort((a,b) => 
    sum(b.revenues) - sum(a.revenues)
  )[0]?.name || "N/A", [allVisiblePoints]);

  const visiblePillars = useMemo(() => {
    return timeFilteredPillars
      .map(pillar => ({
        ...pillar,
        points: pillar.points.filter(p => p.visible === true || p.visible === undefined)
      }))
      .filter(pillar => pillar.points.length > 0);
  }, [timeFilteredPillars]);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lastRefreshDate={lastRefreshDate}
      />
      
      <main className="flex-1 flex flex-col p-8 overflow-hidden relative">
        {activeTab === 'overview' ? (
          <>
            <TopBar 
              pillarName="Tổng quan Toàn khu"
              selectedOption={selectedOption}
              onChangeOption={setSelectedOption}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            <div className="grid grid-cols-4 gap-6 mb-8 shrink-0">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Doanh thu (Tập theo dõi)</div>
                <div className="text-2xl font-bold text-slate-900">{(totalRev / 1000).toFixed(1)} Tỷ VND</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1 uppercase italic">Dữ liệu gộp từ danh mục đang chọn</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiến độ YTD</div>
                    <div className="text-2xl font-bold text-slate-900">{ytdProgress.toFixed(1)}%</div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-[10px] text-slate-500 font-medium italic">Run-rate Tháng</div>
                    <div className="text-lg font-bold text-slate-700">{estimatedRunRate.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cơ sở dẫn đầu (Tập theo dõi)</div>
                <div className="text-2xl font-bold text-blue-600 truncate">{topPerformer}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 italic">Đóng góp dòng tiền TOP 1 hiện tại</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hiệu suất lao động (Tập theo dõi)</div>
                <div className="text-2xl font-bold text-slate-900">{fteProductivity.toFixed(1)}M/ns</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 italic">Doanh thu bình quân trên mỗi nhân sự</div>
              </div>
            </div>
            
            <RevenueHeatmap pillars={visiblePillars} option={selectedOption} />
          </>
        ) : activeTab === 'config' ? (
          <Configuration pillars={selectedPillars} setPillars={setSelectedPillars} />
        ) : (
          <DataImport 
            currentPillars={selectedPillars}
            onDataLoaded={handleDataLoaded} 
            onClearData={() => setSelectedPillars(MOCK_DATA)}
          />
        )}
      </main>
    </div>
  );
}
