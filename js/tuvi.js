/**
 * TU VI ENGINE - LẬP LÁ SỐ TỬ VI ĐẨU SỐ TOÀN THƯ & PHI TINH TỨ HÓA
 * Tương thích chuẩn dữ liệu và giao diện lichngay.net
 * Hỗ trợ 14 Chính Tinh, Phụ Tinh phân 2 cột Cát/Hung, Vòng Tràng Sinh,
 * Vòng Thái Tuế, Vòng Lộc Tồn, Tuần/Triệt, Sao Lưu và Phi Tinh Tứ Hóa 12 Cung.
 */
(function (global) {
  'use strict';

  const STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

  // Thứ tự 12 cung trên bàn cờ chuẩn LichNgay (index 0 đến 11)
  // 0: Tỵ, 1: Ngọ, 2: Mùi, 3: Thân, 4: Thìn, 5: Dậu, 6: Mão, 7: Tuất, 8: Dần, 9: Sửu, 10: Tý, 11: Hợi
  const GRID_BRANCHES = [5, 6, 7, 8, 4, 9, 3, 10, 2, 1, 0, 11];

  const PALACE_NAMES = [
    'MỆNH', 'PHỤ MẪU', 'PHÚC ĐỨC', 'ĐIỀN TRẠCH', 'QUAN LỘC', 'NÔ BỘC',
    'THIÊN DI', 'TẬT ÁCH', 'TÀI BẠCH', 'TỬ TỨC', 'PHU THÊ', 'HUYNH ĐỆ'
  ];

  const PALACE_KEYS = [
    'menh', 'phu_mau', 'phuc_duc', 'dien_trach', 'quan_loc', 'no_boc',
    'thien_di', 'tat_ach', 'tai_bach', 'tu_tuc', 'phu_the', 'huynh_de'
  ];

  // Lục Thập Hoa Giáp Nạp Âm
  const NAP_AM = {
    'Giáp Tý': 'Hải Trung Kim', 'Ất Sửu': 'Hải Trung Kim',
    'Bính Dần': 'Lư Trung Hỏa', 'Đinh Mão': 'Lư Trung Hỏa',
    'Mậu Thìn': 'Đại Lâm Mộc', 'Kỷ Tỵ': 'Đại Lâm Mộc',
    'Canh Ngọ': 'Lộ Bàng Thổ', 'Tân Mùi': 'Lộ Bàng Thổ',
    'Nhâm Thân': 'Kiếm Phong Kim', 'Quý Dậu': 'Kiếm Phong Kim',
    'Giáp Tuất': 'Sơn Đầu Hỏa', 'Ất Hợi': 'Sơn Đầu Hỏa',
    'Bính Tý': 'Giản Hạ Thủy', 'Đinh Sửu': 'Giản Hạ Thủy',
    'Mậu Dần': 'Thành Đầu Thổ', 'Kỷ Mão': 'Thành Đầu Thổ',
    'Canh Thìn': 'Bạch Lạp Kim', 'Tân Tỵ': 'Bạch Lạp Kim',
    'Nhâm Ngọ': 'Dương Liễu Mộc', 'Quý Mùi': 'Dương Liễu Mộc',
    'Giáp Thân': 'Tuyền Trung Thủy', 'Ất Dậu': 'Tuyền Trung Thủy',
    'Bính Tuất': 'Ốc Thượng Thổ', 'Đinh Hợi': 'Ốc Thượng Thổ',
    'Mậu Tý': 'Tích Lịch Hỏa', 'Kỷ Sửu': 'Tích Lịch Hỏa',
    'Canh Dần': 'Tùng Bách Mộc', 'Tân Mão': 'Tùng Bách Mộc',
    'Nhâm Thìn': 'Trường Lưu Thủy', 'Quý Tỵ': 'Trường Lưu Thủy',
    'Giáp Ngọ': 'Sa Trung Kim', 'Ất Mùi': 'Sa Trung Kim',
    'Bính Thân': 'Sơn Hạ Hỏa', 'Đinh Dậu': 'Sơn Hạ Hỏa',
    'Mậu Tuất': 'Bình Địa Mộc', 'Kỷ Hợi': 'Bình Địa Mộc',
    'Canh Tý': 'Bích Thượng Thổ', 'Tân Sửu': 'Bích Thượng Thổ',
    'Nhâm Dần': 'Kim Bạc Kim', 'Quý Mão': 'Kim Bạc Kim',
    'Giáp Thìn': 'Phúc Đăng Hỏa', 'Ất Tỵ': 'Phúc Đăng Hỏa',
    'Bính Ngọ': 'Thiên Hà Thủy', 'Đinh Mùi': 'Thiên Hà Thủy',
    'Mậu Thân': 'Đại Trạch Thổ', 'Kỷ Dậu': 'Đại Trạch Thổ',
    'Canh Tuất': 'Thoa Xuyến Kim', 'Tân Hợi': 'Thoa Xuyến Kim',
    'Nhâm Tý': 'Tang Đố Mộc', 'Quý Sửu': 'Tang Đố Mộc',
    'Giáp Dần': 'Đại Khê Thủy', 'Ất Mão': 'Đại Khê Thủy',
    'Bính Thìn': 'Sa Trung Thổ', 'Đinh Tỵ': 'Sa Trung Thổ',
    'Mậu Ngọ': 'Thiên Thượng Hỏa', 'Kỷ Mùi': 'Thiên Thượng Hỏa',
    'Canh Thân': 'Thạch Lựu Mộc', 'Tân Dậu': 'Thạch Lựu Mộc',
    'Nhâm Tuất': 'Đại Hải Thủy', 'Quý Hợi': 'Đại Hải Thủy'
  };

  // Ngũ hành của 14 Chính Tinh
  const STAR_ELEMENTS = {
    'TỬ VI': 'Thổ', 'THIÊN CƠ': 'Mộc', 'THÁI DƯƠNG': 'Hỏa', 'VŨ KHÚC': 'Kim',
    'THIÊN ĐỒNG': 'Thủy', 'LIÊM TRINH': 'Hỏa', 'THIÊN PHỦ': 'Thổ', 'THÁI ÂM': 'Thủy',
    'THAM LANG': 'Thủy', 'CỰ MÔN': 'Thủy', 'THIÊN TƯỚNG': 'Thủy', 'THIÊN LƯƠNG': 'Mộc',
    'THẤT SÁT': 'Kim', 'PHÁ QUÂN': 'Thủy'
  };

  // Bảng Đắc Hãm của 14 Chính Tinh tại 12 Địa Chi (Tý=0 .. Hợi=11)
  // Theo bảng Việt (Thái Thứ Lang, giống lasotuvi); Thiên Phủ giữ bảng cũ (lasotuvi không có).
  // Hai ô chỉnh theo lá số lichngay: Tử Vi tại Hợi = V, Thất Sát tại Hợi = M.
  const STAR_BRIGHTNESS = {
    'TỬ VI':       ['B', 'Đ', 'M', 'B', 'V', 'M', 'M', 'Đ', 'M', 'B', 'V', 'V'],
    'THIÊN CƠ':    ['Đ', 'Đ', 'H', 'M', 'M', 'V', 'Đ', 'Đ', 'V', 'M', 'M', 'H'],
    'THÁI DƯƠNG':  ['H', 'Đ', 'V', 'V', 'V', 'M', 'M', 'Đ', 'H', 'H', 'H', 'H'],
    'VŨ KHÚC':     ['V', 'M', 'V', 'Đ', 'M', 'H', 'V', 'M', 'V', 'Đ', 'M', 'H'],
    'THIÊN ĐỒNG':  ['V', 'H', 'M', 'Đ', 'H', 'Đ', 'H', 'H', 'M', 'H', 'H', 'Đ'],
    'LIÊM TRINH':  ['V', 'Đ', 'V', 'H', 'M', 'H', 'V', 'Đ', 'V', 'H', 'M', 'H'],
    'THIÊN PHỦ':   ['M', 'M', 'M', 'B', 'M', 'Đ', 'V', 'Đ', 'M', 'B', 'M', 'Đ'],
    'THÁI ÂM':     ['V', 'Đ', 'H', 'H', 'H', 'H', 'H', 'Đ', 'V', 'M', 'M', 'M'],
    'THAM LANG':   ['H', 'M', 'Đ', 'H', 'V', 'H', 'H', 'M', 'Đ', 'H', 'V', 'H'],
    'CỰ MÔN':      ['V', 'H', 'V', 'M', 'H', 'H', 'V', 'H', 'Đ', 'M', 'H', 'Đ'],
    'THIÊN TƯỚNG': ['V', 'Đ', 'M', 'H', 'V', 'Đ', 'V', 'Đ', 'M', 'H', 'V', 'Đ'],
    'THIÊN LƯƠNG': ['V', 'Đ', 'V', 'V', 'M', 'H', 'M', 'Đ', 'V', 'H', 'M', 'H'],
    'THẤT SÁT':    ['M', 'Đ', 'M', 'H', 'H', 'V', 'M', 'Đ', 'M', 'H', 'H', 'M'],
    'PHÁ QUÂN':    ['M', 'V', 'H', 'H', 'Đ', 'H', 'M', 'V', 'H', 'H', 'Đ', 'H']
  };

  // Bảng Thập Can Tứ Hóa: [Lộc, Quyền, Khoa, Kỵ] — theo bảng Việt (như lichngay, lasotuvi):
  // "Canh Nhật Vũ Đồng Âm", "Nhâm Lương Tử Phủ Vũ".
  const TU_HOA_TABLE = {
    'Giáp': ['LIÊM TRINH', 'PHÁ QUÂN', 'VŨ KHÚC', 'THÁI DƯƠNG'],
    'Ất':   ['THIÊN CƠ', 'THIÊN LƯƠNG', 'TỬ VI', 'THÁI ÂM'],
    'Bính': ['THIÊN ĐỒNG', 'THIÊN CƠ', 'VĂN XƯƠNG', 'LIÊM TRINH'],
    'Đinh': ['THÁI ÂM', 'THIÊN ĐỒNG', 'THIÊN CƠ', 'CỰ MÔN'],
    'Mậu':  ['THAM LANG', 'THÁI ÂM', 'HỮU BẬT', 'THIÊN CƠ'],
    'Kỷ':   ['VŨ KHÚC', 'THAM LANG', 'THIÊN LƯƠNG', 'VĂN KHÚC'],
    'Canh': ['THÁI DƯƠNG', 'VŨ KHÚC', 'THIÊN ĐỒNG', 'THÁI ÂM'],
    'Tân':  ['CỰ MÔN', 'THÁI DƯƠNG', 'VĂN KHÚC', 'VĂN XƯƠNG'],
    'Nhâm': ['THIÊN LƯƠNG', 'TỬ VI', 'THIÊN PHỦ', 'VŨ KHÚC'],
    'Quý':  ['PHÁ QUÂN', 'CỰ MÔN', 'THÁI ÂM', 'THAM LANG']
  };
  // Bản Toàn Thư (Trung Hoa) khác ở Canh và Nhâm — dùng khi input.tuHoaToanThu = true
  const TU_HOA_TOAN_THU = Object.assign({}, TU_HOA_TABLE, {
    'Canh': ['THÁI DƯƠNG', 'VŨ KHÚC', 'THÁI ÂM', 'THIÊN ĐỒNG'],
    'Nhâm': ['THIÊN LƯƠNG', 'TỬ VI', 'TẢ PHÙ', 'VŨ KHÚC']
  });

  // Ngũ hành phụ tinh (theo lasotuvi) — để tô màu sao trên lá số
  const PHU_TINH_HANH = (() => {
    const src = {
      'Kim': 'Tử phù, Bạch hổ, Trực phù, Tấu thư, Quan đới, Lâm quan, Đế vượng, Đà la, Kình dương, Văn xương, Thai phụ, Hoa cái',
      'Mộc': 'Tang môn, Tướng quân, Dưỡng, Tam thai, Ân quang, Đường phù, Đào hoa, Giải thần, Hóa lộc',
      'Thủy': 'Thiếu âm, Long đức, Bác sĩ, Thanh long, Trường sinh, Mộc dục, Suy, Văn khúc, Long trì, Bát tọa, Thiên khốc, Thiên hư, Thiên riêu, Thiên y, Hồng loan, Thiên hỷ, Thiên sứ, Hóa khoa, Hóa quyền, Hóa kỵ, Lưu hà, Thiên không',
      'Hỏa': 'Thái tuế, Thiếu dương, Quan phù, Quan phủ, Tuế phá, Điếu khách, Lực sĩ, Tiểu hao, Phi liêm, Hỷ thần, Đại hao, Phục binh, Bệnh, Tử, Địa không, Địa kiếp, Linh tinh, Hỏa tinh, Thiên khôi, Thiên việt, Thiên đức, Nguyệt đức, Thiên hình, Thiên giải, Thiên mã, Phá toái, Thiên quan, Thiên phúc, Kiếp sát, Văn tinh, Đẩu quân',
      'Thổ': 'Phúc đức, Lộc tồn, Bệnh phù, Mộ, Tuyệt, Thai, Tả phù, Hữu bật, Phượng các, Thiên quý, Quốc ấn, Địa giải, Phong cáo, Thiên tài, Thiên thọ, Thiên thương, Thiên la, Địa võng, Cô thần, Quả tú, Thiên trù'
    };
    const map = {};
    Object.entries(src).forEach(([hanh, list]) => list.split(', ').forEach((n) => { map[n.toLowerCase()] = hanh; }));
    return map;
  })();

  /** Hành của một sao bất kỳ (chính tinh / phụ tinh / sao lưu "L.Thái Tuế"); null nếu không rõ */
  function hanhSao(name) {
    const plain = String(name).replace(/<[^>]+>/g, '').replace(/^L\./, '').trim();
    return STAR_ELEMENTS[plain.toUpperCase()] || PHU_TINH_HANH[plain.toLowerCase()] || null;
  }

  // Bảng Chủ Mệnh theo Chi năm
  const CHU_MENH = {
    'Tý': 'Tham Lang', 'Sửu': 'Cự Môn', 'Dần': 'Lộc Tồn', 'Mão': 'Văn Khúc',
    'Thìn': 'Liêm Trinh', 'Tỵ': 'Vũ Khúc', 'Ngọ': 'Phá Quân', 'Mùi': 'Vũ Khúc',
    'Thân': 'Liêm Trinh', 'Dậu': 'Văn Khúc', 'Tuất': 'Lộc Tồn', 'Hợi': 'Cự Môn'
  };

  // Bảng Chủ Thân theo Chi năm
  const CHU_THAN = {
    'Tý': 'Hỏa Tinh', 'Sửu': 'Thiên Tướng', 'Dần': 'Thiên Lương', 'Mão': 'Thiên Đồng',
    'Thìn': 'Văn Xương', 'Tỵ': 'Thiên Cơ', 'Ngọ': 'Hỏa Tinh', 'Mùi': 'Thiên Tướng',
    'Thân': 'Thiên Lương', 'Dậu': 'Thiên Đồng', 'Tuất': 'Văn Xương', 'Hợi': 'Thiên Cơ'
  };

  // Nghĩa của 30 nạp âm (hiển thị "Tuyền Trung Thủy (nước suối)")
  const NAP_AM_NGHIA = {
    'Hải Trung Kim': 'vàng trong biển', 'Lư Trung Hỏa': 'lửa trong lò', 'Đại Lâm Mộc': 'gỗ rừng già',
    'Lộ Bàng Thổ': 'đất đường đi', 'Kiếm Phong Kim': 'vàng mũi kiếm', 'Sơn Đầu Hỏa': 'lửa trên núi',
    'Giản Hạ Thủy': 'nước dưới khe', 'Thành Đầu Thổ': 'đất trên thành', 'Bạch Lạp Kim': 'vàng chân đèn',
    'Dương Liễu Mộc': 'gỗ cây dương liễu', 'Tuyền Trung Thủy': 'nước suối', 'Ốc Thượng Thổ': 'đất nóc nhà',
    'Tích Lịch Hỏa': 'lửa sấm sét', 'Tùng Bách Mộc': 'gỗ tùng bách', 'Trường Lưu Thủy': 'nước chảy dài',
    'Sa Trung Kim': 'vàng trong cát', 'Sơn Hạ Hỏa': 'lửa dưới núi', 'Bình Địa Mộc': 'gỗ đồng bằng',
    'Bích Thượng Thổ': 'đất trên vách', 'Kim Bạc Kim': 'vàng pha bạch kim', 'Phúc Đăng Hỏa': 'lửa ngọn đèn',
    'Thiên Hà Thủy': 'nước trên trời', 'Đại Trạch Thổ': 'đất nền nhà', 'Thoa Xuyến Kim': 'vàng trang sức',
    'Tang Đố Mộc': 'gỗ cây dâu', 'Đại Khê Thủy': 'nước khe lớn', 'Sa Trung Thổ': 'đất pha cát',
    'Thiên Thượng Hỏa': 'lửa trên trời', 'Thạch Lựu Mộc': 'gỗ cây lựu', 'Đại Hải Thủy': 'nước biển lớn'
  };

  const CAM_TINH = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];
  // Con nhà ... Đế theo hành bản mệnh (nạp âm năm sinh)
  const CON_NHA = { 'Kim': 'BẠCH ĐẾ', 'Mộc': 'THANH ĐẾ', 'Thủy': 'HẮC ĐẾ', 'Hỏa': 'XÍCH ĐẾ', 'Thổ': 'HOÀNG ĐẾ' };
  const HANH_SINH = { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' };
  const HANH_KHAC = { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' };

  // Cân xương tính số — đơn vị CHỈ (10 chỉ = 1 lượng) để cộng không bị sai số thập phân.
  // Năm: theo đủ 60 hoa giáp (Giáp Tý .. Quý Hợi), không phải theo 12 chi.
  const WEIGHT_YEAR = [
    12, 9, 6, 7, 12, 5, 9, 8, 7, 8,     // Giáp Tý .. Quý Dậu
    15, 9, 16, 8, 8, 19, 12, 6, 8, 7,   // Giáp Tuất .. Quý Mùi
    5, 15, 6, 16, 15, 7, 9, 12, 10, 7,  // Giáp Thân .. Quý Tỵ
    15, 6, 5, 14, 14, 9, 7, 7, 9, 12,   // Giáp Ngọ .. Quý Mão
    8, 7, 13, 5, 14, 5, 9, 17, 5, 7,    // Giáp Thìn .. Quý Sửu
    12, 8, 8, 6, 19, 6, 8, 16, 10, 6    // Giáp Dần .. Quý Hợi
  ];
  const WEIGHT_MONTH = [6, 7, 18, 9, 5, 16, 9, 15, 18, 8, 9, 5];
  const WEIGHT_DAY = [5, 10, 8, 15, 16, 15, 8, 16, 8, 16, 9, 17, 8, 17, 10, 8, 9, 18, 5, 15, 10, 9, 8, 9, 15, 18, 7, 8, 16, 6];
  const WEIGHT_HOUR = [16, 6, 7, 10, 9, 16, 10, 8, 8, 9, 6, 6]; // Tý .. Hợi

  const CUC_INFO = {
    'Thủy': { name: 'Thủy nhị cục', number: 2, element: 'Thủy' },
    'Mộc': { name: 'Mộc tam cục', number: 3, element: 'Mộc' },
    'Kim': { name: 'Kim tứ cục', number: 4, element: 'Kim' },
    'Thổ': { name: 'Thổ ngũ cục', number: 5, element: 'Thổ' },
    'Hỏa': { name: 'Hỏa lục cục', number: 6, element: 'Hỏa' }
  };

  /** Hành nạp âm của một cặp can chi (VD: Nhâm Ngọ -> Mộc) */
  function hanhNapAm(stemIdx, branchIdx) {
    const napAm = NAP_AM[`${STEMS[stemIdx]} ${BRANCHES[branchIdx]}`];
    return napAm.split(' ').pop();
  }

  /**
   * Tính Cục (Ngũ Hành Cục) = hành nạp âm của can chi cung Mệnh.
   * Can cung Mệnh lấy theo Ngũ Hổ Độn (khởi tháng Dần theo can năm).
   */
  function tinhCuc(canNamIdx, menhBranchIdx) {
    const canDan = ((canNamIdx % 5) * 2 + 2) % 10;
    const canMenh = (canDan + (menhBranchIdx - 2 + 12) % 12) % 10;
    return CUC_INFO[hanhNapAm(canMenh, menhBranchIdx)];
  }

  /** Đổi ngày âm -> dương (dò trong khoảng năm âm lịch đó). Trả null nếu ngày âm không tồn tại. */
  function lunarToSolar(cal, ld, lm, ly, leap) {
    const start = cal.jdFromDate(1, 1, ly);
    for (let jd = start; jd < start + 420; jd++) {
      const s = cal.jdToDate(jd);
      const l = cal.solarToLunar(s.d, s.m, s.y);
      if (l.year === ly && l.month === lm && l.day === ld && !!l.leap === !!leap) return s;
    }
    return null;
  }

  /**
   * An Sao Tử Vi theo Ngày Âm lịch và Số Cục
   */
  function anSaoTuVi(lunarDay, cucNum) {
    let remainder = lunarDay % cucNum;
    let quotient = Math.floor(lunarDay / cucNum);
    let pos = 0;

    if (remainder === 0) {
      pos = (quotient + 1) % 12; // Dần = 2
    } else {
      let x = cucNum - remainder;
      let q = Math.floor((lunarDay + x) / cucNum);
      if (x % 2 === 0) {
        pos = (q + 1 + x) % 12;
      } else {
        pos = (q + 1 - x + 120) % 12;
      }
    }
    return (pos + 12) % 12;
  }

  /**
   * An Tuần Không & Triệt Không
   */
  function tinhTuanTriet(canNamIdx, chiNamIdx) {
    const diff = (chiNamIdx - canNamIdx + 12) % 12;
    const tuanBranches = [(diff + 10) % 12, (diff + 11) % 12];
    const trietMap = [
      [8, 9], [6, 7], [4, 5], [2, 3], [0, 1],
      [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]
    ];
    return { tuan: tuanBranches, triet: trietMap[canNamIdx] };
  }

  /**
   * LẬP LÁ SỐ TỬ VI CHÍNH THỨC
   */
  function lapLaSoTuVi(input) {
    const LH = (typeof global !== 'undefined' && global.LH) ? global.LH : (window.LH || {});
    if (!LH.cal) {
      throw new Error("Không tìm thấy module LH.cal (js/lunar.js). Vui lòng load js/lunar.js trước!");
    }

    let solarD = input.solarDay || 1, solarM = input.solarMonth || 1, solarY = input.solarYear || 2000;
    const hour = input.hour !== undefined ? input.hour : 8;
    const minute = input.minute || 0;
    const viewYear = input.viewYear || new Date().getFullYear();
    // Sinh từ 23h trở đi là giờ Tý của NGÀY HÔM SAU (mặc định). Truyền rollover23: false để tắt.
    const rollover23 = input.rollover23 !== false;

    if (input.isLunar) {
      // Nhập âm lịch: đổi ra dương lịch để tính đúng can chi ngày / giờ
      const s = lunarToSolar(LH.cal, input.lunarDay, input.lunarMonth, input.lunarYear, !!input.isLeapMonth);
      if (!s) {
        throw new Error(`Ngày âm lịch ${input.lunarDay}/${input.lunarMonth}${input.isLeapMonth ? ' (nhuận)' : ''}/${input.lunarYear} không tồn tại.`);
      }
      solarD = s.d; solarM = s.m; solarY = s.y;
    }

    // 1. Can Chi Năm, Tháng, Ngày, Giờ qua LH.cal.getInfo
    // Ngày âm lấy từ cùng một nguồn với trụ ngày để sinh sau 23h không bị lệch ngày.
    const info = LH.cal.getInfo({ y: solarY, m: solarM, d: solarD, h: hour, mi: minute, s: 0 }, { rollover23 });
    const lunarDay = info.lunar.day;
    const lunarMonth = info.lunar.month; // tháng nhuận an sao như tháng chính
    const lunarYear = info.lunar.year;
    const isLeap = !!info.lunar.leap;
    const canNamIdx = (lunarYear - 4 + 6000) % 10;
    const chiNamIdx = (lunarYear - 4 + 6000) % 12;
    const canChiNam = `${STEMS[canNamIdx]} ${BRANCHES[chiNamIdx]}`;

    // Can Chi Tháng
    const canThangDau = ((canNamIdx % 5) * 2 + 2) % 10;
    const canThangIdx = (canThangDau + (lunarMonth - 1)) % 10;
    const chiThangIdx = (2 + (lunarMonth - 1)) % 12;
    const canChiThang = `${STEMS[canThangIdx]} ${BRANCHES[chiThangIdx]}`;

    // Can Chi Ngày & Giờ
    const dayPillar = info.pillars.day;
    const hourPillar = info.pillars.hour;
    const chiGioIdx = hourPillar.branch;
    const canGioIdx = hourPillar.stem;
    const canChiNgay = `${STEMS[dayPillar.stem]} ${BRANCHES[dayPillar.branch]}`;
    const canChiGio = `Giờ ${STEMS[canGioIdx]} ${BRANCHES[chiGioIdx]} ${hour}:${minute < 10 ? '0' + minute : minute}`;

    // Âm Dương đương số
    const isAmNam = (input.gender === 1 && canNamIdx % 2 !== 0);
    const isDuongNam = (input.gender === 1 && canNamIdx % 2 === 0);
    const isDuongNu = (input.gender === 0 && canNamIdx % 2 === 0);
    const isAmNu = (input.gender === 0 && canNamIdx % 2 !== 0);

    const amDuongName = isDuongNam ? 'Dương Nam' : (isAmNam ? 'Âm Nam' : (isDuongNu ? 'Dương Nữ' : 'Âm Nữ'));
    // 2. Định Cung Mệnh & Thân
    // Khởi Dần = 2, đếm thuận đến tháng sinh, rồi nghịch/thuận theo giờ sinh
    const monthPos = (2 + (lunarMonth - 1)) % 12;
    const menhBranchIdx = (monthPos - chiGioIdx + 120) % 12;
    const thanBranchIdx = (monthPos + chiGioIdx) % 12;

    // Thuận lý: tuổi Dương có Mệnh ở cung Dương (Tý, Dần...), tuổi Âm có Mệnh ở cung Âm
    const isThuanLy = (canNamIdx % 2) === (menhBranchIdx % 2);
    const amDuongDesc = `${amDuongName} (${isThuanLy ? 'Âm Dương thuận lý' : 'Âm Dương nghịch lý'})`;

    // 3. Tính Cục & Đại Hạn
    const cuc = tinhCuc(canNamIdx, menhBranchIdx);

    // Can của 12 cung (Ngũ Hổ Độn khởi Dần)
    const palaceStems = [];
    for (let b = 0; b < 12; b++) {
      let offset = (b - 2 + 12) % 12;
      palaceStems[b] = (canThangDau + offset) % 10;
    }

    // Gán 12 Cung chức vào 12 Địa Chi theo chiều THUẬN:
    // Mệnh -> Phụ Mẫu -> Phúc Đức -> Điền Trạch -> Quan Lộc -> Nô Bộc -> Thiên Di -> Tật Ách -> Tài Bạch -> Tử Tức -> Phu Thê -> Huynh Đệ
    const palaceBranchMap = {};
    const branchPalaceMap = {};
    for (let i = 0; i < 12; i++) {
      let b = (menhBranchIdx + i) % 12;
      palaceBranchMap[PALACE_KEYS[i]] = b;
      branchPalaceMap[b] = {
        name: PALACE_NAMES[i],
        key: PALACE_KEYS[i],
        index: i
      };
    }

    // Chiều đi của Đại Hạn: Dương Nam Âm Nữ đi THUẬN, Âm Nam Dương Nữ đi NGHỊCH
    const isDaiHanThuan = (isDuongNam || isAmNu);
    const daiHanMap = {};
    for (let step = 0; step < 12; step++) {
      let b = isDaiHanThuan ? (menhBranchIdx + step) % 12 : (menhBranchIdx - step + 120) % 12;
      daiHanMap[b] = cuc.number + step * 10;
    }

    // 4. Khởi Tuần Không & Triệt Không
    const { tuan, triet } = tinhTuanTriet(canNamIdx, chiNamIdx);

    // Chuẩn bị kho sao cho 12 cung (theo Địa Chi 0..11)
    const starHolders = Array.from({ length: 12 }, () => ({
      chinhTinh: [],
      phuTrai: [],
      phuPhai: [],
      trangSinh: '',
      tieuHan: '',
      thangHan: ''
    }));

    // 5. AN 14 CHÍNH TINH
    const tuviBranch = anSaoTuVi(lunarDay, cuc.number);
    const thienphuBranch = (4 - tuviBranch + 120) % 12;

    // Chòm Tử Vi (đi nghịch)
    const tuviFamily = [
      { name: 'TỬ VI', offset: 0 },
      { name: 'THIÊN CƠ', offset: -1 },
      { name: 'THÁI DƯƠNG', offset: -3 },
      { name: 'VŨ KHÚC', offset: -4 },
      { name: 'THIÊN ĐỒNG', offset: -5 },
      { name: 'LIÊM TRINH', offset: -8 }
    ];
    tuviFamily.forEach(s => {
      let b = (tuviBranch + s.offset + 120) % 12;
      let status = STAR_BRIGHTNESS[s.name][b];
      starHolders[b].chinhTinh.push({ name: s.name, status });
    });

    // Chòm Thiên Phủ (đi thuận)
    const thienphuFamily = [
      { name: 'THIÊN PHỦ', offset: 0 },
      { name: 'THÁI ÂM', offset: 1 },
      { name: 'THAM LANG', offset: 2 },
      { name: 'CỰ MÔN', offset: 3 },
      { name: 'THIÊN TƯỚNG', offset: 4 },
      { name: 'THIÊN LƯƠNG', offset: 5 },
      { name: 'THẤT SÁT', offset: 6 },
      { name: 'PHÁ QUÂN', offset: 10 }
    ];
    thienphuFamily.forEach(s => {
      let b = (thienphuBranch + s.offset) % 12;
      let status = STAR_BRIGHTNESS[s.name][b];
      starHolders[b].chinhTinh.push({ name: s.name, status });
    });

    // 6. AN PHỤ TINH & CÁC VÒNG SAO

    // A. Vòng Thái Tuế (theo Chi năm sinh, đi thuận)
    const THAI_TUE_STARS = [
      { name: 'Thái tuế', isSat: true }, { name: 'Thiếu dương', isSat: false },
      { name: 'Tang môn', isSat: true }, { name: 'Thiếu âm', isSat: false },
      { name: 'Quan phù', isSat: true }, { name: 'Tử phù', isSat: true },
      { name: 'Tuế phá', isSat: true },  { name: 'Long đức', isSat: false },
      { name: 'Bạch hổ', isSat: true },  { name: 'Phúc đức', isSat: false },
      { name: 'Điếu khách', isSat: true },{ name: 'Trực phù', isSat: true }
    ];
    THAI_TUE_STARS.forEach((s, idx) => {
      let b = (chiNamIdx + idx) % 12;
      if (s.isSat) starHolders[b].phuPhai.push(s.name);
      else starHolders[b].phuTrai.push(s.name);
    });

    // B. Vòng Lộc Tồn / Bác Sĩ (theo Can năm sinh)
    const LOC_TON_MAP = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
    const locTonBranch = LOC_TON_MAP[canNamIdx];
    
    starHolders[locTonBranch].phuTrai.push('<b><i>Lộc tồn</i></b>');
    starHolders[(locTonBranch + 1) % 12].phuPhai.push('<b><i>Kình dương</i></b>');
    starHolders[(locTonBranch - 1 + 12) % 12].phuPhai.push('<b><i>Đà la</i></b>');

    // Vòng Bác Sĩ
    const BAC_SI_STARS = [
      { name: 'Bác sĩ', isSat: false }, { name: 'Lực sĩ', isSat: false },
      { name: 'Thanh long', isSat: false }, { name: 'Tiểu hao', isSat: true },
      { name: 'Tướng quân', isSat: true },  { name: 'Tấu thư', isSat: false },
      { name: 'Phi liêm', isSat: true },   { name: 'Hỷ thần', isSat: false },
      { name: 'Bệnh phù', isSat: true },   { name: 'Đại hao', isSat: true },
      { name: 'Phục binh', isSat: true },  { name: 'Quan phủ', isSat: true }
    ];
    const isBacSiThuan = (isDuongNam || isAmNu);
    BAC_SI_STARS.forEach((s, idx) => {
      let b = isBacSiThuan ? (locTonBranch + idx) % 12 : (locTonBranch - idx + 120) % 12;
      if (s.isSat) starHolders[b].phuPhai.push(s.name);
      else starHolders[b].phuTrai.push(s.name);
    });

    // C. Vòng Tràng Sinh (theo Cục)
    const TRANG_SINH_START = { 'Thủy': 8, 'Thổ': 8, 'Mộc': 11, 'Kim': 5, 'Hỏa': 2 };
    const tsStart = TRANG_SINH_START[cuc.element];
    const TRANG_SINH_NAMES = ['Trường sinh', 'Mộc dục', 'Quan đới', 'Lâm quan', 'Đế vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];
    const isTSThuan = (isDuongNam || isAmNu);
    TRANG_SINH_NAMES.forEach((name, idx) => {
      let b = isTSThuan ? (tsStart + idx) % 12 : (tsStart - idx + 120) % 12;
      starHolders[b].trangSinh = name;
    });

    // D. Sao theo Tháng sinh
    const taPhuBranch = (4 + (lunarMonth - 1)) % 12;
    const huuBatBranch = (10 - (lunarMonth - 1) + 120) % 12;
    starHolders[taPhuBranch].phuTrai.push('<b><i>Tả phù</i></b>');
    starHolders[huuBatBranch].phuTrai.push('<b><i>Hữu bật</i></b>');

    starHolders[(9 + (lunarMonth - 1)) % 12].phuPhai.push('Thiên hình');
    starHolders[(1 + (lunarMonth - 1)) % 12].phuPhai.push('Thiên riêu');

    starHolders[(8 + (lunarMonth - 1)) % 12].phuTrai.push('Thiên giải');
    starHolders[(7 + (lunarMonth - 1)) % 12].phuTrai.push('Địa giải');

    // E. Sao theo Giờ sinh
    const xuongBranch = (10 - chiGioIdx + 120) % 12;
    const khucBranch = (4 + chiGioIdx) % 12;
    starHolders[xuongBranch].phuTrai.push('<b><i>Văn xương</i></b>');
    starHolders[khucBranch].phuTrai.push('<b><i>Văn khúc</i></b>');

    const khongBranch = (11 - chiGioIdx + 120) % 12;
    const kiepBranch = (11 + chiGioIdx) % 12;
    starHolders[khongBranch].phuPhai.push('<b><i>Địa không</i></b>');
    starHolders[kiepBranch].phuPhai.push('<b><i>Địa kiếp</i></b>');

    // Thai phụ: Văn khúc tiến 2 cung; Phong cáo: Văn khúc lùi 2 cung
    starHolders[(khucBranch + 2) % 12].phuTrai.push('Thai phụ');
    starHolders[(khucBranch - 2 + 12) % 12].phuTrai.push('Phong cáo');

    // Hỏa Tinh, Linh Tinh — khởi theo tam hợp chi năm:
    //   Dần Ngọ Tuất: Hỏa Sửu, Linh Mão | Thân Tý Thìn: Hỏa Dần, Linh Tuất
    //   Tỵ Dậu Sửu:  Hỏa Mão, Linh Tuất | Hợi Mão Mùi: Hỏa Dậu, Linh Tuất
    // Dương Nam / Âm Nữ: Hỏa thuận, Linh nghịch; Âm Nam / Dương Nữ: Hỏa nghịch, Linh thuận (đếm đến giờ sinh)
    let hoaStart, linhStart;
    if ([2, 6, 10].includes(chiNamIdx)) { hoaStart = 1; linhStart = 3; }
    else if ([8, 0, 4].includes(chiNamIdx)) { hoaStart = 2; linhStart = 10; }
    else if ([5, 9, 1].includes(chiNamIdx)) { hoaStart = 3; linhStart = 10; }
    else { hoaStart = 9; linhStart = 10; }

    const hoaThuan = (isDuongNam || isAmNu);
    const hoaBranch = (hoaStart + (hoaThuan ? chiGioIdx : -chiGioIdx) + 12) % 12;
    const linhBranch = (linhStart + (hoaThuan ? -chiGioIdx : chiGioIdx) + 12) % 12;
    starHolders[hoaBranch].phuPhai.push('<b><i>Hỏa tinh</i></b>');
    starHolders[linhBranch].phuPhai.push('<b><i>Linh tinh</i></b>');

    // F. Sao theo Can năm sinh
    const KHOI_VIET = [
      [1, 7], [0, 8], [11, 9], [11, 9], [1, 7],
      [0, 8], [6, 2], [6, 2], [3, 5], [3, 5]
    ];
    starHolders[KHOI_VIET[canNamIdx][0]].phuTrai.push('<b><i>Thiên khôi</i></b>');
    starHolders[KHOI_VIET[canNamIdx][1]].phuTrai.push('<b><i>Thiên việt</i></b>');

    // Văn tinh, Đường phù, Quốc ấn: tính từ Lộc tồn (tiến 3 / 5 / 8 cung)
    starHolders[(locTonBranch + 3) % 12].phuTrai.push('Văn tinh');
    starHolders[(locTonBranch + 5) % 12].phuTrai.push('Đường phù');
    starHolders[(locTonBranch + 8) % 12].phuTrai.push('Quốc ấn');

    // Thiên quan: Giáp Mùi, Ất Thìn, Bính Tỵ, Đinh Dần, Mậu Mão, Kỷ Dậu, Canh Hợi, Tân Dậu, Nhâm Tuất, Quý Ngọ
    // Thiên phúc: Giáp Dậu, Ất Thân, Bính Tý, Đinh Hợi, Mậu Mão, Kỷ Dần, Canh Ngọ, Tân Tỵ, Nhâm Ngọ, Quý Tỵ
    const QUAN_PHUC = [
      [7, 9], [4, 8], [5, 0], [2, 11], [3, 3],
      [9, 2], [11, 6], [9, 5], [10, 6], [6, 5]
    ];
    starHolders[QUAN_PHUC[canNamIdx][0]].phuTrai.push('Thiên quan');
    starHolders[QUAN_PHUC[canNamIdx][1]].phuTrai.push('Thiên phúc');

    // Thiên trù: Giáp Tỵ, Ất Ngọ, Bính Tý, Đinh Tỵ, Mậu Ngọ, Kỷ Thân, Canh Dần, Tân Ngọ, Nhâm Dậu, Quý Tuất
    // Lưu hà:    Giáp Dậu, Ất Tuất, Bính Mùi, Đinh Thìn, Mậu Tỵ, Kỷ Ngọ, Canh Thân, Tân Mão, Nhâm Hợi, Quý Dần
    const TRU_HA = [
      [5, 9], [6, 10], [0, 7], [5, 4], [6, 5],
      [8, 6], [2, 8], [6, 3], [9, 11], [10, 2]
    ];
    starHolders[TRU_HA[canNamIdx][0]].phuTrai.push('Thiên trù');
    starHolders[TRU_HA[canNamIdx][1]].phuPhai.push('Lưu hà');

    // G. Sao theo Chi năm sinh
    const DAO_HOA_MAP = [9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0];
    starHolders[DAO_HOA_MAP[chiNamIdx]].phuTrai.push('Đào hoa');

    const hongLoanBranch = (3 - chiNamIdx + 120) % 12;
    const thienHyBranch = (hongLoanBranch + 6) % 12;
    starHolders[hongLoanBranch].phuTrai.push('Hồng loan');
    starHolders[thienHyBranch].phuTrai.push('Thiên hỷ');

    const MA_MAP = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
    starHolders[MA_MAP[chiNamIdx]].phuTrai.push('Thiên mã');

    const HOA_CAI_MAP = [4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7];
    starHolders[HOA_CAI_MAP[chiNamIdx]].phuTrai.push('Hoa cái');

    const longTriBranch = (4 + chiNamIdx) % 12;
    const phuongCacBranch = (10 - chiNamIdx + 120) % 12;
    starHolders[longTriBranch].phuTrai.push('<b><i>Long trì</i></b>');
    starHolders[phuongCacBranch].phuTrai.push('<b><i>Phượng các</i></b>');
    starHolders[phuongCacBranch].phuTrai.push('Giải thần');

    starHolders[(6 - chiNamIdx + 120) % 12].phuPhai.push('Thiên khốc');
    starHolders[(6 + chiNamIdx) % 12].phuPhai.push('Thiên hư');

    const CO_QUA = [
      [2, 10], [2, 10], [5, 1], [5, 1], [5, 1], [8, 4],
      [8, 4], [8, 4], [11, 7], [11, 7], [11, 7], [2, 10]
    ];
    starHolders[CO_QUA[chiNamIdx][0]].phuPhai.push('Cô thần');
    starHolders[CO_QUA[chiNamIdx][1]].phuPhai.push('Quả tú');

    const KIEP_SAT_MAP = [5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8];
    const PHA_TOAI_MAP = [5, 1, 9, 5, 1, 9, 5, 1, 9, 5, 1, 9];
    starHolders[KIEP_SAT_MAP[chiNamIdx]].phuPhai.push('Kiếp sát');
    starHolders[PHA_TOAI_MAP[chiNamIdx]].phuPhai.push('Phá toái');

    // Thiên đức: Dậu tiến theo chi năm; Nguyệt đức: Tỵ tiến theo chi năm
    starHolders[(9 + chiNamIdx) % 12].phuTrai.push('Thiên đức');
    starHolders[(5 + chiNamIdx) % 12].phuTrai.push('Nguyệt đức');

    // Thiên tài: từ cung Mệnh đếm thuận đến chi năm; Thiên thọ: từ cung Thân đếm thuận đến chi năm
    starHolders[(menhBranchIdx + chiNamIdx) % 12].phuTrai.push('Thiên tài');
    starHolders[(thanBranchIdx + chiNamIdx) % 12].phuTrai.push('Thiên thọ');

    // Đẩu quân: từ Thái tuế (chi năm) đếm nghịch đến tháng sinh, rồi thuận đến giờ sinh
    const dauQuanBranch = (chiNamIdx - (lunarMonth - 1) + chiGioIdx + 120) % 12;
    starHolders[dauQuanBranch].phuPhai.push('Đẩu quân');

    starHolders[(chiNamIdx + 1) % 12].phuPhai.push('Thiên không');
    starHolders[4].phuPhai.push('Thiên la');
    starHolders[10].phuPhai.push('Địa võng');

    // Thiên y (cùng cung Thiên riêu); Thiên sứ ở Tật ách, Thiên thương ở Nô bộc
    starHolders[(1 + (lunarMonth - 1)) % 12].phuTrai.push('Thiên y');
    starHolders[palaceBranchMap.tat_ach].phuPhai.push('Thiên sứ');
    starHolders[palaceBranchMap.no_boc].phuPhai.push('Thiên thương');

    // H. Sao theo Ngày sinh
    const tamThaiBranch = (taPhuBranch + (lunarDay - 1)) % 12;
    const batToaBranch = (huuBatBranch - (lunarDay - 1) + 120) % 12;
    starHolders[tamThaiBranch].phuTrai.push('<b><i>Tam thai</i></b>');
    starHolders[batToaBranch].phuTrai.push('<b><i>Bát tọa</i></b>');

    const anQuangBranch = (xuongBranch + (lunarDay - 1) - 1 + 12) % 12;
    const thienQuyBranch = (khucBranch - (lunarDay - 1) + 1 + 120) % 12;
    starHolders[anQuangBranch].phuTrai.push('<b><i>Ân quang</i></b>');
    starHolders[thienQuyBranch].phuTrai.push('<b><i>Thiên quý</i></b>');

    // I. Tứ Hóa Năm Sinh (Khởi theo Can năm)
    const bangTuHoa = input.tuHoaToanThu ? TU_HOA_TOAN_THU : TU_HOA_TABLE;
    const tuHoaNam = bangTuHoa[STEMS[canNamIdx]];
    const HOA_LABELS = ['<b><i>Hóa lộc</i></b>', '<b><i>Hóa quyền</i></b>', '<b><i>Hóa khoa</i></b>', '<b><i>Hóa kỵ</i></b>'];
    tuHoaNam.forEach((starName, idx) => {
      for (let b = 0; b < 12; b++) {
        let hasStar = starHolders[b].chinhTinh.some(s => s.name === starName) ||
                      (starName === 'VĂN XƯƠNG' && b === xuongBranch) ||
                      (starName === 'VĂN KHÚC' && b === khucBranch) ||
                      (starName === 'TẢ PHÙ' && b === taPhuBranch) ||
                      (starName === 'HỮU BẬT' && b === huuBatBranch);
        if (hasStar) {
          if (idx === 3) starHolders[b].phuPhai.push(HOA_LABELS[idx]);
          else starHolders[b].phuTrai.push(HOA_LABELS[idx]);
          break;
        }
      }
    });

    // Nhãn Triệt / Tuần ghi vào cột phải (giống dữ liệu lichngay)
    triet.forEach(b => starHolders[b].phuPhai.push('TRIỆT'));
    tuan.forEach(b => starHolders[b].phuPhai.push('TUẦN'));

    // J. Sao Lưu Niên (Tính theo Năm Xem Hạn)
    const canLuuIdx = (viewYear - 4 + 6000) % 10;
    const chiLuuIdx = (viewYear - 4 + 6000) % 12;
    starHolders[chiLuuIdx].phuPhai.push('<span class="color_red"><b>L.</b></span>Thái Tuế');

    const locTonLuu = LOC_TON_MAP[canLuuIdx];
    starHolders[locTonLuu].phuTrai.push('<span class="color_red"><b>L.</b></span>Lộc Tồn');
    starHolders[(locTonLuu + 1) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Kình Dương');
    starHolders[(locTonLuu - 1 + 12) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Đà La');

    starHolders[(chiLuuIdx + 2) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Tang Môn');
    starHolders[(chiLuuIdx + 8) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Bạch Hổ');
    starHolders[MA_MAP[chiLuuIdx]].phuTrai.push('<span class="color_red"><b>L.</b></span>Thiên Mã');
    starHolders[(6 - chiLuuIdx + 120) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Thiên Khốc');
    starHolders[(6 + chiLuuIdx) % 12].phuPhai.push('<span class="color_red"><b>L.</b></span>Thiên Hư');

    // K. Tiểu Hạn & Nguyệt Hạn
    const TIEU_HAN_START = [10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4, 1];
    const thStart = TIEU_HAN_START[chiNamIdx];
    for (let i = 0; i < 12; i++) {
      let b = input.gender === 1 ? (thStart + i) % 12 : (thStart - i + 120) % 12;
      starHolders[b].tieuHan = `Năm ${BRANCHES[(chiNamIdx + i) % 12]}`;
    }

    // Nguyệt hạn: từ cung Tiểu hạn của năm xem, đếm nghịch đến tháng sinh, rồi thuận đến giờ sinh
    // => cung Tháng Giêng; các tháng sau đi thuận.
    const buocNamXem = (chiLuuIdx - chiNamIdx + 12) % 12;
    const tieuHanNamXem = input.gender === 1 ? (thStart + buocNamXem) % 12 : (thStart - buocNamXem + 12) % 12;
    const thangGieng = (tieuHanNamXem - (lunarMonth - 1) + chiGioIdx + 120) % 12;
    for (let m = 0; m < 12; m++) {
      starHolders[(thangGieng + m) % 12].thangHan = `Tháng ${m + 1}`;
    }

    // 7. PHI TINH TỨ HÓA (Theo Can của từng Cung)
    const phiHoaMap = {};
    for (let b = 0; b < 12; b++) {
      const stemIdx = palaceStems[b];
      const stemName = STEMS[stemIdx];
      const stars = bangTuHoa[stemName];
      const hoaLabels = ['Hóa lộc', 'Hóa quyền', 'Hóa khoa', 'Hóa kỵ'];
      const phiHoaList = [];

      hoaLabels.forEach((label, idx) => {
        const targetStar = stars[idx];
        for (let targetB = 0; targetB < 12; targetB++) {
          let found = starHolders[targetB].chinhTinh.some(s => s.name === targetStar) ||
                      (targetStar === 'VĂN XƯƠNG' && targetB === xuongBranch) ||
                      (targetStar === 'VĂN KHÚC' && targetB === khucBranch) ||
                      (targetStar === 'TẢ PHÙ' && targetB === taPhuBranch) ||
                      (targetStar === 'HỮU BẬT' && targetB === huuBatBranch);
          if (found) {
            let targetPalaceName = branchPalaceMap[targetB].name;
            if (targetB === b) {
              phiHoaList.push(`<span class="color_red">Tự</span> ${label}`);
            } else {
              phiHoaList.push(`${label} ➔ ${targetPalaceName}`);
            }
            break;
          }
        }
      });
      phiHoaMap[b] = phiHoaList;
    }

    // 8. ĐÓNG GÓI DỮ LIỆU BÀN CỜ THEO THỨ TỰ GRID LICHNGAY (0 .. 11)
    const parsedPalaces = GRID_BRANCHES.map((b, gridIdx) => {
      const pInfo = branchPalaceMap[b];
      const stemIdx = palaceStems[b];
      const polarity = stemIdx % 2 === 0 ? '+' : '-';
      const canChiCung = `${polarity}${STEMS[stemIdx].charAt(0)}. ${BRANCHES[b]}`;
      const isTriet = triet.includes(b);
      const isTuan = tuan.includes(b);
      const isThan = (b === thanBranchIdx);

      // Điểm số cung ước lượng
      let score = 70;
      starHolders[b].chinhTinh.forEach(s => {
        if (s.status === 'M' || s.status === 'V') score += 10;
        else if (s.status === 'Đ') score += 5;
        else if (s.status === 'H') score -= 8;
      });
      score += starHolders[b].phuTrai.length * 3;
      score -= starHolders[b].phuPhai.length * 2;
      score = Math.max(55, Math.min(99, score));

      return {
        index: gridIdx,
        branch_index: b,
        can_chi: canChiCung,
        ten_cung: pInfo.name,
        key_cung: pInfo.key,
        dai_han: String(daiHanMap[b]),
        is_than: isThan,
        is_triet: isTriet,
        is_tuan: isTuan,
        chinh_tinh: starHolders[b].chinhTinh,
        phu_tinh_trai: starHolders[b].phuTrai,
        phu_tinh_phai: starHolders[b].phuPhai,
        phi_hoa: phiHoaMap[b],
        trang_sinh: starHolders[b].trangSinh,
        tieu_han: starHolders[b].tieuHan,
        thang_han: starHolders[b].thangHan,
        bg_animal_url: `https://lichngay.net/images/12giap/${['tyj', 'suu', 'dan', 'mao', 'thin', 'ty', 'ngo', 'mui', 'than', 'dau', 'tuat', 'hoi'][b]}.png`,
        mo_ta: `Luận giải chi tiết sao chiếu mệnh và vận hạn cung ${pInfo.name}.`,
        diem_cung: score
      };
    });

    // 9. THÔNG TIN THIÊN BÀN (TRUNG TÂM)
    const napAmMenh = NAP_AM[canChiNam];
    const hanhMenh = napAmMenh.split(' ').pop();
    const hanhCuc = cuc.element;
    let quanHeMenhCuc;
    if (hanhMenh === hanhCuc) quanHeMenhCuc = `Mệnh ${hanhMenh} Cục ${hanhCuc} bình hòa`;
    else if (HANH_SINH[hanhMenh] === hanhCuc) quanHeMenhCuc = `Mệnh ${hanhMenh} sinh Cục ${hanhCuc}`;
    else if (HANH_SINH[hanhCuc] === hanhMenh) quanHeMenhCuc = `Cục ${hanhCuc} sinh Mệnh ${hanhMenh}`;
    else if (HANH_KHAC[hanhMenh] === hanhCuc) quanHeMenhCuc = `Mệnh ${hanhMenh} khắc Cục ${hanhCuc}`;
    else quanHeMenhCuc = `Cục ${hanhCuc} khắc Mệnh ${hanhMenh}`;

    // Cân xương: năm (60 hoa giáp) + tháng + ngày + giờ, cộng theo chỉ
    const tongChi = WEIGHT_YEAR[(lunarYear - 4 + 6000) % 60] + WEIGHT_MONTH[lunarMonth - 1] +
      WEIGHT_DAY[lunarDay - 1] + WEIGHT_HOUR[chiGioIdx];

    const pad2 = (n) => (n < 10 ? '0' + n : String(n));
    const thienBanInfo = {
      name: input.name || 'Đương Số',
      genderText: input.gender === 1 ? 'Nam' : 'Nữ',
      birthSolar: `${solarD}/${solarM}/${solarY} (Dương lịch)`,
      birthLunar: `Ngày ${pad2(lunarDay)}/${pad2(lunarMonth)}/${lunarYear} (Âm lịch${isLeap ? ', tháng nhuận' : ''})` +
        (info.shifted ? ' — sinh sau 23h, tính sang ngày hôm sau' : ''),
      canChiNam,
      canChiThang,
      canChiNgay,
      canChiGio,
      amDuong: amDuongDesc,
      tuoi: `${canChiNam}, ${viewYear - lunarYear + 1} tuổi âm (năm ${viewYear})`,
      cuc: `${cuc.name} (${quanHeMenhCuc})`,
      cucSo: cuc.number,
      hanhCuc,
      banMenh: `${napAmMenh} (${NAP_AM_NGHIA[napAmMenh]})`,
      hanhMenh,
      camTinh: `Con ${CAM_TINH[chiNamIdx].toLowerCase()}`,
      chuMenh: CHU_MENH[BRANCHES[chiNamIdx]],
      chuThan: CHU_THAN[BRANCHES[chiNamIdx]],
      conNha: `Con nhà ${CON_NHA[hanhMenh]}`,
      doMang: '', // chưa có bảng nguồn đáng tin -> để trống thay vì ghi cứng một giá trị
      canLuong: `${Math.floor(tongChi / 10)} lượng ${tongChi % 10} chỉ`,
      hanNam: `${STEMS[canLuuIdx]} ${BRANCHES[chiLuuIdx]} (${viewYear})`,
      lapLuc: `${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}`
    };

    return {
      success: true,
      chartId: 'chart_' + Date.now(),
      thienBan: thienBanInfo,
      palaces: parsedPalaces,
      rawStarHolders: starHolders
    };
  }

  // Export module
  const TuVi = {
    lapLaSoTuVi,
    tinhCuc,
    anSaoTuVi,
    tinhTuanTriet,
    STEMS,
    BRANCHES,
    PALACE_NAMES,
    PALACE_KEYS,
    STAR_ELEMENTS,
    STAR_BRIGHTNESS,
    TU_HOA_TABLE,
    TU_HOA_TOAN_THU,
    PHU_TINH_HANH,
    hanhSao
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TuVi;
  } else {
    global.TuVi = TuVi;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
