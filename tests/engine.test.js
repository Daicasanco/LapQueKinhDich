// Kiểm thử engine: node tests/engine.test.js
'use strict';
const assert = require('node:assert/strict');
require('../js/lunar.js');
require('../js/iching.js');
const { cal: C, iching: I } = globalThis.LH;

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
const pn = (p) => C.pillarName(p);
const B = (i) => C.BRANCHES[i];

console.log('Lịch & Can Chi');
const sample = C.getInfo({ y: 2026, m: 11, d: 9, h: 12, mi: 40, s: 1 });

test('Quẻ mẫu 12:40:01 09/11/2026: âm lịch 01/10/2026', () => {
  assert.deepEqual(sample.lunar, { day: 1, month: 10, year: 2026, leap: false });
});
test('Tứ trụ: giờ Bính Ngọ, ngày Đinh Hợi, tháng Kỷ Hợi, năm Bính Ngọ', () => {
  assert.equal(pn(sample.pillars.hour), 'Bính Ngọ');
  assert.equal(pn(sample.pillars.day), 'Đinh Hợi');
  assert.equal(pn(sample.pillars.month), 'Kỷ Hợi');
  assert.equal(pn(sample.pillars.year), 'Bính Ngọ');
});
test('Tiết Lập Đông, tuần Giáp Thân, không vong Ngọ Mùi', () => {
  assert.equal(sample.term.name, 'Lập Đông');
  assert.equal(sample.tuan.name, 'Giáp Thân');
  assert.deepEqual(sample.tuan.voids.map(B), ['Ngọ', 'Mùi']);
});
test('01/01/2000 là ngày Mậu Ngọ, tháng Bính Tý, năm Kỷ Mão; âm 25/11/1999', () => {
  const x = C.getInfo({ y: 2000, m: 1, d: 1, h: 12, mi: 0, s: 0 });
  assert.equal(pn(x.pillars.day), 'Mậu Ngọ');
  assert.equal(pn(x.pillars.month), 'Bính Tý');
  assert.equal(pn(x.pillars.year), 'Kỷ Mão');
  assert.deepEqual([x.lunar.day, x.lunar.month, x.lunar.year], [25, 11, 1999]);
});
test('Tết Bính Ngọ 17/02/2026 là mùng 1 tháng Giêng', () => {
  const x = C.getInfo({ y: 2026, m: 2, d: 17, h: 8, mi: 0, s: 0 });
  assert.deepEqual([x.lunar.day, x.lunar.month, x.lunar.year], [1, 1, 2026]);
});
test('Trước Lập Xuân: 29/01/2025 vẫn là tháng Đinh Sửu, năm Giáp Thìn (theo tiết)', () => {
  const x = C.getInfo({ y: 2025, m: 1, d: 29, h: 12, mi: 0, s: 0 });
  assert.equal(pn(x.pillars.month), 'Đinh Sửu');
  assert.equal(pn(x.pillars.year), 'Giáp Thìn');
  assert.equal(pn(x.lunarYearPillar), 'Ất Tị');
});
test('Từ 23h tính sang ngày mới (giờ Tý)', () => {
  const on = C.getInfo({ y: 2026, m: 11, d: 9, h: 23, mi: 30, s: 0 }, { rollover23: true });
  const off = C.getInfo({ y: 2026, m: 11, d: 9, h: 23, mi: 30, s: 0 }, { rollover23: false });
  assert.equal(pn(on.pillars.day), 'Mậu Tý');
  assert.equal(pn(on.pillars.hour), 'Nhâm Tý');
  assert.equal(pn(off.pillars.day), 'Đinh Hợi');
});

console.log('An quẻ (đối chiếu lá quẻ mẫu Thủy Lôi Truân → Phong Lôi Ích)');
const r = I.analyze([7, 8, 8, 8, 7, 6], sample);
test('Tên quẻ, cung, quẻ tượng', () => {
  assert.equal(r.main.name, 'Thủy Lôi Truân');
  assert.equal(r.changed.name, 'Phong Lôi Ích');
  assert.equal(r.main.palaceName, 'Khảm');
  assert.equal(r.changed.palaceName, 'Tốn');
  assert.equal(r.main.omen, 'Loạn Ti Vô Đầu');
  assert.equal(r.changed.omen, 'Khô Mộc Khai Hoa');
  assert.equal(r.mutual.name, 'Sơn Địa Bác');
});
test('Thế/Ứng quẻ chủ (2/5) và quẻ biến (3/6)', () => {
  assert.deepEqual([r.main.the, r.main.ung, r.changed.the, r.changed.ung], [2, 5, 3, 6]);
});
test('Lục thân + chi quẻ chủ (hào 1→6)', () => {
  assert.deepEqual(r.lines.map((l) => l.relName + ' ' + l.label), [
    'Huynh Đệ Tý-Thủy', 'Tử Tôn Dần-Mộc', 'Quan Quỷ Thìn-Thổ', 'Phụ Mẫu Thân-Kim', 'Quan Quỷ Tuất-Thổ', 'Huynh Đệ Tý-Thủy'
  ]);
});
test('Lục thân + chi quẻ biến (theo cung quẻ chủ)', () => {
  assert.deepEqual(r.changedLines.map((l) => l.relName + ' ' + l.label), [
    'Huynh Đệ Tý-Thủy', 'Tử Tôn Dần-Mộc', 'Quan Quỷ Thìn-Thổ', 'Quan Quỷ Mùi-Thổ', 'Thê Tài Tị-Hỏa', 'Tử Tôn Mão-Mộc'
  ]);
});
test('Phục thần Thê Tài Ngọ dưới hào 3', () => {
  assert.equal(r.hidden.length, 1);
  assert.equal(r.hidden[0].pos, 3);
  assert.equal(r.hidden[0].relShort + '-' + B(r.hidden[0].branch), 'Tài-Ngọ');
});
test('Lục thú ngày Đinh: Chu Tước ở hào Sơ', () => {
  assert.deepEqual(r.beasts, ['Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ', 'Thanh Long']);
});
test('Nạp giáp + Vượng/Tướng/Hưu/Tù/Tử', () => {
  assert.deepEqual(r.lines.map((l) => l.canChi + ' ' + l.vs), [
    'Canh Tý Vượng', 'Canh Dần Tướng', 'Canh Thìn Tù', 'Mậu Thân Hưu', 'Mậu Tuất Tù', 'Mậu Tý Vượng'
  ]);
  assert.deepEqual(r.changedLines.slice(3).map((l) => l.canChi + ' ' + l.vs), ['Tân Mùi Tù', 'Tân Tị Tử', 'Tân Mão Tướng']);
});
test('Tuần không: Mùi ở quẻ biến; Đào hoa Tý; Dịch mã Tị', () => {
  assert.equal(r.changedLines[3].isVoid, true);
  assert.equal(r.lines.filter((l) => l.isVoid).length, 0);
  assert.deepEqual(r.lines.filter((l) => l.marks.dao).map((l) => l.pos), [1, 6]);
  assert.deepEqual(r.changedLines.filter((l) => l.marks.ma).map((l) => l.pos), [5]);
});

test('Quái thân Mùi-Thổ (Thế hào 2 âm): Hương Khuê = Thủy (hào 1, 6), Sàng Trướng = Kim (hào 4)', () => {
  const S = r.shensha.byKey;
  assert.deepEqual(S.quai.branches.map(B), ['Mùi']);
  assert.deepEqual(S.huongkhue.branches.map(B), ['Tý', 'Hợi']);
  assert.deepEqual(S.sangtruong.branches.map(B), ['Thân', 'Dậu']);
  assert.deepEqual(r.lines.filter((l) => l.marks.huongkhue).map((l) => l.pos), [1, 6]);
  assert.deepEqual(r.lines.filter((l) => l.marks.sangtruong).map((l) => l.pos), [4]);
  assert.ok(r.lines[3].stars.includes('Sàng Trướng'));
});

test('Hào biến xét Nhật Nguyệt: Tổn hào 5 Tý động biến Tị-Hỏa ở tháng Tuất → Hóa Mộ tại Nguyệt', () => {
  const c = C.getInfo({ y: 2026, m: 11, d: 1, h: 13, mi: 24, s: 27 });
  assert.equal(P2(c.pillars.month), 'Mậu Tuất');
  const x = I.analyze([7, 7, 8, 8, 6, 7], c);
  const l = x.lines[4];
  assert.equal(l.changeTo.canChi, 'Tân Tị');
  assert.equal(l.changeTo.tsMonth, 'Mộ');
  assert.ok(l.transform.some((t) => t.t === 'Hóa Mộ tại Nguyệt' && t.tone === 'bad'));
  assert.ok(l.transform.some((t) => t.t === 'Hóa Tuyệt')); // Thủy tuyệt tại Tị (cách cũ, theo hào động)
});
function P2(p) {
  return C.pillarName(p);
}

console.log('Bát cung & loại quẻ');
const all = I.allHexagrams();
test('Đủ 64 quẻ, không trùng', () => {
  assert.equal(new Set(all.map((h) => h.key)).size, 64);
  assert.equal(new Set(all.map((h) => h.kw)).size, 64);
});
test('Lục Xung = 8 quẻ Bát Thuần + Vô Vọng + Đại Tráng', () => {
  const xs = all.filter((h) => I.hexInfo(h.key.split('').map(Number)).lucXung).map((h) => h.kw).sort((a, b) => a - b);
  assert.deepEqual(xs, [1, 2, 25, 29, 30, 34, 51, 52, 57, 58]);
});
test('Lục Hợp = Bĩ, Thái, Khốn, Tiết, Lữ, Bí, Dự, Phục', () => {
  const hs = all.filter((h) => I.hexInfo(h.key.split('').map(Number)).lucHop).map((h) => h.kw).sort((a, b) => a - b);
  assert.deepEqual(hs, [11, 12, 16, 22, 24, 47, 56, 60]);
});

console.log('Mai Hoa');
test('Theo số 27, 14 giờ Mùi → Vị Tế động hào Sơ → Khuê', () => {
  const x = C.getInfo({ y: 2026, m: 11, d: 9, h: 14, mi: 18, s: 0 });
  const p = I.plumNumbers(27, 14, x);
  assert.equal(p.values.join(''), '678787');
  const a = I.analyze(p.values, x);
  assert.equal(a.main.name, 'Hỏa Thủy Vị Tế');
  assert.equal(a.changed.name, 'Hỏa Trạch Khuê');
});
test('Theo thời gian 14:18 09/11/2026 → Bát Thuần Đoài động hào 2', () => {
  const x = C.getInfo({ y: 2026, m: 11, d: 9, h: 14, mi: 18, s: 0 });
  const p = I.plumTime(x);
  assert.deepEqual([p.formula.upper, p.formula.lower, p.formula.moving], [2, 2, 2]);
});
test('Gieo xu chỉ ra 6/7/8/9', () => {
  for (let i = 0; i < 500; i++) assert.ok([6, 7, 8, 9].includes(I.tossCoins().value));
});

console.log('Số serial & ghi chú quẻ');
require('../js/render.js');
const Rn = globalThis.LH.render;
test('Serial 24002019 → Thủy Lôi Truân động hào 6 (đúng lá quẻ mẫu)', () => {
  const p = I.plumSerial('24002019');
  assert.equal(p.values.join(''), '788876');
  assert.deepEqual([p.formula.su, p.formula.sl, p.formula.total], [6, 12, 18]);
});
test('Serial lẻ: nửa đầu ít hơn một số; bỏ ký tự chữ; dưới 2 số thì không lập', () => {
  const p = I.plumSerial('AB 12345');
  assert.equal(p.formula.upperDigits, '12');
  assert.equal(p.formula.lowerDigits, '345');
  assert.equal(I.plumSerial('7'), null);
});
test('Bát Thuần Chấn động hào 4: HỌ CHẤN (LỤC XUNG), giữa ghi XUNG BIẾN HỢP', () => {
  const r = I.analyze([7, 8, 8, 9, 8, 8], sample);
  assert.equal(r.changed.name, 'Địa Lôi Phục');
  assert.equal(Rn.typeLabel(r.main), 'LỤC XUNG');
  assert.ok(Rn.middleNotes(r).some((n) => n.t === 'XUNG BIẾN HỢP'));
});
test('Quẻ biến cũng ghi loại quẻ: Tổn → Trung Phu = HỌ CẤN (DU HỒN); Chấn → Phục = HỌ KHÔN (LỤC HỢP)', () => {
  const r1 = I.analyze([7, 7, 8, 8, 6, 7], sample);
  assert.equal(r1.changed.name, 'Phong Trạch Trung Phu');
  const h1 = Rn.chart({ question: '', methodLabel: 'x', cal: sample, res: r1 }, {});
  assert.ok(h1.includes('HỌ CẤN (DU HỒN)'));
  const r2 = I.analyze([7, 8, 8, 9, 8, 8], sample);
  const h2 = Rn.chart({ question: '', methodLabel: 'x', cal: sample, res: r2 }, {});
  assert.ok(h2.includes('HỌ CHẤN (LỤC XUNG)') && h2.includes('HỌ KHÔN (LỤC HỢP)'));
});
test('Quẻ tĩnh: bên biến lặp lại quẻ chủ, giữa ghi QUẺ TĨNH', () => {
  const r = I.analyze([8, 8, 7, 7, 7, 8], sample);
  const html = Rn.chart({ question: '', methodLabel: 'x', cal: sample, res: r }, {});
  assert.equal((html.match(/TRẠCH SƠN HÀM/g) || []).length, 2);
  assert.ok(Rn.middleNotes(r).some((n) => n.t === 'QUẺ TĨNH'));
});
test('Cấn động hào 3 hóa Khôn nội quái → NỘI PHẢN NGÂM', () => {
  const r = I.analyze([8, 8, 9, 8, 8, 7], sample);
  assert.equal(r.phanNgam, 'Nội Phản Ngâm');
});

console.log('Tra ngày theo Can Chi');
const P = (p) => C.pillarName(p);
test('Ngày Ất Mão tháng Tị (tiết khí) 2026–2036: 6 ngày, mỗi ngày đối chiếu đúng với getInfo', () => {
  const r = C.scanDays({ day: { stem: 1, branch: 3 }, month: { branch: 5 } }, { y: 2026, m: 1, d: 1 }, { y: 2036, m: 12, d: 31 });
  assert.equal(r.total, 6);
  assert.equal(R2(r.items[0].date), '5/6/2027');
  r.items.forEach((it) => {
    const g = C.getInfo({ y: it.date.y, m: it.date.m, d: it.date.d, h: 12, mi: 0, s: 0 });
    assert.equal(P(g.pillars.day), 'Ất Mão');
    assert.equal(B(g.pillars.month.branch), 'Tị');
  });
});
function R2(d) {
  return `${d.d}/${d.m}/${d.y}`;
}
test('Theo âm lịch: tháng Tị = tháng 4 âm (kể cả nhuận)', () => {
  const r = C.scanDays({ day: { stem: 1, branch: 3 }, month: { branch: 5 } }, { y: 2026, m: 1, d: 1 }, { y: 2036, m: 12, d: 31 }, { monthMode: 'lunar' });
  assert.equal(r.total, 5);
  r.items.forEach((it) => assert.equal(it.lunar.month, 4));
});
test('Ngày giao tiết có 2 trụ tháng: 07/11/2026 (Lập Đông) Mậu Tuất → Kỷ Hợi', () => {
  const r = C.scanDays({ month: { branch: 11 } }, { y: 2026, m: 11, d: 7 }, { y: 2026, m: 11, d: 7 });
  assert.equal(r.total, 1);
  const it = r.items[0];
  assert.equal(it.term.name, 'Lập Đông');
  assert.deepEqual(it.segments.map((s) => P(s.month)), ['Mậu Tuất', 'Kỷ Hợi']);
  assert.deepEqual(it.matched.map((s) => P(s.month)), ['Kỷ Hợi']);
});
test('Giờ Mậu Dần chỉ có ở ngày can Ất hoặc Canh', () => {
  const r = C.scanDays({ hour: { stem: 4, branch: 2 } }, { y: 2026, m: 1, d: 1 }, { y: 2026, m: 3, d: 1 });
  assert.ok(r.total > 0);
  r.items.forEach((it) => assert.ok([1, 6].includes(it.day.stem)));
});
test('Can chi lệch âm dương (Ất Tý) không hợp lệ', () => {
  assert.equal(C.validPair({ stem: 1, branch: 0 }), false);
  assert.equal(C.validPair({ stem: 1, branch: 3 }), true);
  assert.equal(C.validPair({ stem: -1, branch: 0 }), true);
});

console.log(`\n${passed} kiểm thử đạt${process.exitCode ? ' — CÓ LỖI' : ''}.`);
