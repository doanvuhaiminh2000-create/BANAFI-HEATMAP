import React from 'react';
import { LayoutDashboard, Settings, FileUp } from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'overview' | 'config' | 'data';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight uppercase text-white">Bà Nà Hills</h1>
        <p className="text-slate-400 text-xs font-medium uppercase mt-1">Revenue Heatmap</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button 
          onClick={() => onSelectTab('overview')}
          className={cn(
            "w-full flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            activeTab === 'overview' ? "bg-blue-600 font-semibold text-white" : "hover:bg-slate-800 text-slate-300"
          )}
        >
          <LayoutDashboard size={18} />
          <span className="text-sm">Tổng quan toàn khu</span>
        </button>

        <button 
          onClick={() => onSelectTab('config')}
          className={cn(
            "w-full flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            activeTab === 'config' ? "bg-blue-600 font-semibold text-white" : "hover:bg-slate-800 text-slate-300"
          )}
        >
          <Settings size={18} />
          <span className="text-sm">Cấu hình</span>
        </button>

        <button 
          onClick={() => onSelectTab('data')}
          className={cn(
            "w-full flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            activeTab === 'data' ? "bg-blue-600 font-semibold text-white" : "hover:bg-slate-800 text-slate-300"
          )}
        >
          <FileUp size={18} />
          <span className="text-sm">Nạp Dữ liệu</span>
        </button>
      </nav>
      
      <div className="p-6 text-[10px] text-slate-500 border-t border-slate-700 uppercase">
        LAST DATA REFRESH: 2026-04-21 08:30 AM
      </div>
    </aside>
  );
}
