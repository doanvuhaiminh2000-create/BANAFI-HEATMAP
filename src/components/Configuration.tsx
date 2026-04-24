import React from 'react';
import { Pillar } from '../data/mockData';
import { ChevronDown, X } from 'lucide-react';

interface ConfigurationProps {
  pillars: Pillar[];
  setPillars: React.Dispatch<React.SetStateAction<Pillar[]>>;
}

export function Configuration({ pillars, setPillars }: ConfigurationProps) {
  // Lấy các điểm đang được chọn để hiện bên Box phải
  const activePoints = pillars.flatMap(p => p.points.filter(pt => pt.visible !== false));

  const togglePoint = (id: string) => {
    setPillars(prev => prev.map(pillar => ({
      ...pillar,
      points: pillar.points.map(pt => pt.id === id ? { ...pt, visible: !pt.visible } : pt)
    })));
  };

  const togglePillar = (pillarId: string, visible: boolean) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? {
      ...p,
      points: p.points.map(pt => ({ ...pt, visible }))
    } : p));
  };

  const toggleGroup = (pillarId: string, groupName: string, visible: boolean) => {
    setPillars(prev => prev.map(p => p.id === pillarId ? {
      ...p,
      points: p.points.map(pt => {
        const match = pt.name.match(/^\[(.*?)\]\s*(.*)$/);
        const ptGroup = match ? match[1] : 'Khác';
        return ptGroup === groupName ? { ...pt, visible } : pt;
      })
    } : p));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-slate-50 min-h-screen">
      {/* CỘT TRÁI: DANH MỤC (Accordion) */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-4">Danh mục mảng doanh thu</h3>
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden divide-y divide-slate-100">
           {pillars.map(pillar => {
              // Nhóm các điểm bán theo Group (Trích xuất từ prefix `[Group] `)
              const groupedPoints = pillar.points.reduce((acc, pt) => {
                 const match = pt.name.match(/^\[(.*?)\]\s*(.*)$/);
                 const groupName = match ? match[1] : 'Khác';
                 const displayName = match ? match[2] : pt.name;
                 
                 if (!acc[groupName]) acc[groupName] = [];
                 acc[groupName].push({ ...pt, displayName });
                 return acc;
              }, {} as Record<string, any[]>);

              const isPillarAllSelected = pillar.points.every(pt => pt.visible !== false);

              return (
                 <details key={pillar.id} className="group/pillar bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50 font-bold uppercase text-slate-800 border-b border-transparent group-open/pillar:border-slate-100">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isPillarAllSelected}
                          onChange={(e) => {
                             e.stopPropagation();
                             togglePillar(pillar.id, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                        />
                        {pillar.name}
                      </div>
                      <ChevronDown className="group-open/pillar:rotate-180 transition-transform duration-200 text-slate-400" size={18} />
                    </summary>
                    <div className="bg-slate-50/50 p-4 space-y-3">
                       {Object.entries(groupedPoints).map(([groupName, pts]) => {
                          const isGroupAllSelected = pts.every(pt => pt.visible !== false);
                          return (
                            <details key={groupName} className="group/group bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                               <summary className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold uppercase text-slate-600 tracking-wider">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={isGroupAllSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(pillar.id, groupName, e.target.checked);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                                    />
                                    <span>{groupName} <span className="text-slate-400 ml-1 font-medium lowercase">({pts.length})</span></span>
                                  </div>
                                  <ChevronDown className="group-open/group:rotate-180 transition-transform duration-200 text-slate-300" size={14} />
                               </summary>
                               <div className="p-3 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50/30">
                                {pts.map(pt => (
                                   <label key={pt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all">
                                      <input 
                                        type="checkbox" 
                                        checked={pt.visible !== false} 
                                        onChange={() => togglePoint(pt.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                      />
                                      <span className={`text-xs ${pt.visible !== false ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
                                        {pt.displayName}
                                      </span>
                                   </label>
                                ))}
                             </div>
                          </details>
                       )})}
                    </div>
                 </details>
              );
           })}
        </div>
      </div>

      {/* CỘT PHẢI: BOX HIỂN THỊ (Selected Items) */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white h-fit sticky top-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Đang lên Heatmap</h4>
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{activePoints.length}</span>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {activePoints.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-xs italic italic">Chưa có chỉ tiêu nào được chọn</p>
            </div>
          ) : (
            activePoints.map(pt => (
              <div key={pt.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10 group hover:border-blue-500/50 transition-all">
                <span className="text-[10px] font-bold truncate pr-4 text-slate-200">{pt.name}</span>
                <button onClick={() => togglePoint(pt.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}