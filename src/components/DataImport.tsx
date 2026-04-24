import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Clock, CheckCircle, AlertCircle, Trash2, Database } from 'lucide-react';
import { Pillar, RevenuePoint } from '../data/mockData';
import { cn } from '../lib/utils';

interface DataImportProps {
  currentPillars: Pillar[];
  onDataLoaded: (pillars: Pillar[], newStart?: Date, newEnd?: Date) => void;
  onClearData: () => void;
}

// Hàm định vị chính xác: Dòng Excel -> Pillar & Group
export function DataImport({ currentPillars, onDataLoaded, onClearData }: DataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const processData = (wb: XLSX.WorkBook) => {
    try {
      // Clone cấu trúc cố định hiện tại (đã được tạo full ID row_xxx)
      const updatedPillars = JSON.parse(JSON.stringify(currentPillars)) as Pillar[];

      // Xác định Act Data 
      const targetActSheetName = wb.SheetNames.find(n => n.toUpperCase().includes('ACT')) || wb.SheetNames[0];
      const wsAct = wb.Sheets[targetActSheetName];
      const actData = XLSX.utils.sheet_to_json(wsAct, { header: 1, raw: true, blankrows: true, defval: 0 }) as any[][];

      // Đọc Budget Data
      const budgetSheetName = wb.SheetNames.find(n => n.toUpperCase().includes('BUDGET'));
      const budgetMap = new Map<string, { [month: number]: number }>();

      if (budgetSheetName) {
        const wsBudget = wb.Sheets[budgetSheetName];
        const budgetData = XLSX.utils.sheet_to_json(wsBudget, { header: 1, raw: true, blankrows: true }) as any[][];

        budgetData.forEach((row, idx) => {
           const excelRow = idx + 1;
           if (excelRow < 39 || excelRow > 144) return;
           
           const locationName = row[7]?.toString().trim() || '';
           if (!locationName || locationName.toLowerCase().includes('tổng')) return; // Bỏ qua theo logic trước

           const budgetMonths: { [month: number]: number } = {};
           for (let m = 1; m <= 12; m++) {
             const colIdx = 7 + m;
             const rawVal = row[colIdx];
             if (typeof rawVal === 'string' && rawVal.startsWith('=')) {
                budgetMonths[m] = 0;
             } else {
                budgetMonths[m] = (parseFloat(row[colIdx]) / 1000000) || 0;
             }
           }
           budgetMap.set(`row_${excelRow}`, budgetMonths);
        });
      }

      // Xử lý động cột ngày từ header (dòng thứ 6 trong excel, index = 5)
      const actHeaderRow = actData[5];
      const dynamicDateCols: { colIdx: number; dateStr: string }[] = [];

      if (actHeaderRow) {
        for (let c = 8; c < actHeaderRow.length; c++) {
          const cellVal = actHeaderRow[c];
          if (!cellVal) continue;
          
          const upperStr = String(cellVal).toUpperCase();
          if (upperStr.includes('THÁNG') || upperStr.includes('NĂM') || upperStr.includes('BUDGET') || upperStr.includes('KẾ HOẠCH')) continue;
          
          let dateStr = '';
          if (cellVal instanceof Date && !isNaN(cellVal.getTime())) {
            // Trường hợp 1: xlsx đã convert sang Date object (cellDates:true hoạt động đúng)
            const y = cellVal.getFullYear();
            const m = String(cellVal.getMonth() + 1).padStart(2, '0');
            const d = String(cellVal.getDate()).padStart(2, '0');
            if (y >= 2000 && y < 2100) dateStr = `${y}-${m}-${d}`;
          } else if (typeof cellVal === 'number' && cellVal > 40000 && cellVal < 60000) {
            // Trường hợp 2: xlsx trả về Excel serial number (40000–60000 tương ứng năm 2009–2064)
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + cellVal * 86400000);
            const y = jsDate.getFullYear();
            const m = String(jsDate.getMonth() + 1).padStart(2, '0');
            const d = String(jsDate.getDate()).padStart(2, '0');
            if (y >= 2000 && y < 2100) dateStr = `${y}-${m}-${d}`;
          }
          
          if (dateStr) {
            dynamicDateCols.push({ colIdx: c, dateStr });
          }
        }
      }

      const lastDate = dynamicDateCols.length > 0
        ? new Date(dynamicDateCols[dynamicDateCols.length - 1].dateStr)
        : new Date(2026, 3, 23);
      const currentMonth = lastDate.getMonth() + 1; // 1-12

      actData.forEach((row, idx) => {
        const excelRow = idx + 1;
        
        // Phạm vi: Chỉ quét từ dòng 37 đến 144
        if (excelRow < 37 || excelRow > 144) return;
        
        // Tuyệt đối không nạp các dòng tổng/tiêu đề phân mục
        const excludedRows = [40, 41, 46, 52, 58, 75, 81, 83, 84, 85, 88, 94, 102, 107, 120, 124, 132, 140];
        if (excludedRows.includes(excelRow)) return;

        // Chỉ tìm chính xác Data Point dựa trên số thứ tự dòng cứng (O(1) lookup)
        const targetId = `row_${excelRow}`;
        
        // Tìm point trong struct
        let targetPoint: RevenuePoint | undefined;
        updatedPillars.forEach(p => {
           const pt = p.points.find(x => x.id === targetId);
           if (pt) targetPoint = pt;
        });

        if (!targetPoint) return;

        const revenuesRaw: { [k: string]: number } = {};
        
        // Thêm budget
        const pointBudget = budgetMap.get(targetId);
        targetPoint.budgetByMonth = pointBudget || {};
        
        // Tính YTD budget
        const monthsYTD = currentMonth;
        targetPoint.budgetYTD = 0;
        if (pointBudget) {
            for (let m = 1; m <= monthsYTD; m++) {
                targetPoint.budgetYTD += (pointBudget[m] || 0);
            }
        }

        targetPoint.monthlyTarget = pointBudget ? (pointBudget[monthsYTD] || 0) : 0;
        
        // Tính Act YTD từ cột 38 (0-indexed -> 38, dòng 6 là header nên Act 2026 ở cột index 38)
        let actYTDCell = row[38];
        targetPoint.actYTD = typeof actYTDCell === 'number' ? actYTDCell / 1000000 : 0;

        for (const { colIdx, dateStr } of dynamicDateCols) {
           const dayVal = parseFloat(row[colIdx]) || 0;
           revenuesRaw[dateStr] = dayVal / 1000000;
        }

        targetPoint.revenuesRaw = revenuesRaw;
        targetPoint.revenues = Object.values(revenuesRaw);
      });

      const firstDate = dynamicDateCols.length > 0 ? new Date(dynamicDateCols[0].dateStr) : new Date(2026, 3, 1);
      const rollingStart = dynamicDateCols.length >= 7
        ? new Date(dynamicDateCols[dynamicDateCols.length - 7].dateStr)
        : firstDate;

      onDataLoaded(updatedPillars, rollingStart, lastDate);
      setStatus({ type: 'success', message: 'Nạp dữ liệu Act và Budget thành công theo đúng vị trí dòng báo cáo.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Lỗi: ' + err.message });
    } finally { setIsProcessing(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, cellFormula: false });
      processData(wb);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-10 bg-white rounded-3xl shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Nạp Dữ Liệu Báo Cáo</h2>
        <p className="text-slate-500 text-sm">Hệ thống trích xuất chuẩn xác từ dòng 37 đến 144</p>
      </div>
      <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-blue-50 transition-all relative">
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        <FileSpreadsheet className="mx-auto text-blue-600 mb-4" size={48} />
        <p className="font-bold">Kéo thả file báo cáo vào đây</p>
      </div>
      {status.type !== 'idle' && (
        <div className={cn("mt-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3", status.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}
    </div>
  );
}