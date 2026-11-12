// Kiểm thử engine Tử Vi: node tests/tuvi.test.js   (thêm -v để in chi tiết lá số mẫu)
'use strict';
const assert = require('node:assert/strict');
require('../js/lunar.js');
const TuVi = require('../js/tuvi.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    console.error('  ✗ ' + name + '\n    ' + e.message);
    process.exitCode = 1;
  }
}
const plain = (s) => s.replace(/<[^>]+>/g, '').trim();
/** Chi (0..11) của cung chứa sao `name` */
const where = (chart, name) => chart.palaces
  .filter((p) => [...p.phu_tinh_trai, ...p.phu_tinh_phai].some((s) => plain(s) === name))
  .map((p) => p.branch_index);

const MAU = { name: 'Nguyễn Quân Anh', gender: 1, solarDay: 11, solarMonth: 10, solarYear: 2005, hour: 7, minute: 1, viewYear: 2026 };
const chart = TuVi.lapLaSoTuVi(MAU);

// Lá số cùng người, cùng giờ sinh lập trên lichngay.net/tu-vi:
// [chi, cung, đại hạn, tháng hạn, tiểu hạn, tràng sinh, chính tinh, toàn bộ phụ tinh]
const LICHNGAY = [
  ['Tỵ', 'HUYNH ĐỆ', '13', 'Tháng 6', 'Năm Mùi', 'Bệnh', 'THIÊN LƯƠNG(H)', 'Bạch hổ, Hóa quyền, L.Lộc Tồn, Phá toái, Phục binh, Thiên hình, Đẩu quân'],
  ['Ngọ', 'MỆNH', '3', 'Tháng 7', 'Năm Thân', 'Suy', 'THẤT SÁT(M)', 'Bát tọa, Hồng loan, L.Kình Dương, L.Thái Tuế, Phong cáo, Phúc đức, TRIỆT, TUẦN, Thiên trù, Thiên đức, Văn tinh, Văn xương, Đào hoa, Đại hao'],
  ['Mùi', 'PHỤ MẪU', '113', 'Tháng 8', 'Năm Dậu', 'Đế vượng', '', 'Bệnh phù, Quả tú, TRIỆT, TUẦN, Điếu khách, Địa không'],
  ['Thân', 'PHÚC ĐỨC', '103', 'Tháng 9', 'Năm Tuất', 'Lâm quan', 'LIÊM TRINH(V)', 'Hỷ thần, L.Tang Môn, L.Thiên Mã, Tam thai, Thiên phúc, Thiên việt, Trực phù, Văn khúc, Đường phù'],
  ['Thìn', 'PHU THÊ', '23', 'Tháng 5', 'Năm Ngọ', 'Tử', 'THIÊN TƯỚNG(V), TỬ VI(V)', 'Hóa khoa, Kình dương, L.Đà La, Long đức, Quan phủ, Thiên giải, Thiên la, Thiên quan'],
  ['Dậu', 'ĐIỀN TRẠCH', '93', 'Tháng 10', 'Năm Hợi', 'Quan đới', '', 'Phi liêm, Thiên khốc, Thiên riêu, Thiên y, Thái tuế'],
  ['Mão', 'TỬ TỨC', '33', 'Tháng 4', 'Năm Tỵ', 'Mộ', 'CỰ MÔN(M), THIÊN CƠ(M)', 'Bác sĩ, Hóa lộc, Lộc tồn, Thiên hư, Thiên tài, Tuế phá, Địa giải, Địa kiếp'],
  ['Tuất', 'QUAN LỘC', '83', 'Tháng 11', 'Năm Tý', 'Mộc dục', 'PHÁ QUÂN(Đ)', 'Lưu hà, Thai phụ, Thiên không, Thiếu dương, Tấu thư, Địa võng'],
  ['Dần', 'TÀI BẠCH', '43', 'Tháng 3', 'Năm Thìn', 'Tuyệt', 'THAM LANG(Đ)', 'Hữu bật, Kiếp sát, L.Bạch Hổ, Linh tinh, Lực sĩ, Nguyệt đức, Tử phù, Đà la'],
  ['Sửu', 'TẬT ÁCH', '53', 'Tháng 2', 'Năm Mão', 'Thai', 'THÁI DƯƠNG(Đ), THÁI ÂM(Đ)', 'Giải thần, Hoa cái, Hóa kỵ, Long trì, Phượng các, Quan phù, Thanh long, Thiên quý, Thiên sứ, Ân quang'],
  ['Tý', 'THIÊN DI', '63', 'Tháng 1', 'Năm Dần', 'Dưỡng', 'THIÊN PHỦ(M), VŨ KHÚC(V)', 'L.Thiên Hư, L.Thiên Khốc, Thiên hỷ, Thiên khôi, Thiếu âm, Tiểu hao, Tả phù'],
  ['Hợi', 'NÔ BỘC', '73', 'Tháng 12', 'Năm Sửu', 'Trường sinh', 'THIÊN ĐỒNG(Đ)', 'Cô thần, Hỏa tinh, Quốc ấn, Tang môn, Thiên mã, Thiên thương, Thiên thọ, Tướng quân']
];

console.log('Lá số mẫu so với lichngay.net');
LICHNGAY.forEach(([chi, cung, daiHan, thangHan, tieuHan, trangSinh, chinh, phu]) => {
  test(`Cung ${chi} (${cung})`, () => {
    const p = chart.palaces.find((x) => TuVi.BRANCHES[x.branch_index] === chi);
    assert.equal(p.ten_cung, cung);
    assert.equal(p.dai_han, daiHan, 'đại hạn');
    assert.equal(p.thang_han, thangHan, 'tháng hạn');
    assert.equal(p.tieu_han, tieuHan, 'tiểu hạn');
    assert.equal(p.trang_sinh, trangSinh, 'tràng sinh');
    assert.equal(p.chinh_tinh.map((c) => `${c.name}(${c.status})`).sort().join(', '), chinh, 'chính tinh');
    assert.equal([...p.phu_tinh_trai, ...p.phu_tinh_phai].map(plain).sort().join(', '), phu, 'phụ tinh');
  });
});

test('Thiên bàn khớp lichngay', () => {
  const tb = chart.thienBan;
  assert.equal(tb.amDuong, 'Âm Nam (Âm Dương nghịch lý)');
  assert.equal(tb.cuc, 'Mộc tam cục (Mệnh Thủy sinh Cục Mộc)');
  assert.equal(tb.banMenh, 'Tuyền Trung Thủy (nước suối)');
  assert.equal(tb.chuMenh, 'Văn Khúc');
  assert.equal(tb.chuThan, 'Thiên Đồng');
  assert.equal(tb.canLuong, '5 lượng 0 chỉ');
  assert.equal(tb.camTinh, 'Con gà');
  assert.equal(tb.conNha, 'Con nhà HẮC ĐẾ');
  assert.equal(chart.palaces.find((p) => p.is_than).ten_cung, 'TÀI BẠCH');
});

// Lá số thứ hai trên lichngay: nam, 02/05/2002 20:16 (Nhâm Ngọ, Thủy nhị cục) — [chi, cung, chính tinh, phụ tinh]
// Khác lichngay đúng 1 chỗ có chủ ý: Văn tinh tuổi Nhâm an ở Dần (Lộc tồn + 3, theo bảng cổ);
// lichngay đặt ở Dậu (trùng cung Hồng loan), không khớp bảng nào.
const LICHNGAY_2 = [
  ['Tỵ', 'HUYNH ĐỆ', 'THIÊN PHỦ(Đ)', 'Hóa khoa, L.Lộc Tồn, Linh tinh, Phi liêm, Phá toái, Thiên việt, Trực phù'],
  ['Ngọ', 'MỆNH', 'THIÊN ĐỒNG(H), THÁI ÂM(H)', 'Hỷ thần, L.Kình Dương, L.Thái Tuế, Thiên phúc, Thái tuế, Tả phù, Ân quang'],
  ['Mùi', 'PHỤ MẪU', 'THAM LANG(M), VŨ KHÚC(M)', 'Bệnh phù, Hóa kỵ, Quốc ấn, Thiên không, Thiếu dương'],
  ['Thân', 'PHÚC ĐỨC', 'CỰ MÔN(Đ), THÁI DƯƠNG(H)', 'Cô thần, Hữu bật, L.Tang Môn, L.Thiên Mã, TUẦN, Tang môn, Thiên mã, Thiên quý, Thiên thọ, Đại hao'],
  ['Thìn', 'PHU THÊ', '', 'Giải thần, L.Đà La, Phượng các, Quả tú, Thai phụ, Thiên la, Tấu thư, Điếu khách, Đường phù'],
  ['Dậu', 'ĐIỀN TRẠCH', 'THIÊN TƯỚNG(H)', 'Hồng loan, Phục binh, TUẦN, Thiên trù, Thiếu âm, Địa giải, Địa kiếp'],
  ['Mão', 'TỬ TỨC', 'LIÊM TRINH(H), PHÁ QUÂN(H)', 'Phúc đức, TRIỆT, Thiên hỷ, Thiên khôi, Thiên riêu, Thiên y, Thiên đức, Tướng quân, Đào hoa'],
  ['Tuất', 'QUAN LỘC', 'THIÊN CƠ(M), THIÊN LƯƠNG(M)', 'Hoa cái, Hóa lộc, Long trì, Quan phù, Quan phủ, Thiên giải, Thiên quan, Đà la, Địa võng'],
  ['Dần', 'TÀI BẠCH', '', 'Bạch hổ, L.Bạch Hổ, TRIỆT, Tiểu hao, Văn khúc, Văn tinh, Đẩu quân'],
  ['Sửu', 'TẬT ÁCH', '', 'Bát tọa, Long đức, Tam thai, Thanh long, Thiên sứ, Địa không'],
  ['Tý', 'THIÊN DI', '', 'Kình dương, L.Thiên Hư, L.Thiên Khốc, Lực sĩ, Phong cáo, Thiên hư, Thiên khốc, Thiên tài, Tuế phá, Văn xương'],
  ['Hợi', 'NÔ BỘC', 'THẤT SÁT(M), TỬ VI(V)', 'Bác sĩ, Hóa quyền, Hỏa tinh, Kiếp sát, Lưu hà, Lộc tồn, Nguyệt đức, Thiên hình, Thiên thương, Tử phù']
];
const chart2 = TuVi.lapLaSoTuVi({ gender: 1, solarDay: 2, solarMonth: 5, solarYear: 2002, hour: 20, minute: 16, viewYear: 2026 });
console.log('Lá số thứ hai (Nhâm Ngọ) so với lichngay.net');
test('12 cung: chính tinh, độ sáng, phụ tinh (Tứ hóa Nhâm: Khoa ở Thiên Phủ)', () => {
  LICHNGAY_2.forEach(([chi, cung, chinh, phu]) => {
    const p = chart2.palaces.find((x) => TuVi.BRANCHES[x.branch_index] === chi);
    assert.equal(p.ten_cung, cung, chi);
    assert.equal(p.chinh_tinh.map((c) => `${c.name}(${c.status})`).sort().join(', '), chinh, `chính tinh ${chi}`);
    assert.equal([...p.phu_tinh_trai, ...p.phu_tinh_phai].map(plain).sort().join(', '), phu, `phụ tinh ${chi}`);
  });
  const tb = chart2.thienBan;
  assert.equal(tb.amDuong, 'Dương Nam (Âm Dương thuận lý)');
  assert.equal(tb.cuc, 'Thủy nhị cục (Cục Thủy sinh Mệnh Mộc)');
  assert.equal(tb.canLuong, '4 lượng 7 chỉ');
  assert.equal(tb.conNha, 'Con nhà THANH ĐẾ');
});

console.log('Quy tắc an sao');
test('Cục = nạp âm can chi cung Mệnh (năm Giáp: Tý Thủy 2, Dần Hỏa 6, Thìn Mộc 3, Ngọ Thổ 5, Thân Kim 4, Tuất Hỏa 6)', () => {
  const got = [0, 2, 4, 6, 8, 10].map((b) => TuVi.tinhCuc(0, b).number);
  assert.deepEqual(got, [2, 6, 3, 5, 4, 6]);
  assert.equal(TuVi.tinhCuc(9, 0).name, 'Kim tứ cục'); // Quý năm, Mệnh Tý = Giáp Tý
});

test('Hỏa / Linh: Giáp Tý giờ Sửu — Dương nam Hỏa Mão Linh Dậu, Dương nữ Hỏa Sửu Linh Hợi', () => {
  const base = { solarDay: 15, solarMonth: 6, solarYear: 1984, hour: 2, viewYear: 2026 };
  const nam = TuVi.lapLaSoTuVi({ ...base, gender: 1 });
  const nu = TuVi.lapLaSoTuVi({ ...base, gender: 0 });
  assert.equal(nam.thienBan.canChiNam, 'Giáp Tý');
  assert.deepEqual([where(nam, 'Hỏa tinh'), where(nam, 'Linh tinh')], [[3], [9]]);
  assert.deepEqual([where(nu, 'Hỏa tinh'), where(nu, 'Linh tinh')], [[1], [11]]);
});

console.log('Ngày giờ sinh');
test('Nhập âm lịch 9/9/2005 cho cùng lá số với dương lịch 11/10/2005', () => {
  const lunar = TuVi.lapLaSoTuVi({ ...MAU, isLunar: true, lunarDay: 9, lunarMonth: 9, lunarYear: 2005 });
  assert.equal(lunar.thienBan.canChiNgay, chart.thienBan.canChiNgay);
  assert.deepEqual(lunar.palaces, chart.palaces);
});

test('Sinh sau 23h tính sang ngày hôm sau (tắt được bằng rollover23: false)', () => {
  const late = TuVi.lapLaSoTuVi({ ...MAU, solarDay: 10, hour: 23, minute: 30 });
  assert.match(late.thienBan.birthLunar, /^Ngày 09\/09\/2005/);
  assert.equal(late.thienBan.canChiNgay, 'Mậu Thìn');
  const off = TuVi.lapLaSoTuVi({ ...MAU, solarDay: 10, hour: 23, minute: 30, rollover23: false });
  assert.match(off.thienBan.birthLunar, /^Ngày 08\/09\/2005/);
});

test('Tháng nhuận & ngày âm không tồn tại', () => {
  const leap = TuVi.lapLaSoTuVi({ gender: 0, isLunar: true, lunarDay: 15, lunarMonth: 2, lunarYear: 2023, isLeapMonth: true, hour: 10 });
  assert.equal(leap.thienBan.birthSolar, '5/4/2023 (Dương lịch)');
  assert.throws(() => TuVi.lapLaSoTuVi({ gender: 0, isLunar: true, lunarDay: 30, lunarMonth: 2, lunarYear: 2023, isLeapMonth: true, hour: 10 }), /không tồn tại/);
});

if (process.argv.includes('-v')) {
  console.log('\nTHIÊN BÀN:');
  for (const [k, v] of Object.entries(chart.thienBan)) console.log(`   ${k}: ${v}`);
  console.log('\n12 CUNG:');
  chart.palaces.forEach((p) => {
    console.log(`[${p.can_chi}] ${p.ten_cung}${p.is_than ? ' (THÂN)' : ''} | Đại hạn ${p.dai_han} | ${p.trang_sinh} | ${p.tieu_han} | ${p.thang_han}`);
    console.log(`   Chính tinh: ${p.chinh_tinh.map((c) => `${c.name}(${c.status})`).join(', ') || '—'}`);
    console.log(`   Trái: ${p.phu_tinh_trai.map(plain).join(', ')}`);
    console.log(`   Phải: ${p.phu_tinh_phai.map(plain).join(', ')}`);
    console.log(`   Phi hóa: ${p.phi_hoa.map(plain).join(' | ')}`);
  });
}

console.log(`\n${passed} kiểm thử đạt${process.exitCode ? ' — CÓ LỖI' : ''}`);
