
export interface CatalogItem {
  id: string;
  name: string;
  children?: CatalogItem[];
  // If it's a leaf node, it has data
  revenueData?: {
    revenues: number[];
    monthlyTarget: number;
    headCount: number;
  };
}

function createLeaf(id: string, name: string): CatalogItem {
  const baseRev = Math.floor(Math.random() * 500) + 10;
  return {
    id,
    name,
    revenueData: {
      revenues: Array.from({ length: 7 }, () => Math.floor(baseRev * (0.8 + Math.random() * 0.4))),
      monthlyTarget: Math.floor(baseRev * 30 * 1.1),
      headCount: Math.floor(Math.random() * 15) + 2
    }
  };
}

export const REVENUE_CATALOG: CatalogItem[] = [
  {
    id: "cable_car",
    name: "Cáp treo",
    children: [
      createLeaf("cable_car_main", "Cáp treo")
    ]
  },
  {
    id: "f_and_b",
    name: "F&B",
    children: [
      {
        id: "fnb_buffet",
        name: "Buffet",
        children: [
          createLeaf("beer_plaza", "Beer Plaza"),
          createLeaf("bharata", "Bharata"),
          createLeaf("four_seasons", "Four Season"),
          createLeaf("taiga", "Taiga")
        ]
      },
      {
        id: "fnb_allacarte",
        name: "A la carte",
        children: [
          createLeaf("brew_house", "BaNa Brew House 1901"),
          createLeaf("brasseries", "Brasseries"),
          createLeaf("bulgogi", "Bulgogi"),
          createLeaf("morin", "Morin"),
          createLeaf("rosa_sushi", "Rosa Sushi and sashimi"),
          createLeaf("thai_market", "Thái market"),
          createLeaf("nha_hang_viet", "Nhà hàng Việt")
        ]
      },
      {
        id: "fnb_coffee",
        name: "Coffee shop",
        children: [
          createLeaf("le_petrin", "Le Petrin"),
          createLeaf("ga16", "Ga 16"),
          createLeaf("rosa_coffee", "Rosa Coffee"),
          createLeaf("maison_kayser1", "MaisonKayser1"),
          createLeaf("maison_kayser2", "MaisonKayser2")
        ]
      },
      {
        id: "fnb_foodcart",
        name: "Food cart",
        children: [
          createLeaf("diem_ban_lau_dai", "Điểm bán Lâu Đài"),
          createLeaf("green_bean", "Green Bean"),
          createLeaf("ham_ruou", "Hầm rượu"),
          createLeaf("hoi_an", "Hội An"),
          createLeaf("hoi_cho_chau_au", "Hội chợ Châu Âu"),
          createLeaf("khu_vuc_dinh", "Khu vực đỉnh"),
          createLeaf("khu_vuon_hoa", "Khu vườn hoa"),
          createLeaf("le_hoi_bia", "Lễ hội Bia"),
          createLeaf("mango_holic", "Mango holic (bachuss)"),
          createLeaf("mixused_carnival", "Mixused-Carnival"),
          createLeaf("quay_ga_12", "Quầy ga 12"),
          createLeaf("rosa_fried_chicken", "Rosa Fried Chicken BNC"),
          createLeaf("tra_vu_tra_quan", "Trà vũ trà quán"),
          createLeaf("browny_chicken", "Browny Chicken"),
          createLeaf("dai_quan_sat", "Đài quan sát")
        ]
      }
    ]
  },
  {
    id: "entertainment",
    name: "Vui chơi giải trí",
    children: [
      {
        id: "ent_wowpass",
        name: "Wowpass",
        children: [
          createLeaf("wowpass_main", "Wowpass")
        ]
      },
      {
        id: "ent_game",
        name: "Game",
        children: [
          createLeaf("mang_truot", "Máng trượt"),
          createLeaf("leo_nui", "Leo núi"),
          createLeaf("chup_anh_mang_truot", "Chụp ảnh máng trượt"),
          createLeaf("bao_tang_sap", "Bảo tàng sáp")
        ]
      },
      {
        id: "ent_retail",
        name: "Retail",
        children: [
          createLeaf("sungift", "Sungift")
        ]
      }
    ]
  },
  {
    id: "business_coop",
    name: "Hợp tác kinh doanh",
    children: [
      {
        id: "coop_fnb",
        name: "F&B",
        children: [
          {
            id: "coop_fnb_buffet",
            name: "Buffet",
            children: [
              createLeaf("tokyo", "Tokyo"),
              createLeaf("nha_hang_mfv", "Nhà hàng MFV")
            ]
          },
          {
            id: "coop_fnb_allacart",
            name: "Allacart",
            children: [
              createLeaf("lotteria", "Lotteria"),
              createLeaf("mi_kungfu", "Mì Kungfu"),
              createLeaf("ngoc_chi", "Ngọc Chi"),
              createLeaf("coop_nha_hang_viet", "Nhà hàng Việt"),
              createLeaf("coop_thai_market", "Thái market")
            ]
          },
          {
            id: "coop_fnb_coffee",
            name: "Coffee shop",
            children: [
              createLeaf("bar_gemination", "Bar Gemination"),
              createLeaf("el_fresco", "El Fresco"),
              createLeaf("fencha", "Fencha"),
              createLeaf("high_lands", "High Lands"),
              createLeaf("nhat_anh_coffee", "Nhật Anh Coffee"),
              createLeaf("soul_coffee", "Soul Coffee"),
              createLeaf("starbucks", "Starbucks")
            ]
          },
          {
            id: "coop_fnb_foodcart",
            name: "Food Court",
            children: [
              createLeaf("kem_cuon_dau_phong", "Kem cuộn và đậu phộng"),
              createLeaf("kem_maroya", "Kem Maroya"),
              createLeaf("kem_y", "Kem Ý"),
              createLeaf("minh_hong_phat", "Minh Hồng Phát")
            ]
          }
        ]
      },
      {
        id: "coop_retail",
        name: "Retail",
        children: [
          createLeaf("artbook", "ArtBook"),
          createLeaf("ruou_ngoc_binh", "Rượu Ngọc Bình"),
          createLeaf("langfarm", "L'angfarm"),
          createLeaf("luu_niem_da_cham", "Lưu niệm Đá Chàm"),
          createLeaf("luu_niem_nhat_anh", "Lưu niệm Nhật Anh"),
          createLeaf("luu_niem_ta", "Lưu niệm TA"),
          createLeaf("mai_vang_rong_viet", "Mai Vàng Rồng Việt"),
          createLeaf("mini_mart_nhat_anh", "Mini Mart Nhật Anh"),
          createLeaf("mocs_truly_hue", "Mộc's Truly Huế"),
          createLeaf("pop_mart", "Pop Mart"),
          createLeaf("sam_ngoc_linh", "Sâm Ngọc Linh"),
          createLeaf("tinh_nguyen", "Tinh Nguyên")
        ]
      },
      {
        id: "coop_game",
        name: "Game",
        children: [
          createLeaf("bao_tang_anh_sang", "Bảo tàng ánh sáng"),
          createLeaf("game_hbl", "Game HBL"),
          createLeaf("phim_10d", "Phim 10D")
        ]
      },
      {
        id: "coop_other",
        name: "Khác",
        children: [
          createLeaf("ghe_massage_kh", "Ghế Massage K&H"),
          createLeaf("ghe_massage_da_cham", "Ghế Massage Đá Chàm"),
          createLeaf("may_gap_gau_kh", "Máy gắp gấu K&H"),
          createLeaf("in_op_dien_thoai_kh", "In ốp điện thoại K&H"),
          createLeaf("ve_chan_dung", "Vẽ chân dung"),
          createLeaf("may_ban_hang_tu_dong", "Máy bán hàng tự động JP Casure"),
          createLeaf("photobooth", "Photobooth")
        ]
      }
    ]
  },
  {
    id: "others",
    name: "Doanh thu khác",
    children: [
      {
        id: "other_rent",
        name: "Cho thuê mặt bằng",
        children: [
          createLeaf("cho_thue_tram_thu_vien_thong", "Cho thuê trạm thu viễn thông")
        ]
      },
      {
        id: "other_misc",
        name: "Khác",
        children: [
          createLeaf("chup_anh_tu_dong", "Chụp ảnh tự động (Đài phun nước FV, Máng trượt...)"),
          createLeaf("in_anh_tu_dong", "In ảnh tự động"),
          createLeaf("chup_anh_khu_vuon_hoa", "Chụp ảnh khu vườn hoa - Nguyễn Vũ Sinh"),
          createLeaf("cang_tin_hoang_lan", "Căng tin Hoàng Lan"),
          createLeaf("dich_vu_canteen_bai_xe", "Dịch vụ Canteen bãi xe"),
          createLeaf("cang_tin_maroya", "Căng tin Maroya")
        ]
      }
    ]
  }
];
