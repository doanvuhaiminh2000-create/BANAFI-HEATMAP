import React, { useState } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import { AnalysisOption } from '../utils/analytics';
import { cn } from '../lib/utils';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

interface TopBarProps {
  selectedOption: AnalysisOption;
  onChangeOption: (option: AnalysisOption) => void;
  pillarName: string;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const ANALYTICS_LAYERS: { id: AnalysisOption; label: string }[] = [
  { id: 'RUN_RATE', label: 'Tiến độ (Run-rate)' },
  { id: 'YTD_PROGRESS', label: 'Tiến độ YTD' },
  { id: 'GROWTH', label: 'Tăng trưởng (DoD)' },
  { id: 'VOLATILITY', label: 'Biến động' },
  { id: 'FTE_PRODUCTIVITY', label: 'Năng suất' },
];

export function TopBar({ 
  selectedOption, 
  onChangeOption, 
  pillarName,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: TopBarProps) {
  const [showPresets, setShowPresets] = useState(false);

  const applyPreset = (start: Date, end: Date) => {
    onStartDateChange(start);
    onEndDateChange(end);
    setShowPresets(false);
  };

  const dayDiff = differenceInDays(endDate, startDate) + 1;
  const isRolling7 = dayDiff === 7;
  
  let periodLabel = "Giai đoạn Tùy chỉnh";
  if (isRolling7) periodLabel = "Rolling 7 Days (Tiêu chuẩn)";
  else if (dayDiff > 27 && dayDiff < 32) periodLabel = `Phân tích Tháng ${format(endDate, 'M')}`;
  else if (dayDiff > 80) periodLabel = "Báo cáo Quý";

  return (
    <header className="flex justify-between items-end mb-8 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Hệ thống Phân tích Quản trị</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{pillarName}</h2>
      </div>
      
      <div className="flex space-x-8 items-center">
        {/* Analysis Layers */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest px-1">Lớp phân tích chuyên sâu</label>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60 shadow-inner">
            {ANALYTICS_LAYERS.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChangeOption(opt.id)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-bold transition-all rounded-lg whitespace-nowrap",
                    isSelected
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Professional Timeframe Selector */}
        <div className="flex flex-col relative">
          <label className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest px-1 text-right">Chu kỳ Phân tích</label>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPresets(!showPresets)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm hover:border-blue-400 transition-all group min-w-[240px]"
            >
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar size={14} />
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{periodLabel}</span>
                <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">
                  {format(startDate, 'dd/MM')} — {format(endDate, 'dd/MM/yyyy')}
                </span>
              </div>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showPresets && "rotate-180")} />
            </button>
          </div>

          {/* Presets Dropdown */}
          {showPresets && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 grid grid-cols-1 gap-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mốc thời gian nhanh</p>
                
                <button 
                  onClick={() => applyPreset(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date())}
                  className="flex items-center justify-between p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold text-slate-700 group text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500 group-hover:text-white" />
                    <span>Rolling 7 Days (Hiện tại)</span>
                  </div>
                </button>

                <button 
                  onClick={() => applyPreset(startOfOfMonth(new Date()), endOfOfMonth(new Date()))}
                  className="flex items-center justify-between p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold text-slate-700 group text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 group-hover:text-white" />
                    <span>Tháng này</span>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    const prev = subMonths(new Date(), 1);
                    applyPreset(startOfMonth(prev), endOfMonth(prev));
                  }}
                  className="flex items-center justify-between p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold text-slate-700 group text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 group-hover:text-white" />
                    <span>Tháng trước</span>
                  </div>
                </button>

                <button 
                  onClick={() => applyPreset(startOfQuarter(new Date()), endOfQuarter(new Date()))}
                  className="flex items-center justify-between p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold text-slate-700 group text-left w-full"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 group-hover:text-white" />
                    <span>Quý này</span>
                  </div>
                </button>
              </div>

              <div className="p-4 bg-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tùy chỉnh khoảng ngày</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Từ</span>
                    <input 
                      type="date" 
                      value={format(startDate, 'yyyy-MM-dd')}
                      onChange={(e) => onStartDateChange(new Date(e.target.value))}
                      className="text-[11px] font-bold p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Đến</span>
                    <input 
                      type="date" 
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={(e) => onEndDateChange(new Date(e.target.value))}
                      className="text-[11px] font-bold p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Fixed function names for startOfMonth/endOfMonth mismatch
function startOfOfMonth(date: Date) { return startOfMonth(date); }
function endOfOfMonth(date: Date) { return endOfMonth(date); }
