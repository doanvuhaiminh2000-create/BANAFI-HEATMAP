export interface RevenuePoint {
  id: string;
  name: string;
  revenuesRaw?: { [dateStr: string]: number }; // 'YYYY-MM-DD' mapped to revenue val
  revenues: number[]; // 7 days of revenue (mil VND)
  monthlyTarget: number; // Monthly target (mil VND)
  headCount: number; // For FTE calculation
  visible?: boolean; // Toggle visibility on heatmap
}

export interface Pillar {
  id: string;
  name: string;
  points: RevenuePoint[];
}

// Khởi tạo các trụ cột doanh thu trống để người dùng bắt đầu nạp dữ liệu thật
export const MOCK_DATA: Pillar[] = [
  { id: "cable_car", name: "Cáp treo", points: [] },
  { id: "f_and_b", name: "F&B", points: [] },
  { id: "entertainment", name: "Vui chơi giải trí", points: [] },
  { id: "business_coop", name: "Hợp tác kinh doanh", points: [] },
  { id: "others", name: "Doanh thu khác", points: [] }
];

export const OVERALL_PILLAR: Pillar = {
  id: "overview",
  name: "Tổng quan Toàn khu",
  points: []
};
