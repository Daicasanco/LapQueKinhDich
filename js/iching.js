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

    const monthRel = [];
    if (nj.branch === mb) monthRel.push('Nguyệt Kiến');
    else if (isClash(nj.branch, mb)) monthRel.push('Nguyệt Phá');
    else if (isCombine(nj.branch, mb)) monthRel.push('Nguyệt Hợp');
    if (nj.branch !== mb) {
      if (generates(monthEl, nj.el)) monthRel.push('Nguyệt Sinh');
      else if (controls(monthEl, nj.el)) monthRel.push('Nguyệt Khắc');
      else if (monthEl === nj.el) monthRel.push('Nguyệt Phù');
    }

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
    if (moving.filter(Boolean).length === 6) notes.push('Sáu hào đều động');

    return {
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
    isClash, isCombine, generates, controls
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
