/*
 * Soi hào: rê chuột (hoặc chạm) vào một hào trên lá quẻ để xem chi tiết hào đó
 * và các mũi tên quan hệ: Nguyệt → hào, Nhật → hào, hào động ↔ hào biến,
 * các hào động khác tác động lên hào, hào động tác động lên hào khác.
 */
(function (G) {
  'use strict';
  const LH = G.LH;
  const { BRANCHES, ELEMENTS, BRANCH_EL } = LH.cal;
  const I = LH.iching;
  const R = LH.render;
  const esc = R.esc;
  const ELC = R.EL_COLORS;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // Màu quan hệ
  const KIND = {
    sinh: { c: '#2e9d48', t: 'Sinh' },
    phu: { c: '#1f7fbf', t: 'Trợ / Phù' },
    khac: { c: '#d7263d', t: 'Khắc' },
    xung: { c: '#ef7d00', t: 'Xung / Phá' },
    hop: { c: '#8e44ad', t: 'Hợp' },
    hinh: { c: '#a0522d', t: 'Hình' },
    hai: { c: '#7d6b5d', t: 'Hại' },
    none: { c: '#9a8f82', t: 'Không tác động' }
  };

  // Các giai đoạn Trường sinh đáng chú ý của hào biến khi xét theo Nhật / Nguyệt
  const STAGE_TONE = { 'Trường Sinh': 'good', 'Đế Vượng': 'good', 'Mộ': 'bad', 'Tuyệt': 'bad' };

  let chartEl = null;
  let panelEl = null;
  let data = null;
  let current = null;
  let pinned = null;

  /* ---------- Phân loại quan hệ ---------- */
  // Tác động của chi nguồn lên chi đích
  function relOf(srcB, dstB) {
    const s = BRANCH_EL[srcB];
    const d = BRANCH_EL[dstB];
    const out = [];
    if (srcB !== dstB) {
      if (I.isClash(srcB, dstB)) out.push({ k: 'xung', t: 'xung' });
      else if (I.isCombine(srcB, dstB)) out.push({ k: 'hop', t: 'hợp' });
    }
    if (I.generates(s, d)) out.push({ k: 'sinh', t: 'sinh' });
    else if (I.controls(s, d)) out.push({ k: 'khac', t: 'khắc' });
    else if (s === d) out.push({ k: 'phu', t: srcB === dstB ? 'đồng chi' : 'trợ' });
    if (I.isHinh(srcB, dstB)) out.push({ k: 'hinh', t: 'hình' });
    if (I.isHai(srcB, dstB)) out.push({ k: 'hai', t: 'hại' });
    return out;
  }

  function kindOfTags(tags) {
    for (const k of ['xung', 'khac', 'sinh', 'hop', 'phu', 'hinh', 'hai']) if (tags.some((t) => t.k === k)) return k;
    return 'none';
  }

  function kindOfNames(names) {
    const s = names.join(' ');
    if (/Phá|Xung/.test(s)) return 'xung';
    if (/Khắc/.test(s)) return 'khac';
    if (/Sinh/.test(s)) return 'sinh';
    if (/Hợp/.test(s)) return 'hop';
    if (/Kiến|Lâm|Phù/.test(s)) return 'phu';
    if (/Hình/.test(s)) return 'hinh';
    if (/Hại/.test(s)) return 'hai';
    return 'none';
  }

  // Nhãn quan hệ Nhật/Nguyệt → hào
  function lordLabel(prefix, rels, lineEl, srcEl) {
    if (rels.length) return rels.map((r, i) => (i === 0 ? r : r.replace(/^(Nhật|Nguyệt) /, ''))).join(' · ');
    if (I.generates(lineEl, srcEl)) return `Hào sinh ${prefix} (tiết khí)`;
    if (I.controls(lineEl, srcEl)) return `Hào khắc ${prefix}`;
    return prefix;
  }

  function transformKind(tags) {
    if (!tags || !tags.length) return 'none';
    const t = tags[0];
    return t.tone === 'good' ? 'sinh' : t.tone === 'bad' ? (/Xung|Phản/.test(t.t) ? 'xung' : 'khac') : 'phu';
  }

  // Các tác động giữa các hào: hào động j → hào i
  function incoming(res, i) {
    const out = [];
    res.lines.forEach((l, j) => {
      if (j === i || !l.moving) return;
      const tags = relOf(l.branch, res.lines[i].branch);
      if (tags.length) out.push({ from: j, tags, kind: kindOfTags(tags) });
    });
    return out;
  }

  function outgoing(res, i) {
    const out = [];
    if (!res.lines[i].moving) return out;
    res.lines.forEach((l, k) => {
      if (k === i) return;
      const tags = relOf(res.lines[i].branch, l.branch).filter((t) => t.k !== 'phu');
      if (tags.length) out.push({ to: k, tags, kind: kindOfTags(tags) });
    });
    return out;
  }

  // Hào biến (của hào động i) tác động lên các hào khác của quẻ chủ — xét như một hào động
  function outgoingFromBien(res, i) {
    const out = [];
    const c = res.lines[i].changeTo;
    if (!c) return out;
    res.lines.forEach((l, k) => {
      if (k === i) return; // với chính hào động của nó đã có mũi tên hồi đầu
      const tags = relOf(c.branch, l.branch).filter((t) => t.k !== 'phu');
      if (tags.length) out.push({ to: k, tags, kind: kindOfTags(tags) });
    });
    return out;
  }

  /* ---------- Hình học ---------- */
  function geom() {
    const cr = chartEl.getBoundingClientRect();
    const w = parseFloat(getComputedStyle(chartEl).width) || chartEl.offsetWidth;
    return { cr, s: cr.width / w || 1 };
  }

  function box(el, g) {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - g.cr.left) / g.s - chartEl.clientLeft,
      y: (r.top - g.cr.top) / g.s - chartEl.clientTop,
      w: r.width / g.s,
      h: r.height / g.s
    };
  }

  const q = (sel) => chartEl.querySelector(sel);
  const rowEl = (pos) => q(`.ch-main tr[data-pos="${pos}"]`);

  /* ---------- SVG ---------- */
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
    return e;
  }

  function ensureSvg(g) {
    let svg = chartEl.querySelector('svg.ins-svg');
    if (!svg) {
      svg = svgEl('svg', { class: 'ins-svg', 'aria-hidden': 'true' });
      const defs = svgEl('defs');
      Object.keys(KIND).forEach((k) => {
        const m = svgEl('marker', { id: 'ah-' + k, viewBox: '0 0 10 10', refX: '8.5', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
        m.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 Z', fill: KIND[k].c }));
        defs.appendChild(m);
      });
      svg.appendChild(defs);
      chartEl.appendChild(svg);
    }
    const W = g.cr.width / g.s - chartEl.clientLeft * 2;
    const H = g.cr.height / g.s - chartEl.clientTop * 2;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    Array.from(svg.querySelectorAll('g.arr')).forEach((n) => n.remove());
    return svg;
  }

  function bez(p0, c1, c2, p3, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p3.y
    };
  }
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Vẽ mũi tên cong; nhãn tự trượt dọc đường cong để không đè lên chữ trên lá quẻ
  function drawArrow(svg, ctx, p0, p3, c1, c2, kind, label, opt) {
    const o = opt || {};
    const k = KIND[kind] ? kind : 'none';
    const col = KIND[k].c;
    const d = `M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`;
    const gEl = svgEl('g', { class: 'arr' });
    gEl.appendChild(svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.85 }));
    gEl.appendChild(svgEl('path', {
      d, fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round',
      'stroke-dasharray': o.dash ? '6 4' : 'none', 'marker-end': `url(#ah-${k})`
    }));
    svg.appendChild(gEl);
    if (!label) return;

    const lg = svgEl('g');
    const rect = svgEl('rect', { rx: 9, ry: 9, fill: '#fff', stroke: col, 'stroke-width': 1.4 });
    const text = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: col, 'font-size': 12.5, 'font-weight': 700, 'font-family': "'Noto Sans', Arial, sans-serif" });
    text.textContent = label;
    lg.appendChild(rect);
    lg.appendChild(text);
    gEl.appendChild(lg);
    let tw = 0;
    try {
      tw = text.getComputedTextLength();
    } catch (e) {
      tw = 0;
    }
    if (!tw) tw = label.length * 7;
    const w = tw + 16;
    const h = 22;
    const base = o.labelT == null ? 0.5 : o.labelT;
    const cands = [0, -0.05, 0.05, -0.1, 0.1, -0.15, 0.15, -0.2, 0.2, -0.25, 0.25, -0.3, 0.3]
      .map((x) => base + x)
      .filter((t) => t > 0.1 && t < 0.9);
    let pos = null;
    for (const t of cands) {
      const m = bez(p0, c1, c2, p3, t);
      const r = { x: m.x - w / 2, y: m.y - h / 2, w, h };
      if (!ctx.obstacles.some((ob) => hit(r, ob))) {
        pos = m;
        break;
      }
    }
    if (!pos) pos = bez(p0, c1, c2, p3, base);
    ctx.obstacles.push({ x: pos.x - w / 2 - 2, y: pos.y - h / 2 - 2, w: w + 4, h: h + 4 });
    lg.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    rect.setAttribute('x', -w / 2);
    rect.setAttribute('y', -h / 2);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
  }

  // Các vùng chữ cần tránh khi đặt nhãn
  const OBSTACLES = '.ch-k, .ch-row > .ch-v:not(.ch-split), .ch-split > span, .ch-brand span, .hexname, .hexpalace, .hexomen, .tri-lab, .mid-note, .ch-main thead th, .ch-main tbody .t, .ch-main tbody td.tk, .ch-main tbody td.tu';

  /* ---------- Vẽ ---------- */
  // side: 'dong' = soi hào (quẻ chủ), 'bien' = soi hào biến của hào động
  function draw(pos, side) {
    const res = data.res;
    const i = pos - 1;
    const l = res.lines[i];
    const bien = side === 'bien' && l.moving && l.changeTo;
    const subj = bien ? l.changeTo : l;
    const cal = data.cal;
    const g = geom();
    const svg = ensureSvg(g);
    const obsEls = Array.from(chartEl.querySelectorAll(OBSTACLES)).filter((el) => el.textContent.trim());
    const ctx = { obstacles: obsEls.map((el) => box(el, g)) };

    const ccL = (p) => box(rowEl(p).querySelector('td.cc-l .t'), g);
    const ccR = (p) => box(rowEl(p).querySelector('td.cc-r .t'), g);

    const target = bien ? ccR(pos) : ccL(pos);
    const related = new Set();

    // Nguyệt và Nhật → hào (hoặc → hào biến)
    const stageNote = (st) => (STAGE_TONE[st] ? ' · ' + st : '');
    const lords = [
      { node: q('[data-node="nguyet"]'), rels: subj.monthRel, prefix: 'Nguyệt', b: cal.pillars.month.branch, dx: 0.72, extra: ' · ' + subj.vs + (bien ? stageNote(subj.tsMonth) : '') },
      { node: q('[data-node="nhat"]'), rels: subj.dayRel, prefix: 'Nhật', b: cal.pillars.day.branch, dx: 0.28, extra: bien ? stageNote(subj.tsDay) : subj.status.length ? ' → ' + subj.status[0] : '' }
    ];
    lords.forEach((L, k) => {
      if (!L.node) return;
      const nb = box(L.node, g);
      const p0 = { x: nb.x + nb.w / 2, y: nb.y + nb.h + 3 };
      const p3 = { x: target.x + target.w * L.dx, y: target.y - 3 };
      const dy = p3.y - p0.y;
      const c1 = { x: p0.x, y: p0.y + dy * 0.5 };
      const c2 = { x: p3.x, y: p3.y - dy * 0.45 };
      const kind = kindOfNames(L.rels);
      drawArrow(svg, ctx, p0, p3, c1, c2, kind, lordLabel(L.prefix, L.rels, subj.el, BRANCH_EL[L.b]) + L.extra, { labelT: k === 0 ? 0.42 : 0.6 });
    });

    // Hào động ↔ hào biến
    if (l.moving && l.changeTo) {
      const a = ccL(pos);
      const b = ccR(pos);
      const kind = transformKind(l.transform);
      const back = l.transform.some((t) => /Hồi Đầu/.test(t.t));
      let p0 = { x: a.x + a.w + 4, y: a.y + a.h / 2 };
      let p3 = { x: b.x - 6, y: b.y + b.h / 2 };
      if (back) [p0, p3] = [{ x: p3.x + 2, y: p3.y }, { x: p0.x + 2, y: p0.y }];
      const c1 = { x: p0.x + (p3.x - p0.x) * 0.3, y: p0.y - 16 };
      const c2 = { x: p0.x + (p3.x - p0.x) * 0.7, y: p3.y - 16 };
      drawArrow(svg, ctx, p0, p3, c1, c2, kind, l.transform.filter((t) => !t.src).slice(0, 2).map((t) => t.t).join(' · '), { labelT: 0.5 });
    }

    // Quan hệ giữa các hào: không vẽ đường cong, gắn thẻ ngay trên hàng liên quan
    //   "khắc H5" trên hàng j  = hào j (động) khắc hào 5 đang soi
    //   "H5 khắc" trên hàng k  = hào 5 (đang soi, động) khắc hào k
    //   "B5 khắc" trên hàng k  = hào biến của hào 5 khắc hào k (khi soi hào biến)
    const tagsByRow = new Map();
    const addTag = (p, kind, text) => {
      if (!tagsByRow.has(p)) tagsByRow.set(p, []);
      tagsByRow.get(p).push({ kind, text });
    };
    if (bien) {
      outgoingFromBien(res, i).forEach((e) => addTag(e.to + 1, e.kind, `B${pos} ${e.tags.map((t) => t.t).join(' · ')}`));
    } else {
      const inc = incoming(res, i);
      inc.forEach((e) => addTag(e.from + 1, e.kind, `${e.tags.map((t) => t.t).join(' · ')} H${pos}`));
      outgoing(res, i).forEach((e) => {
        // Xung, hợp là quan hệ hai chiều: hàng đã có thẻ chiều vào thì không ghi lại
        const both = inc.some((x) => x.from === e.to);
        const tags = both ? e.tags.filter((t) => t.k !== 'xung' && t.k !== 'hop') : e.tags;
        if (tags.length) addTag(e.to + 1, kindOfTags(tags), `H${pos} ${tags.map((t) => t.t).join(' · ')}`);
      });
    }
    const rowKind = new Map();
    tagsByRow.forEach((list, p) => {
      related.add(p);
      rowKind.set(p, list[0].kind);
      const tr = rowEl(p);
      const rb = box(tr, g);
      const cy = rb.y + rb.h / 2;
      const anchors = [tr.querySelector('td.cc-l .t'), tr.querySelector('td.phuc .t')].filter(Boolean).map((el) => box(el, g));
      let x = Math.max(...anchors.map((b) => b.x + b.w)) + 10;
      const grp = svgEl('g', { class: 'arr' });
      grp.appendChild(svgEl('rect', { x: rb.x - 9, y: rb.y + 5, width: 4, height: rb.h - 10, rx: 2, fill: KIND[list[0].kind].c }));
      svg.appendChild(grp);
      list.forEach((t) => {
        x += drawTag(grp, x, cy, t.kind, t.text) + 6;
      });
    });

    markRows(pos, related, rowKind, bien);
  }

  // Đánh dấu hàng đang soi / hàng liên quan
  function markRows(pos, related, rowKind, bien) {
    chartEl.classList.add('ins-on');
    chartEl.classList.toggle('ins-bien', !!bien);
    chartEl.querySelectorAll('tr[data-pos]').forEach((tr) => {
      const p = +tr.dataset.pos;
      const rel = p !== pos && related.has(p);
      tr.classList.toggle('ins-focus', p === pos);
      tr.classList.toggle('ins-rel', rel);
      if (rel) tr.style.setProperty('--relc', KIND[rowKind.get(p) || 'none'].c);
      else tr.style.removeProperty('--relc');
    });
  }

  // Thẻ quan hệ (viên thuốc) vẽ trong SVG; trả về bề rộng
  function drawTag(parent, x, cy, kind, text) {
    const col = (KIND[kind] || KIND.none).c;
    const gEl = svgEl('g', { transform: `translate(${x},${cy})` });
    const rect = svgEl('rect', { rx: 10, ry: 10, fill: col });
    const t = svgEl('text', { x: 9, 'dominant-baseline': 'central', fill: '#fff', 'font-size': 12.5, 'font-weight': 700, 'font-family': "'Noto Sans', Arial, sans-serif" });
    t.textContent = text;
    gEl.appendChild(rect);
    gEl.appendChild(t);
    parent.appendChild(gEl);
    let tw = 0;
    try {
      tw = t.getComputedTextLength();
    } catch (e) {
      tw = 0;
    }
    if (!tw) tw = text.length * 7;
    const w = tw + 18;
    rect.setAttribute('x', 0);
    rect.setAttribute('y', -11);
    rect.setAttribute('width', w);
    rect.setAttribute('height', 22);
    return w;
  }

  function clearDraw() {
    if (!chartEl) return;
    chartEl.classList.remove('ins-on', 'ins-bien');
    chartEl.querySelectorAll('.hexname.ins-active').forEach((el) => el.classList.remove('ins-active'));
    chartEl.querySelectorAll('tr.ins-focus, tr.ins-rel').forEach((tr) => tr.classList.remove('ins-focus', 'ins-rel'));
    const svg = chartEl.querySelector('svg.ins-svg');
    if (svg) svg.remove();
  }

  /* ---------- Bảng chi tiết ---------- */
  const elName = (b) => `<span class="el-${BRANCH_EL[b]}"><b>${BRANCHES[b]}</b>-${ELEMENTS[BRANCH_EL[b]]}</span>`;
  const dot = (el) => `<i class="el-dot" style="background:${ELC[el]}"></i>`;
  const pill = (kind, text) => `<span class="rel-pill" style="--rc:${(KIND[kind] || KIND.none).c}">${esc(text)}</span>`;
  const chip = (text, tone) => `<span class="chip ${tone || ''}">${esc(text)}</span>`;

  function legendHTML() {
    const kinds = ['sinh', 'phu', 'khac', 'xung', 'hop', 'hinh', 'hai'].map((k) => `<span class="lg-item"><i style="background:${KIND[k].c}"></i>${KIND[k].t}</span>`).join('');
    const els = ELEMENTS.map((e, i) => `<span class="lg-item"><i class="round" style="background:${ELC[i]}"></i>${e}</span>`).join('');
    return `<div class="hp-legend"><div>${kinds}</div><div>${els}</div>
      <div class="lg-note">Thẻ trên hàng: <b>H5 khắc</b> = hào 5 khắc hào đó · <b>khắc H5</b> = hào đó (động) khắc hào 5 · <b>B5 khắc</b> = hào biến của hào 5 khắc hào đó</div></div>`;
  }

  function placeholderHTML() {
    return `<div class="hp-empty">
      <div class="hp-kicker">Soi hào</div>
      <p>Rê chuột vào một hào trên lá quẻ để xem chi tiết và các mũi tên quan hệ với Nhật, Nguyệt, hào biến, hào động. Rê vào <b>tên quẻ</b> để đọc Tổng quan – Quẻ tượng – Lục hào tượng. Bấm để ghim lại.</p>
      ${legendHTML()}
    </div>`;
  }

  function panelHTML(pos) {
    const res = data.res;
    const cal = data.cal;
    const l = res.lines[pos - 1];
    const c = l.changeTo;
    const mb = cal.pillars.month.branch;
    const db = cal.pillars.day.branch;
    const tags = [];
    if (l.isThe) tags.push(chip('Thế', 'mv'));
    if (l.isUng) tags.push(chip('Ứng', 'note'));
    if (l.moving) tags.push(chip(l.yang ? 'Động — Lão Dương (O)' : 'Động — Lão Âm (X)', 'mv'));
    if (l.isVoid) tags.push(chip('Tuần Không', 'warn'));
    tags.push(chip(l.beast));

    const sec = (title, body) => `<div class="hp-sec"><div class="hp-k">${title}</div><div class="hp-v">${body}</div></div>`;
    let html = `<div class="hp-head" style="--elc:${ELC[l.el]}">
      <div class="hp-kicker">Hào ${l.pos} · ${l.posName}${pinned === keyOf(pos) ? ' · <span class="hp-pin">đang ghim</span>' : ''}
        ${pinned === keyOf(pos) ? '<button type="button" class="hp-x" data-unpin aria-label="Bỏ ghim">×</button>' : ''}</div>
      <div class="hp-title">${dot(l.el)} ${esc(l.relName)} <span class="el-${l.el}">${esc(l.canChi)}</span> <small>${ELEMENTS[l.el]}</small></div>
      <div class="chips">${tags.join('')}</div>
    </div>`;

    const mKind = kindOfNames(l.monthRel);
    html += sec('Nguyệt lệnh', `${elName(mb)} → ${pill(mKind, lordLabel('Nguyệt', l.monthRel, l.el, BRANCH_EL[mb]))}
      <div class="hp-sub">Vượng suy: <b>${l.vs}</b> · Trường sinh theo Nguyệt: <b>${esc(l.tsMonth)}</b></div>`);

    const dKind = kindOfNames(l.dayRel);
    html += sec('Nhật thần', `${elName(db)} → ${pill(dKind, lordLabel('Nhật', l.dayRel, l.el, BRANCH_EL[db]))}
      ${l.status.length ? `<div class="hp-sub">${l.status.map((s) => chip(s, 'warn')).join(' ')}</div>` : ''}
      <div class="hp-sub">Trường sinh theo Nhật: <b>${esc(l.tsDay)}</b></div>`);

    if (l.moving && c) {
      html += sec('Hào biến', `<div>${dot(c.el)} ${esc(c.relName)} <span class="el-${c.el}">${esc(c.canChi)}</span> <small>${ELEMENTS[c.el]}</small></div>
        <div class="chips">${l.transform.filter((t) => !t.src).map(tchip).join('')}</div>
        ${bienLordRows(c)}
        <div class="hp-sub muted">Rê chuột sang nửa quẻ biến của hàng này để soi riêng hào biến.</div>`);
    }

    const inc = incoming(res, pos - 1);
    if (inc.length) {
      html += sec('Hào động tác động', inc.map((e) => {
        const s = res.lines[e.from];
        return `<div class="hp-row">${pill(e.kind, e.tags.map((t) => t.t).join(' · '))} từ hào ${e.from + 1} ${esc(s.relName)} ${elName(s.branch)}</div>`;
      }).join(''));
    } else if (res.hasMoving) {
      html += sec('Hào động tác động', '<span class="muted">Không có hào động nào sinh, khắc, xung, hợp hào này.</span>');
    }

    const out = outgoing(res, pos - 1);
    if (out.length) {
      html += sec('Hào này tác động ra', out.map((e) => {
        const t = res.lines[e.to];
        return `<div class="hp-row">${pill(e.kind, e.tags.map((x) => x.t).join(' · '))} hào ${e.to + 1} ${esc(t.relName)} ${elName(t.branch)}${t.isThe ? ' (Thế)' : t.isUng ? ' (Ứng)' : ''}</div>`;
      }).join(''));
    }

    if (l.hidden) {
      const h = l.hidden;
      html += sec('Phục thần', `${dot(h.el)} ${esc(h.relName)} <span class="el-${h.el}">${esc(h.canChi)}</span> <small>${ELEMENTS[h.el]}</small>
        <div class="chips">${chip(h.relation)}${chip(h.vs)}${h.isVoid ? chip('Tuần Không', 'warn') : ''}</div>`);
    }

    if (l.stars.length) html += sec('Thần sát', l.stars.map((s) => chip(s, 'note')).join(' '));

    html += legendHTML();
    html += `<p class="hp-hint">${pinned === keyOf(pos) ? 'Bấm lại vào hào hoặc nhấn Esc để bỏ ghim.' : 'Bấm vào hào để ghim bảng này.'}</p>`;
    return html;
  }

  const tchip = (t) => chip(t.t, t.tone === 'good' ? 'good' : t.tone === 'bad' ? 'bad' : '');

  // Nhật / Nguyệt xét cho hào biến: quan hệ, vượng suy, vòng trường sinh (Mộ, Tuyệt, ...)
  function bienLordRows(c) {
    const cal = data.cal;
    const mb = cal.pillars.month.branch;
    const db = cal.pillars.day.branch;
    const stage = (st, src) => (STAGE_TONE[st] ? chip(`Hóa ${st} tại ${src}`, STAGE_TONE[st]) : '');
    return `<div class="hp-row">Nguyệt ${elName(mb)} → ${pill(kindOfNames(c.monthRel), lordLabel('Nguyệt', c.monthRel, c.el, BRANCH_EL[mb]))}
        <span class="hp-sub">· <b>${c.vs}</b> · T.Sinh: <b>${esc(c.tsMonth)}</b></span> ${stage(c.tsMonth, 'Nguyệt')}</div>
      <div class="hp-row">Nhật ${elName(db)} → ${pill(kindOfNames(c.dayRel), lordLabel('Nhật', c.dayRel, c.el, BRANCH_EL[db]))}
        <span class="hp-sub">· T.Sinh: <b>${esc(c.tsDay)}</b></span> ${stage(c.tsDay, 'Nhật')}</div>
      ${c.isVoid ? `<div class="chips">${chip('Hóa Không (Tuần Không)', 'bad')}</div>` : ''}`;
  }

  // Bảng chi tiết khi soi riêng hào biến
  function bienPanelHTML(pos) {
    const res = data.res;
    const cal = data.cal;
    const l = res.lines[pos - 1];
    const c = l.changeTo;
    const mb = cal.pillars.month.branch;
    const db = cal.pillars.day.branch;
    const key = keyOf(pos, 'bien');
    const tags = [];
    if (c.isThe) tags.push(chip('Thế (quẻ biến)', 'mv'));
    if (c.isUng) tags.push(chip('Ứng (quẻ biến)', 'note'));
    if (c.isVoid) tags.push(chip('Tuần Không', 'warn'));
    const sec = (title, body) => `<div class="hp-sec"><div class="hp-k">${title}</div><div class="hp-v">${body}</div></div>`;
    const stage = (st, src) => (STAGE_TONE[st] ? ` ${chip(`Hóa ${st} tại ${src}`, STAGE_TONE[st])}` : '');
    let html = `<div class="hp-head" style="--elc:${ELC[c.el]}">
      <div class="hp-kicker">Hào biến · từ hào ${l.pos} (${l.posName})${pinned === key ? ' · <span class="hp-pin">đang ghim</span>' : ''}
        ${pinned === key ? '<button type="button" class="hp-x" data-unpin aria-label="Bỏ ghim">×</button>' : ''}</div>
      <div class="hp-title">${dot(c.el)} ${esc(c.relName)} <span class="el-${c.el}">${esc(c.canChi)}</span> <small>${ELEMENTS[c.el]}</small></div>
      <div class="chips">${tags.join('')}</div>
    </div>`;
    html += sec('Nguyệt lệnh', `${elName(mb)} → ${pill(kindOfNames(c.monthRel), lordLabel('Nguyệt', c.monthRel, c.el, BRANCH_EL[mb]))}
      <div class="hp-sub">Vượng suy: <b>${c.vs}</b> · Trường sinh theo Nguyệt: <b>${esc(c.tsMonth)}</b>${stage(c.tsMonth, 'Nguyệt')}</div>`);
    html += sec('Nhật thần', `${elName(db)} → ${pill(kindOfNames(c.dayRel), lordLabel('Nhật', c.dayRel, c.el, BRANCH_EL[db]))}
      <div class="hp-sub">Trường sinh theo Nhật: <b>${esc(c.tsDay)}</b>${stage(c.tsDay, 'Nhật')}</div>`);
    html += sec('Với hào động', `<div>${dot(l.el)} ${esc(l.relName)} <span class="el-${l.el}">${esc(l.canChi)}</span> → ${dot(c.el)} <span class="el-${c.el}">${esc(c.canChi)}</span></div>
      <div class="chips">${l.transform.filter((t) => !t.src).map(tchip).join('')}</div>`);
    const outB = outgoingFromBien(res, pos - 1);
    html += sec('Hào biến tác động ra', (outB.length
      ? outB.map((e) => {
        const t = res.lines[e.to];
        return `<div class="hp-row">${pill(e.kind, e.tags.map((x) => x.t).join(' · '))} hào ${e.to + 1} ${esc(t.relName)} ${elName(t.branch)}${t.isThe ? ' (Thế)' : t.isUng ? ' (Ứng)' : ''}</div>`;
      }).join('')
      : '<span class="muted">Không sinh, khắc, xung, hợp hào nào khác.</span>') +
      '<div class="hp-sub muted">Xét hào biến như một hào động để tham khảo; theo phép cổ, hào biến chủ yếu chỉ tác động lại chính hào động của nó (hồi đầu sinh / khắc).</div>');
    if (c.stars.length) html += sec('Thần sát', c.stars.map((s) => chip(s, 'note')).join(' '));
    html += legendHTML();
    html += `<p class="hp-hint">${pinned === key ? 'Bấm lại hoặc nhấn Esc để bỏ ghim.' : 'Bấm để ghim bảng này.'}</p>`;
    return html;
  }

  function renderPanel(pos, side) {
    if (!panelEl) return;
    if (pos == null) {
      panelEl.innerHTML = placeholderHTML();
      panelEl.classList.remove('on');
      return;
    }
    panelEl.innerHTML = side === 'bien' ? bienPanelHTML(pos) : panelHTML(pos);
    panelEl.classList.add('on');
  }

  /* ---------- Nội dung quẻ (Dịch kinh Chân tủy) ---------- */
  function queHTML(which) {
    const res = data.res;
    const h = which === 'changed' ? res.changed || res.main : res.main;
    const src = G.LH_QUE_TUONG;
    const item = src && src.items ? src.items[`${h.upper}-${h.lower}`] : null;
    const key = 'q' + which;
    const T = I.TRIGRAMS;
    const elChip = (text, el) => `<span class="q-chip el" style="--c:var(--el-${el})"><i></i>${esc(text)}</span>`;
    const chips = [
      elChip('Họ ' + h.palaceName, h.palaceEl),
      `<span class="q-chip order">${esc(h.orderName)}</span>`,
      h.lucXung ? '<span class="q-chip xung">Lục Xung</span>' : h.lucHop ? '<span class="q-chip hop">Lục Hợp</span>' : '',
      elChip(`Thượng ${T[h.upper].name} · ${ELEMENTS[T[h.upper].el]}`, T[h.upper].el),
      elChip(`Hạ ${T[h.lower].name} · ${ELEMENTS[T[h.lower].el]}`, T[h.lower].el)
    ].join('');
    const sec = (cls, title, paras) => `<div class="q-sec ${cls}"><div class="q-k">${title}</div><div class="q-body">${
      paras && paras.length
        ? paras.map((p) => (/bao hàm/i.test(p) ? `<p class="q-sum">${hlText(p)}</p>` : `<p>${hlText(p)}</p>`)).join('')
        : '<p class="muted">Bản OCR hiện có thiếu mục này.</p>'
    }</div></div>`;
    let html = `<div class="q-head">
      <div class="hp-kicker">${which === 'changed' ? (res.changed ? 'Quẻ biến' : 'Quẻ biến (quẻ tĩnh)') : 'Quẻ chủ'} ${pinned === key ? ' · <span class="hp-pin">đang ghim</span>' : ''}
        ${pinned === key ? '<button type="button" class="hp-x" data-unpin aria-label="Bỏ ghim">×</button>' : ''}</div>
      <div class="q-title">${esc(h.name)}</div>
      <div class="q-omen">${esc(h.omen)}</div>
      <div class="q-chips">${chips}</div>
    </div>`;
    if (!item) {
      html += `<div class="q-sec"><p class="muted">Bản OCR sách hiện có chưa có phần giải cho quẻ này.</p></div>`;
    } else {
      html += sec('tq', 'Tổng quan', item.tongQuan) + sec('qt', 'Quẻ tượng', item.queTuong) + sec('lh', 'Lục hào tượng', item.lucHao);
    }
    return html;
  }

  // Tô sáng từ khóa trong đoạn giải quẻ: ngũ hành, lục thân, Thế/Ứng, vị trí hào
  const NB = '(?<![\\p{L}])';
  const NA = '(?![\\p{L}])';
  const EL_WORD = { 'mộc': 0, 'hỏa': 1, 'hoả': 1, 'thổ': 2, 'kim': 3, 'thủy': 4, 'thuỷ': 4 };
  const RE_LUCTHAN = new RegExp(`${NB}(Phụ\\s+Mẫu|Huynh\\s+đệ|Tử\\s+tôn|Thê\\s+tài|Quan\\s+quỷ)${NA}`, 'giu');
  const RE_EL = new RegExp(`${NB}(mộc|hỏa|hoả|thổ|kim|thủy|thuỷ)${NA}`, 'giu');
  const RE_HAO = new RegExp(`${NB}(sơ\\s+hào|hào\\s+(?:sơ|hai|ba|bốn|năm|sáu))${NA}`, 'giu');
  const RE_THEUNG = new RegExp(`${NB}(Thế|Ứng)${NA}`, 'gu');
  function hlText(p) {
    return esc(p)
      .replace(RE_LUCTHAN, '<b class="kw-lt">$1</b>')
      .replace(RE_EL, (m) => `<span class="kw-el" style="--c:var(--el-${EL_WORD[m.toLowerCase()]})">${m}</span>`)
      .replace(RE_HAO, '<span class="kw-hao">$1</span>')
      .replace(RE_THEUNG, '<span class="kw-tu">$1</span>');
  }

  function focusQue(which) {
    if (!data) return;
    current = 'q' + which;
    clearDraw();
    chartEl.querySelectorAll('.hexname[data-hex]').forEach((el) => el.classList.toggle('ins-active', el.dataset.hex === which));
    panelEl.innerHTML = queHTML(which);
    panelEl.classList.add('on');
    panelEl.scrollTop = 0;
  }

  /* ---------- Điều khiển ---------- */
  // Khóa trạng thái: "5" = soi hào 5, "5b" = soi hào biến của hào 5, "qmain"/"qchanged" = nội dung quẻ
  const keyOf = (pos, side) => pos + (side === 'bien' ? 'b' : '');
  const parseKey = (k) => ({ pos: parseInt(k, 10), side: /b$/.test(k) ? 'bien' : 'dong' });
  const isQueKey = (k) => typeof k === 'string' && k.charAt(0) === 'q';

  function focusTarget(t) {
    if (t.que) focusQue(t.que);
    else focus(t.pos, t.side);
  }

  // Xác định đang trỏ vào tên quẻ, hoặc nửa nào của hàng (nửa quẻ biến chỉ có nghĩa khi hào động)
  function targetOf(e) {
    const hn = e.target.closest('.hexname[data-hex]');
    if (hn) return { que: hn.dataset.hex, key: 'q' + hn.dataset.hex };
    const tr = e.target.closest('tr[data-pos]');
    if (!tr) return null;
    const pos = +tr.dataset.pos;
    const td = e.target.closest('td');
    const half = tr.closest('.ch-sub') ? 7 : 6;
    const l = data.res.lines[pos - 1];
    const side = td && td.cellIndex >= half && l.moving && l.changeTo ? 'bien' : 'dong';
    return { pos, side, key: keyOf(pos, side) };
  }

  function focus(pos, side) {
    if (!data) return;
    current = keyOf(pos, side);
    draw(pos, side);
    renderPanel(pos, side);
  }

  function clear() {
    current = null;
    pinned = null;
    clearDraw();
    renderPanel(null);
  }

  function init(chart, panel) {
    chartEl = chart;
    panelEl = panel;
    // Chỉ rê chuột thật mới soi theo hover; cảm ứng dùng chạm (click) để ghim
    chartEl.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse' || pinned || !data) return;
      const t = targetOf(e);
      if (t && t.key !== current) focusTarget(t);
    });
    chartEl.addEventListener('click', (e) => {
      if (!data) return;
      const t = targetOf(e);
      if (!t) {
        if (current) clear();
        return;
      }
      if (pinned === t.key) {
        pinned = null;
        if (e.pointerType && e.pointerType !== 'mouse') clear();
        else focusTarget(t);
      } else {
        pinned = t.key;
        focusTarget(t);
        if (!t.que) keepRowVisible(t.pos);
      }
    });
    panelEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-unpin]')) clear();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && current) clear();
    });
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        if (current && !isQueKey(current)) draw(parseKey(current).pos, parseKey(current).side);
      }, 150);
    });
  }

  // Màn hình hẹp: bảng chi tiết trượt từ dưới lên — cuộn để hào đang soi nằm phía trên
  function keepRowVisible(pos) {
    if (!window.matchMedia || !window.matchMedia('(max-width: 640px)').matches) return;
    const r = rowEl(pos).getBoundingClientRect();
    const free = window.innerHeight - panelEl.offsetHeight - 12;
    if (r.top >= 64 && r.bottom <= free) return;
    window.scrollBy({ top: r.top - Math.max(70, (free - r.height) / 2), behavior: 'smooth' });
  }

  function setData(d) {
    data = d;
    current = null;
    pinned = null;
    clearDraw();
    renderPanel(null);
  }

  // Vẽ lại khi lá quẻ đổi kích thước (thu vừa màn hình)
  function refresh() {
    if (current && !isQueKey(current)) draw(parseKey(current).pos, parseKey(current).side);
  }

  LH.inspect = { init, setData, clear, refresh, relOf };
})(typeof globalThis !== 'undefined' ? globalThis : window);
