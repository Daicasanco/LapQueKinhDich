/*
 * Engine an quẻ Lục Hào (Hỏa Châu Lâm / Tăng San Bốc Dịch)
 * Giá trị hào (từ hào Sơ lên hào Thượng):
 *   6 = Lão Âm (động, X)   7 = Thiếu Dương   8 = Thiếu Âm   9 = Lão Dương (động, O)
 */
(function (G) {
  'use strict';
  const LH = (G.LH = G.LH || {});
  const { STEMS, BRANCHES, ELEMENTS, BRANCH_EL, mod } = LH.cal;

  /* ---------- Bát quái + Nạp giáp ---------- */
  // Thứ tự Tiên thiên: 1 Càn, 2 Đoài, 3 Ly, 4 Chấn, 5 Tốn, 6 Khảm, 7 Cấn, 8 Khôn
  const TRIGRAMS = [
    { name: 'Càn', image: 'Thiên', bits: [1, 1, 1], el: 3, stems: [0, 8], inner: [0, 2, 4], outer: [6, 8, 10] },
    { name: 'Đoài', image: 'Trạch', bits: [1, 1, 0], el: 3, stems: [3, 3], inner: [5, 3, 1], outer: [11, 9, 7] },
    { name: 'Ly', image: 'Hỏa', bits: [1, 0, 1], el: 1, stems: [5, 5], inner: [3, 1, 11], outer: [9, 7, 5] },
    { name: 'Chấn', image: 'Lôi', bits: [1, 0, 0], el: 0, stems: [6, 6], inner: [0, 2, 4], outer: [6, 8, 10] },
    { name: 'Tốn', image: 'Phong', bits: [0, 1, 1], el: 0, stems: [7, 7], inner: [1, 11, 9], outer: [7, 5, 3] },
    { name: 'Khảm', image: 'Thủy', bits: [0, 1, 0], el: 4, stems: [4, 4], inner: [2, 4, 6], outer: [8, 10, 0] },
    { name: 'Cấn', image: 'Sơn', bits: [0, 0, 1], el: 2, stems: [2, 2], inner: [4, 6, 8], outer: [10, 0, 2] },
    { name: 'Khôn', image: 'Địa', bits: [0, 0, 0], el: 2, stems: [1, 9], inner: [7, 5, 3], outer: [1, 11, 9] }
  ];

  const triIndex = (b) => TRIGRAMS.findIndex((t) => t.bits[0] === b[0] && t.bits[1] === b[1] && t.bits[2] === b[2]);

  // Tên ngắn 64 quẻ [thượng][hạ]
  const SHORT = [
    ['Càn', 'Lý', 'Đồng Nhân', 'Vô Vọng', 'Cấu', 'Tụng', 'Độn', 'Bĩ'],
    ['Quải', 'Đoài', 'Cách', 'Tùy', 'Đại Quá', 'Khốn', 'Hàm', 'Tụy'],
    ['Đại Hữu', 'Khuê', 'Ly', 'Phệ Hạp', 'Đỉnh', 'Vị Tế', 'Lữ', 'Tấn'],
    ['Đại Tráng', 'Quy Muội', 'Phong', 'Chấn', 'Hằng', 'Giải', 'Tiểu Quá', 'Dự'],
    ['Tiểu Súc', 'Trung Phu', 'Gia Nhân', 'Ích', 'Tốn', 'Hoán', 'Tiệm', 'Quán'],
    ['Nhu', 'Tiết', 'Ký Tế', 'Truân', 'Tỉnh', 'Khảm', 'Kiển', 'Tỷ'],
    ['Đại Súc', 'Tổn', 'Bí', 'Di', 'Cổ', 'Mông', 'Cấn', 'Bác'],
    ['Thái', 'Lâm', 'Minh Di', 'Phục', 'Thăng', 'Sư', 'Khiêm', 'Khôn']
  ];
  // Số thứ tự Văn Vương [thượng][hạ]
  const KW = [
    [1, 10, 13, 25, 44, 6, 33, 12],
    [43, 58, 49, 17, 28, 47, 31, 45],
    [14, 38, 30, 21, 50, 64, 56, 35],
    [34, 54, 55, 51, 32, 40, 62, 16],
    [9, 61, 37, 42, 57, 59, 53, 20],
    [5, 60, 63, 3, 48, 29, 39, 8],
    [26, 41, 22, 27, 18, 4, 52, 23],
    [11, 19, 36, 24, 46, 7, 15, 2]
  ];
  // Quẻ tượng (điềm) theo số Văn Vương 1..64
  const OMEN = [null,
    'Khốn Long Đắc Thủy', 'Ngạ Hổ Đắc Thực', 'Loạn Ti Vô Đầu', 'Tiểu Quỷ Thâu Tiền', 'Minh Châu Thổ Mai',
    'Nhị Nhân Tranh Lộ', 'Mã Đáo Thành Công', 'Thuyền Đắc Thuận Phong', 'Mật Vân Bất Vũ', 'Phượng Minh Kỳ Sơn',
    'Hỷ Báo Tam Nguyên', 'Hổ Lạc Hãm Khanh', 'Tiên Nhân Chỉ Lộ', 'Khảm Thụ Mạc Tước', 'Nhị Nhân Phân Kim',
    'Thanh Long Đắc Vị', 'Thôi Xa Kháo Nhai', 'Thôi Ma Xóa Đạo', 'Phát Chính Thi Nhân', 'Hạn Bồng Phùng Hà',
    'Cơ Nhân Ngộ Thực', 'Hỷ Khí Doanh Môn', 'Ưng Thước Đồng Lâm', 'Phu Thê Phản Mục', 'Điểu Bị Lung Lao',
    'Trận Thế Đắc Khai', 'Vị Thủy Phỏng Hiền', 'Dạ Mộng Kim Ngân', 'Thủy Để Lao Nguyệt', 'Thiên Quan Tứ Phúc',
    'Manh Nha Xuất Thổ', 'Ngư Lai Tràng Võng', 'Nùng Vân Tế Nhật', 'Công Sư Đắc Mộc', 'Sừ Địa Đắc Kim',
    'Quá Hà Sách Kiều', 'Kính Lý Quan Hoa', 'Thái Công Bất Ngộ', 'Vũ Tuyết Tái Đồ', 'Ngũ Quan Thoát Nạn',
    'Thôi Xa Điệu Nhĩ', 'Khô Mộc Khai Hoa', 'Du Phong Thoát Võng', 'Tha Hương Ngộ Hữu', 'Lý Ngư Hóa Long',
    'Chỉ Nhật Cao Thăng', 'Toát Can Trừu Thê', 'Khô Tỉnh Sinh Tuyền', 'Hạn Miêu Đắc Vũ', 'Ngư Nhân Đắc Lợi',
    'Kim Chung Dạ Tràng', 'Ải Ba Câu Táo', 'Tuấn Điểu Xuất Lung', 'Duyên Mộc Cầu Ngư', 'Cổ Kính Trùng Minh',
    'Túc Điểu Phần Sào', 'Cô Chu Đắc Thủy', 'Sấn Thủy Hòa Nê', 'Cách Hà Vọng Kim', 'Trảm Tướng Phong Thần',
    'Hành Tẩu Bạc Băng', 'Cấp Quá Độc Mộc Kiều', 'Kim Bảng Đề Danh', 'Ưu Trung Vọng Hỷ'
  ];
  // Ý nghĩa tóm tắt theo số Văn Vương
  const MEANING = [null,
    'Cứng mạnh, sáng tạo; thời vận hanh thông nhưng chớ kiêu căng.',
    'Nhu thuận, bao dung; đi sau, theo người thì được lợi.',
    'Gian nan buổi đầu, mọi việc còn rối ren, chưa nên vội.',
    'Mờ tối, non nớt; cần học hỏi, tìm thầy chỉ dẫn.',
    'Chờ đợi thời cơ; nhẫn nại thì được, nóng vội thì hỏng.',
    'Tranh chấp, kiện tụng; nên hòa giải, tránh đi đến cùng.',
    'Đông người, việc quân; cần người cầm đầu chính đáng.',
    'Thân cận, hợp tác, nương tựa lẫn nhau.',
    'Tích chứa nhỏ, bị ngăn trở tạm thời; việc chưa thành.',
    'Thận trọng từng bước, giữ lễ thì yên ổn.',
    'Thông suốt, hanh thái; trên dưới giao hòa.',
    'Bế tắc, trên dưới không thông; nên giữ mình.',
    'Đồng lòng, hợp tác với người thì nên việc.',
    'Có lớn, sung túc, được nhiều.',
    'Khiêm tốn thì được ích lợi, trước khó sau dễ.',
    'Vui vẻ, an lạc; chuẩn bị trước thì thuận lợi.',
    'Theo thời, thuận người mà làm.',
    'Hư hỏng tích tụ, cần sửa đổi, chấn chỉnh.',
    'Đến gần, lớn mạnh dần; thời vận đang lên.',
    'Quan sát, xem xét kỹ trước khi làm.',
    'Cắn hợp, trừ bỏ trở ngại; có việc hình pháp.',
    'Trang sức bề ngoài; việc nhỏ thì lợi.',
    'Bóc mòn, suy tàn; nên giữ yên, chớ tiến.',
    'Trở lại, phục hồi; khởi đầu một chu kỳ mới.',
    'Chân thật, không càn bậy; đề phòng tai họa bất ngờ.',
    'Tích chứa lớn, nuôi dưỡng tài đức.',
    'Nuôi dưỡng; cẩn trọng lời nói, ăn uống.',
    'Quá mức, gánh nặng vượt sức.',
    'Hiểm hãm trùng trùng; cần giữ lòng tin.',
    'Sáng sủa, nương tựa, bám vào.',
    'Cảm ứng, giao cảm; lợi việc tình cảm.',
    'Bền lâu, giữ đạo thường.',
    'Lui ẩn, tránh né thì yên.',
    'Mạnh mẽ lớn; chớ cậy sức mà hỏng việc.',
    'Tiến lên, thăng tiến, sáng sủa.',
    'Ánh sáng bị tổn thương; nên ẩn mình chờ thời.',
    'Việc trong nhà, gia đạo.',
    'Chia lìa, trái ngược; việc nhỏ còn được.',
    'Gian nan trắc trở; nên dừng lại.',
    'Tháo gỡ, giải thoát khó khăn.',
    'Giảm bớt, bớt dưới thêm trên; thành tâm thì được.',
    'Tăng thêm, có lợi; nên tiến hành.',
    'Quyết đoán, dứt bỏ.',
    'Gặp gỡ bất ngờ; gặp gỡ không chính.',
    'Tụ họp, đông người.',
    'Đi lên, thăng tiến dần dần.',
    'Khốn cùng, bị vây hãm.',
    'Giếng nước; nuôi dưỡng không cạn, giữ nếp cũ.',
    'Thay đổi, cải cách.',
    'Đổi mới, ổn định, xây dựng cơ nghiệp.',
    'Chấn động; kinh sợ rồi yên.',
    'Dừng lại, yên tĩnh.',
    'Tiến dần từng bước.',
    'Việc không chính, không thuận; chớ vội.',
    'Thịnh lớn, sung mãn; đề phòng thịnh cực rồi suy.',
    'Đi xa, khách lữ, không yên định.',
    'Thuận nhập, mềm mỏng thì lợi.',
    'Vui vẻ, đẹp lòng; lợi việc nói năng, giao thiệp.',
    'Tan rã, phân tán.',
    'Tiết chế, có chừng mực.',
    'Thành tín trong lòng.',
    'Hơi quá; việc nhỏ thì được, việc lớn không nên.',
    'Đã xong, thành tựu; đề phòng về sau.',
    'Chưa xong, việc còn dang dở.'
  ];

  /* ---------- Bát cung, Thế Ứng ---------- */
  const ORDER_NAMES = ['Bát Thuần', 'Nhất Thế', 'Nhị Thế', 'Tam Thế', 'Tứ Thế', 'Ngũ Thế', 'Du Hồn', 'Quy Hồn'];
  const THE_BY_ORDER = [6, 1, 2, 3, 4, 5, 4, 3];
  const PALACE_MAP = (() => {
    const map = {};
    const steps = [[], [0], [1], [2], [3], [4], [3], [0, 1, 2]];
    TRIGRAMS.forEach((t, p) => {
      const b = t.bits.concat(t.bits);
      steps.forEach((s, o) => {
        s.forEach((i) => (b[i] ^= 1));
        map[b.join('')] = { palace: p, order: o, the: THE_BY_ORDER[o] };
      });
    });
    return map;
  })();

  /* ---------- Quan hệ ngũ hành / địa chi ---------- */
  const generates = (a, b) => (a + 1) % 5 === b;
  const controls = (a, b) => (a + 2) % 5 === b;
  const isClash = (a, b) => mod(a - b, 12) === 6;
  const isCombine = (a, b) => (a + b) % 12 === 1;
  // Hình: Dần–Tị–Thân, Sửu–Tuất–Mùi, Tý–Mão; tự hình Thìn, Ngọ, Dậu, Hợi
  const HINH_PAIRS = [[2, 5], [5, 8], [8, 2], [1, 10], [10, 7], [7, 1], [0, 3]];
  const SELF_HINH = [4, 6, 9, 11];
  const isHinh = (a, b) =>
    a === b ? SELF_HINH.includes(a) : HINH_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  // Lục hại: Tý–Mùi, Sửu–Ngọ, Dần–Tị, Mão–Thìn, Thân–Hợi, Dậu–Tuất
  const isHai = (a, b) => a !== b && (a + b) % 12 === 7;
  // Tam hợp cục (mid = chi Đế vượng ở giữa)
  const TAM_HOP = [
    { branches: [8, 0, 4], el: 4, mid: 0 }, // Thân Tý Thìn – Thủy
    { branches: [11, 3, 7], el: 0, mid: 3 }, // Hợi Mão Mùi – Mộc
    { branches: [2, 6, 10], el: 1, mid: 6 }, // Dần Ngọ Tuất – Hỏa
    { branches: [5, 9, 1], el: 3, mid: 9 } // Tị Dậu Sửu – Kim
  ];
  const TAM_HINH = [
    { branches: [2, 5, 8], name: 'Dần Tị Thân (vô ân chi hình)' },
    { branches: [1, 10, 7], name: 'Sửu Tuất Mùi (trì thế chi hình)' }
  ];

  const RELATIVES = ['Phụ Mẫu', 'Huynh Đệ', 'Tử Tôn', 'Thê Tài', 'Quan Quỷ'];
  const REL_SHORT = ['Phụ', 'Huynh', 'Tử', 'Tài', 'Quan'];
  const relativeOf = (lineEl, palaceEl) => mod(lineEl - palaceEl + 1, 5);

  const BEASTS = ['Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ'];
  const BEAST_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];

  // Vượng Tướng Hưu Tù Tử: d = (hành hào - hành tháng) mod 5
  const SEASON_STATE = ['Vượng', 'Tướng', 'Tử', 'Tù', 'Hưu'];
  const seasonState = (lineEl, monthEl) => SEASON_STATE[mod(lineEl - monthEl, 5)];

  // Vòng Trường sinh (Thổ theo Thủy)
  const STAGES = ['Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];
  const STAGE_START = [11, 2, 8, 5, 8]; // Mộc Hợi, Hỏa Dần, Thổ Thân, Kim Tị, Thủy Thân
  const stageOf = (el, branch) => mod(branch - STAGE_START[el], 12);
  const moOf = (el) => (STAGE_START[el] + 8) % 12; // chi Mộ của một hành

  const LINE_NAMES = ['Sơ', 'Nhị', 'Tam', 'Tứ', 'Ngũ', 'Thượng'];

  const branchLabel = (b) => BRANCHES[b] + '-' + ELEMENTS[BRANCH_EL[b]];

  /* ---------- Thông tin một quẻ ---------- */
  function najiaOf(bits) {
    const lo = TRIGRAMS[triIndex(bits.slice(0, 3))];
    const up = TRIGRAMS[triIndex(bits.slice(3))];
    const out = [];
    for (let i = 0; i < 6; i++) {
      const inner = i < 3;
      const t = inner ? lo : up;
      const branch = inner ? t.inner[i] : t.outer[i - 3];
      out.push({ stem: inner ? t.stems[0] : t.stems[1], branch, el: BRANCH_EL[branch] });
    }
    return out;
  }

  function hexInfo(bits) {
    const lower = triIndex(bits.slice(0, 3));
    const upper = triIndex(bits.slice(3));
    const pal = PALACE_MAP[bits.join('')];
    const short = SHORT[upper][lower];
    const kw = KW[upper][lower];
    const name = upper === lower
      ? 'Bát Thuần ' + TRIGRAMS[upper].name
      : TRIGRAMS[upper].image + ' ' + TRIGRAMS[lower].image + ' ' + short;
    const najia = najiaOf(bits);
    const lucXung = [0, 1, 2].every((i) => isClash(najia[i].branch, najia[i + 3].branch));
    const lucHop = [0, 1, 2].every((i) => isCombine(najia[i].branch, najia[i + 3].branch));
    const the = pal.the;
    return {
      bits: bits.slice(),
      key: bits.join(''),
      lower, upper, short, kw, name,
      omen: OMEN[kw],
      meaning: MEANING[kw],
      palace: pal.palace,
      palaceName: TRIGRAMS[pal.palace].name,
      palaceEl: TRIGRAMS[pal.palace].el,
      order: pal.order,
      orderName: ORDER_NAMES[pal.order],
      the,
      ung: the > 3 ? the - 3 : the + 3,
      najia,
      lucXung,
      lucHop
    };
  }

  /* ---------- Thần sát ---------- */
  function computeShensha(cal, main) {
    const ds = cal.pillars.day.stem;
    const db = cal.pillars.day.branch;
    const mb = cal.pillars.month.branch;
    const g = db % 4; // 0: Thân Tý Thìn, 1: Tị Dậu Sửu, 2: Dần Ngọ Tuất, 3: Hợi Mão Mùi
    const seasonOfMonth = Math.floor(mod(mb - 2, 12) / 3); // 0 xuân, 1 hạ, 2 thu, 3 đông
    const theYang = main.bits[main.the - 1] === 1;
    const quai = theYang ? main.the - 1 : main.the + 5;
    const quaiEl = BRANCH_EL[quai];
    const branchesOfEl = (el) => BRANCHES.map((_, b) => b).filter((b) => BRANCH_EL[b] === el);

    const list = [
      { key: 'quy', name: 'Quý Nhân', basis: 'Can ngày ' + STEMS[ds], branches: [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [2, 6], [2, 6], [3, 5], [3, 5]][ds] },
      { key: 'loc', name: 'Lộc Thần', basis: 'Can ngày ' + STEMS[ds], branches: [[2, 3, 5, 6, 5, 6, 8, 9, 11, 0][ds]] },
      { key: 'nhan', name: 'Dương Nhẫn', basis: 'Can ngày ' + STEMS[ds], branches: [[3, 2, 6, 5, 6, 5, 9, 8, 0, 11][ds]] },
      { key: 'xuong', name: 'Văn Xương', basis: 'Can ngày ' + STEMS[ds], branches: [[5, 6, 8, 9, 8, 9, 11, 0, 2, 3][ds]] },
      { key: 'ma', name: 'Dịch Mã', basis: 'Chi ngày ' + BRANCHES[db], branches: [[2, 11, 8, 5][g]] },
      { key: 'dao', name: 'Đào Hoa', basis: 'Chi ngày ' + BRANCHES[db], branches: [[9, 6, 3, 0][g]] },
      { key: 'tuongtinh', name: 'Tướng Tinh', basis: 'Chi ngày ' + BRANCHES[db], branches: [[0, 9, 6, 3][g]] },
      { key: 'hoacai', name: 'Hoa Cái', basis: 'Chi ngày ' + BRANCHES[db], branches: [[4, 1, 10, 7][g]] },
      { key: 'kiep', name: 'Kiếp Sát', basis: 'Chi ngày ' + BRANCHES[db], branches: [[5, 2, 11, 8][g]] },
      { key: 'tai', name: 'Tai Sát', basis: 'Chi ngày ' + BRANCHES[db], branches: [[6, 3, 0, 9][g]] },
      { key: 'muu', name: 'Mưu Tinh', basis: 'Chi ngày ' + BRANCHES[db], branches: [[10, 7, 4, 1][g]] },
      { key: 'thienhy', name: 'Thiên Hỷ', basis: 'Tháng ' + BRANCHES[mb], branches: [[10, 1, 4, 7][seasonOfMonth]] },
      { key: 'thieny', name: 'Thiên Y', basis: 'Tháng ' + BRANCHES[mb], branches: [mod(mb - 1, 12)] },
      { key: 'quai', name: 'Quái Thân (Quải thần)', basis: 'Thế hào ' + main.the + (theYang ? ' (dương)' : ' (âm)'), branches: [quai] },
      // Theo Quái thân: hào bị Quái thân khắc là Hương Khuê, hào được Quái thân sinh là Sàng Trướng
      { key: 'huongkhue', name: 'Hương Khuê', basis: `Quái thân ${BRANCHES[quai]}-${ELEMENTS[quaiEl]} khắc`, branches: branchesOfEl((quaiEl + 2) % 5) },
      { key: 'sangtruong', name: 'Sàng Trướng', basis: `Quái thân ${BRANCHES[quai]}-${ELEMENTS[quaiEl]} sinh`, branches: branchesOfEl((quaiEl + 1) % 5) }
    ];
    const byKey = {};
    list.forEach((s) => (byKey[s.key] = s));
    return { list, byKey };
  }

  /* ---------- Chi tiết một hào ---------- */
  function lineInfo(nj, i, ctx, opt) {
    const { palaceEl, cal, shensha, voids } = ctx;
    const db = cal.pillars.day.branch;
    const mb = cal.pillars.month.branch;
    const dayEl = BRANCH_EL[db];
    const monthEl = BRANCH_EL[mb];
    const rel = relativeOf(nj.el, palaceEl);

    const dayRel = [];
    if (nj.branch === db) dayRel.push('Lâm Nhật');
    else if (isClash(nj.branch, db)) dayRel.push('Nhật Xung');
    else if (isCombine(nj.branch, db)) dayRel.push('Nhật Hợp');
    if (nj.branch !== db) {
      if (generates(dayEl, nj.el)) dayRel.push('Nhật Sinh');
      else if (controls(dayEl, nj.el)) dayRel.push('Nhật Khắc');
      else if (dayEl === nj.el) dayRel.push('Nhật Phù');
    }
    if (isHinh(nj.branch, db)) dayRel.push(nj.branch === db ? 'Nhật Tự Hình' : 'Nhật Hình');
    if (isHai(nj.branch, db)) dayRel.push('Nhật Hại');

    const monthRel = [];
    if (nj.branch === mb) monthRel.push('Nguyệt Kiến');
    else if (isClash(nj.branch, mb)) monthRel.push('Nguyệt Phá');
    else if (isCombine(nj.branch, mb)) monthRel.push('Nguyệt Hợp');
    if (nj.branch !== mb) {
      if (generates(monthEl, nj.el)) monthRel.push('Nguyệt Sinh');
      else if (controls(monthEl, nj.el)) monthRel.push('Nguyệt Khắc');
      else if (monthEl === nj.el) monthRel.push('Nguyệt Phù');
    }
    if (isHinh(nj.branch, mb)) monthRel.push(nj.branch === mb ? 'Nguyệt Tự Hình' : 'Nguyệt Hình');
    if (isHai(nj.branch, mb)) monthRel.push('Nguyệt Hại');

    const vs = seasonState(nj.el, monthEl);
    const marks = {};
    const stars = [];
    shensha.list.forEach((s) => {
      if (s.key === 'quai' && !opt.allowQuai) return;
      if (s.branches.includes(nj.branch)) {
        marks[s.key] = true;
        stars.push(s.name);
      }
    });

    const status = [];
    const strong = vs === 'Vượng' || vs === 'Tướng' || dayRel.includes('Nhật Sinh') || dayRel.includes('Nhật Phù');
    if (!opt.moving && dayRel.includes('Nhật Xung')) {
      status.push(strong && !monthRel.includes('Nguyệt Phá') ? 'Ám Động' : 'Nhật Phá (xung tán)');
    }

    return {
      pos: i + 1,
      posName: LINE_NAMES[i],
      yang: opt.yang,
      moving: !!opt.moving,
      stem: nj.stem,
      branch: nj.branch,
      el: nj.el,
      canChi: STEMS[nj.stem] + ' ' + BRANCHES[nj.branch],
      label: branchLabel(nj.branch),
      rel,
      relName: RELATIVES[rel],
      relShort: REL_SHORT[rel],
      vs,
      isVoid: voids.includes(nj.branch),
      tsDay: STAGES[stageOf(nj.el, db)],
      tsMonth: STAGES[stageOf(nj.el, mb)],
      dayRel,
      monthRel,
      marks,
      stars,
      status
    };
  }

  /* ---------- Hào động biến ---------- */
  const ADVANCE = { 11: 0, 2: 3, 5: 6, 8: 9, 1: 4, 4: 7, 7: 10, 10: 1 }; // Tiến thần

  function transformTags(from, to, ctx) {
    const tags = [];
    if (from.branch === to.branch) tags.push({ t: 'Hóa Phục Ngâm', tone: 'bad' });
    else if (from.el === to.el) {
      if (ADVANCE[from.branch] === to.branch) tags.push({ t: 'Hóa Tiến Thần', tone: 'good' });
      else if (ADVANCE[to.branch] === from.branch) tags.push({ t: 'Hóa Thoái Thần', tone: 'bad' });
      else tags.push({ t: 'Hóa Tỷ Hòa', tone: 'neutral' });
    } else if (generates(to.el, from.el)) tags.push({ t: 'Hồi Đầu Sinh', tone: 'good' });
    else if (controls(to.el, from.el)) tags.push({ t: 'Hồi Đầu Khắc', tone: 'bad' });
    else if (generates(from.el, to.el)) tags.push({ t: 'Hóa Tiết (sinh xuất)', tone: 'neutral' });
    else if (controls(from.el, to.el)) tags.push({ t: 'Hóa Khắc Xuất', tone: 'neutral' });

    if (isClash(from.branch, to.branch)) tags.push({ t: 'Hóa Xung (Phản Ngâm)', tone: 'bad' });
    if (isCombine(from.branch, to.branch)) tags.push({ t: 'Hóa Hợp', tone: 'neutral' });
    const st = stageOf(from.el, to.branch);
    if (st === 0) tags.push({ t: 'Hóa Trường Sinh', tone: 'good' });
    if (st === 4) tags.push({ t: 'Hóa Đế Vượng', tone: 'good' });
    if (st === 8) tags.push({ t: 'Hóa Mộ', tone: 'bad' });
    if (st === 9) tags.push({ t: 'Hóa Tuyệt', tone: 'bad' });
    if (ctx.voids.includes(to.branch)) tags.push({ t: 'Hóa Không', tone: 'bad' });
    if (isClash(to.branch, ctx.cal.pillars.month.branch)) tags.push({ t: 'Hóa Nguyệt Phá', tone: 'bad' });

    // Hào biến xét theo Nguyệt / Nhật (vòng Trường sinh của hành hào biến)
    // vd. biến ra hào Hỏa ở tháng Tuất → Hỏa mộ tại Tuất → "Hóa Mộ tại Nguyệt"
    const STAGE_TAG = { 'Trường Sinh': 'good', 'Đế Vượng': 'good', 'Mộ': 'bad', 'Tuyệt': 'bad' };
    [['Nguyệt', to.tsMonth], ['Nhật', to.tsDay]].forEach(([src, stage]) => {
      if (STAGE_TAG[stage]) tags.push({ t: `Hóa ${stage} tại ${src}`, tone: STAGE_TAG[stage], src });
    });
    return tags;
  }

  /* ---------- Phục ngâm / Phản ngâm ---------- */
  const TRI_CLASH = { 0: 4, 4: 0, 5: 2, 2: 5, 6: 7, 7: 6, 3: 1, 1: 3 }; // Càn-Tốn, Khảm-Ly, Cấn-Khôn, Chấn-Đoài

  function fuFan(main, changed, mainLines, changedLines, moving) {
    if (!changed) return { phucNgam: '', phanNgam: '', haoPhanNgam: [] };
    const innerMove = moving.slice(0, 3).some(Boolean);
    const outerMove = moving.slice(3).some(Boolean);
    const same = (a, b) => [0, 1, 2].every((i) => a[i] === b[i]);
    const ib = (ls, s) => ls.slice(s, s + 3).map((l) => l.branch);
    const innerFu = innerMove && same(ib(mainLines, 0), ib(changedLines, 0));
    const outerFu = outerMove && same(ib(mainLines, 3), ib(changedLines, 3));
    const phucNgam = innerFu && outerFu ? 'Quẻ Phục Ngâm' : outerFu ? 'Ngoại Phục Ngâm' : innerFu ? 'Nội Phục Ngâm' : '';

    const innerFan = innerMove && TRI_CLASH[main.lower] === changed.lower;
    const outerFan = outerMove && TRI_CLASH[main.upper] === changed.upper;
    const phanNgam = innerFan && outerFan ? 'Quẻ Phản Ngâm' : outerFan ? 'Ngoại Phản Ngâm' : innerFan ? 'Nội Phản Ngâm' : '';

    const haoPhanNgam = [];
    for (let i = 0; i < 6; i++) {
      if (moving[i] && isClash(mainLines[i].branch, changedLines[i].branch)) haoPhanNgam.push(i + 1);
    }
    return { phucNgam, phanNgam, haoPhanNgam };
  }

  /* ---------- Phân tích tổng ---------- */
  function analyze(values, cal) {
    if (!Array.isArray(values) || values.length !== 6 || values.some((v) => ![6, 7, 8, 9].includes(v))) {
      throw new Error('Cần đúng 6 hào với giá trị 6/7/8/9');
    }
    const bits = values.map((v) => (v === 7 || v === 9 ? 1 : 0));
    const moving = values.map((v) => v === 6 || v === 9);
    const hasMoving = moving.some(Boolean);
    const cbits = bits.map((b, i) => (moving[i] ? 1 - b : b));

    const main = hexInfo(bits);
    const changed = hasMoving ? hexInfo(cbits) : null;
    const mutual = hexInfo([bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]]);

    const voids = cal.tuan.voids;
    const shensha = computeShensha(cal, main);
    const ctx = { palaceEl: main.palaceEl, cal, shensha, voids };

    const bs = BEAST_START[cal.pillars.day.stem];
    const beasts = [0, 1, 2, 3, 4, 5].map((i) => BEASTS[(bs + i) % 6]);

    const mainLines = main.najia.map((nj, i) =>
      lineInfo(nj, i, ctx, { yang: bits[i] === 1, moving: moving[i], allowQuai: true })
    );
    mainLines.forEach((l, i) => {
      l.beast = beasts[i];
      l.isThe = main.the === i + 1;
      l.isUng = main.ung === i + 1;
    });

    let changedLines = null;
    if (changed) {
      changedLines = changed.najia.map((nj, i) =>
        lineInfo(nj, i, ctx, { yang: cbits[i] === 1, moving: false, allowQuai: false })
      );
      changedLines.forEach((l, i) => {
        l.status = []; // trạng thái ám động chỉ xét cho quẻ chủ
        l.isThe = changed.the === i + 1;
        l.isUng = changed.ung === i + 1;
        l.fromMoving = moving[i];
      });
      mainLines.forEach((l, i) => {
        if (l.moving) {
          l.changeTo = changedLines[i];
          l.transform = transformTags(l, changedLines[i], ctx);
        }
      });
    }

    // Phục thần: lục thân vắng mặt, lấy từ quẻ thuần của cung
    const present = new Set(mainLines.map((l) => l.rel));
    const pureBits = TRIGRAMS[main.palace].bits.concat(TRIGRAMS[main.palace].bits);
    const pureNj = najiaOf(pureBits);
    const hidden = [];
    pureNj.forEach((nj, i) => {
      const rel = relativeOf(nj.el, main.palaceEl);
      if (!present.has(rel)) {
        const flyEl = mainLines[i].el;
        let relation = '';
        if (generates(flyEl, nj.el)) relation = 'Phi sinh Phục (được sinh)';
        else if (controls(flyEl, nj.el)) relation = 'Phi khắc Phục (bị khắc)';
        else if (generates(nj.el, flyEl)) relation = 'Phục sinh Phi (tiết khí)';
        else if (controls(nj.el, flyEl)) relation = 'Phục khắc Phi';
        else relation = 'Phi Phục tỷ hòa';
        const h = {
          pos: i + 1,
          stem: nj.stem,
          branch: nj.branch,
          el: nj.el,
          rel,
          relName: RELATIVES[rel],
          relShort: REL_SHORT[rel],
          canChi: STEMS[nj.stem] + ' ' + BRANCHES[nj.branch],
          label: branchLabel(nj.branch),
          isVoid: voids.includes(nj.branch),
          vs: seasonState(nj.el, BRANCH_EL[cal.pillars.month.branch]),
          relation
        };
        hidden.push(h);
        mainLines[i].hidden = h;
      }
    });

    const ff = fuFan(main, changed, mainLines, changedLines || [], moving);
    const db = cal.pillars.day.branch;
    const mbr = cal.pillars.month.branch;

    /* ---------- Nhập mộ (tại Nhật / tại hào động) ---------- */
    mainLines.forEach((l, i) => {
      const mo = moOf(l.el);
      if (l.tsDay === 'Mộ') l.status.push('Nhập Mộ tại Nhật');
      mainLines.forEach((o, j) => {
        if (j !== i && o.moving && o.branch === mo) l.status.push(`Nhập Mộ hào động H${j + 1}`);
      });
    });

    /* ---------- Tam hợp cục / bán hợp, tam hình ---------- */
    // Thành phần: hào (động/tĩnh), hào biến, Nhật, Nguyệt; "act" = hào động hoặc hào biến
    const parts = [];
    mainLines.forEach((l, i) => {
      parts.push({ b: l.branch, src: `H${i + 1}${l.moving ? ' động' : ''}`, act: l.moving, rank: l.moving ? 0 : 2 });
      if (l.moving && l.changeTo) parts.push({ b: l.changeTo.branch, src: `biến H${i + 1}`, act: true, rank: 1 });
    });
    parts.push({ b: db, src: 'Nhật', act: false, rank: 3 });
    parts.push({ b: mbr, src: 'Nguyệt', act: false, rank: 3 });
    const pick = (b) => parts.filter((p) => p.b === b).sort((x, y) => x.rank - y.rank);

    const combos = [];
    TAM_HOP.forEach((g) => {
      const have = g.branches.map(pick);
      const base = {
        el: g.el,
        cuc: ELEMENTS[g.el] + ' cục',
        relName: RELATIVES[relativeOf(g.el, main.palaceEl)]
      };
      const activeCount = have.filter((h) => h.some((p) => p.act)).length;
      // Cục thành khi đủ 3 chi và ít nhất 2 chi do hào động / hào biến đảm nhận
      if (have.every((h) => h.length) && activeCount >= 2) {
        combos.push(Object.assign({ full: true, name: 'Tam hợp ' + base.cuc, branches: g.branches, members: have.map((h) => h[0].src) }, base));
        return;
      }
      // Bán hợp: chi Đế vượng + một chi còn lại, có ít nhất một hào động / hào biến
      const mids = pick(g.mid);
      if (!mids.length) return;
      g.branches.filter((b) => b !== g.mid).forEach((b) => {
        const others = pick(b);
        if (!others.length) return;
        const a = mids.find((p) => p.act) || mids[0];
        const c = others.find((p) => p.act) || others[0];
        if (!a.act && !c.act) return;
        const order = g.branches.filter((x) => x === g.mid || x === b);
        combos.push(Object.assign({ full: false, name: 'Bán hợp ' + base.cuc, branches: order, members: [a.src, c.src] }, base));
      });
    });

    const hinhSets = [];
    TAM_HINH.forEach((s) => {
      const have = s.branches.map(pick);
      if (have.every((h) => h.length) && have.some((h) => h.some((p) => p.act))) {
        hinhSets.push({ name: s.name, branches: s.branches, members: have.map((h) => h[0].src) });
      }
    });

    /* ---------- Phục thần có xuất được không ---------- */
    hidden.forEach((h) => {
      const fly = mainLines[h.pos - 1];
      const dEl = BRANCH_EL[db];
      const mEl = BRANCH_EL[mbr];
      const good = [];
      const bad = [];
      const strongMonth = h.vs === 'Vượng' || h.vs === 'Tướng';
      const dayHelp = h.branch === db || generates(dEl, h.el) || dEl === h.el;
      const dayHurt = h.branch !== db && controls(dEl, h.el);
      (strongMonth ? good : bad).push(`Phục thần ${h.vs} theo Nguyệt`);
      if (h.branch === db) good.push('Phục thần lâm Nhật');
      else if (generates(dEl, h.el)) good.push('Nhật sinh phục thần');
      else if (dEl === h.el) good.push('Nhật phù phục thần');
      if (dayHurt) bad.push('Nhật khắc phục thần');
      if (controls(mEl, h.el) && h.branch !== mbr) bad.push('Nguyệt khắc phục thần');
      if (isClash(h.branch, mbr)) bad.push('Phục thần Nguyệt phá');
      if (isClash(h.branch, db)) (strongMonth || dayHelp ? good : bad).push(strongMonth || dayHelp ? 'Nhật xung phục thần (xung khởi)' : 'Nhật xung phục thần (xung tán)');
      if (h.isVoid) bad.push('Phục thần tuần không');
      if (stageOf(h.el, db) === 8) bad.push('Phục thần nhập mộ tại Nhật');
      if (stageOf(h.el, db) === 9) bad.push('Phục thần tuyệt tại Nhật');
      const flyStrong = fly.vs === 'Vượng' || fly.vs === 'Tướng';
      const flyOpen = fly.isVoid || fly.monthRel.includes('Nguyệt Phá') || fly.dayRel.includes('Nhật Xung');
      if (generates(fly.el, h.el)) good.push('Phi thần sinh phục');
      if (controls(fly.el, h.el)) (flyStrong && !flyOpen ? bad : good).push(flyStrong && !flyOpen ? 'Phi thần vượng khắc phục' : 'Phi thần khắc phục nhưng phi suy / bị phá');
      if (stageOf(h.el, fly.branch) === 8) bad.push('Phục thần mộ dưới phi thần');
      if (stageOf(h.el, fly.branch) === 9) bad.push('Phục thần tuyệt dưới phi thần');
      if (fly.isVoid) good.push('Phi thần tuần không');
      if (fly.monthRel.includes('Nguyệt Phá')) good.push('Phi thần Nguyệt phá');
      if (fly.dayRel.includes('Nhật Xung')) good.push('Nhật xung phi thần (khai phục)');
      if (fly.moving) good.push('Phi thần phát động');
      const hasQi = strongMonth || dayHelp || generates(fly.el, h.el);
      const blocked =
        (controls(fly.el, h.el) && flyStrong && !flyOpen) ||
        (dayHurt && !strongMonth) ||
        (isClash(h.branch, mbr) && !dayHelp) ||
        (h.isVoid && !strongMonth && !dayHelp);
      const ok = hasQi && !blocked;
      h.verdict = { ok, text: ok ? 'Phục thần hữu dụng — có thể xuất' : 'Phục thần vô dụng — khó xuất', good, bad };
    });

    /* ---------- Tùy Quỷ nhập mộ (hào Thế) ---------- */
    let tuyQuy = null;
    {
      const T = mainLines[main.the - 1];
      const lamQuy = T.rel === 4;
      const hoaQuy = T.moving && T.changeTo && T.changeTo.rel === 4;
      if (lamQuy || hoaQuy) {
        const mo = moOf(T.el);
        const where = [];
        if (T.tsDay === 'Mộ') where.push('Nhật');
        mainLines.forEach((o, j) => {
          if (o.moving && j !== main.the - 1 && o.branch === mo) where.push('hào động H' + (j + 1));
        });
        if (T.moving && T.changeTo && T.changeTo.branch === mo) where.push('chính hào biến (hóa mộ)');
        if (where.length) tuyQuy = `Tùy Quỷ Nhập Mộ: Thế ${lamQuy ? 'lâm' : 'hóa'} Quan Quỷ, nhập mộ tại ${where.join(', ')}`;
      }
    }

    const movingPos = moving.map((m, i) => (m ? i + 1 : 0)).filter(Boolean);

    const notes = [];
    if (main.lucXung) notes.push('Quẻ chủ là quẻ Lục Xung');
    if (main.lucHop) notes.push('Quẻ chủ là quẻ Lục Hợp');
    if (changed) {
      if (main.lucXung && changed.lucHop) notes.push('Lục Xung biến Lục Hợp (trước tan sau hợp)');
      else if (main.lucHop && changed.lucXung) notes.push('Lục Hợp biến Lục Xung (trước hợp sau tan)');
      else if (changed.lucXung) notes.push('Quẻ biến là quẻ Lục Xung');
      else if (changed.lucHop) notes.push('Quẻ biến là quẻ Lục Hợp');
    }
    if (main.order === 6) notes.push('Quẻ Du Hồn');
    if (main.order === 7) notes.push('Quẻ Quy Hồn');
    if (ff.phucNgam) notes.push(ff.phucNgam);
    if (ff.phanNgam) notes.push(ff.phanNgam);
    if (ff.haoPhanNgam.length) notes.push('Hào Phản Ngâm: hào ' + ff.haoPhanNgam.join(', '));
    if (!hasMoving) notes.push('Quẻ tĩnh (không có hào động)');
    if (movingPos.length === 1) notes.push(`Độc phát: hào ${movingPos[0]}`);
    if (movingPos.length === 5) notes.push(`Độc tĩnh: hào ${[1, 2, 3, 4, 5, 6].find((p) => !movingPos.includes(p))}`);
    if (movingPos.length >= 4) notes.push('Loạn động (nhiều hào động)');
    if (movingPos.length === 6) notes.push('Sáu hào đều động');
    combos.filter((c) => c.full).forEach((c) => notes.push(`${c.name} — ${c.relName} cục (${c.members.join(', ')})`));
    hinhSets.forEach((s) => notes.push(`Tam hình ${s.name}`));
    if (tuyQuy) notes.push(tuyQuy);

    return {
      movingPos,
      combos,
      hinhSets,
      tuyQuy,
      values: values.slice(),
      bits,
      moving,
      hasMoving,
      main,
      changed,
      mutual,
      beasts,
      lines: mainLines,
      changedLines,
      hidden,
      shensha,
      voids,
      notes,
      phucNgam: ff.phucNgam,
      phanNgam: ff.phanNgam,
      haoPhanNgam: ff.haoPhanNgam
    };
  }

  /* ---------- Dụng thần ---------- */
  // Trả về chỉ số lục thân của Nguyên / Kỵ / Cừu / Tiết thần
  function godSet(relIdx) {
    return {
      dung: relIdx,
      nguyen: mod(relIdx - 1, 5),
      ky: mod(relIdx - 2, 5),
      cuu: mod(relIdx - 3, 5),
      tiet: mod(relIdx + 1, 5)
    };
  }

  /* ---------- Ứng kỳ (theo Cẩm nang ứng kỳ Lục Hào / Tăng San Bốc Dịch) ---------- */
  const xungOf = (b) => (b + 6) % 12;
  const hopOf = (b) => mod(1 - b, 12);
  const vuongOf = (el) => (STAGE_START[el] + 4) % 12; // chi Đế vượng của hành
  // Chi đại diện cho "ngày hành X": Tý / Ngọ / Mão / Dậu; riêng Thổ lấy Thìn, Tuất, Sửu, Mùi
  // (bỏ chi là Mộ của hành đang xét, tối đa 2 chi)
  const elDays = (el, forEl) =>
    el === 2 ? [4, 10, 1, 7].filter((b) => forEl == null || b !== moOf(forEl)).slice(0, 2) : [[3, 6, 0, 9, 0][el]];
  const SEASON_OF_EL = ['mùa Xuân (Dần, Mão)', 'mùa Hạ (Tị, Ngọ)', 'tháng Tứ quý (Thìn, Tuất, Sửu, Mùi)', 'mùa Thu (Thân, Dậu)', 'mùa Đông (Hợi, Tý)'];

  // Vượng suy thực tế của một hào: Nguyệt, Nhật, động hào sinh khắc, động biến
  function lineStrength(l, res) {
    let s = { Vượng: 2, Tướng: 1, Hưu: -1, Tù: -2, Tử: -2 }[l.vs] || 0;
    const why = [`${l.vs} theo Nguyệt`];
    if (l.monthRel.includes('Nguyệt Kiến')) { s += 1; why.push('lâm Nguyệt kiến'); }
    if (l.monthRel.includes('Nguyệt Phá')) { s -= 3; why.push('Nguyệt phá'); }
    if (l.dayRel.includes('Lâm Nhật')) { s += 2; why.push('lâm Nhật'); }
    else if (l.dayRel.includes('Nhật Sinh')) { s += 2; why.push('Nhật sinh'); }
    else if (l.dayRel.includes('Nhật Phù')) { s += 1; why.push('Nhật phù'); }
    if (l.dayRel.includes('Nhật Khắc')) { s -= 2; why.push('Nhật khắc'); }
    res.lines.forEach((o) => {
      if (!o.moving || o === l) return;
      if (generates(o.el, l.el)) { s += 1; why.push(`H${o.pos} động sinh`); }
      else if (controls(o.el, l.el)) { s -= 1; why.push(`H${o.pos} động khắc`); }
    });
    if (l.moving && l.transform) {
      const has = (t) => l.transform.some((x) => x.t === t);
      if (has('Hồi Đầu Sinh')) { s += 2; why.push('hồi đầu sinh'); }
      if (has('Hồi Đầu Khắc')) { s -= 2; why.push('hồi đầu khắc'); }
      if (has('Hóa Tiến Thần')) { s += 1; why.push('hóa tiến'); }
      if (has('Hóa Thoái Thần')) { s -= 1; why.push('hóa thoái'); }
    }
    if (!l.moving && l.dayRel.includes('Nhật Xung')) {
      if (s >= 1) why.push('Nhật xung → ám động (xung khởi)');
      else { s -= 1; why.push('Nhật xung → xung tán'); }
    }
    const level = s >= 5 ? 'Quá vượng' : s >= 2 ? 'Vượng' : s >= 0 ? 'Bình hòa' : 'Suy';
    return { score: s, level, why };
  }

  /**
   * Gợi ý ứng kỳ theo Dụng thần.
   * relIdx: lục thân Dụng thần; anchorPos: vị trí hào nếu Dụng thần là hào Thế / Ứng.
   * Trả về hồ sơ Dụng thần (vượng suy, trạng thái cản trở, điều kiện cần), danh sách chi ứng viên
   * đã xếp hạng (role: uu-tien / du-phong / tham-khao / canh-bao), mốc theo ngày và lưu ý.
   * Nhóm căn cứ (group): 1 điều kiện trực tiếp · 2 tháo gỡ cản trở · 3 Nguyên/Kỵ thần · 4 động/biến hào · 5 dấu hiệu phụ.
   */
  function ungKy(res, cal, relIdx, anchorPos) {
    const GROUP_W = { 1: 10, 2: 10, 3: 6, 4: 3, 5: 1 };
    const cands = new Map();
    const add = (b, t, group, phase, tone) => {
      const c = cands.get(b) || { branch: b, reasons: [], score: 0, warnOnly: true };
      if (c.reasons.some((r) => r.t === t)) return;
      c.reasons.push({ t, group, phase, tone: tone || '' });
      if (phase !== 'cảnh báo') {
        c.score += GROUP_W[group] || 1;
        c.warnOnly = false;
      }
      cands.set(b, c);
    };
    const states = [];
    const conds = [];
    const caveats = [];
    const extras = [];
    const db = cal.pillars.day.branch;
    const mbr = cal.pillars.month.branch;
    const N = (b) => BRANCHES[b];
    const E = (el) => ELEMENTS[el];

    /* 1. Xác định Dụng thần (lưỡng hiện: chọn một hào chính) */
    let L = null;
    let H = null;
    let pickNote = '';
    if (anchorPos) L = res.lines[anchorPos - 1];
    else {
      const ls = res.lines.filter((l) => l.rel === relIdx);
      if (ls.length > 1) {
        const sc = (l) => (l.moving ? 8 : 0) + (l.isThe || l.isUng ? 4 : 0) + (l.isVoid ? 0 : 2) + lineStrength(l, res).score * 0.1;
        ls.sort((a, b) => sc(b) - sc(a));
        const w = ls[0];
        const why = w.moving ? 'đang động' : w.isThe ? 'trì Thế' : w.isUng ? 'lâm Ứng' : !w.isVoid ? 'không gặp Tuần Không' : 'vượng hơn';
        pickNote = `Dụng thần lưỡng hiện (hào ${ls.map((l) => l.pos).join(' và ')}): chọn hào ${w.pos} vì ${why}; hào còn lại chỉ để tham khảo.`;
      }
      L = ls[0] || null;
      if (!L) H = res.hidden.find((h) => h.rel === relIdx) || null;
    }
    if (!L && !H) return { subject: null, hidden: false, items: [], states, conds, caveats, extras };
    const godRel = L ? L.rel : H.rel;
    const ngRel = mod(godRel - 1, 5);
    const kyRel = mod(godRel - 2, 5);

    let strength;
    if (H) {
      /* ---- Dụng thần không hiện: Phục thần – Phi thần ---- */
      const fly = res.lines[H.pos - 1];
      const v = H.verdict || { ok: false, good: [], bad: [] };
      strength = { score: v.ok ? 1 : -1, level: v.ok ? 'Có lực' : 'Vô lực', why: v.good.concat(v.bad) };
      states.push({ t: `Phục dưới hào ${H.pos} (phi thần ${fly.relName} ${fly.label})`, tone: '' });
      states.push({ t: v.ok ? 'Phục thần hữu dụng' : 'Phục thần vô dụng — khó xuất', tone: v.ok ? 'good' : 'bad' });
      add(H.branch, `Phục thần gặp Trị: ngày / tháng ${N(H.branch)}`, 1, 'kết quả');
      add(xungOf(fly.branch), `Xung phi lộ phục: ngày / tháng ${N(xungOf(fly.branch))} xung phi thần ${N(fly.branch)}`, 2, 'tháo gỡ');
      add(hopOf(H.branch), `Phục thần gặp Hợp: ngày / tháng ${N(hopOf(H.branch))} (hợp ${N(H.branch)})`, 3, 'trợ lực');
      conds.push('Cần Phục thần gặp Trị, hoặc Phi thần bị Xung / khắc / suy để Phục thần lộ ra');
      if (H.isVoid) {
        add(xungOf(H.branch), `Phục thần Tuần Không — Xung Không: ngày / tháng ${N(xungOf(H.branch))}`, 2, 'tháo gỡ');
        extras.push({ type: 'xuatKhong', label: 'Phục thần xuất Không' });
      }
      if (stageOf(H.el, db) === 8) add(xungOf(moOf(H.el)), `Phục thần nhập Nhật mộ — Xung Mộ: ngày / tháng ${N(xungOf(moOf(H.el)))} xung ${N(moOf(H.el))}`, 2, 'tháo gỡ');
      if (!v.ok) {
        elDays(mod(H.el - 1, 5), H.el).forEach((b) => add(b, `Phục thần suy — gặp Sinh: ngày / tháng ${N(b)} (${E(mod(H.el - 1, 5))} sinh ${E(H.el)})`, 3, 'trợ lực'));
        caveats.push('Phục thần vô lực: dù Phi thần bị Xung cũng chưa chắc dùng được (cẩm nang 7.1).');
      }
      if (fly.isVoid || fly.monthRel.includes('Nguyệt Phá') || fly.dayRel.includes('Nhật Xung')) {
        states.push({ t: 'Phi thần đang Không / Phá / bị Nhật xung — phục thần dễ lộ', tone: 'good' });
      }
    } else {
      /* ---- Dụng thần hiện trên quẻ ---- */
      const B = L.branch;
      const xB = xungOf(B);
      const hB = hopOf(B);
      const mo = moOf(L.el);
      strength = lineStrength(L, res);
      const weak = strength.level === 'Suy';

      // Tuần Không: Động Không / Giả Không / Chân Không
      if (L.isVoid) {
        const kind = L.moving ? 'Động Không' : strength.score >= 1 ? 'Giả Không' : 'Chân Không';
        const note = { 'Động Không': 'động bất vi không', 'Giả Không': 'vượng / được sinh trợ', 'Chân Không': 'suy, thiếu trợ lực' }[kind];
        states.push({ t: `Tuần Không — ${kind} (${note})`, tone: kind === 'Chân Không' ? 'bad' : 'warn' });
        add(B, `Điền Không: gặp ngày / tháng ${N(B)} (Trị)`, 2, 'tháo gỡ');
        add(xB, `Xung Không: gặp ngày / tháng ${N(xB)} (xung ${N(B)})`, 2, 'tháo gỡ');
        extras.push({ type: 'xuatKhong', label: 'Xuất Không' });
        conds.push('Cần Điền Không, Xung Không hoặc Xuất Không');
        if (kind === 'Chân Không') caveats.push('Dụng thần Chân Không: dù gặp ngày Điền / Xung hay xuất tuần cũng khó thành nếu không được sinh trợ.');
      }
      // Nguyệt Phá
      if (L.monthRel.includes('Nguyệt Phá')) {
        const cuu = L.dayRel.some((r) => /Sinh|Phù|Lâm/.test(r)) || res.lines.some((o) => o.moving && o !== L && generates(o.el, L.el));
        states.push({ t: `Nguyệt Phá — ${cuu ? 'có cứu (được Nhật / động hào sinh phù)' : 'không cứu'}`, tone: cuu ? 'warn' : 'bad' });
        add(B, `Nguyệt phá — Điền thực: tháng / ngày ${N(B)}`, 2, 'tháo gỡ');
        add(hB, `Nguyệt phá — gặp Hợp: ngày / tháng ${N(hB)} (hợp ${N(B)})`, 2, 'tháo gỡ');
        extras.push({ type: 'quaThang', label: 'Qua tháng phá' });
        conds.push('Cần Điền thực, gặp Hợp hoặc qua tháng phá');
      }
      // Nhập Mộ: Nhật mộ / Động mộ / Hóa mộ
      const moTypes = [];
      if (db === mo) moTypes.push('Nhật mộ');
      res.lines.forEach((o) => {
        if (o.moving && o !== L && o.branch === mo) moTypes.push(`Động mộ (H${o.pos})`);
      });
      if (L.moving && L.changeTo && L.changeTo.branch === mo) moTypes.push('Hóa mộ');
      if (moTypes.length) {
        states.push({ t: `Nhập Mộ ${BRANCHES[mo]} — ${moTypes.join(', ')}`, tone: 'bad' });
        add(xungOf(mo), `Xung Mộ: ngày / tháng ${N(xungOf(mo))} xung ${N(mo)} mở kho`, 2, 'tháo gỡ');
        add(B, `Xuất Mộ: gặp ngày / tháng ${N(B)} (Trị)`, 4, 'kết quả');
        conds.push(`Cần Xung khai Mộ (ngày / tháng ${BRANCHES[xungOf(mo)]})`);
      }
      // Hợp: động mà bị hợp = hợp trói; tĩnh được hợp = có thể là hợp trợ / hợp khởi
      const binders = [];
      if (L.dayRel.includes('Nhật Hợp')) binders.push({ b: db, label: 'Nhật' });
      if (L.monthRel.includes('Nguyệt Hợp')) binders.push({ b: mbr, label: 'Nguyệt' });
      res.lines.forEach((o) => {
        if (o.moving && o !== L && isCombine(o.branch, B)) binders.push({ b: o.branch, label: `H${o.pos} động` });
      });
      if (L.moving && L.changeTo && isCombine(L.changeTo.branch, B)) binders.push({ b: L.changeTo.branch, label: 'biến hào (hóa hợp)' });
      if (binders.length) {
        const who = binders.map((x) => `${x.label} ${BRANCHES[x.b]}`).join(', ');
        if (L.moving) {
          states.push({ t: `Hợp trói — động mà bị hợp (${who})`, tone: 'warn' });
          add(xB, `Xung mở Hợp: ngày / tháng ${N(xB)} xung Dụng thần ${N(B)}`, 2, 'tháo gỡ');
          binders.forEach((x) => add(xungOf(x.b), `Xung mở Hợp: ngày / tháng ${N(xungOf(x.b))} xung ${x.label} ${N(x.b)}`, 2, 'tháo gỡ'));
          conds.push('Cần Xung mở Hợp');
        } else {
          states.push({ t: `Được hợp (${who}) — có thể là hợp trợ / hợp khởi`, tone: '' });
          add(xB, `Nếu là hợp giữ — Xung mở: ngày / tháng ${N(xB)}`, 5, 'tháo gỡ');
          caveats.push('Dụng thần tĩnh được hợp: hợp có thể là hợp trợ, không mặc định phải chờ ngày Xung (cẩm nang 3.6).');
        }
      }
      // Tuyệt
      const tuyet = stageOf(L.el, db) === 9 ? 'Tuyệt tại Nhật' : L.moving && L.changeTo && stageOf(L.el, L.changeTo.branch) === 9 ? 'Hóa Tuyệt' : '';
      if (tuyet) {
        states.push({ t: tuyet, tone: 'bad' });
        add(STAGE_START[L.el], `Tuyệt gặp Sinh: ngày / tháng ${N(STAGE_START[L.el])} (Trường sinh của ${E(L.el)})`, 2, 'trợ lực');
        conds.push('Cần gặp Trường sinh / được sinh trợ');
      }
      // Nhật xung hào tĩnh: Xung khởi (ám động) / Xung tán
      if (!L.moving && L.dayRel.includes('Nhật Xung')) {
        if (strength.score >= 1) {
          states.push({ t: 'Ám động — Nhật xung khởi', tone: 'good' });
          add(hB, `Ám động gặp Hợp: ngày / tháng ${N(hB)}`, 4, 'kết quả');
        } else {
          states.push({ t: 'Xung tán — suy mà bị Nhật xung', tone: 'bad' });
          caveats.push('Dụng thần suy bị Nhật xung (xung tán): ngày Trị / Xung dễ chỉ là lúc sự việc tan rã.');
        }
      }

      // Điều kiện trực tiếp theo động / tĩnh (cẩm nang 3.1, 3.2, 4.1, 4.2)
      const tiedUp = L.moving && binders.length;
      if (L.moving) {
        add(B, `Động mà gặp Trị: ngày / tháng ${N(B)}`, 1, 'kết quả');
        if (!tiedUp) add(hB, `Động mà gặp Hợp: ngày / tháng ${N(hB)} (hợp ${N(B)})`, 1, 'kết quả');
        const c = L.changeTo;
        if (c) {
          const has = (t) => L.transform.some((x) => x.t === t);
          add(c.branch, `Trị biến hào: ngày / tháng ${N(c.branch)}`, 4, 'kết quả');
          if (has('Hóa Tiến Thần')) add(hB, `Hóa Tiến gặp Hợp: ngày / tháng ${N(hB)}`, 4, 'kết quả');
          if (has('Hóa Thoái Thần')) {
            add(xB, `Hóa Thoái — Xung hào động: ngày / tháng ${N(xB)}`, 4, 'cảnh báo', 'bad');
            caveats.push('Dụng thần hóa Thoái: xu hướng suy giảm, không nhất thiết mất tác dụng ngay (cẩm nang 3.13).');
          }
          if (has('Hồi Đầu Sinh')) add(c.branch, `Hồi đầu sinh — Trị biến hào: ngày / tháng ${N(c.branch)} (được trợ)`, 3, 'trợ lực');
          if (has('Hồi Đầu Khắc')) add(c.branch, `Hồi đầu khắc — Trị biến hào: ngày / tháng ${N(c.branch)} (bất lợi)`, 3, 'cảnh báo', 'bad');
          if (c.isVoid) add(c.branch, `Hóa Không — Điền biến hào: ngày / tháng ${N(c.branch)}`, 4, 'tháo gỡ');
          if (c.monthRel.includes('Nguyệt Phá')) add(c.branch, `Hóa Phá — Điền thực biến hào: tháng / ngày ${N(c.branch)}`, 4, 'tháo gỡ');
        }
      } else {
        add(B, `Tĩnh mà gặp Trị: ngày / tháng ${N(B)}`, 1, 'kết quả');
        if (strength.score >= 0) add(xB, `Tĩnh mà gặp Xung: ngày / tháng ${N(xB)} xung ${N(B)} (xung khởi)`, 1, 'kích hoạt');
        else add(xB, `Tĩnh mà suy gặp Xung: ngày / tháng ${N(xB)} dễ thành Xung tán`, 4, 'cảnh báo', 'bad');
      }

      // Vượng suy (cẩm nang 3.3, 3.4)
      if (strength.level === 'Quá vượng') {
        add(mo, `Quá vượng gặp Mộ: ngày / tháng ${N(mo)} (Mộ của ${E(L.el)})`, 3, 'kết quả');
        const khacEl = mod(L.el + 3, 5);
        elDays(khacEl).forEach((b) => add(b, `Quá vượng gặp Khắc: ngày / tháng ${N(b)} (${E(khacEl)} khắc ${E(L.el)})`, 4, 'kết quả'));
        caveats.push('Phép “quá vượng gặp Mộ / Xung” chỉ dùng khi quá vượng thực sự là điểm nghẽn.');
      }
      if (weak) {
        const sinhEl = mod(L.el - 1, 5);
        elDays(sinhEl, L.el).forEach((b) => add(b, `Suy gặp Sinh: ngày / tháng ${N(b)} (${E(sinhEl)} sinh ${E(L.el)})`, 2, 'trợ lực'));
        if (L.el !== 2) {
          if (!tuyet) add(STAGE_START[L.el], `Suy gặp Sinh: ngày / tháng ${N(STAGE_START[L.el])} (Trường sinh của ${E(L.el)})`, 3, 'trợ lực');
          add(vuongOf(L.el), `Suy gặp Vượng: ngày / tháng ${N(vuongOf(L.el))} (${E(L.el)} vượng)`, 2, 'trợ lực');
        }
        conds.push(`Cần được sinh vượng — hành ${ELEMENTS[L.el]} đắc khí vào ${SEASON_OF_EL[L.el]}`);
      }

      // Kỵ thần động khắc Dụng thần (cẩm nang 3.9, 3.10, 5.2)
      res.lines
        .filter((o) => o.moving && o.rel === kyRel && o !== L)
        .forEach((k) => {
          const ks = lineStrength(k, res);
          states.push({ t: `Bị Kỵ thần H${k.pos} ${k.label} động khắc (${ks.level})`, tone: 'bad' });
          const cheEl = mod(k.el + 3, 5);
          add(xungOf(k.branch), `Chế Kỵ thần: ngày / tháng ${N(xungOf(k.branch))} xung Kỵ H${k.pos} ${N(k.branch)}`, 3, 'tháo gỡ');
          elDays(cheEl).forEach((b) => add(b, `Chế Kỵ thần: ngày / tháng ${N(b)} (${E(cheEl)} khắc Kỵ ${E(k.el)})`, 3, 'tháo gỡ'));
          add(k.branch, `Kỵ thần H${k.pos} gặp Trị: ngày / tháng ${N(k.branch)} — đề phòng trở ngại`, 3, 'cảnh báo', 'bad');
          conds.push('Cần chế ngự Kỵ thần');
          if (weak) caveats.push(`Dụng thần suy lại bị Kỵ thần khắc: đặc biệt đề phòng lúc Kỵ thần được sinh / gặp Trị (cẩm nang 3.10).`);
        });

      // Nguyên thần (cẩm nang 3.16, 3.17, 5.1)
      const needHelp = strength.score < 2 || L.isVoid;
      res.lines
        .filter((o) => o.rel === ngRel && o !== L)
        .forEach((n) => {
          const g = needHelp ? 3 : 4;
          if (n.moving) {
            add(n.branch, `Nguyên thần H${n.pos} động gặp Trị: ngày / tháng ${N(n.branch)}`, (L.isThe && L.isVoid) || needHelp ? 3 : 4, 'trợ lực');
            add(hopOf(n.branch), `Nguyên thần H${n.pos} động gặp Hợp: ngày / tháng ${N(hopOf(n.branch))}`, 4, 'trợ lực');
          } else if (needHelp) {
            add(xungOf(n.branch), `Nguyên thần H${n.pos} tĩnh gặp Xung: ngày / tháng ${N(xungOf(n.branch))} (kích hoạt)`, g, 'trợ lực');
            add(n.branch, `Nguyên thần H${n.pos} tĩnh gặp Trị: ngày / tháng ${N(n.branch)}`, 4, 'trợ lực');
          }
          if (n.isVoid && needHelp) add(n.branch, `Nguyên thần H${n.pos} Không — Điền Không: ngày / tháng ${N(n.branch)}`, 4, 'trợ lực');
        });
    }

    /* Dấu hiệu phụ (nhóm 5): Độc phát / Độc tĩnh, Tam hợp khuyết một chi, Tam hình */
    const mp = res.movingPos || [];
    const subjPos = (L || H).pos;
    if (mp.length === 1 && mp[0] !== subjPos) {
      const o = res.lines[mp[0] - 1];
      add(o.branch, `Độc phát H${o.pos}: ngày / tháng ${N(o.branch)} (manh mối phụ)`, 5, 'phụ');
      if (o.changeTo) add(o.changeTo.branch, `Biến hào của độc phát H${o.pos}: ngày / tháng ${N(o.changeTo.branch)}`, 5, 'phụ');
    }
    if (mp.length === 5) {
      const sp = [1, 2, 3, 4, 5, 6].find((p) => !mp.includes(p));
      if (sp !== subjPos) add(res.lines[sp - 1].branch, `Độc tĩnh H${sp}: ngày / tháng ${N(res.lines[sp - 1].branch)} (manh mối phụ)`, 5, 'phụ');
    }
    if (L) {
      const actives = [];
      res.lines.forEach((o) => {
        if (o.moving) {
          actives.push(o.branch);
          if (o.changeTo) actives.push(o.changeTo.branch);
        }
      });
      TAM_HOP.forEach((g) => {
        if (!g.branches.includes(L.branch)) return;
        if ((res.combos || []).some((c) => c.full && c.el === g.el)) return;
        const others = g.branches.filter((b) => b !== L.branch);
        const present = others.filter((b) => actives.includes(b));
        if (present.length === 1 && (L.moving || actives.includes(L.branch))) {
          const missing = others.find((b) => !present.includes(b));
          add(missing, `Tam hợp ${E(g.el)} cục khuyết ${N(missing)}: chờ ngày / tháng ${N(missing)}`, 5, 'phụ');
        }
      });
      TAM_HINH.forEach((s) => {
        if (!s.branches.includes(L.branch)) return;
        const present = s.branches.filter((b) => b !== L.branch && res.lines.some((o) => o.moving && (o.branch === b || (o.changeTo && o.changeTo.branch === b))));
        if (present.length === 1) {
          const missing = s.branches.find((b) => b !== L.branch && !present.includes(b));
          add(missing, `Hoàn thành bộ Tam hình ${s.branches.map((b) => N(b)).join(' ')}: ngày / tháng ${N(missing)}`, 5, 'cảnh báo', 'bad');
        }
      });
    }

    /* Xếp hạng (cẩm nang 9 – bước 8, 10) */
    const all = Array.from(cands.values());
    const main = all.filter((c) => !c.warnOnly).sort((a, b) => b.score - a.score || a.reasons[0].group - b.reasons[0].group);
    const warns = all.filter((c) => c.warnOnly);
    const top = main.length ? main[0].score : 0;
    main.forEach((c, i) => {
      c.role = i === 0 || c.score >= top * 0.85 ? 'uu-tien' : i < 4 && c.score >= 6 ? 'du-phong' : 'tham-khao';
    });
    warns.forEach((c) => (c.role = 'canh-bao'));
    const items = main.concat(warns);
    if (!caveats.length) caveats.push('Ngày Trị / Xung / Hợp chỉ là dấu hiệu thời điểm; cát hay hung còn tùy quẻ và vượng suy Dụng thần.');
    return { subject: L || H, hidden: !!H, pickNote, strength, states, conds: Array.from(new Set(conds)), caveats, extras, items };
  }

  /* ---------- Phương pháp lập quẻ ---------- */
  function randomInt(n) {
    const c = G.crypto;
    if (c && c.getRandomValues) {
      const buf = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / n) * n;
      let x;
      do {
        c.getRandomValues(buf);
        x = buf[0];
      } while (x >= limit);
      return x % n;
    }
    return Math.floor(Math.random() * n);
  }

  // Gieo 3 đồng xu: mặt dương = 3, mặt âm = 2. Tổng 6/7/8/9
  function tossCoins() {
    const coins = [0, 1, 2].map(() => (randomInt(2) ? 3 : 2));
    return { coins, value: coins[0] + coins[1] + coins[2] };
  }

  function randomHexagram() {
    return [0, 1, 2, 3, 4, 5].map(() => tossCoins().value);
  }

  // Dựng quẻ từ số quái thượng/hạ (1..8, Tiên thiên) và hào động (1..6)
  function fromTrigramNumbers(upperNum, lowerNum, movingPos) {
    const up = TRIGRAMS[upperNum - 1].bits;
    const lo = TRIGRAMS[lowerNum - 1].bits;
    const bits = lo.concat(up);
    return bits.map((b, i) => {
      const mv = movingPos === i + 1;
      if (b === 1) return mv ? 9 : 7;
      return mv ? 6 : 8;
    });
  }

  const r8 = (n) => mod(n - 1, 8) + 1;
  const r6 = (n) => mod(n - 1, 6) + 1;

  // Mai Hoa theo thời gian: (chi năm + tháng âm + ngày âm) và + chi giờ
  function plumTime(cal) {
    const Y = cal.lunarYearPillar.branch + 1;
    const M = cal.lunar.month;
    const D = cal.lunar.day;
    const H = cal.pillars.hour.branch + 1;
    const upper = r8(Y + M + D);
    const lower = r8(Y + M + D + H);
    const mv = r6(Y + M + D + H);
    return {
      values: fromTrigramNumbers(upper, lower, mv),
      formula: { Y, M, D, H, upper, lower, moving: mv }
    };
  }

  // Mai Hoa theo số: thượng = a, hạ = b, động = a + b + chi giờ
  function plumNumbers(a, b, cal) {
    const H = cal.pillars.hour.branch + 1;
    const upper = r8(a);
    const lower = r8(b);
    const mv = r6(a + b + H);
    return { values: fromTrigramNumbers(upper, lower, mv), formula: { a, b, H, upper, lower, moving: mv } };
  }

  /**
   * Lập quẻ theo số serial: bỏ ký tự không phải số, chia đôi dãy số
   * (dãy lẻ thì nửa đầu ít hơn một số). Tổng nửa đầu → Thượng quái,
   * tổng nửa sau → Hạ quái, tổng tất cả chia 6 → hào động.
   */
  function plumSerial(input) {
    const digits = String(input || '').replace(/\D/g, '');
    if (digits.length < 2) return null;
    const cut = Math.floor(digits.length / 2);
    const upperDigits = digits.slice(0, cut);
    const lowerDigits = digits.slice(cut);
    const sum = (s) => s.split('').reduce((a, c) => a + Number(c), 0);
    const su = sum(upperDigits);
    const sl = sum(lowerDigits);
    const upper = r8(su);
    const lower = r8(sl);
    const mv = r6(su + sl);
    return {
      values: fromTrigramNumbers(upper, lower, mv),
      formula: { digits, upperDigits, lowerDigits, su, sl, total: su + sl, upper, lower, moving: mv }
    };
  }

  // Danh sách 64 quẻ theo bát cung (để chọn nhanh)
  function allHexagrams() {
    const out = [];
    TRIGRAMS.forEach((t, p) => {
      const b = t.bits.concat(t.bits);
      const steps = [[], [0], [1], [2], [3], [4], [3], [0, 1, 2]];
      steps.forEach((s) => {
        s.forEach((i) => (b[i] ^= 1));
        const h = hexInfo(b.slice());
        out.push({ palace: p, palaceName: t.name, key: h.key, name: h.name, kw: h.kw, orderName: h.orderName });
      });
    });
    return out;
  }

  LH.iching = {
    TRIGRAMS, RELATIVES, REL_SHORT, BEASTS, STAGES, LINE_NAMES, ORDER_NAMES,
    analyze, hexInfo, godSet, tossCoins, randomHexagram, randomInt,
    fromTrigramNumbers, plumTime, plumNumbers, plumSerial, allHexagrams, branchLabel,
    isClash, isCombine, isHinh, isHai, generates, controls, ungKy, moOf, lineStrength
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
