import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Clock, CheckCircle, AlertCircle, Trash2, Database } from 'lucide-react';
import { Pillar, RevenuePoint, INITIAL_STATIC_DATA } from '../data/mockData';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface DataImportProps {
  currentPillars: Pillar[];
  onDataLoaded: (pillars: Pillar[], newStart?: Date, newEnd?: Date) => void;
  onClearData: () => void;
  uploadMeta: { fileName: string; dateRange: string; pointCount: number; } | null;
  setUploadMeta: (meta: { fileName: string; dateRange: string; pointCount: number; } | null) => void;
}

// Hàm định vị chính xác: Dòng Excel -> Pillar & Group
export function DataImport({ currentPillars, onDataLoaded, onClearData, uploadMeta, setUploadMeta }: DataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const processData = (wb: XLSX.WorkBook, fileName: string) => {
    try {
      // Clone cấu trúc cố định hiện tại từ INITIAL_STATIC_DATA để đảm bảo replace hoàn toàn dữ liệu cũ
      const updatedPillars = JSON.parse(JSON.stringify(INITIAL_STATIC_DATA)) as Pillar[];
      
      // Khởi tạo các giá trị trống cho mọi point (Bug 1 fix)
      updatedPillars.forEach(p => {
         p.points.forEach(pt => {
            pt.revenues = [];
            pt.revenuesRaw = {};
            pt.budgetByMonth = {};
            pt.budgetYTD = 0;
            pt.actYTD = 0;
            pt.monthlyTarget = 0;
         });
      });

      // Xác định Act Data
      if (wb.SheetNames.length === 1) {
        throw new Error("Vui lòng gộp dữ liệu Act và Budget vào 1 file Excel (.xlsx) duy nhất có 2 sheet (tối thiểu chứa sheet Act và Budget).");
      }
      const targetActSheetName = wb.SheetNames.find(n => n.toUpperCase().includes('ACT'));
      if (!targetActSheetName) {
        throw new Error("Không tìm thấy sheet chứa dữ liệu thực tế (tên sheet cần chứa chữ 'ACT').");
      }
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
             budgetMonths[m] = (parseFloat(row[colIdx]) || 0) / 1000000;
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
          } else if (typeof cellVal === 'string') {
            // Trường hợp 3: chuỗi ngày tháng YYYY-MM-DD
            const matchYMD = cellVal.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (matchYMD) {
              dateStr = cellVal.trim();
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(cellVal.trim())) {
              // Handle MM/DD/YYYY or DD/MM/YYYY format as fallback
              const parts = cellVal.trim().split('/');
              if (parts.length >= 3) {
                // assume DD/MM/YYYY format for Vietnam
                const y = parseInt(parts[2], 10);
                const m = parts[1].padStart(2, '0');
                const d = parts[0].padStart(2, '0');
                if (y >= 2000 && y < 2100) dateStr = `${y}-${m}-${d}`;
              }
            }
          }
          
          if (dateStr) {
            dynamicDateCols.push({ colIdx: c, dateStr });
          }
        }
      }

      // Xác định cột "Năm" dùng cho Act YTD
      let ytdIndex = -1;
      if (actHeaderRow) {
        for (let i = 0; i < actHeaderRow.length; i++) {
          const v = actHeaderRow[i];
          if (v && typeof v === 'string') {
            const upper = v.toUpperCase();
            if (upper.includes('NĂM') || upper.includes('NAM') || upper.includes('YEAR')) {
              ytdIndex = i;
              break;
            }
          }
        }
      }
      if (ytdIndex === -1) ytdIndex = 38; // fallback: col 39 in Excel = index 38

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

        // Cơ chế mapping: Tìm theo ID dòng trước, nếu không có/bị lệch dòng thì fallback tìm theo tên
        const targetId = `row_${excelRow}`;
        const rawName = row[7]?.toString().trim().toLowerCase();
        
        // Tìm point trong struct
        let targetPoint: RevenuePoint | undefined;
        updatedPillars.forEach(p => {
           const pt = p.points.find(x => {
             const cleanName = x.name.replace(/^\[.*?\]\s*/, '').toLowerCase();
             return x.id === targetId || (rawName && cleanName === rawName);
           });
           if (!targetPoint && pt) targetPoint = pt;
        });

        if (!targetPoint) return;

        const revenuesRaw: { [k: string]: number } = {};
        
        // Thêm budget (ưu tiên id của điểm vừa tìm được, phòng trường hợp lệch)
        const pointBudget = budgetMap.get(targetPoint.id) || budgetMap.get(targetId);
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
        
        // Tính Act YTD từ cột động ytdIndex bằng parse an toàn
        let actYTDCell = row[ytdIndex];
        targetPoint.actYTD = (parseFloat(actYTDCell as any) || 0) / 1000000;

        if (targetPoint.monthlyTarget === 0 && targetPoint.actYTD > 0 && currentMonth > 0) {
           targetPoint.monthlyTarget = targetPoint.actYTD / currentMonth;
        }

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
      
      let loadedPtsCount = 0;
      updatedPillars.forEach(p => p.points.forEach(pt => {
         if (pt.revenues && pt.revenues.length > 0) loadedPtsCount++;
      }));
      setUploadMeta({
        fileName,
        dateRange: `${format(firstDate, 'dd/MM/yyyy')} - ${format(lastDate, 'dd/MM/yyyy')}`,
        pointCount: loadedPtsCount
      });

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
      processData(wb, file.name);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
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
      {(uploadMeta || status.type !== 'idle') && (
        <div className={cn("mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between gap-4", (uploadMeta || status.type === 'success') ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100")}>
          <div className="flex items-start gap-3">
             {(uploadMeta || status.type === 'success') ? <CheckCircle className="text-emerald-600 mt-0.5" size={18} /> : <AlertCircle className="text-red-600 mt-0.5" size={18} />}
             <div>
                <p className={cn("font-bold mb-1", (uploadMeta || status.type === 'success') ? "text-emerald-800" : "text-red-800")}>
                  {status.type === 'success' ? status.message : uploadMeta ? 'Đang hiển thị dữ liệu đã nạp.' : status.message}
                </p>
                {uploadMeta && (
                  <ul className="text-emerald-700 text-xs space-y-1 list-disc list-inside opacity-80 mt-2">
                     <li>File tải lên: <span className="font-semibold">{uploadMeta.fileName}</span></li>
                     <li>Khoảng thời gian: <span className="font-semibold">{uploadMeta.dateRange}</span></li>
                     <li>Dữ liệu nạp: <span className="font-semibold">{uploadMeta.pointCount} cơ sở</span></li>
                  </ul>
                )}
             </div>
          </div>
          {uploadMeta && (
             <button onClick={() => {
                setStatus({ type: 'idle', message: '' });
                onClearData();
             }} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider">
               <Trash2 size={14} /> Xóa dữ liệu
             </button>
          )}
        </div>
      )}
    </div>
  );
}