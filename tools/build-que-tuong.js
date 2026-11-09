/*
 * Trích Tổng quan / Quẻ tượng / Lục hào tượng của 64 quẻ từ file OCR
 * "AN HẠ - DỊCH KINH CHÂN TỦY LỤC HÀO TƯỢNG GIẢI_p10-320_OCR.md"
 * → sinh js/que-tuong.js (window.LH_QUE_TUONG), bỏ qua toàn bộ phần Ví dụ.
 *
 * Chạy:  node tools/build-que-tuong.js            (ghi file + in báo cáo)
 *        node tools/build-que-tuong.js --report   (chỉ in báo cáo)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readdirSync(ROOT).find((f) => /CHÂN TỦY.*\.md$/i.test(f.normalize('NFC')));
if (!SRC) {
  console.error('Không tìm thấy file MD Dịch kinh Chân tủy trong thư mục gốc.');
  process.exit(1);
}
const OUT = path.join(ROOT, 'js', 'que-tuong.js');
const REPORT_ONLY = process.argv.includes('--report');

const IMAGES = { 'thiên': 0, 'trạch': 1, 'hỏa': 2, 'lôi': 3, 'phong': 4, 'thủy': 5, 'sơn': 6, 'địa': 7 };
const PALACES = { 'càn': 0, 'đoài': 1, 'ly': 2, 'chấn': 3, 'tốn': 4, 'khảm': 5, 'cấn': 6, 'khôn': 7 };

// Bỏ dòng tiêu đề trang bị OCR lẫn vào nội dung ("Dịch kinh Chân tủy – Lục hào Tượng giải An Hạ")
const PAGE_HEADER = /Dịch\s*kinh\s*Chân\s*tủy\s*[–-]\s*Lục\s*hào\s*Tượng\s*giải(\s*An\s*H[aạ]\.?)?/giu;
const lines = fs
  .readFileSync(path.join(ROOT, SRC), 'utf8')
  .normalize('NFC')
  .split(/\r?\n/)
  .map((l, i) => (i > 0 ? l.replace(PAGE_HEADER, '').replace(/\s+$/, '') : l));

/* ---------- Nhận dạng ---------- */
const HEADING_RE = /^#{2,3}\s*(Càn|Đoài|Ly|Chấn|Tốn|Khảm|Cấn|Khôn)\s+cung\s*:\s*(.+?)\s*(\((.*?)\))?\s*$/i;
const LABELS = [
  { key: 'tongQuan', re: /^Tổng\s*quan\b/i },
  { key: 'queTuong', re: /^Quẻ\s*(tượng|tổ\s*hợp)\b/i },
  { key: 'lucHao', re: /^Lục\s*hào\s*tượng\b/i }
];
const strip = (s) => s.replace(/^[#\s*]+/, '').replace(/[\s*]+$/, '').trim();
const isExample = (s) => /^(\*\*)?(#+\s*)?(\*\*)?\s*Ví\s*dụ\s*\d/i.test(s.trim());
const isChartLine = (s) => {
  const t = strip(s);
  if (!t) return false;
  if (s.trim().startsWith('|')) return true;
  if (/^QUẺ\s+(CHÍNH|BIẾN)\b/.test(t)) return true;
  // dòng toàn chữ in hoa là tên quẻ của hình ví dụ (vd. "SƠN ĐỊA BÁC")
  return t.length >= 6 && t === t.toUpperCase() && /^[A-ZÀ-Ỹ\s]+$/u.test(t) && /\p{Lu}/u.test(t);
};
const isHeading = (s) => /^#/.test(s.trim()) && !LABELS.some((L) => L.re.test(strip(s)));

function labelOf(s) {
  const t = strip(s);
  for (const L of LABELS) {
    if (L.re.test(t)) {
      const rest = t.replace(L.re, '').replace(/^[\s*:]+/, '').trim();
      return { key: L.key, rest };
    }
  }
  return null;
}

function keyOfName(name) {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  const m = /^bát thuần (\S+)/.exec(n);
  if (m) {
    const p = PALACES[m[1]];
    return p == null ? null : `${p}-${p}`;
  }
  const w = n.split(' ');
  const u = IMAGES[w[0]];
  const l = IMAGES[w[1]];
  return u == null || l == null ? null : `${u}-${l}`;
}

/* ---------- Ghép đoạn ---------- */
const ENDS = /[.!?…:;)"”»]$/;
function paragraphs(rawLines) {
  const paras = [];
  let cur = [];
  rawLines.forEach((ln) => {
    const t = ln.replace(/\*\*/g, '').trim();
    if (!t) {
      if (cur.length) paras.push(cur.join(' '));
      cur = [];
    } else cur.push(t);
  });
  if (cur.length) paras.push(cur.join(' '));
  // Câu bị ngắt do sang trang: đoạn trước không kết thúc bằng dấu câu → nối với đoạn sau
  const out = [];
  paras.forEach((p) => {
    if (out.length && !ENDS.test(out[out.length - 1])) out[out.length - 1] += ' ' + p;
    else out.push(p);
  });
  return out.map((p) => p.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim()).filter(Boolean);
}

/* ---------- Tách từng quẻ ---------- */
const starts = [];
lines.forEach((ln, i) => {
  const m = HEADING_RE.exec(ln.trim());
  if (m) starts.push({ line: i, palace: m[1], name: m[2].trim(), tag: (m[4] || '').trim() });
});

function parseSection(from, to) {
  const out = { tongQuan: [], queTuong: [], lucHao: [] };
  const seen = new Set();
  let cur = null;
  let buf = [];
  const flush = () => {
    if (cur) out[cur] = paragraphs(buf);
    buf = [];
  };
  for (let i = from + 1; i < to; i++) {
    const ln = lines[i];
    if (isExample(ln)) break;
    const lab = labelOf(ln);
    if (lab) {
      if (seen.has(lab.key)) break; // nhãn lặp lại → đã sang phần khác
      flush();
      cur = lab.key;
      seen.add(lab.key);
      if (lab.rest) buf.push(lab.rest);
      continue;
    }
    if (!cur) continue; // bỏ phần bảng quẻ đầu mục
    if (isChartLine(ln) || isHeading(ln)) break;
    buf.push(ln);
  }
  flush();
  return out;
}

/* ---------- Sửa lỗi OCR đảo trang (theo mốc chữ, không theo số dòng) ---------- */
// Lấy các dòng bắt đầu tại dòng khớp "anchor"; dừng ở Ví dụ / hình quẻ / tiêu đề,
// hoặc ở dòng trống đầu tiên nếu opts.untilBlank
function grab(anchorRe, opts) {
  const o = opts || {};
  const i = lines.findIndex((l) => anchorRe.test(strip(l)));
  if (i < 0) return null;
  const buf = [];
  for (let k = i; k < lines.length; k++) {
    const l = lines[k];
    if (k > i && o.untilBlank && !l.trim()) break;
    if (k > i && (isExample(l) || isChartLine(l) || isHeading(l))) break;
    buf.push(l);
  }
  return buf;
}
const FIXUPS = require('./que-tuong-fixups.js');

/* ---------- Chạy ---------- */
const data = {};
const report = [];
starts.forEach((s, idx) => {
  const end = idx + 1 < starts.length ? starts[idx + 1].line : lines.length;
  const key = keyOfName(s.name);
  const sec = parseSection(s.line, end);
  const fix = FIXUPS[s.name];
  if (fix) fix(sec, { grab, paragraphs, labelOf, lines });
  const item = { name: s.name, palace: s.palace, tag: s.tag, ...sec };
  if (!key) report.push(`!! Không nhận ra tên quẻ: ${s.name} (dòng ${s.line + 1})`);
  else data[key] = item;
  const issues = [];
  ['tongQuan', 'queTuong', 'lucHao'].forEach((k) => {
    if (!sec[k].length) issues.push(`thiếu ${k}`);
    const last = sec[k][sec[k].length - 1];
    if (last && !ENDS.test(last)) issues.push(`${k} kết thúc lửng: "…${last.slice(-40)}"`);
  });
  const len = ['tongQuan', 'queTuong', 'lucHao'].map((k) => sec[k].join(' ').length);
  report.push(`${issues.length ? '⚠' : '✓'} ${String(s.line + 1).padStart(5)} ${s.name.padEnd(26)} ${len.join('/')}${issues.length ? '  ← ' + issues.join('; ') : ''}`);
});

// Trộn nội dung bổ sung chép tay (chỉ điền phần còn thiếu)
const SUPP = require('./que-tuong-bo-sung.js');
Object.keys(SUPP).forEach((name) => {
  const s = SUPP[name];
  const key = keyOfName(name);
  if (!key) {
    report.push(`!! Bổ sung: không nhận ra tên quẻ ${name}`);
    return;
  }
  const cur = data[key];
  if (!cur) {
    data[key] = { name, palace: s.palace || '', tag: s.tag || '', tongQuan: s.tongQuan || [], queTuong: s.queTuong || [], lucHao: s.lucHao || [] };
    report.push(`+ Bổ sung cả quẻ: ${name}`);
    return;
  }
  ['tongQuan', 'queTuong', 'lucHao'].forEach((k) => {
    if (!cur[k].length && s[k] && s[k].length) {
      cur[k] = s[k];
      report.push(`+ Bổ sung ${k}: ${name}`);
    }
  });
});
const missing = [];
for (let u = 0; u < 8; u++) for (let l = 0; l < 8; l++) if (!data[`${u}-${l}`]) missing.push(`${u}-${l}`);

console.log(`Nguồn: ${SRC}`);
if (missing.length) console.log(`Còn thiếu ${missing.length} quẻ (khóa thượng-hạ): ${missing.join(', ')}`);
console.log(`Tìm thấy ${starts.length} quẻ, nhận dạng ${Object.keys(data).length}.\n`);
console.log(report.join('\n'));

if (!REPORT_ONLY) {
  const header = `/* Tự sinh bởi tools/build-que-tuong.js từ "${SRC}" — không sửa tay, hãy sửa file MD hoặc tools/que-tuong-fixups.js rồi chạy lại. */\n`;
  const body = `window.LH_QUE_TUONG = ${JSON.stringify({ source: 'An Hạ — Dịch kinh Chân tủy, Lục hào Tượng giải', items: data }, null, 1)};\n`;
  fs.writeFileSync(OUT, header + body, 'utf8');
  console.log(`\nĐã ghi ${path.relative(ROOT, OUT)} (${(Buffer.byteLength(body) / 1024).toFixed(0)} KB).`);
}
