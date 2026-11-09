/*
 * Điều khiển giao diện: phương pháp lập quẻ, hiển thị, lịch sử, chia sẻ, xuất ảnh
 */
(function () {
  'use strict';
  const LH = window.LH;
  const CAL = LH.cal;
  const I = LH.iching;
  const R = LH.render;

  // Tên hiển thị trên lá quẻ — đổi tùy ý
  const CONFIG = { siteName: 'Lục Hào', siteUrl: '' };

  const HISTORY_KEY = 'luchao.history.v1';
  const HISTORY_MAX = 100;
  const METHOD_LABELS = {
    serial: 'Số serial',
    random: 'Số ngẫu nhiên',
    coin: 'Gieo xu',
    time: 'Mai Hoa theo thời gian',
    number: 'Mai Hoa theo số',
    manual: 'Tự chọn hào'
  };
  const VALUE_NAMES = { 6: 'Lão âm (X)', 7: 'Thiếu dương', 8: 'Thiếu âm', 9: 'Lão dương (O)' };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pad = R.pad;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const state = {
    method: 'serial',
    coinLines: [],
    coinFaces: [],
    tossing: false,
    manual: [7, 7, 7, 7, 7, 7],
    current: null,
    dungKey: 'the',
    fit: true
  };

  /* ---------- Thời gian ---------- */
  function nowParts() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds() };
  }

  function parseLocal(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(str || '').trim());
    if (!m) return null;
    const t = { y: +m[1], m: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: +(m[6] || 0) };
    if (t.y < 1900 || t.y > 2199 || t.h > 23 || t.mi > 59 || t.s > 59) return null;
    const back = CAL.jdToDate(CAL.jdFromDate(t.d, t.m, t.y));
    if (back.d !== t.d || back.m !== t.m || back.y !== t.y) return null;
    return t;
  }

  const toLocalStr = (t) => `${t.y}-${pad(t.m)}-${pad(t.d)}T${pad(t.h)}:${pad(t.mi)}:${pad(t.s)}`;

  function selectedTime() {
    const mode = $('input[name=timemode]:checked').value;
    return mode === 'custom' ? parseLocal($('#customTime').value) : nowParts();
  }

  function currentCal() {
    const t = selectedTime();
    return t ? CAL.getInfo(t, { rollover23: $('#rollover').checked }) : null;
  }

  function updatePreview() {
    const mode = $('input[name=timemode]:checked').value;
    if (mode === 'now') {
      const n = nowParts();
      $('#clock').textContent = `${pad(n.h)}:${pad(n.mi)}:${pad(n.s)} ${pad(n.d)}/${pad(n.m)}/${n.y}`;
    }
    const c = currentCal();
    if (!c) {
      $('#timePreview').textContent = 'Thời điểm chưa hợp lệ (năm 1900–2199).';
      return;
    }
    $('#timePreview').innerHTML =
      `Âm lịch: <b>${R.lunarText(c)}</b> · Tiết <b>${R.esc(c.term.name)}</b><br>` +
      `${R.canChiText(c)}`;
    if (state.method === 'time') updatePlumTime(c);
    if (state.method === 'number') updatePlumNumber(c);
  }

  /* ---------- Số serial ---------- */
  function updatePlumSerial() {
    const raw = $('#serial').value;
    const p = I.plumSerial(raw);
    if (!p) {
      $('#plumSerial').innerHTML = raw.trim() ? '<span class="muted">Cần ít nhất 2 chữ số.</span>' : '';
      return;
    }
    const f = p.formula;
    const n = hexNamesOf(p.values);
    const plus = (d) => d.split('').join('+');
    $('#plumSerial').innerHTML =
      `<div>Nửa đầu <b>${f.upperDigits}</b>: ${plus(f.upperDigits)} = ${f.su} → Thượng quái: <b>${triName(f.upper)}</b></div>` +
      `<div>Nửa sau <b>${f.lowerDigits}</b>: ${plus(f.lowerDigits)} = ${f.sl} → Hạ quái: <b>${triName(f.lower)}</b></div>` +
      `<div>Tổng ${f.su} + ${f.sl} = ${f.total} chia 6 → Hào động: <b>${f.moving}</b></div>` +
      `<div class="f-res">${R.esc(n.main.name)} → ${R.esc(n.changed.name)}</div>`;
  }

  function randomSerial() {
    let s = '';
    for (let k = 0; k < 8; k++) s += String(I.randomInt(10));
    return s;
  }

  /* ---------- Tabs phương pháp ---------- */
  function setMethod(m) {
    state.method = m;
    $$('.tab').forEach((b) => {
      const on = b.dataset.method === m;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    $$('.panel').forEach((p) => (p.hidden = p.id !== 'panel-' + m));
    updateCastBtn();
    updatePreview();
    if (m === 'manual') updateManualPreview();
    if (m === 'serial') updatePlumSerial();
  }

  function updateCastBtn() {
    const btn = $('#castBtn');
    if (state.method === 'coin') {
      const left = 6 - state.coinLines.length;
      btn.disabled = left > 0;
      btn.textContent = left > 0 ? `Còn ${left} hào cần gieo` : 'Lập quẻ';
    } else {
      btn.disabled = false;
      btn.textContent = 'Lập quẻ';
    }
  }

  /* ---------- Gieo xu ---------- */
  function renderCoinBuild() {
    const ol = $('#coinBuild');
    let html = '';
    for (let pos = 6; pos >= 1; pos--) {
      const v = state.coinLines[pos - 1];
      const next = state.coinLines.length === pos - 1;
      if (v) {
        const yang = v === 7 || v === 9;
        const moving = v === 6 || v === 9;
        const faces = state.coinFaces[pos - 1].map((f) => (f === 3 ? 'D' : 'Â')).join(' ');
        html += `<li class="done${moving ? ' mv' : ''}"><span class="cb-pos">Hào ${I.LINE_NAMES[pos - 1]}</span>${R.lineGlyph(yang, moving, 'sm')}<span class="cb-val">${VALUE_NAMES[v]}</span><span class="cb-faces" title="D = mặt dương, Â = mặt âm">${faces}</span></li>`;
      } else {
        html += `<li class="${next ? 'next' : ''}"><span class="cb-pos">Hào ${I.LINE_NAMES[pos - 1]}</span><span class="cb-empty">${next ? 'đang chờ gieo…' : '—'}</span></li>`;
      }
    }
    ol.innerHTML = html;
    const n = state.coinLines.length;
    $('#tossBtn').disabled = n >= 6 || state.tossing;
    $('#tossAuto').disabled = n >= 6 || state.tossing;
    $('#tossBtn').textContent = n >= 6 ? 'Đã đủ 6 hào' : `Gieo hào ${I.LINE_NAMES[n]}`;
    updateCastBtn();
  }

  function setCoinFaces(coins) {
    $$('#coins .coinwrap').forEach((w, i) => {
      const yang = coins[i] === 3;
      w.querySelector('.coin').dataset.face = yang ? 'yang' : 'yin';
      w.querySelector('small').textContent = yang ? 'Dương (3)' : 'Âm (2)';
    });
  }

  async function tossOne(fast) {
    if (state.tossing || state.coinLines.length >= 6) return;
    state.tossing = true;
    renderCoinBuild();
    const r = I.tossCoins();
    const coins = $$('#coins .coin');
    if (!reduceMotion) {
      coins.forEach((c) => c.classList.add('spin'));
      await sleep(fast ? 280 : 700);
      coins.forEach((c) => c.classList.remove('spin'));
    }
    setCoinFaces(r.coins);
    state.coinLines.push(r.value);
    state.coinFaces.push(r.coins);
    state.tossing = false;
    renderCoinBuild();
    if (state.coinLines.length === 6) {
      await sleep(fast ? 150 : 350);
      cast();
    }
  }

  async function tossAuto() {
    while (state.coinLines.length < 6) {
      // eslint-disable-next-line no-await-in-loop
      await tossOne(true);
    }
  }

  function resetCoins() {
    if (state.tossing) return;
    state.coinLines = [];
    state.coinFaces = [];
    $$('#coins .coinwrap small').forEach((s) => (s.innerHTML = '&nbsp;'));
    renderCoinBuild();
  }

  /* ---------- Mai Hoa ---------- */
  const triName = (n) => `${n} – ${I.TRIGRAMS[n - 1].name} (${I.TRIGRAMS[n - 1].image})`;

  function hexNamesOf(values) {
    const bits = values.map((v) => (v === 7 || v === 9 ? 1 : 0));
    const main = I.hexInfo(bits);
    const moving = values.some((v) => v === 6 || v === 9);
    const changed = moving ? I.hexInfo(bits.map((b, i) => (values[i] === 6 || values[i] === 9 ? 1 - b : b))) : null;
    return { main, changed };
  }

  function updatePlumTime(c) {
    const p = I.plumTime(c);
    const f = p.formula;
    const s1 = f.Y + f.M + f.D;
    const s2 = s1 + f.H;
    const n = hexNamesOf(p.values);
    $('#plumTime').innerHTML =
      `<div>Năm <b>${CAL.BRANCHES[c.lunarYearPillar.branch]}</b> (${f.Y}) + tháng <b>${f.M}</b> + ngày <b>${f.D}</b> = ${s1} → Thượng quái: <b>${triName(f.upper)}</b></div>` +
      `<div>${s1} + giờ <b>${CAL.BRANCHES[c.pillars.hour.branch]}</b> (${f.H}) = ${s2} → Hạ quái: <b>${triName(f.lower)}</b></div>` +
      `<div>${s2} chia 6 dư → Hào động: <b>${f.moving}</b></div>` +
      `<div class="f-res">${R.esc(n.main.name)} → ${R.esc(n.changed.name)}</div>`;
  }

  function readNumbers() {
    const a = parseInt($('#numA').value, 10);
    const b = parseInt($('#numB').value, 10);
    if (!(a > 0) || !(b > 0)) return null;
    return { a, b };
  }

  function updatePlumNumber(c) {
    const nb = readNumbers();
    if (!nb) {
      $('#plumNumber').innerHTML = '<span class="muted">Nhập hai số nguyên dương.</span>';
      return;
    }
    const p = I.plumNumbers(nb.a, nb.b, c);
    const f = p.formula;
    const n = hexNamesOf(p.values);
    $('#plumNumber').innerHTML =
      `<div>${f.a} chia 8 → Thượng quái: <b>${triName(f.upper)}</b></div>` +
      `<div>${f.b} chia 8 → Hạ quái: <b>${triName(f.lower)}</b></div>` +
      `<div>${f.a} + ${f.b} + giờ ${CAL.BRANCHES[c.pillars.hour.branch]} (${f.H}) = ${f.a + f.b + f.H} chia 6 → Hào động: <b>${f.moving}</b></div>` +
      `<div class="f-res">${R.esc(n.main.name)} → ${R.esc(n.changed.name)}</div>`;
  }

  /* ---------- Tự chọn hào ---------- */
  function buildManual() {
    const wrap = $('#manualRows');
    let html = '';
    for (let pos = 6; pos >= 1; pos--) {
      html += `<div class="mrow" data-pos="${pos}"><span class="mpos">Hào ${I.LINE_NAMES[pos - 1]}</span><div class="seg" role="group" aria-label="Hào ${I.LINE_NAMES[pos - 1]}">`;
      [7, 8, 9, 6].forEach((v) => {
        const yang = v === 7 || v === 9;
        const mv = v === 6 || v === 9;
        html += `<button type="button" data-v="${v}" aria-pressed="false" title="${VALUE_NAMES[v]}">${R.lineGlyph(yang, mv, 'sm')}<span>${VALUE_NAMES[v]}</span></button>`;
      });
      html += '</div></div>';
    }
    wrap.innerHTML = html;

    const sel = $('#quickHex');
    const groups = {};
    I.allHexagrams().forEach((h) => {
      (groups[h.palaceName] = groups[h.palaceName] || []).push(h);
    });
    Object.keys(groups).forEach((pn) => {
      const og = document.createElement('optgroup');
      og.label = 'Cung ' + pn;
      groups[pn].forEach((h) => {
        const o = document.createElement('option');
        o.value = h.key;
        o.textContent = `${h.name} (${h.orderName})`;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    syncManual();
  }

  function syncManual() {
    $$('#manualRows .mrow').forEach((row) => {
      const pos = +row.dataset.pos;
      $$('button', row).forEach((b) => b.setAttribute('aria-pressed', +b.dataset.v === state.manual[pos - 1] ? 'true' : 'false'));
    });
    updateManualPreview();
  }

  function updateManualPreview() {
    const n = hexNamesOf(state.manual);
    $('#manualPreview').innerHTML = `<div class="f-res">${R.esc(n.main.name)}${n.changed ? ' → ' + R.esc(n.changed.name) : ' <span class="muted">(quẻ tĩnh)</span>'}</div>`;
  }

  /* ---------- Lập quẻ ---------- */
  function cast() {
    const t = selectedTime();
    if (!t) {
      toast('Thời điểm lập quẻ chưa hợp lệ.');
      return;
    }
    const rollover = $('#rollover').checked;
    const c = CAL.getInfo(t, { rollover23: rollover });
    const rec = { q: $('#question').value.trim().slice(0, 200), t: toLocalStr(t), m: state.method, r: rollover ? 1 : 0 };
    let values;
    switch (state.method) {
      case 'serial': {
        const p = I.plumSerial($('#serial').value);
        if (!p) {
          toast('Nhập dãy số serial (ít nhất 2 chữ số), hoặc bấm “Số ngẫu nhiên”.');
          $('#serial').focus();
          return;
        }
        values = p.values;
        rec.s = p.formula.digits;
        break;
      }
      case 'random':
        values = I.randomHexagram();
        break;
      case 'coin':
        if (state.coinLines.length < 6) {
          toast('Hãy gieo đủ 6 hào.');
          return;
        }
        values = state.coinLines.slice();
        break;
      case 'time':
        values = I.plumTime(c).values;
        break;
      case 'number': {
        const nb = readNumbers();
        if (!nb) {
          toast('Nhập hai số nguyên dương.');
          $('#numA').focus();
          return;
        }
        values = I.plumNumbers(nb.a, nb.b, c).values;
        rec.a = nb.a;
        rec.b = nb.b;
        break;
      }
      case 'manual':
        values = state.manual.slice();
        break;
      default:
        return;
    }
    rec.v = values.join('');
    show(rec, { save: true, scroll: true });
    if (state.method === 'coin') {
      state.coinLines = [];
      state.coinFaces = [];
      renderCoinBuild();
    }
  }

  function methodLabel(rec) {
    let s = METHOD_LABELS[rec.m] || 'Không rõ';
    if (rec.m === 'number' && rec.a && rec.b) s += ` (${rec.a} – ${rec.b})`;
    if (rec.m === 'serial' && rec.s) s += ` ${rec.s}`;
    return s;
  }

  function validRec(rec) {
    return rec && /^[6-9]{6}$/.test(rec.v || '') && parseLocal(rec.t) && METHOD_LABELS[rec.m];
  }

  function show(rec, opts) {
    const o = opts || {};
    if (!validRec(rec)) {
      toast('Dữ liệu quẻ không hợp lệ.');
      return;
    }
    const t = parseLocal(rec.t);
    const c = CAL.getInfo(t, { rollover23: rec.r !== 0 });
    const values = rec.v.split('').map(Number);
    // Mai Hoa (serial / thời gian / số) luôn có đúng 1 hào động theo công thức → không xét Độc phát
    const res = I.analyze(values, c, { fixedMoving: ['serial', 'time', 'number'].includes(rec.m) });
    const data = { question: rec.q || '', methodLabel: methodLabel(rec), cal: c, res, rec };
    state.current = data;
    state.dungKey = 'the';
    $('#chart').innerHTML = R.chart(data, CONFIG);
    LH.inspect.setData(data);
    renderDetails();
    $('#result').hidden = false;
    applyFit();
    try {
      history.replaceState(null, '', '#' + encodeRec(rec));
    } catch (e) {
      /* file:// trên một số trình duyệt */
    }
    document.title = `${res.main.name}${res.changed ? ' → ' + res.changed.name : ''} — Lập Quẻ Lục Hào`;
    if (o.save) saveHistory(rec);
    if (o.scroll) $('#result').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // Thu lá quẻ vừa khung trên màn hình hẹp (có thể chuyển sang cỡ thật để cuộn ngang)
  function applyFit() {
    const sc = $('.chart-scroll');
    const chart = $('#chart');
    if (!sc || !chart || $('#result').hidden) return;
    chart.style.zoom = '';
    const natural = chart.offsetWidth;
    const avail = sc.clientWidth;
    const overflow = natural > avail + 1;
    const fit = overflow && state.fit;
    if (fit) chart.style.zoom = String(avail / natural);
    sc.classList.toggle('fit', fit);
    $('#btnFit').hidden = !overflow;
    $('#btnFit').textContent = state.fit ? 'Xem cỡ thật' : 'Thu vừa màn hình';
    $('#scrollHint').hidden = !overflow || state.fit;
    LH.inspect.refresh();
  }

  function renderDetails() {
    $('#details').innerHTML = R.details(state.current, state.dungKey);
  }

  /* ---------- Liên kết chia sẻ ---------- */
  function encodeRec(rec) {
    const p = new URLSearchParams();
    p.set('v', rec.v);
    p.set('t', rec.t);
    p.set('m', rec.m);
    p.set('r', String(rec.r === 0 ? 0 : 1));
    if (rec.a) p.set('a', rec.a);
    if (rec.b) p.set('b', rec.b);
    if (rec.s) p.set('s', rec.s);
    if (rec.q) p.set('q', rec.q);
    return p.toString();
  }

  function decodeHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h || h.indexOf('v=') === -1) return null;
    const p = new URLSearchParams(h);
    const rec = {
      v: p.get('v'),
      t: p.get('t'),
      m: p.get('m') || 'manual',
      r: p.get('r') === '0' ? 0 : 1,
      q: (p.get('q') || '').slice(0, 200)
    };
    const a = parseInt(p.get('a'), 10);
    const b = parseInt(p.get('b'), 10);
    if (a > 0) rec.a = a;
    if (b > 0) rec.b = b;
    const sr = (p.get('s') || '').replace(/\D/g, '').slice(0, 40);
    if (sr) rec.s = sr;
    return validRec(rec) ? rec : null;
  }

  /* ---------- Lịch sử ---------- */
  function loadHistory() {
    try {
      const v = JSON.parse(localStorage.getItem(HISTORY_KEY));
      return Array.isArray(v) ? v.filter(validRec) : [];
    } catch (e) {
      return [];
    }
  }

  function storeHistory(list) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch (e) {
      /* bộ nhớ bị chặn — bỏ qua */
    }
  }

  function saveHistory(rec) {
    const list = loadHistory().filter((x) => !(x.t === rec.t && x.v === rec.v && (x.q || '') === (rec.q || '')));
    list.unshift(Object.assign({}, rec, { saved: Date.now() }));
    storeHistory(list.slice(0, HISTORY_MAX));
    renderHistory();
  }

  function renderHistory() {
    const list = loadHistory();
    $('#histEmpty').hidden = list.length > 0;
    $('#histClear').hidden = list.length === 0;
    $('#histList').innerHTML = list
      .map((rec, i) => {
        const n = hexNamesOf(rec.v.split('').map(Number));
        const t = parseLocal(rec.t);
        return `<li class="hist-item">
          <button type="button" class="hist-open" data-i="${i}">
            ${R.hexFigure(n.main.bits, rec.v.split('').map((v) => v === '6' || v === '9'), 'tiny')}
            <span class="hist-text">
              <b>${R.esc(rec.q || '(Không ghi việc cần xem)')}</b>
              <span>${R.esc(n.main.name)}${n.changed ? ' → ' + R.esc(n.changed.name) : ''}</span>
              <small>${pad(t.h)}:${pad(t.mi)} ${R.fmtDate(t)} · ${R.esc(methodLabel(rec))}</small>
            </span>
          </button>
          <button type="button" class="hist-del" data-i="${i}" aria-label="Xóa quẻ này" title="Xóa">×</button>
        </li>`;
      })
      .join('');
  }

  /* ---------- Xuất / chia sẻ ---------- */
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('on'), 2600);
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      ta.remove();
      toast(ok ? okMsg : 'Không sao chép được — hãy chọn và sao chép thủ công.');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function exportPng() {
    if (!state.current) return;
    const btn = $('#btnPng');
    btn.disabled = true;
    try {
      if (!window.html2canvas) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    } catch (e) {
      btn.disabled = false;
      toast('Không tải được thư viện xuất ảnh (cần mạng). Có thể dùng nút In → Lưu PDF.');
      return;
    }
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const node = $('#chart');
      const canvas = await window.html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: Math.max(window.innerWidth, 1200),
        onclone: (doc) => {
          const sc = doc.querySelector('.chart-scroll');
          if (sc) sc.style.overflow = 'visible';
          const ch = doc.querySelector('#chart');
          if (ch) {
            ch.style.zoom = '';
            ch.classList.remove('ins-on');
            ch.querySelectorAll('.ins-svg').forEach((n) => n.remove());
            ch.querySelectorAll('.ins-focus, .ins-rel, .ins-active').forEach((n) => n.classList.remove('ins-focus', 'ins-rel', 'ins-active'));
          }
        }
      });
      await new Promise((resolve) =>
        canvas.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `que-luc-hao-${state.current.rec.t.replace(/[:T]/g, '-')}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          resolve();
        }, 'image/png')
      );
      toast('Đã lưu ảnh lá quẻ.');
    } catch (e) {
      toast('Xuất ảnh thất bại: ' + (e && e.message ? e.message : e));
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- Khởi tạo ---------- */
  function initTabs() {
    const tabs = $$('.tab');
    tabs.forEach((b, idx) => {
      b.addEventListener('click', () => setMethod(b.dataset.method));
      b.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight') j = (idx + 1) % tabs.length;
        if (e.key === 'ArrowLeft') j = (idx - 1 + tabs.length) % tabs.length;
        if (j !== null) {
          e.preventDefault();
          tabs[j].focus();
          setMethod(tabs[j].dataset.method);
        }
      });
    });
  }

  function init() {
    $('#brandMark').innerHTML = R.baguaSVG(40, '#f6e7cf', { stroke: 1.4 });

    const now = nowParts();
    $('#customTime').value = toLocalStr(now);

    $$('input[name=timemode]').forEach((r) =>
      r.addEventListener('change', () => {
        const custom = $('input[name=timemode]:checked').value === 'custom';
        $('#customTime').hidden = !custom;
        $('#clock').hidden = custom;
        if (custom) $('#customTime').focus();
        updatePreview();
      })
    );
    $('#customTime').addEventListener('input', updatePreview);
    $('#rollover').addEventListener('change', updatePreview);
    $('#numA').addEventListener('input', updatePreview);
    $('#serial').addEventListener('input', updatePlumSerial);
    $('#serial').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') cast();
    });
    $('#serialRandom').addEventListener('click', () => {
      $('#serial').value = randomSerial();
      updatePlumSerial();
    });
    LH.inspect.init($('#chart'), $('#haoPanel'));
    $('#numB').addEventListener('input', updatePreview);

    initTabs();

    $('#tossBtn').addEventListener('click', () => tossOne(false));
    $('#tossAuto').addEventListener('click', tossAuto);
    $('#tossReset').addEventListener('click', resetCoins);

    buildManual();
    $('#manualRows').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      const pos = +b.closest('.mrow').dataset.pos;
      state.manual[pos - 1] = +b.dataset.v;
      $('#quickHex').value = '';
      syncManual();
    });
    $('#quickHex').addEventListener('change', (e) => {
      const key = e.target.value;
      if (!key) return;
      state.manual = key.split('').map((b) => (b === '1' ? 7 : 8));
      syncManual();
    });

    $('#castBtn').addEventListener('click', cast);
    $('#question').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && state.method !== 'coin') cast();
    });

    $('#details').addEventListener('change', (e) => {
      if (e.target.id === 'dungSelect') {
        state.dungKey = e.target.value;
        renderDetails();
        const sel = $('#dungSelect');
        if (sel) sel.focus();
      }
    });

    $('#btnPng').addEventListener('click', exportPng);
    $('#btnLink').addEventListener('click', () => copyText(location.href, 'Đã sao chép liên kết quẻ.'));
    $('#btnText').addEventListener('click', () => state.current && copyText(R.textSummary(state.current), 'Đã sao chép nội dung quẻ.'));
    $('#btnPrint').addEventListener('click', () => window.print());
    $('#btnFit').addEventListener('click', () => {
      state.fit = !state.fit;
      applyFit();
    });
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(applyFit, 120);
    });
    $('#btnNew').addEventListener('click', () => {
      resetCoins();
      $('#cast').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      $('#question').focus({ preventScroll: true });
    });

    $('#histList').addEventListener('click', (e) => {
      const list = loadHistory();
      const del = e.target.closest('.hist-del');
      const open = e.target.closest('.hist-open');
      if (del) {
        list.splice(+del.dataset.i, 1);
        storeHistory(list);
        renderHistory();
      } else if (open) {
        const rec = list[+open.dataset.i];
        if (rec) show(rec, { scroll: true });
      }
    });
    $('#histClear').addEventListener('click', () => {
      if (window.confirm('Xóa toàn bộ lịch sử quẻ trên trình duyệt này?')) {
        storeHistory([]);
        renderHistory();
      }
    });

    renderCoinBuild();
    renderHistory();
    setMethod('serial');
    setInterval(() => {
      if ($('input[name=timemode]:checked').value === 'now') updatePreview();
    }, 1000);

    const fromHash = decodeHash();
    if (fromHash) {
      $('#question').value = fromHash.q || '';
      show(fromHash, { save: true, scroll: true });
    }
    window.addEventListener('hashchange', () => {
      const rec = decodeHash();
      if (rec && (!state.current || encodeRec(rec) !== encodeRec(state.current.rec))) show(rec, { save: true, scroll: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
