import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUp, CheckCircle, AlertCircle, Info, FileSpreadsheet, Clock, Trash2, Database } from 'lucide-react';
import { parse, isValid, format, subDays, parseISO } from 'date-fns';
import { Pillar, RevenuePoint } from '../data/mockData';
import { cn } from '../lib/utils';

interface DataImportProps {
  currentPillars: Pillar[];
  onDataLoaded: (pillars: Pillar[], newStart?: Date, newEnd?: Date) => void;
  onClearData: () => void;
}

function parseVnNumber(str: any): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const noDot = str.toString().replace(/\./g, '');
  const finalStr = noDot.replace(/,/g, '.');
  return parseFloat(finalStr) || 0;
}

export function DataImport({ currentPillars, onDataLoaded, onClearData }: DataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const processData = (rows: any[][]) => {
    try {
      const headerRowIndex = rows.findIndex(row => 
        row.some(cell => cell?.toString().toUpperCase().includes('NỘI DUNG'))
      );

      if (headerRowIndex === -1) {
        throw new Error('Không tìm thấy dòng tiêu đề chứa "NỘI DUNG". Hãy đảm bảo file báo cáo đúng chuẩn định dạng.');
      }

      const headerRow = rows[headerRowIndex];
      const noiDungIdx = headerRow.findIndex(cell => cell?.toString().toUpperCase().includes('NỘI DUNG'));
      
      const dateCols: { colIdx: number, dateStr: string }[] = [];
      let annualTargetColIdx = -1;

      for (let c = noiDungIdx + 1; c < headerRow.length; c++) {
          const rawHeader = headerRow[c];
          let dateStr = '';
          
          if (rawHeader instanceof Date && !isNaN(rawHeader.getTime())) {
              dateStr = format(rawHeader, 'yyyy-MM-dd');
          } else {
              const colVal = rawHeader?.toString().trim() || '';
              if (!colVal) continue;
              
              const datePartOnly = colVal.split(' ')[0];

              const matchRegex = datePartOnly.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
              if (matchRegex) {
                 let y = 0, m = 0, d = 0;
                 if (matchRegex[1].length === 4) {
                     y = parseInt(matchRegex[1]);
                     m = parseInt(matchRegex[2]);
                     d = parseInt(matchRegex[3]);
                 } else if (matchRegex[3].length === 4) {
                     y = parseInt(matchRegex[3]);
                     let p1 = parseInt(matchRegex[1]);
                     let p2 = parseInt(matchRegex[2]);
                     if (p2 > 12) {
                         m = p1; d = p2;
                     } else if (p1 > 12) {
                         m = p2; d = p1;
                     } else {
                         m = p1; d = p2;
                     }
                 }
                 if (y >= 2000 && y < 2100 && m > 0 && m <= 12 && d > 0 && d <= 31) {
                     dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                 }
              } 
              
              if (!dateStr) {
                 const formatsToTry = [
                   'M/d/yyyy', 'd/M/yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'yyyy/MM/dd'
                 ];
                 for (const fmt of formatsToTry) {
                    const parsedDate = parse(datePartOnly, fmt, new Date());
                    if (isValid(parsedDate) && parsedDate.getFullYear() >= 2000 && parsedDate.getFullYear() < 2100) {
                       dateStr = format(parsedDate, 'yyyy-MM-dd');
                       break;
                    }
                 }
              }
              
              if (!dateStr) {
                 const parsedNative = new Date(colVal);
                 if (!isNaN(parsedNative.getTime()) && parsedNative.getFullYear() >= 2000 && parsedNative.getFullYear() < 2100) {
                     dateStr = format(parsedNative, 'yyyy-MM-dd');
                 }
              }

              if (!dateStr && !isNaN(Number(colVal))) {
                 const numVal = Number(colVal);
                 if (numVal > 40000 && numVal < 60000) {
                     const excelDate = new Date((Math.floor(numVal) - 25569) * 86400 * 1000);
                     dateStr = format(excelDate, 'yyyy-MM-dd');
                 }
              }
              
              const upperVal = colVal.toUpperCase();
              if (upperVal.includes('KẾ HOẠCH') || upperVal.includes('BUDGET') || upperVal.includes('NĂM 2026') || upperVal.includes('TARGET')) {
                 annualTargetColIdx = c;
              }
          }

          if (dateStr) {
             dateCols.push({ colIdx: c, dateStr: dateStr });
          }
      }

      if (dateCols.length === 0) {
          const sampleHeaders = headerRow.slice(noiDungIdx + 1, noiDungIdx + 5).map(String).join(' | ');
          throw new Error(`Hệ thống không nhận diện được các cột ngày (ví dụ: 1/1/2026). Dữ liệu sau cột NỘI DUNG tìm thấy: [${sampleHeaders}]`);
      }

      const pillarsMap = new Map<string, Pillar>();

      // Initialize exact 5 pillars requested
      const targetPillars = ["Cáp treo", "F&B", "Vui chơi giải trí", "Hợp tác kinh doanh", "Doanh thu khác"];
      targetPillars.forEach((pName, index) => {
          pillarsMap.set(pName, {
              id: `p_${index}`,
              name: pName,
              points: []
          });
      });

      rows.forEach((row, idx) => {
        const excelRow = idx + 1; // 1-indexed to match Excel visual rows

        // User requested strict DOANH THU section from 37 to 144. Row 39 is Cáp treo, 40-73 F&B, etc.
        // Skip 37 and 38 since they are just section headers and might contain keywords that mess up parser.
        if (excelRow < 39 || excelRow > 144) return;

        let pillarName = '';
        if (excelRow === 39) {
            pillarName = "Cáp treo";
        } else if (excelRow >= 40 && excelRow <= 73) {
            pillarName = "F&B";
        } else if (excelRow >= 74 && excelRow <= 82) {
            pillarName = "Vui chơi giải trí";
        } else if (excelRow >= 83 && excelRow <= 131) {
            pillarName = "Hợp tác kinh doanh";
        } else if (excelRow >= 132 && excelRow <= 144) {
            pillarName = "Doanh thu khác";
        } else {
            return; 
        }

        const businessType = row[1]?.toString().trim() || '';
        const activityType = row[2]?.toString().trim() || '';
        const serviceType = row[3]?.toString().trim() || '';
        const locationName = row[noiDungIdx]?.toString().trim() || '';

        // Ignore summary/header rows that don't have location Names
        const locUpper = locationName.toUpperCase();
        if (!locationName || locUpper === 'TỔNG' || locUpper.includes('LƯỢT KHÁCH') || locUpper === 'DOANH THU' || locUpper === 'CÁP TREO' || locUpper === 'F&B' || locUpper.includes('DOANH THU KHÁC')) return;

        const revenuesRaw: { [k: string]: number } = {};
        let dayHasValueCount = 0;
        let runningTotal = 0;

        dateCols.forEach(({ colIdx, dateStr }) => {
            const rawVal = row[colIdx];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
               const val = parseVnNumber(rawVal) / 1000000; 
               revenuesRaw[dateStr] = val;
               runningTotal += val;
               dayHasValueCount++;
            }
        });

        if (dayHasValueCount > 0) {
          let monthlyTarget = 500; 
          if (annualTargetColIdx !== -1) {
            const parsedTarget = parseVnNumber(row[annualTargetColIdx]) / 1000000;
            if (parsedTarget > 0) monthlyTarget = parsedTarget / 12; 
          } else {
             const dailyAvg = runningTotal / dayHasValueCount;
             monthlyTarget = Math.round(dailyAvg * 31 * 1.2);
          }

        let groupName = 'Chung';
        if (pillarName === 'Cáp treo') {
            groupName = 'Cáp treo';
        } else if (pillarName === 'F&B') {
            const combined = `${activityType} ${serviceType} ${locationName}`.toUpperCase();
            if (combined.includes('BUFFET')) groupName = 'Buffet';
            else if (combined.includes('A LA CARTE') || combined.includes('ALACARTE')) groupName = 'Alacarte';
            else if (combined.includes('COFFEE') || combined.includes('CAFE')) groupName = 'Coffee Shop';
            else if (combined.includes('KIO') || combined.includes('FOOD CART') || combined.includes('XE')) groupName = 'Food Cart';
            else groupName = 'Khác';
        } else if (pillarName === 'Vui chơi giải trí') {
            const combined = `${activityType} ${serviceType} ${locationName}`.toUpperCase();
            if (combined.includes('WOWPASS') || combined.includes('WOW PASS')) groupName = 'Wowpass';
            else if (combined.includes('GAME')) groupName = 'Game';
            else if (combined.includes('RETAIL') || combined.includes('SHOP') || combined.includes('MUA SẮM')) groupName = 'Retail';
            else groupName = 'Khác';
        } else if (pillarName === 'Hợp tác kinh doanh') {
            const combined = `${activityType} ${serviceType} ${locationName}`.toUpperCase();
            if (combined.includes('F&B') || combined.includes('NHÀ HÀNG')) groupName = 'F&B';
            else if (combined.includes('RETAIL') || combined.includes('SHOP') || combined.includes('BÁN LẺ')) groupName = 'Retail';
            else if (combined.includes('GAME')) groupName = 'Game';
            else groupName = 'Khác';
        } else if (pillarName === 'Doanh thu khác') {
            const combined = `${activityType} ${serviceType} ${locationName}`.toUpperCase();
            if (combined.includes('MẶT BẰNG') || combined.includes('CHO THUÊ')) groupName = 'Cho thuê mặt bằng';
            else groupName = 'Doanh thu khác';
        }

        const pointName = `[${groupName}] ${locationName}`;

          const point: RevenuePoint = {
            id: `pt_${pillarsMap.size}_${pillarsMap.get(pillarName)!.points.length}`,
            name: pointName,
            revenuesRaw: revenuesRaw,
            revenues: [], 
            monthlyTarget: Math.max( monthlyTarget || 0, 10),
            headCount: Math.floor(Math.max(runningTotal / 50, 1)) + Math.floor(Math.random() * 5),
            visible: true
          };

          pillarsMap.get(pillarName)!.points.push(point);
        }
      });

      const processedPillars = Array.from(pillarsMap.values()).filter(p => p.points.length > 0);
      
      if (processedPillars.length === 0) {
        throw new Error('Dữ liệu không trống nhưng không có điểm kinh doanh nào ở khu vực dòng 37 tới 144 theo chuẩn đã định.');
      }

      // Automatically sync latest dates (Rolling 7 by default)
      dateCols.sort((a,b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
      const maxDateFromData = parseISO(dateCols[dateCols.length - 1].dateStr);
      const newEndDate = maxDateFromData;
      let newStartDate = maxDateFromData;
      
      if (dateCols.length >= 7) {
        newStartDate = parseISO(dateCols[dateCols.length - 7].dateStr);
      } else if (dateCols.length > 0) {
        newStartDate = parseISO(dateCols[0].dateStr);
      }

      onDataLoaded(processedPillars, newStartDate, newEndDate);
      setStatus({ 
        type: 'success', 
        message: `Hệ thống nạp thành công dải ngày từ ${dateCols[0].dateStr} đến ${dateCols[dateCols.length-1].dateStr}. Các luồng dữ liệu chuẩn từ dòng 37 đến 144 đã được nạp. Đã thiết lập Rolling tự động về ${format(newStartDate, 'dd/MM/yyyy')} -> ${format(newEndDate, 'dd/MM/yyyy')}` 
      });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus({ type: 'idle', message: 'Hệ thống đang trích xuất dữ liệu...' });

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary', cellDates: true }); 
          
          const targetSheetName = wb.SheetNames.find(n => n.toUpperCase().includes('ACT')) || wb.SheetNames[0];
          const ws = wb.Sheets[targetSheetName];
          // use blankrows: true to ensure index matches the real Excel row perfectly
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: true }) as any[][];
          
          processData(data);
        } catch (error: any) {
          setStatus({ type: 'error', message: 'Lỗi đọc file Excel: ' + error.message });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        skipEmptyLines: false, // Must be false to keep exact line index matching 37 to 144
        complete: (results) => {
          processData(results.data as any[][]);
          setIsProcessing(false);
        },
        error: (error) => {
          setStatus({ type: 'error', message: 'Lỗi CSV: ' + error.message });
          setIsProcessing(false);
        }
      });
    } else {
      setStatus({ type: 'error', message: 'Hệ thống chỉ hỗ trợ .xlsx, .xls hoặc .csv' });
      setIsProcessing(false);
    }
  };

  const removePillar = (id: string) => {
    onDataLoaded(currentPillars.filter(p => p.id !== id));
  };

  return (
    <div className="p-10 bg-white rounded-3xl shadow-xl border border-slate-200 min-h-full flex flex-col items-center max-w-4xl mx-auto overflow-y-auto">
      <div className="text-center mb-12">
        <div className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4 shadow-sm">
          Database Synchronization
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Nạp & Quản lý Dữ liệu</h2>
        <p className="text-slate-500 mt-2 font-medium">Thay thế dữ liệu bằng báo cáo thực tế. Tự động đồng bộ với Global Timeframe.</p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Zone */}
        <div className="relative group">
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center p-8 transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30 overflow-hidden">
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={isProcessing}
            />
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
              isProcessing ? "bg-blue-100 animate-spin" : "bg-white shadow-md border border-slate-100 group-hover:scale-110 group-hover:rotate-3"
            )}>
              {isProcessing ? <Clock className="text-blue-600" /> : <FileSpreadsheet className="text-blue-600" size={32} />}
            </div>
            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Kéo thả file báo cáo</span>
            <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ Excel (.xlsx) & CSV</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">Cấu trúc trích xuất tự động</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">01</span>
                <div>
                  <p className="text-xs font-bold">Chống nhiễu dữ liệu</p>
                  <p className="text-[10px] text-slate-400">Chỉ lấy "BNC Nhận" tại phần "DOANH THU" (Tự động loại bỏ Lượt khách).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">02</span>
                <div>
                  <p className="text-xs font-bold">Rolling Timeframe</p>
                  <p className="text-[10px] text-slate-400">Nạp xong sẽ tự động lùi 7 ngày sát nhất để đồng bộ Global Timeframe.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex gap-2 items-center">
             <Database size={14} className="text-slate-400" />
             <span className="text-xs font-bold text-slate-300">Đang có {currentPillars.reduce((acc, p) => acc + p.points.length, 0)} điểm bán trên RAM.</span>
          </div>
        </div>
      </div>

      {status.type !== 'idle' && (
        <div className={cn(
          "w-full mt-8 p-6 rounded-2xl border flex items-start gap-4 transition-all animate-in zoom-in-95",
          status.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
        )}>
          {status.type === 'success' ? <CheckCircle className="text-emerald-500 shrink-0" /> : <AlertCircle className="text-red-500 shrink-0" />}
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-tight">{status.type === 'success' ? 'Đồng bộ thành công' : 'Lỗi xử lý file'}</p>
            <p className="text-xs mt-1 opacity-80 leading-relaxed">{status.message}</p>
            {status.type === 'success' && (
              <p className="text-[10px] mt-4 font-black text-emerald-600 uppercase tracking-widest underline decoration-2 underline-offset-4 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                Chuyển qua Tab Tổng Quan để xem dữ liệu →
              </p>
            )}
          </div>
        </div>
      )}

      {currentPillars.length > 0 && (
        <div className="w-full mt-12">
           <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-4">
              <div>
                 <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Quản lý Phân hệ Hiện tại</h3>
                 <p className="text-xs text-slate-500 mt-1">Danh sách các mảng kinh doanh đang lưu trên báo cáo</p>
              </div>
              <button 
                onClick={onClearData}
                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                 <Trash2 size={14} /> Xóa toàn bộ
              </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentPillars.map(p => (
                 <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between group">
                    <div>
                       <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</h4>
                       <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{p.points.length} điểm bán</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                       <button 
                         onClick={() => removePillar(p.id)}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Xóa mảng này"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
