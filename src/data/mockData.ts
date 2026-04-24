export interface RevenuePoint {
  id: string;
  name: string;
  revenuesRaw?: { [dateStr: string]: number }; // 'YYYY-MM-DD' mapped to revenue val
  revenues: number[]; // 12 months of revenue (mil VND)
  monthlyTarget: number; // Monthly target (mil VND)
  budgetByMonth?: { [month: number]: number };   // 1–12 → triệu VND
  budgetYTD?: number;       // Tổng budget từ T1 đến tháng hiện tại
  actYTD?: number;          // Thực hiện từ đầu năm (triệu VND)
  headCount: number; // For FTE calculation
  visible?: boolean; // Toggle visibility on heatmap
}

export interface Pillar {
  id: string;
  name: string;
  points: RevenuePoint[];
}

const createPoint = (id: string, group: string, name: string): RevenuePoint => ({
  id,
  name: `[${group}] ${name}`,
  revenues: Array(12).fill(0),
  monthlyTarget: 0,
  headCount: 5,
  visible: true
});

export const INITIAL_STATIC_DATA: Pillar[] = [
  {
    id: "cable_car",
    name: "Cáp treo",
    points: [
      createPoint("row_39", "Cáp treo", "Cáp treo")
    ]
  },
  {
    id: "f_and_b",
    name: "F&B",
    points: [
      // Buffet
      createPoint("row_42", "Buffet", "Beer Plaza"),
      createPoint("row_43", "Buffet", "Bharata"),
      createPoint("row_44", "Buffet", "Four Season"),
      createPoint("row_45", "Buffet", "Taiga"),
      // Alacarte
      createPoint("row_47", "Alacarte", "BaNa Brew House 1901"),
      createPoint("row_48", "Alacarte", "Brasseries"),
      createPoint("row_49", "Alacarte", "Bulgogi"),
      createPoint("row_50", "Alacarte", "Morin"),
      createPoint("row_51", "Alacarte", "Rosa Sushi and sashimi"),
      // Coffee Shop
      createPoint("row_53", "Coffee Shop", "Le Petrin"),
      createPoint("row_54", "Coffee Shop", "Ga 16"),
      createPoint("row_55", "Coffee Shop", "Rosa Coffee"),
      createPoint("row_56", "Coffee Shop", "MaisonKayser1"),
      createPoint("row_57", "Coffee Shop", "MaisonKayser2"),
      // Food Cart
      createPoint("row_59", "Food Cart", "Điểm bán lâu dài"),
      createPoint("row_60", "Food Cart", "Green Bean"),
      createPoint("row_61", "Food Cart", "Hầm Rượu"),
      createPoint("row_62", "Food Cart", "Hội An"),
      createPoint("row_63", "Food Cart", "Hội chợ châu âu"),
      createPoint("row_64", "Food Cart", "Khu vực đỉnh"),
      createPoint("row_65", "Food Cart", "Khu vườn hoa"),
      createPoint("row_66", "Food Cart", "Lễ hội bia"),
      createPoint("row_67", "Food Cart", "Mango Holic (bachuss)"),
      createPoint("row_68", "Food Cart", "mixused-Carnival"),
      createPoint("row_69", "Food Cart", "Quầy ga 12"),
      createPoint("row_70", "Food Cart", "Rosa Fried Chicken BNC"),
      createPoint("row_71", "Food Cart", "Trú vũ trà quán"),
      createPoint("row_72", "Food Cart", "Browny chicken"),
      createPoint("row_73", "Food Cart", "Đài quan sát")
    ]
  },
  {
    id: "entertainment",
    name: "Vui chơi giải trí",
    points: [
      createPoint("row_74", "Wowpass", "WOWPASS"),
      createPoint("row_76", "Game", "máng trượt"),
      createPoint("row_77", "Game", "leo núi"),
      createPoint("row_78", "Game", "chụp ảnh máng trượt"),
      createPoint("row_79", "Game", "bảo tàng sáp"),
      createPoint("row_80", "Game", "lưu niệm"),
      createPoint("row_82", "Retail", "sungift")
    ]
  },
  {
    id: "business_coop",
    name: "Hợp tác kinh doanh",
    points: [
      // F&B - Buffet
      createPoint("row_86", "F&B - Buffet", "Tokyo"),
      createPoint("row_87", "F&B - Buffet", "nhà hàng MFV"),
      // F&B - Alacarte
      createPoint("row_89", "F&B - Alacarte", "Lotteria"),
      createPoint("row_90", "F&B - Alacarte", "mỳ kungfu"),
      createPoint("row_91", "F&B - Alacarte", "ngọc chi"),
      createPoint("row_92", "F&B - Alacarte", "nhà hàng Việt"),
      createPoint("row_93", "F&B - Alacarte", "Thái Market"),
      // F&B - Coffee Shop
      createPoint("row_95", "F&B - Coffee Shop", "Bar Gemination"),
      createPoint("row_96", "F&B - Coffee Shop", "El Fresco"),
      createPoint("row_97", "F&B - Coffee Shop", "Fencha"),
      createPoint("row_98", "F&B - Coffee Shop", "Highlands"),
      createPoint("row_99", "F&B - Coffee Shop", "Nhật Anh coffee"),
      createPoint("row_100", "F&B - Coffee Shop", "Soul Coffee"),
      createPoint("row_101", "F&B - Coffee Shop", "Starbucks"),
      // F&B - Food Cart
      createPoint("row_103", "F&B - Food Cart", "kem cuộn và đậu phộng"),
      createPoint("row_104", "F&B - Food Cart", "kem maroya"),
      createPoint("row_105", "F&B - Food Cart", "kem ý"),
      createPoint("row_106", "F&B - Food Cart", "minh hồng phát"),
      // Retail
      createPoint("row_108", "Retail", "artbook"),
      createPoint("row_109", "Retail", "rượu ngọc bình"),
      createPoint("row_110", "Retail", "l''angfarm"),
      createPoint("row_111", "Retail", "Lưu niệm đá chàm"),
      createPoint("row_112", "Retail", "lưu niệm nhật anh"),
      createPoint("row_113", "Retail", "Lưu niệm TA"),
      createPoint("row_114", "Retail", "mai vàng rồng việt"),
      createPoint("row_115", "Retail", "minimart nhật anh"),
      createPoint("row_116", "Retail", "Mộc''s Truly huế"),
      createPoint("row_117", "Retail", "popmart"),
      createPoint("row_118", "Retail", "sâm ngọc linh"),
      createPoint("row_119", "Retail", "tinh nguyên"),
      // Game
      createPoint("row_121", "Game", "bảo tàng ánh sáng"),
      createPoint("row_122", "Game", "game HBL"),
      createPoint("row_123", "Game", "game 10D"),
      // Khác
      createPoint("row_125", "Khác", "Ghế Massage K&H"),
      createPoint("row_126", "Khác", "Ghế massage đá chàm"),
      createPoint("row_127", "Khác", "máy gắp gấu K&H"),
      createPoint("row_128", "Khác", "In ốp điện thoại K&H"),
      createPoint("row_129", "Khác", "Vẽ chân dung"),
      createPoint("row_130", "Khác", "máy bán hàng tự động JP capsure"),
      createPoint("row_131", "Khác", "photobooth")
    ]
  },
  {
    id: "others",
    name: "Doanh thu khác",
    points: [
      // Cho thuê mặt bằng
      createPoint("row_133", "Cho thuê mặt bằng", "Chụp ảnh tự động"),
      createPoint("row_134", "Cho thuê mặt bằng", "in ảnh tự động"),
      createPoint("row_135", "Cho thuê mặt bằng", "Chụp ảnh vườn hoa - nguyễn sinh"),
      createPoint("row_136", "Cho thuê mặt bằng", "căng tin hoàng lan"),
      createPoint("row_137", "Cho thuê mặt bằng", "dịch vụ canteen bãi xe"),
      createPoint("row_138", "Cho thuê mặt bằng", "căng tin maroya"),
      createPoint("row_139", "Cho thuê mặt bằng", "cho thuê trạm thu viễn thông"),
      // Khác
      createPoint("row_141", "Khác", "hướng dẫn viên/khẩu trang y tế/DVGT"),
      createPoint("row_142", "Khác", "Phí phục vụ"),
      createPoint("row_143", "Khác", "wowgift"),
      createPoint("row_144", "Khác", "phí bãi đậu xe")
    ]
  }
];

// Khởi tạo biến này để chống tương thích với các view đang dùng
export const MOCK_DATA = INITIAL_STATIC_DATA;

export const OVERALL_PILLAR: Pillar = {
  id: "overview",
  name: "Tổng quan Toàn khu",
  points: []
};
