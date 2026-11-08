// lib/mock-service.ts
import { KnowledgeItem } from '@/types/database';

export interface BusinessProfile {
  name: string;
  industry: string;
  hotline: string;
  address: string;
  serviceTypeName: string; // ví dụ: "Gói bàn tiệc", "Dịch vụ", "Khóa học"
  bookingVerb: string;      // ví dụ: "Xem sảnh & thử món", "Tư vấn 1-1"
}

export interface BotTrainingConfig {
  businessProfile: BusinessProfile;
  isMasterEnabled: boolean;
  masterStatusNote: string;
  persona: string;
  workingHours: {
    start: number;
    end: number;
  };
  outOfHoursMessage: string;
  channels: {
    facebook: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
    zalo: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
    web: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
  };
  guardrails: string[];
  telegramAlert: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  sampleTestPrompts: string[];
}

export interface IndustryPreset {
  id: string;
  name: string;
  tag: string;
  profile: BusinessProfile;
  persona: string;
  guardrails: string[];
  samplePrompts: string[];
  knowledgeBase: KnowledgeItem[];
}

// BỘ CẤU HÌNH NGÀNH NGHỀ MẪU (MULTI-INDUSTRY PRESETS)
export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  // ⭐ PRESET MẪU 1: TRUNG TÂM TIỆC CƯỚI & SỰ KIỆN (GOLDEN PALACE SHOWCASE)
  wedding_event: {
    id: 'wedding_event',
    name: 'Tiệc cưới & Hội nghị Sự kiện (Golden Palace Showcase)',
    tag: 'Được khuyên dùng',
    profile: {
      name: 'Trung tâm Tiệc cưới & Sự kiện Golden Palace Nam Định',
      industry: 'Ẩm thực & Sự kiện (F&B / Hospitality)',
      hotline: '0228 659 5959',
      address: '98 Đông A, KĐT Hòa Vượng, TP. Nam Định',
      serviceTypeName: 'Gói tiệc & Sảnh cưới',
      bookingVerb: 'Xem sảnh tiệc & tư vấn',
    },
    persona: `Tên bot: Golden Palace Assistant
Xưng hô: Em xưng hô với Quý khách / Anh/Chị
Phong cách: Ân cần, niềm nở, lịch sự, chuẩn phong cách hiếu khách ngành tiệc cưới cao cấp.
Nguyên tắc: Chỉ câu đầu tiên mở đầu cuộc trò chuyện mới giới thiệu 'Em là trợ lý Golden Palace'. Các câu sau TUYỆT ĐỐI KHÔNG lặp lại câu giới thiệu 'em là trợ lý tư vấn'. Trả lời cực kỳ ngắn gọn, đi thẳng vào đúng trọng tâm câu hỏi. Luôn dẫn link URL đầy đủ để khách hàng bấm mở trực tiếp xem thực đơn, ảnh sảnh, bản đồ.`,
    guardrails: [
      'Khi gặp câu hỏi nằm ngoài phạm vi tri thức hoặc chưa được xác thực: Tuyệt đối không suy đoán hay trả lời lung tung. Tự động tắt chế độ AI của hội thoại và chuyển giao cho nhân viên tư vấn thật tiếp quản ngay lập tức.',
      'Luôn trả lời ngắn gọn, đúng trọng tâm câu hỏi. Tuyệt đối không lặp lại câu giới thiệu vai trò trợ lý trong các câu trả lời tiếp theo.',
      'Đối với tổng tiệc cưới/mâm cỗ: Tuyệt đối không báo giá cố định trong chatbox, hướng dẫn khách dùng công cụ Dự toán Chi phí hoặc gọi Hotline 0228 659 5959.',
      'Đối với dịch vụ bổ sung (Photobooth, MC, Rót gạo, Ban nhạc, Laser, Flycam): Báo giá trực tiếp số tiền cụ thể theo bảng giá niêm yết.',
      'Tất cả báo giá hiện tại đều CHƯA BAO GỒM VAT. Thuế bóc tách: 8% (Đồ ăn + Phí HT + Nước lọc) và 10% (Đồ uống: Bia, rượu, nước ngọt).',
      'Nhà hàng không áp dụng dịch vụ mâm thử món để đảm bảo chuẩn yến tiệc số lượng lớn.',
      'Được phép mang rượu bia và đơn vị decor từ ngoài vào (có áp dụng phí dịch vụ/mặt bằng theo quy chế).',
    ],
    samplePrompts: [
      'Thực đơn tiệc cưới bao nhiêu một mâm?',
      'Bảng giá dịch vụ Photobooth chụp ảnh lấy ngay?',
      'Thuê MC, ca sĩ và ban nhạc giá bao nhiêu?',
      'Nghi thức rót gạo, vòng laser và flycam trao nhẫn?',
      'Tiệc 500 khách nên chọn sảnh hội trường nào?',
      'Báo giá đã gồm thuế VAT chưa?',
      'Nhà hàng có cho ăn thử mâm cỗ không?',
      'Địa chỉ nhà hàng và chỗ đỗ xe ô tô?',
      'Có được mang rượu bia từ ngoài vào không?',
      'Số em là 0912345678, gọi lại tư vấn giúp em',
    ],
    knowledgeBase: [
      {
        id: 'gp-1',
        category: 'thuc_don',
        question: 'Thực đơn tiệc cưới bao nhiêu một bàn? Giá một mâm cỗ tại Golden Palace thế nào?',
        answer: 'Dạ thực đơn tiệc cưới tại Golden Palace dao động từ 2.800.000đ - 6.500.000đ/bàn 10 khách với hơn 150 món ăn Á - Âu tinh hoa phong phú, linh hoạt theo mùa vụ. Quý khách có thể tự tính dự toán chi phí trọn gói minh bạch trong 30 giây tại: https://goldenpalacenamdinh.com/du-toan-chi-phi hoặc xem đầy đủ các set thực đơn mẫu tại: https://goldenpalacenamdinh.com/thuc-don?tab=SET_TIEC ạ!',
        tags: ['thuc_don', 'gia_ban', 'menu', 'du_toan'],
        is_active: true,
      },
      {
        id: 'gp-2',
        category: 'dia_chi',
        question: 'Địa chỉ nhà hàng ở đâu? Giờ đón khách tham quan sảnh thế nào?',
        answer: 'Dạ Golden Palace tọa lạc tại 98 Đông A, KĐT Hòa Vượng, TP Nam Định (Bản đồ chỉ đường: https://maps.app.goo.gl/goldenpalacenamdinh). Giờ đón tiếp Quý khách tham quan trực tiếp các sảnh tiệc từ 8h00 – 21h00 (khung giờ xem sảnh & tư vấn chuyên sâu 8h00 – 10h30) tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày Lễ) ạ! Hotline/Zalo hỗ trợ: 0228 659 5959.',
        tags: ['dia_chi', 'gio_mo_cua', 'don_khach', 'hotline'],
        is_active: true,
      },
      {
        id: 'gp-3',
        category: 'tien_ich',
        question: 'Nhà hàng có chỗ đỗ xe ô tô không? Phí gửi xe bao nhiêu?',
        answer: 'Dạ Golden Palace có bãi đỗ xe ô tô và xe máy vô cùng rộng rãi ngay trước khuôn viên nhà hàng, có nhân viên bảo vệ điều phối chu đáo và hoàn toàn miễn phí 100% cho toàn bộ khách tham dự tiệc ạ! Quý khách xem thêm tại: https://goldenpalacenamdinh.com/khong-gian',
        tags: ['do_xe', 'gui_xe', 'o_to', 'mien_phi'],
        is_active: true,
      },
      {
        id: 'gp-4',
        category: 'sanh_tang_2',
        question: 'Thông tin về Hội trường Tầng 2 (Sức chứa, phong cách, thiết bị)?',
        answer: 'Dạ Hội trường Tầng 2 là đại cung điện lớn nhất tại Golden Palace: Sức chứa 350 – 750 khách (35 – 75 mâm). Thiết kế trần cao 7m hoàn toàn không có cột chắn, tạo tầm nhìn thoáng đãng tuyệt đối. Trang bị màn hình LED P2.5 cỡ lớn 30m², giàn đèn chùm pha lê hoàng gia lộng lẫy. Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian/tang-2',
        tags: ['sanh_tiec', 'tang_2', '750_khach', 'khong_cot'],
        is_active: true,
      },
      {
        id: 'gp-5',
        category: 'sanh_tang_3',
        question: 'Thông tin về Hội trường Tầng 3 (Sức chứa, phong cách, thiết bị)?',
        answer: 'Dạ Hội trường Tầng 3 mang phong cách hoàng gia tân cổ điển: Sức chứa 300 – 650 khách (30 – 65 mâm). Điểm nhấn độc bản là giàn đèn bướm nghệ thuật rực rỡ, tông màu ấm áp cùng phông nền sân khấu sang trọng, màn hình LED 30m² siêu nét và âm thanh biểu diễn chuyên nghiệp. Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian/tang-3',
        tags: ['sanh_tiec', 'tang_3', '650_khach', 'den_buom'],
        is_active: true,
      },
      {
        id: 'gp-6',
        category: 'sanh_tang_4',
        question: 'Thông tin về Hội trường Tầng 4 (Sức chứa, phong cách, thiết bị)?',
        answer: 'Dạ Hội trường Tầng 4 là lựa chọn lý tưởng cho tiệc cưới quy mô vừa, ấm cúng và tinh tế: Sức chứa 100 – 300 khách (10 – 30 mâm). Không gian trang nhã, riêng tư, trang bị sẵn màn hình LED 10m² hiện đại, âm thanh biểu diễn chuẩn và hoa lụa sân khấu lãng mạn. Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian/tang-4',
        tags: ['sanh_tiec', 'tang_4', '300_khach', 'am_cung'],
        is_active: true,
      },
      {
        id: 'gp-7',
        category: 'sanh_quay_bar',
        question: 'Thông tin về Quầy Bar Tầng 1?',
        answer: 'Dạ Quầy Bar Tầng 1 mang phong cách lounge hiện đại, sành điệu: Sức chứa 50 – 100 khách. Không gian quầy pha chế mở sang trọng, ánh sáng ấm cúng và âm thanh lounge nhẹ nhàng, rất phù hợp tiệc sinh nhật, kỷ niệm, cocktail, báo hỷ bạn bè. Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian/quay-bar',
        tags: ['sanh_tiec', 'quay_bar', 'tang_1', '100_khach'],
        is_active: true,
      },
      {
        id: 'gp-8',
        category: 'sanh_phong_vip',
        question: 'Thông tin về Không gian Phòng VIP?',
        answer: 'Dạ hệ thống Phòng VIP tại Golden Palace mang đẳng cấp riêng tư tuyệt đối: Sức chứa 10 – 50 khách (1 – 5 mâm). Nội thất gỗ và mạ vàng hoàng gia, không gian hoàn toàn biệt lập, phục vụ chuẩn riêng chu đáo, phù hợp tiệc gia đình, dạm ngõ, đính hôn nhỏ hoặc đối tác VIP. Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian/phong-vip',
        tags: ['sanh_tiec', 'phong_vip', '50_khach', 'rieng_tu'],
        is_active: true,
      },
      {
        id: 'gp-9',
        category: 'thue_vat',
        question: 'Báo giá trên website đã bao gồm thuế VAT chưa? Cách tính VAT tổng bill như thế nào?',
        answer: 'Dạ các báo giá thực đơn và dịch vụ hiện tại của Golden Palace là GIÁ CHƯA BAO GỒM VAT ạ. Khi tính tổng bill hoặc xuất hóa đơn, thuế VAT được bóc tách: Thuế 8% VAT áp dụng cho Đồ ăn + Phí Hội trường (phí HT) + Nước lọc; Thuế 10% VAT áp dụng cho Đồ uống (Nước ngọt + Bia + Rượu). Quý khách có thể tự tính tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!',
        tags: ['vat', 'thue', 'hoa_don', '8_phan_tram', '10_phan_tram'],
        is_active: true,
      },
      {
        id: 'gp-10',
        category: 'thu_mon',
        question: 'Nhà hàng có cho ăn thử mâm cỗ (thử món) không?',
        answer: 'Dạ để đảm bảo tính đồng bộ và chất lượng phục vụ tiêu chuẩn yến tiệc số lượng lớn, hiện tại Golden Palace không áp dụng dịch vụ mâm thử món ạ. Toàn bộ các món ăn trong menu đều được các đầu bếp chuyên nghiệp nhiều năm kinh nghiệm chế biến chuẩn vị tiệc cưới truyền thống và hiện đại, đã được hàng ngàn cặp đôi tại Nam Định tin chọn và đánh giá rất cao. Quý khách xem danh sách món tại: https://goldenpalacenamdinh.com/thuc-don?tab=SET_TIEC',
        tags: ['thu_mon', 'an_thu', 'thuc_don'],
        is_active: true,
      },
      {
        id: 'gp-11',
        category: 'do_uong',
        question: 'Chính sách đồ uống thế nào? Có được mang rượu/bia từ ngoài vào không? Phí nút chai ra sao?',
        answer: 'Dạ chính sách đồ uống tại Golden Palace rất minh bạch: 1. Đồ uống nhà hàng: Kiểm đếm số lượng thực tế sử dụng sau tiệc (uống bao nhiêu tính tiền bấy nhiêu). 2. Đồ uống mang ngoài vào: Quý khách ĐƯỢC PHÉP mang rượu, bia từ ngoài vào, nhà hàng áp dụng mức phí phục vụ (phí nút chai, đá lạnh, ly cốc niêm yết theo quy định). Xem chi tiết tại: https://goldenpalacenamdinh.com/thuc-don?tab=DO_UONG',
        tags: ['do_uong', 'mang_bia_ruou', 'phi_nut_chai'],
        is_active: true,
      },
      {
        id: 'gp-12',
        category: 'photobooth',
        question: 'Nhà hàng có dịch vụ máy chụp ảnh Photobooth lấy ngay không? Giá bao nhiêu?',
        answer: 'Dạ Golden Palace cung cấp dịch vụ máy chụp ảnh Photobooth in lấy ngay tại sảnh với 3 gói niêm yết: 📸 Gói 1 (1.5h): 3.400.000 VNĐ (In 200 ảnh nhỏ hoặc 100 ảnh to). 📸 Gói 2 (2.0h): 4.000.000 VNĐ (KHÔNG GIỚI HẠN ảnh in). 📸 Gói 3 (3.0h): 5.000.000 VNĐ (KHÔNG GIỚI HẠN ảnh in). Đã bao gồm kỹ thuật viên trực máy, bàn giao file mềm gốc, phụ kiện check-in và sổ ký tên lưu niệm cho dâu rể ạ!',
        tags: ['photobooth', 'chup_anh_lay_ngay', 'gia_photobooth'],
        is_active: true,
      },
      {
        id: 'gp-13',
        category: 'nhan_su_bieu_dien',
        question: 'Bảng giá thuê MC, Ca sĩ, Nhạc công và Ban nhạc biểu diễn là bao nhiêu?',
        answer: 'Dạ Golden Palace cung cấp nhân sự biểu diễn chuyên nghiệp với bảng giá niêm yết: 🎤 MC chuyên nghiệp: 800.000 VNĐ/người. 🎶 Ca sĩ biểu diễn (hát 3 bài): 800.000 VNĐ/ca sĩ. 🎹 Nhạc công Keyboard: 800.000 VNĐ/người. 👼 Thiên thần dẫn lối (1 cặp): 1.000.000 VNĐ/cặp. 🎷 Ban nhạc Saxophone đón khách: 5.000.000 VNĐ/ban. 🎻 Ban nhạc Tứ tấu cổ điển: 14.000.000 VNĐ/ban. Quý khách có thể chọn khi tính dự toán tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!',
        tags: ['mc', 'ca_si', 'ban_nhac', 'keyboard', 'saxophone', 'tu_tau'],
        is_active: true,
      },
      {
        id: 'gp-14',
        category: 'nghi_thuc_hieu_ung',
        question: 'Nhà hàng có các nghi thức cưới & hiệu ứng đặc biệt nào (Rót gạo, Laser, Flycam...)? Giá bao nhiêu?',
        answer: 'Dạ nhà hàng có các nghi thức và hiệu ứng cưới độc đáo với giá niêm yết: 🌾 Rót gạo / Tranh cát thiêng liêng: 800.000 VNĐ/hộp. 💍 Vòng laser trao nhẫn: 700.000 VNĐ/lần (TẶNG MIỄN PHÍ cho tiệc từ 400 khách trở lên). 🛸 Flycam trao nhẫn cưới: 1.000.000 VNĐ/lần. 🦋 Bướm bay dẫn đường: 3.000.000 VNĐ/con. 🌳 Tưới cây hạnh phúc: 500.000 VNĐ/lần. 🎈 Bóng bay kích nổ: 900.000 VNĐ/quả (từ 4 quả). Quý khách xem chi tiết tại: https://goldenpalacenamdinh.com/dich-vu ạ!',
        tags: ['rot_gao', 'tranh_cat', 'vong_laser', 'flycam', 'hieu_ung'],
        is_active: true,
      },
      {
        id: 'gp-15',
        category: 'dat_coc',
        question: 'Đặt cọc giữ sảnh bao nhiêu? Quy trình đặt tiệc cưới tại Golden Palace gồm những bước nào?',
        answer: 'Dạ để giữ ngày đẹp và sảnh ưng ý, Quý khách đặt cọc lần 1 là 5.000.000 VNĐ ạ. Khoản cọc này được cấn trừ trực tiếp khi ký hợp đồng và chốt thực đơn chính thức. Quy trình đặt tiệc gồm 3 giai đoạn chuyên nghiệp: • GĐ 1 (Trước 2–3 tháng): Khảo sát sảnh & Đặt cọc lần 1 là 5.000.000 VNĐ giữ ngày đẹp. • GĐ 2 (Trước 1 tháng): Ký hợp đồng chính thức, chốt thực đơn & dịch vụ bổ sung (Đặt cọc 50%). • GĐ 3 (Trước 1 ngày diễn ra tiệc): Bàn giao danh sách khách VIP, chạy thử LED, kịch bản tiệc. Quý khách xem chi tiết tại: https://goldenpalacenamdinh.com/du-toan-chi-phi',
        tags: ['dat_coc', 'hop_dong', 'giu_sanh', '3_giai_doan', '5_trieu'],
        is_active: true,
      },
      {
        id: 'gp-16',
        category: 'decor_ngoai',
        question: 'Tôi có thể thuê đơn vị trang trí (decor) bên ngoài vào sảnh được không?',
        answer: 'Dạ Quý khách HOÀN TOÀN CÓ THỂ mời đơn vị trang trí (decor) riêng từ bên ngoài vào sảnh để thực hiện concept cá nhân hóa theo ý thích ạ. Nhà hàng chỉ áp dụng một khoản phí hỗ trợ mặt bằng, điện nước thi công và vệ sinh theo quy định chung. Quý khách liên hệ Hotline 0228 659 5959 để được hỗ trợ thủ tục bàn giao mặt bằng sớm nhé!',
        tags: ['decor', 'trang_tri_ngoai', 'concept_rieng'],
        is_active: true,
      },
      {
        id: 'gp-17',
        category: 'cong_nghe_so',
        question: 'Website có tính năng tạo Thiệp cưới online và Video phông LED không?',
        answer: 'Dạ CÓ ạ! Golden Palace tiên phong ứng dụng công nghệ số hóa hỗ trợ dâu rể: • Thiệp cưới Online (E-Invitation): Tạo thiệp cưới điện tử gửi khách mời qua Zalo/Facebook chỉ trong 1 phút. • Phông LED sân khấu cá nhân hóa: Tùy biến hình ảnh dâu rể xuất video chiếu trực tiếp lên màn hình LED hội trường. • Kịch bản âm nhạc: Chọn trước list nhạc lễ cưới theo phong cách riêng. Trải nghiệm ngay tại: https://goldenpalacenamdinh.com/ca-nhan-hoa ạ!',
        tags: ['thiep_cuoi_online', 'phong_led', 'ca_nhan_hoa'],
        is_active: true,
      },
      {
        id: 'gp-18',
        category: 'uu_dai',
        question: 'Chương trình ưu đãi tiệc cưới hiện nay?',
        answer: 'Dạ Golden Palace luôn có chính sách ưu đãi dành riêng cho tiệc cưới và sự kiện theo từng thời điểm. Đặc biệt tiệc từ 400 khách trở lên được TẶNG MIỄN PHÍ Vòng ánh sáng Laser trao nhẫn cưới độc đáo. Quý khách vui lòng liên hệ Hotline 0228 659 5959 để được tư vấn gói ưu đãi chi tiết ạ!',
        tags: ['uu_dai', 'khuyen_mai', 'laser_tang_free'],
        is_active: true,
      },
      {
        id: 'gp-19',
        category: 'chinh_sach',
        question: 'Nhà hàng có tổ chức tiệc vào ngày Thứ 7, Chủ Nhật hoặc ngày Lễ không? Có bị phụ thu không?',
        answer: 'Dạ Golden Palace phục vụ tiệc vào tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày Lễ) mà không thu phụ phí ngày lễ ạ! Do ngày cuối tuần và ngày đẹp thường kín sảnh sớm, Quý khách nên đặt cọc giữ sảnh trước 2–3 tháng tại: https://goldenpalacenamdinh.com/khong-gian hoặc gọi Hotline: 0228 659 5959 nhé!',
        tags: ['cuoi_tuan', 'thu_7', 'chu_nhat', 'ngay_le', 'phu_thu'],
        is_active: true,
      },
      {
        id: 'gp-20',
        category: 'sanh_tiec',
        question: 'Quy mô tiệc cưới 300 khách (30 mâm) thì nhà hàng tư vấn sảnh nào phù hợp nhất?',
        answer: 'Dạ với quy mô 300 khách (30 mâm), Golden Palace có 2 lựa chọn sảnh tuyệt đẹp: 1. Hội trường Tầng 3 (300 – 650 khách): Giàn đèn bướm nghệ thuật rực rỡ, màn LED 30m², cực kỳ thoải mái dự phòng phát sinh mâm. Xem ảnh: https://goldenpalacenamdinh.com/khong-gian/tang-3. 2. Hội trường Tầng 4 (100 – 300 khách): Không gian ấm cúng, sang trọng, vừa vặn cho tiệc 30 mâm. Xem ảnh: https://goldenpalacenamdinh.com/khong-gian/tang-4.',
        tags: ['300_khach', '30_mam', 'tang_3', 'tang_4', 'tu_van_sanh'],
        is_active: true,
      },
      {
        id: 'gp-21',
        category: 'du_toan',
        question: 'Làm sao để tôi tự tính chi phí tiệc cưới trọn gói trên website trong 30 giây?',
        answer: 'Dạ Quý khách có thể tự tính ngân sách trọn gói cực kỳ chính xác chỉ với 4 bước: 1. Nhập số lượng khách & ngày cưới -> 2. Chọn Sảnh hội trường -> 3. Chọn Thực đơn set tiệc & đồ uống -> 4. Tích chọn Dịch vụ biểu diễn & Nghi thức cưới. Bấm để tính ngay bảng kê chi tiết tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!',
        tags: ['du_toan', 'tinh_chi_phi', 'ngan_sach', 'tu_dong'],
        is_active: true,
      },
      {
        id: 'gp-22',
        category: 'nghi_thuc_hieu_ung',
        question: 'Nghi thức trao nhẫn cưới độc đáo và hiệu ứng sân khấu tại Golden Palace?',
        answer: 'Dạ Golden Palace sở hữu các hiệu ứng sân khấu độc bản: Vòng ánh sáng Laser trao nhẫn (700k, tặng FREE cho tiệc >400 khách), Flycam trao nhẫn cưới (1.000k), Bướm bay dẫn lối (3.000k), Rót gạo thiêng liêng (800k), Tưới cây hạnh phúc (500k). Quý khách xem chi tiết tại: https://goldenpalacenamdinh.com/dich-vu ạ!',
        tags: ['trao_nhan', 'vong_laser', 'flycam', 'rot_gao', 'hieu_ung'],
        is_active: true,
      },
      {
        id: 'gp-23',
        category: 'dat_coc',
        question: 'Chính sách thanh toán và các đợt cấn trừ hợp đồng tiệc cưới như thế nào?',
        answer: 'Dạ chính sách thanh toán tại Golden Palace rất rõ ràng qua 3 đợt: Đợt 1 đặt cọc 5.000.000 VNĐ giữ sảnh; Đợt 2 đặt cọc 50% khi ký hợp đồng và chốt thực đơn (trước 1 tháng); Đợt 3 thanh toán số tiền còn lại sau khi tiệc kết thúc và kiểm đếm đồ uống thực tế. Mọi khoản cọc đều được cấn trừ trực tiếp trên hóa đơn quyết toán ạ!',
        tags: ['thanh_toan', 'dat_coc', 'hop_dong', 'can_tru'],
        is_active: true,
      },
      {
        id: 'gp-24',
        category: 'dia_chi',
        question: 'Đường đi tới Golden Palace và vị trí bản đồ Google Maps?',
        answer: 'Dạ Golden Palace tọa lạc tại số 98 Đông A, KĐT Hòa Vượng, TP. Nam Định (ngay cạnh trục đường chính, giao thông thuận tiện, bãi đỗ xe ô tô 1.000m² miễn phí). Quý khách bấm mở chỉ đường Google Maps trực tiếp tại: https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic hoặc liên hệ 0228 659 5959 để được đón tiếp chu đáo nhé!',
        tags: ['dia_chi', 'google_maps', 'chi_duong', '98_dong_a'],
        is_active: true,
      },
      {
        id: 'gp-25',
        category: 'dich_vu',
        question: 'Nhà hàng có hỗ trợ trang trí hoa tươi và bàn Gallery đón khách không?',
        answer: 'Dạ các sảnh tiệc của Golden Palace đều đã trang bị sẵn gói trang trí tiêu chuẩn sang trọng gồm: Cổng hoa đón khách, bàn Gallery lưu niệm, backdrop chụp ảnh, thảm đỏ dẫn lối và hoa lụa sân khấu cao cấp. Nếu Quý khách muốn nâng cấp hoa tươi 100% theo concept riêng, nhà hàng có đội ngũ decor thiết kế riêng hoặc hỗ trợ đơn vị ngoài vào thi công ạ! Xem ảnh tại: https://goldenpalacenamdinh.com/khong-gian',
        tags: ['gallery', 'hoa_tuoi', 'decor', 'backdrop', 'cong_hoa'],
        is_active: true,
      },
      {
        id: 'gp-26',
        category: 'dich_vu',
        question: 'Dịch vụ xe hoa và xe đón dâu của nhà hàng thế nào?',
        answer: 'Dạ Golden Palace có liên kết cung cấp dàn xe hoa và xe đón dâu sang trọng từ 4 đến 45 chỗ (Mercedes, Camry, Mazda, Sedona, Hyundai Universe...) phục vụ nội thành và ngoại tỉnh với mức giá ưu đãi dành riêng cho khách đặt tiệc. Quý khách vui lòng liên hệ Hotline 0228 659 5959 để chọn dòng xe và lộ trình rước dâu ưng ý nhé!',
        tags: ['xe_hoa', 'xe_don_dau', 'xe_cuoi', 'mercedes'],
        is_active: true,
      },
    ],
  },

  // PRESET 2: DỊCH VỤ DOANH NGHIỆP & CHUYỂN ĐỔI SỐ B2B
  b2b_service: {
    id: 'b2b_service',
    name: 'Dịch vụ Doanh nghiệp & Chuyển đổi số B2B',
    tag: 'Công nghệ & Tư vấn',
    profile: {
      name: 'OmniTech Solutions',
      industry: 'Giải pháp Chuyển đổi số & Tự động hóa AI',
      hotline: '0901 234 567',
      address: 'Tòa nhà Innovation, Hà Nội',
      serviceTypeName: 'Gói giải pháp AI & Phần mềm',
      bookingVerb: 'Hẹn lịch Demo 1-1',
    },
    persona: `Tên bot: OmniTech Bot
Xưng hô: Em xưng hô với Anh/Chị / Quý doanh nghiệp
Phong cách: Chuyên nghiệp, am hiểu nghiệp vụ, súc tích, tư vấn giải pháp chuyển đổi số và AI thực chiến.`,
    guardrails: [
      'Khi gặp câu hỏi nằm ngoài phạm vi tri thức hoặc chưa được xác thực: Tuyệt đối không suy đoán hay trả lời lung tung. Tự động tắt chế độ AI của hội thoại và chuyển giao cho nhân viên tư vấn thật tiếp quản ngay lập tức.',
      'Không cam kết thời gian hoàn thành dự án dưới 2 tuần khi chưa khảo sát kỹ thuật.',
      'Không tiết lộ mã nguồn hoặc chính sách giá custom của khách hàng khác.',
    ],
    samplePrompts: [
      'Chi phí triển khai Chatbot AI đa kênh bao nhiêu?',
      'Hệ thống có tích hợp được CRM nội bộ không?',
      'Cho tôi đặt lịch hẹn demo phần mềm 1-1',
      'Số em là 0912345678',
    ],
    knowledgeBase: [
      {
        id: 'b2b-1',
        category: 'chi_phi',
        question: 'Chi phí triển khai Chatbot AI đa kênh bao nhiêu?',
        answer: 'Dạ gói giải pháp OmniChat AI triển khai tiêu chuẩn từ 15.000.000đ, bao gồm tích hợp Botcake (Facebook, Zalo cá nhân), Web widget và kết nối CRM quản lý Lead thông minh.',
        tags: ['chi_phi', 'báo_giá'],
        is_active: true,
      },
    ],
  },

  // PRESET 3: THẨM MỸ VIỆN & SPA
  spa_clinic: {
    id: 'spa_clinic',
    name: 'Thẩm mỹ viện, Spa & Phòng khám',
    tag: 'Làm đẹp & Sức khỏe',
    profile: {
      name: 'Aura Beauty & Spa',
      industry: 'Chăm sóc sắc đẹp & Trị liệu da',
      hotline: '0966 888 999',
      address: 'Quận 1, TP. Hồ Chí Minh',
      serviceTypeName: 'Gói liệu trình & Thẩm mỹ',
      bookingVerb: 'Đặt lịch soi da & tư vấn Bác sĩ',
    },
    persona: `Tên bot: Aura Spa Assistant
Xưng hô: Dạ em chào Chị yêu / Anh!
Phong cách: Ngọt ngào, ân cần, thấu hiểu, tư vấn liệu trình chăm sóc da chuẩn y khoa.`,
    guardrails: [
      'Khi gặp câu hỏi nằm ngoài phạm vi tri thức hoặc chưa được xác thực: Tuyệt đối không suy đoán hay trả lời lung tung. Tự động tắt chế độ AI của hội thoại và chuyển giao cho nhân viên tư vấn thật tiếp quản ngay lập tức.',
      'Không chẩn đoán bệnh lý da liễu nặng qua tin nhắn mà luôn mời đến thăm khám trực tiếp.',
      'Không hứa hẹn hết nám 100% chỉ sau 1 buổi điều trị.',
    ],
    samplePrompts: [
      'Liệu trình trị mụn bên mình giá bao nhiêu?',
      'Có được Bác sĩ da liễu khám trực tiếp không?',
      'Cho em đặt lịch soi da miễn phí',
      'Số em là 0988112233',
    ],
    knowledgeBase: [
      {
        id: 'spa-1',
        category: 'gia_lieu_trinh',
        question: 'Liệu trình trị mụn bên mình giá bao nhiêu?',
        answer: 'Dạ liệu trình phục hồi da mụn chuẩn y khoa tại Aura Spa có giá từ 490.000đ/buổi. Khách hàng mới được tặng 01 buổi soi da chuyên sâu 3D cùng Bác sĩ ạ!',
        tags: ['tri_mun', 'soi_da'],
        is_active: true,
      },
    ],
  },
};

// Cấu hình mặc định sử dụng Tiệc cưới & Sự kiện (Golden Palace Showcase)
export const DEFAULT_BOT_CONFIG: BotTrainingConfig = {
  businessProfile: INDUSTRY_PRESETS.wedding_event.profile,
  isMasterEnabled: true,
  masterStatusNote: 'Đang hoạt động trên toàn hệ thống',
  persona: INDUSTRY_PRESETS.wedding_event.persona,
  workingHours: {
    start: 8,
    end: 21,
  },
  outOfHoursMessage: 'Dạ hiện tại đã ngoài giờ làm việc. Em đã ghi nhận thông tin của Quý khách, bộ phận tư vấn sẽ liên hệ lại vào 8h30 sáng mai nhé!',
  channels: {
    facebook: { enabled: true, mode: 'bot' },
    zalo: { enabled: true, mode: 'bot' },
    web: { enabled: true, mode: 'draft' },
  },
  guardrails: INDUSTRY_PRESETS.wedding_event.guardrails,
  sampleTestPrompts: INDUSTRY_PRESETS.wedding_event.samplePrompts,
  telegramAlert: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
};

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] =
  INDUSTRY_PRESETS.wedding_event.knowledgeBase;
