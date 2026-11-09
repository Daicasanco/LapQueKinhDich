/*
 * Trang Tra ngày theo Can Chi
 */
(function () {
  'use strict';
  const LH = window.LH;
  const CAL = LH.cal;
  const R = LH.render;
  const { STEMS, BRANCHES } = CAL;

  const KINDS = [
    { k: 'day', label: 'Ngày', key: 'd' },
    { k: 'month', label: 'Tháng', key: 'm' },
    { k: 'year', label: 'Năm', key: 'y' },
    { k: 'hour', label: 'Giờ', key: 'h' }
  ];
  const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const LIMIT = 1000;
  const MM_HINT = {
    solar: 'Tháng Tị = từ Lập Hạ đến trước Mang Chủng; năm đổi tại Lập Xuân. Đây là cách Lục Hào dùng (Nguyệt lệnh).',
    lunar: 'Tháng Tị = tháng 4 âm lịch (tháng Giêng là Dần); năm đổi tại Tết Nguyên Đán.'
  };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = R.esc;
  const pad = R.pad;
  const pn = (p) => STEMS[p.stem] + ' ' + BRANCHES[p.branch];

  /* ---------- Ô chọn can chi ---------- */
  function buildSelects() {
    $('#ccGrid').innerHTML = KINDS.map((K) => {
      const stems = STEMS.map((s, i) => `<option value="${i}">${s}</option>`).join('');
      const branches = BRANCHES.map((b, i) => `<option value="${i}">${b}</option>`).join('');
      return `<fieldset class="cc" data-k="${K.k}">
        <legend>${K.label}</legend>
        <div class="cc-sel">
          <select data-p="stem" aria-label="Can ${K.label.toLowerCase()}"><option value="-1">Mọi can</option>${stems}</select>
          <select data-p="branch" aria-label="Chi ${K.label.toLowerCase()}"><option value="-1">Mọi chi</option>${branches}</select>
        </div>
        <p class="cc-err" hidden></p>
      </fieldset>`;
    }).join('');
  }

  function readFilters() {
    const f = {};
    KINDS.forEach((K) => {
      const fs = $(`.cc[data-k=${K.k}]`);
      f[K.k] = { stem: +$('select[data-p=stem]', fs).value, branch: +$('select[data-p=branch]', fs).value };
    });
    return f;
  }

  function setFilters(f) {
    KINDS.forEach((K) => {
      const fs = $(`.cc[data-k=${K.k}]`);
      const v = f[K.k] || { stem: -1, branch: -1 };
      $('select[data-p=stem]', fs).value = String(v.stem);
      $('select[data-p=branch]', fs).value = String(v.branch);
    });
    validate(f);
  }

  const isSet = (x) => x.stem >= 0 || x.branch >= 0;
  const yinYang = (i) => (i % 2 === 0 ? 'dương' : 'âm');

  function validate(f) {
    let ok = true;
    KINDS.forEach((K) => {
      const fs = $(`.cc[data-k=${K.k}]`);
      const err = $('.cc-err', fs);
      const x = f[K.k];
      const bad = !CAL.validPair(x);
      fs.classList.toggle('on', isSet(x));
      fs.classList.toggle('bad', bad);
      err.hidden = !bad;
      if (bad) {
        err.textContent = `Can ${STEMS[x.stem]} (${yinYang(x.stem)}) không đi với chi ${BRANCHES[x.branch]} (${yinYang(x.branch)}).`;
        ok = false;
      }
    });
    return ok;
  }

  function describe(f) {
    return KINDS.filter((K) => isSet(f[K.k]))
      .map((K) => {
        const x = f[K.k];
        const parts = [];
        if (x.stem >= 0) parts.push(STEMS[x.stem]);
        if (x.branch >= 0) parts.push(BRANCHES[x.branch]);
        if (x.stem >= 0 && x.branch < 0) parts.push('(can)');
        return `${K.label.toLowerCase()} ${parts.join(' ')}`;
      })
      .join(' · ');
  }

  /* ---------- Nhập nhanh ---------- */
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const STEM_AL = STEMS.map((s) => [s.toLowerCase()]);
  const BRANCH_AL = BRANCHES.map((b) => [b.toLowerCase()]);
  STEM_AL[5].push('kỉ');
  STEM_AL[9].push('quí');
  BRANCH_AL[0].push('tí');
  BRANCH_AL[5].push('tỵ');
  BRANCH_AL[3].push('mẹo');
  const KEYWORDS = { ngay: 'day', thang: 'month', nam: 'year', gio: 'hour' };
  const FILLERS = new Set(['va', 'cua', 'la', 'vao', 'tim', 'cac', 'nhung', 'trong', 'luc', 'can', 'chi']);
  const ENTRIES = [];
  STEM_AL.forEach((al, idx) => al.forEach((a) => ENTRIES.push({ type: 'stem', idx, a, s: strip(a) })));
  BRANCH_AL.forEach((al, idx) => al.forEach((a) => ENTRIES.push({ type: 'branch', idx, a, s: strip(a) })));
  const nameOf = (e) => (e.type === 'stem' ? STEMS[e.idx] : BRANCHES[e.idx]);
  const uniq = (list) => {
    const seen = new Set();
    return list.filter((e) => {
      const k = e.type + e.idx;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  function lookupToken(tok, prefer) {
    const exact = uniq(ENTRIES.filter((e) => e.a === tok));
    if (exact.length === 1) return { match: exact[0] };
    const st = strip(tok);
    let cands = uniq(ENTRIES.filter((e) => e.s === st));
    if (!cands.length && st.length >= 2) cands = uniq(ENTRIES.filter((e) => e.s.startsWith(st)));
    if (cands.length > 1 && prefer) {
      const pref = cands.filter((e) => e.type === prefer);
      if (pref.length === 1) return { match: pref[0], guessed: true };
    }
    if (cands.length === 1) return { match: cands[0], guessed: cands[0].s !== st };
    if (cands.length > 1) return { ambiguous: cands.map(nameOf) };
    return null;
  }

  function parseQuick(text) {
    const res = {};
    KINDS.forEach((K) => (res[K.k] = { stem: -1, branch: -1 }));
    const notes = [];
    const tokens = text.normalize('NFC').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
    let cur = null;
    tokens.forEach((tok) => {
      const kw = KEYWORDS[strip(tok)];
      if (kw) {
        cur = kw;
        return;
      }
      const target = cur || 'day';
      const t = res[target];
      const prefer = t.stem >= 0 && t.branch < 0 ? 'branch' : t.branch >= 0 && t.stem < 0 ? 'stem' : null;
      const r = lookupToken(tok, prefer);
      if (!r) {
        if (!FILLERS.has(strip(tok))) notes.push(`chưa hiểu “${tok}”`);
        return;
      }
      if (r.ambiguous) {
        notes.push(`“${tok}” có thể là ${r.ambiguous.join(' hoặc ')} — hãy gõ có dấu`);
        return;
      }
      t[r.match.type] = r.match.idx;
      if (r.guessed) notes.push(`hiểu “${tok}” là ${nameOf(r.match)}`);
    });
    return { res, notes };
  }

  function onQuick() {
    const text = $('#quick').value.trim();
    if (!text) {
      $('#quickMsg').textContent = '';
      return;
    }
    const p = parseQuick(text);
    setFilters(p.res);
    const d = describe(p.res);
    $('#quickMsg').innerHTML =
      (d ? `Đã hiểu: <b>${esc(d)}</b>` : 'Chưa nhận ra can chi nào.') +
      (p.notes.length ? ` <span class="muted">(${esc(p.notes.join('; '))})</span>` : '');
  }

  /* ---------- Khoảng thời gian ---------- */
  function today() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }
  const ymd = (t) => `${t.y}-${pad(t.m)}-${pad(t.d)}`;
  function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    const t = { y: +m[1], m: +m[2], d: +m[3] };
    const back = CAL.jdToDate(CAL.jdFromDate(t.d, t.m, t.y));
    if (back.y !== t.y || back.m !== t.m || back.d !== t.d) return null;
    return t;
  }
  const clampY = (y) => Math.min(2199, Math.max(1900, y));
  function addYears(t, n) {
    const y = clampY(t.y + n);
    const d = Math.min(t.d, new Date(y, t.m, 0).getDate());
    return { y, m: t.m, d };
  }

  function applyPreset(p) {
    const t = today();
    let a = t, b;
    if (p === 'year') {
      a = { y: t.y, m: 1, d: 1 };
      b = { y: t.y, m: 12, d: 31 };
    } else if (p === 'pm10') {
      a = addYears(t, -10);
      b = addYears(t, 10);
    } else {
      b = addYears(t, +p);
    }
    $('#from').value = ymd(a);
    $('#to').value = ymd(b);
    $$('#presets .chip-btn').forEach((x) => x.setAttribute('aria-pressed', x.dataset.preset === p ? 'true' : 'false'));
  }

  /* ---------- Tìm ---------- */
  function formError(msg) {
    const el = $('#formErr');
    el.hidden = !msg;
    el.textContent = msg || '';
  }

  function relDays(jd, todayJd) {
    const n = jd - todayJd;
    if (n === 0) return '<b class="rel-today">Hôm nay</b>';
    if (n === 1) return 'Ngày mai';
    if (n === -1) return 'Hôm qua';
    const abs = Math.abs(n);
    const approx = abs >= 365 ? ` <span class="muted">(~${(abs / 365.25).toFixed(1).replace('.', ',')} năm)</span>` : '';
    return n > 0 ? `còn ${abs.toLocaleString('vi-VN')} ngày${approx}` : `<span class="muted">đã qua ${abs.toLocaleString('vi-VN')} ngày</span>${approx}`;
  }

  const hourRange = (b) => (b === 0 ? '23h–1h' : `${2 * b - 1}h–${2 * b + 1}h`);
  const hm = (t) => `${pad(t.h)}:${pad(t.mi)}`;

  function segCell(it, kind, F) {
    const segs = it.segments;
    const set = isSet(F[kind]);
    const same = segs.length === 1 || pn(segs[0][kind]) === pn(segs[1][kind]);
    if (same) return `<span class="${set ? 'hl' : ''}">${pn(segs[0][kind])}</span>`;
    const m0 = it.matched.includes(segs[0]);
    const m1 = it.matched.includes(segs[1]);
    return `<span class="${set && m0 ? 'hl' : 'dim'}">${pn(segs[0][kind])}</span> → <span class="${set && m1 ? 'hl' : 'dim'}">${pn(segs[1][kind])}</span>` +
      `<br><small class="muted">đổi lúc ${hm(segs[1].since)}</small>`;
  }

  function search(opts) {
    const o = opts || {};
    const F = readFilters();
    formError('');
    if (!validate(F)) {
      formError('Có can chi không hợp lệ — xem ô báo đỏ.');
      return;
    }
    if (!KINDS.some((K) => isSet(F[K.k]))) {
      formError('Chọn ít nhất một can hoặc chi (ngày, tháng, năm hoặc giờ).');
      return;
    }
    const from = parseYmd($('#from').value);
    const to = parseYmd($('#to').value);
    if (!from || !to) {
      formError('Khoảng thời gian chưa hợp lệ.');
      return;
    }
    if (from.y < 1900 || to.y > 2199) {
      formError('Chỉ hỗ trợ từ năm 1900 đến 2199.');
      return;
    }
    const jdA = CAL.jdFromDate(from.d, from.m, from.y);
    const jdB = CAL.jdFromDate(to.d, to.m, to.y);
    if (jdB < jdA) {
      formError('“Đến ngày” phải sau “Từ ngày”.');
      return;
    }
    const mode = $('input[name=mmode]:checked').value;
    const r = CAL.scanDays(F, from, to, { monthMode: mode, limit: LIMIT });
    renderResults(r, F, from, to, mode);
    writeHash(F, from, to, mode);
    if (o.scroll !== false) $('#lkResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderResults(r, F, from, to, mode) {
    const t = today();
    const todayJd = CAL.jdFromDate(t.d, t.m, t.y);
    const showHour = isSet(F.hour);
    const desc = describe(F);
    const modeTxt = mode === 'solar' ? 'tháng/năm theo tiết khí' : 'tháng/năm theo âm lịch';
    const upcoming = r.items.find((it) => it.jd >= todayJd);

    let summary = `Tìm thấy <b>${r.total.toLocaleString('vi-VN')}</b> ngày khớp <b>${esc(desc)}</b> (${modeTxt}), từ ${R.fmtDate(from)} đến ${R.fmtDate(to)}.`;
    if (upcoming) summary += ` Gần nhất sắp tới: <b>${R.fmtDate(upcoming.date)}</b> — ${relDays(upcoming.jd, todayJd)}.`;
    $('#lkSummary').innerHTML = summary;
    $('#lkFoot').textContent = r.truncated ? `Chỉ hiển thị ${LIMIT.toLocaleString('vi-VN')} ngày đầu tiên — thu hẹp khoảng thời gian để xem tiếp.` : '';

    if (!r.items.length) {
      $('#lkTable').innerHTML = '<tbody><tr><td class="empty">Không có ngày nào khớp trong khoảng này. Thử mở rộng khoảng thời gian, hoặc đổi cách tính tháng.</td></tr></tbody>';
      $('#lkResult').hidden = false;
      return;
    }

    const head = `<thead><tr><th>#</th><th>Dương lịch</th><th>Âm lịch</th><th>Ngày</th><th>Tháng</th><th>Năm</th>${showHour ? '<th>Giờ</th>' : ''}<th>Tiết khí</th><th>Cách hôm nay</th></tr></thead>`;
    const rows = r.items.map((it, i) => {
      const l = it.lunar;
      const cls = [it.jd < todayJd ? 'past' : '', it.jd === todayJd ? 'today' : '', upcoming && it === upcoming ? 'next' : ''].join(' ').trim();
      const termTxt = it.term ? `${esc(it.term.name)} <small class="muted">${hm(it.term.time)}</small>` : '<span class="muted">—</span>';
      const hours = showHour ? `<td data-label="Giờ">${it.hours.map((h) => `<span class="hl nowrap">${pn(h)}</span> <small class="muted nowrap">${hourRange(h.branch)}</small>`).join('<br>')}</td>` : '';
      return `<tr class="${cls}">
        <td class="idx" data-label="#">${i + 1}</td>
        <td data-label="Dương lịch"><b>${R.fmtDate(it.date)}</b><br><small class="muted">${WEEKDAYS[it.weekday]}</small></td>
        <td data-label="Âm lịch">${pad(l.day)}/${pad(l.month)}${l.leap ? '<small> nhuận</small>' : ''}/${l.year}</td>
        <td data-label="Ngày"><span class="${isSet(F.day) ? 'hl' : ''}">${pn(it.day)}</span></td>
        <td data-label="Tháng">${segCell(it, 'month', F)}</td>
        <td data-label="Năm">${segCell(it, 'year', F)}</td>
        ${hours}
        <td data-label="Tiết khí">${termTxt}</td>
        <td data-label="Cách hôm nay">${relDays(it.jd, todayJd)}</td>
      </tr>`;
    });
    $('#lkTable').innerHTML = head + '<tbody>' + rows.join('') + '</tbody>';
    $('#lkResult').hidden = false;
  }

  /* ---------- Liên kết ---------- */
  function writeHash(F, from, to, mode) {
    const p = new URLSearchParams();
    KINDS.forEach((K) => {
      if (isSet(F[K.k])) p.set(K.key, F[K.k].stem + '.' + F[K.k].branch);
    });
    p.set('mm', mode);
    p.set('f', ymd(from));
    p.set('t', ymd(to));
    try {
      history.replaceState(null, '', '#' + p.toString());
    } catch (e) {
      /* bỏ qua */
    }
  }

  function readHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return false;
    const p = new URLSearchParams(h);
    const F = {};
    let any = false;
    KINDS.forEach((K) => {
      const v = (p.get(K.key) || '').split('.');
      const stem = parseInt(v[0], 10);
      const branch = parseInt(v[1], 10);
      F[K.k] = {
        stem: stem >= 0 && stem < 10 ? stem : -1,
        branch: branch >= 0 && branch < 12 ? branch : -1
      };
      if (isSet(F[K.k])) any = true;
    });
    if (!any) return false;
    setFilters(F);
    if (p.get('mm') === 'lunar') $('input[name=mmode][value=lunar]').checked = true;
    if (parseYmd(p.get('f'))) $('#from').value = p.get('f');
    if (parseYmd(p.get('t'))) $('#to').value = p.get('t');
    updateModeHint();
    return true;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('on'), 2400);
  }

  function updateModeHint() {
    $('#mmHint').textContent = MM_HINT[$('input[name=mmode]:checked').value];
  }

  /* ---------- Khởi tạo ---------- */
  function init() {
    $('#brandMark').innerHTML = R.baguaSVG(40, '#f6e7cf', { stroke: 1.4 });
    buildSelects();
    applyPreset('10');
    updateModeHint();

    let qt;
    $('#quick').addEventListener('input', () => {
      clearTimeout(qt);
      qt = setTimeout(onQuick, 150);
    });
    $('#quick').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onQuick();
        search();
      }
    });
    $('#ccGrid').addEventListener('change', () => {
      validate(readFilters());
      formError('');
    });
    $$('input[name=mmode]').forEach((r) => r.addEventListener('change', updateModeHint));
    $('#presets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset]');
      if (b) applyPreset(b.dataset.preset);
    });
    ['#from', '#to'].forEach((s) =>
      $(s).addEventListener('input', () => $$('#presets .chip-btn').forEach((x) => x.setAttribute('aria-pressed', 'false')))
    );
    $('#searchBtn').addEventListener('click', () => search());
    $('#clearBtn').addEventListener('click', () => {
      $('#quick').value = '';
      $('#quickMsg').textContent = '';
      setFilters({});
      formError('');
    });
    $('#copyLink').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        toast('Đã sao chép liên kết tra cứu.');
      } catch (e) {
        toast('Không sao chép được — hãy sao chép địa chỉ trên thanh trình duyệt.');
      }
    });

    validate(readFilters());
    if (readHash()) search({ scroll: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
