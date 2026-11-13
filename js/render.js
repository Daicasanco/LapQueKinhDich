/*
 * Hiển thị: lá quẻ (chart) theo mẫu + các bảng phân tích chi tiết
 */
(function (G) {
  'use strict';
  const LH = G.LH;
  const { STEMS, BRANCHES, ELEMENTS, BRANCH_EL, STEM_EL, jdFromDate, jdToDate } = LH.cal;
  const I = LH.iching;

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (o) => `${pad(o.d)}/${pad(o.m)}/${o.y}`;
  const fmtTime = (o) => `${pad(o.h)}:${pad(o.mi)}:${pad(o.s || 0)}`;
  const fmtHM = (o) => `${pad(o.h)}:${pad(o.mi)}`;
  const pillar = (p) => STEMS[p.stem] + ' ' + BRANCHES[p.branch];
  const brEl = (b) => BRANCHES[b] + '-' + ELEMENTS[BRANCH_EL[b]];
  const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  /* ---------- Hình vẽ ---------- */
  function lineGlyph(yang, moving, extra) {
    return `<span class="lg ${yang ? 'yang' : 'yin'}${moving ? ' mv' : ''}${extra ? ' ' + extra : ''}" aria-hidden="true"><i></i><i></i></span>`;
  }

  function hexFigure(bits, moving, size) {
    let html = `<div class="hexfig ${size || ''}" role="img" aria-label="Hình quẻ">`;
    for (let i = 5; i >= 0; i--) html += lineGlyph(bits[i] === 1, moving && moving[i]);
    return html + '</div>';
  }

  // Biểu tượng Bát quái + Thái cực (vẽ bằng SVG)
  function baguaSVG(size, color, opts) {
    const o = Object.assign({ ring: true, stroke: 2 }, opts || {});
    const c = size / 2;
    const R = size * 0.2;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">`;
    s += `<g transform="translate(${c} ${c})" fill="${color}" stroke="none">`;
    if (o.ring) {
      s += `<circle r="${size * 0.47}" fill="none" stroke="${color}" stroke-width="${o.stroke}"/>`;
      s += `<circle r="${size * 0.27}" fill="none" stroke="${color}" stroke-width="${o.stroke * 0.6}"/>`;
      // 8 quẻ theo Hậu thiên quanh vòng (Ly ở trên)
      const order = [2, 1, 0, 5, 6, 3, 4, 7]; // vị trí: S, SW... chỉ để trang trí
      const tri = I.TRIGRAMS;
      const bw = size * 0.13, bh = size * 0.022, gap = size * 0.018;
      for (let k = 0; k < 8; k++) {
        const t = tri[order[k]];
        s += `<g transform="rotate(${k * 45}) translate(0 ${-size * 0.37})">`;
        for (let j = 0; j < 3; j++) {
          const y = (1 - j) * (bh + gap) - bh / 2; // hào dưới gần tâm
          const yy = -y - bh;
          if (t.bits[j]) s += `<rect x="${-bw / 2}" y="${yy}" width="${bw}" height="${bh}" rx="${bh / 3}"/>`;
          else {
            const w = bw * 0.42;
            s += `<rect x="${-bw / 2}" y="${yy}" width="${w}" height="${bh}" rx="${bh / 3}"/>`;
            s += `<rect x="${bw / 2 - w}" y="${yy}" width="${w}" height="${bh}" rx="${bh / 3}"/>`;
          }
        }
        s += '</g>';
      }
    }
    s += `<circle r="${R}" fill="none" stroke="${color}" stroke-width="${o.stroke * 0.8}"/>`;
    s += `<path d="M0,${-R} A${R},${R} 0 0,1 0,${R} A${R / 2},${R / 2} 0 0,1 0,0 A${R / 2},${R / 2} 0 0,0 0,${-R} Z"/>`;
    s += `<circle cy="${-R / 2}" r="${R / 7}"/>`;
    s += `<circle cy="${R / 2}" r="${R / 7}" fill="#fff"/>`;
    s += '</g></svg>';
    return s;
  }

  /* ---------- Chuỗi tiện ích ---------- */
  function lunarText(cal) {
    const l = cal.lunar;
    return `giờ ${BRANCHES[cal.pillars.hour.branch]}, ngày ${pad(l.day)}/${pad(l.month)}${l.leap ? ' (nhuận)' : ''}/${l.year}`;
  }

  function canChiText(cal) {
    const p = cal.pillars;
    return `Giờ ${pillar(p.hour)}, ngày ${pillar(p.day)}, tháng ${pillar(p.month)}, năm ${pillar(p.year)}`;
  }

  function hexTitle(h) {
    return h ? h.name.toUpperCase() : '';
  }

  const tuText = (l) => (l ? (l.isThe ? 'Thế' : l.isUng ? 'Ứng' : '') : '');
  const mark = (l, k, s) => (l.marks[k] ? s : '-');

  /* ---------- Lá quẻ ---------- */
  function chart(data, cfg) {
    const { question, methodLabel, cal, res } = data;
    const L = res.lines;
    const C = res.changedLines;
    const conf = cfg || {};
    const p = cal.pillars;

    const elT = (el, text, cls) => `<span class="t${cls ? ' ' + cls : ''}" data-el="${el}">${esc(text)}</span>`;

    const head = `
      <div class="ch-head">
        <div class="ch-headtext">
          <div class="ch-brand"><span class="ch-site">${esc(conf.siteName || 'Lục Hào')}</span><span class="ch-app">AN QUẺ LỤC HÀO</span></div>
          <div class="ch-info">
            <div class="ch-row"><span class="ch-k">Việc cần xem:</span><span class="ch-v ch-q">${esc(question || '—')}</span></div>
            <div class="ch-row"><span class="ch-k">Thời gian lập quẻ:</span><span class="ch-v">${fmtTime(cal.input)} - ${fmtDate(cal.input)} - Âm Lịch: ${lunarText(cal)} ( ${esc(cal.term.name)} )</span></div>
            <div class="ch-row"><span class="ch-k">Can Chi:</span><span class="ch-v">${canChiText(cal)}</span></div>
            <div class="ch-row"><span class="ch-k">Tiết khí:</span><span class="ch-v ch-split">
              <span>Nhật lệnh: <b class="nd" data-node="nhat" data-el="${BRANCH_EL[p.day.branch]}">${brEl(p.day.branch)}</b></span>
              <span>Nguyệt lệnh: <b class="nd" data-node="nguyet" data-el="${BRANCH_EL[p.month.branch]}">${brEl(p.month.branch)}</b></span>
              <span>Tuần không: <b>${cal.tuan.voids.map((v) => BRANCHES[v]).join(', ')}</b></span></span></div>
            <div class="ch-row"><span class="ch-k">Phương pháp lập quẻ:</span><span class="ch-v"><b>${esc(methodLabel)}</b></span></div>
          </div>
        </div>
        <div class="ch-emblem">${baguaSVG(104, '#c8232c', { stroke: 2 })}</div>
      </div>`;

    // Họ + loại quẻ: HỌ CHẤN (LỤC XUNG). Cạnh hình quẻ ghi Thượng/Hạ quái
    // (quẻ chủ ghi bên trái, quẻ biến ghi bên phải cho cân đối)
    const hexCol = (h, moving, annotate, side) => {
      const tl = annotate ? typeLabel(h) : '';
      // Nhãn quái: tên + ngũ hành (tô màu ngũ hành) ở dòng dưới
      const tri = (cls, prefix, t) =>
        `<span class="tri-lab ${cls}"><span class="tri-name">${esc(prefix + ' ' + t.name)}</span><span class="tri-el el-${t.el}">${ELEMENTS[t.el]}</span></span>`;
      // Hai nhãn chung một cột (cùng bề rộng) để trên – dưới cùng trục giữa
      return `<div class="hexcol">
        <h3 class="hexname" data-hex="${side === 'left' ? 'main' : 'changed'}">${esc(hexTitle(h))}</h3>
        <div class="hexfig-wrap">
          ${hexFigure(h.bits, moving)}
          <div class="tri-col ${side}">
            ${tri('tri-up', 'Thượng', I.TRIGRAMS[h.upper])}
            ${tri('tri-lo', 'Hạ', I.TRIGRAMS[h.lower])}
          </div>
        </div>
        <div class="hexpalace">HỌ ${esc(h.palaceName.toUpperCase())}${tl ? ' (' + tl + ')' : ''}</div>
        <div class="hexomen">${esc(h.omen.toUpperCase())}</div>
      </div>`;
    };
    const mids = middleNotes(res);
    const hexes = `
      <div class="ch-hex">
        ${hexCol(res.main, res.moving, true, 'left')}
        <div class="hexmid">${mids.map((n) => `<div class="mid-note${n.cls ? ' ' + n.cls : ''}">${esc(n.t)}</div>`).join('')}</div>
        ${hexCol(res.changed || res.main, null, true, 'right')}
      </div>`;

    // Quẻ tĩnh: bên quẻ biến lặp lại y hệt quẻ chủ
    const S = C || L;
    let rows = '';
    for (let i = 5; i >= 0; i--) {
      const l = L[i];
      const c = S[i];
      rows += `<tr class="${l.moving ? 'mv' : ''}" data-pos="${i + 1}">
        <td class="g">${lineGlyph(l.yang, l.moving)}</td>
        <td class="tu">${tuText(l)}</td>
        <td class="rel-l">${elT(l.el, l.relName, 'rel')}</td>
        <td class="cc-l">${elT(l.el, l.label)}</td>
        <td class="phuc">${l.hidden ? elT(l.hidden.el, l.hidden.relShort + '-' + BRANCHES[l.hidden.branch]) : ''}</td>
        <td class="tk">${l.isVoid ? 'K' : ''}</td>
        <td class="div rel-r">${elT(c.el, c.relName, 'rel')}</td>
        <td class="cc-r">${elT(c.el, c.label)}</td>
        <td class="tk">${c.isVoid ? 'K' : ''}</td>
        <td>${esc(res.beasts[i])}</td>
        <td class="tu">${tuText(c)}</td>
        <td class="g gr">${lineGlyph(c.yang, false)}</td>
      </tr>`;
    }
    const mainTable = `
      <table class="ch-table ch-main">
        <colgroup><col style="width:72px"><col style="width:52px"><col style="width:108px"><col style="width:104px"><col style="width:98px"><col style="width:34px">
        <col style="width:106px"><col style="width:104px"><col style="width:34px"><col style="width:108px"><col style="width:46px"><col style="width:70px"></colgroup>
        <thead><tr><th>Hào</th><th>T/Ư</th><th>Lục Thân</th><th>Can Chi</th><th>Phục thần</th><th class="tk">TK</th>
        <th class="div">Lục Thân</th><th>Can Chi</th><th class="tk">TK</th><th>Lục Thú</th><th>T/Ư</th><th class="gr">Hào</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    let rows2 = '';
    for (let i = 5; i >= 0; i--) {
      const l = L[i];
      const c = S[i];
      rows2 += `<tr class="${l.moving ? 'mv' : ''}" data-pos="${i + 1}">
        <td>${esc(l.canChi)}</td><td>${l.vs}</td>
        <td class="c">${l.marks.quai ? 'QT' : l.marks.huongkhue ? 'H.Khuê' : l.marks.sangtruong ? 'S.Trướng' : '-'}</td><td class="c">${mark(l, 'loc', 'L')}</td><td class="c">${mark(l, 'ma', 'M')}</td><td class="c">${mark(l, 'quy', 'Q')}</td><td class="c">${mark(l, 'dao', 'Đ')}</td>
        <td class="div">${esc(c.canChi)}</td><td>${c.vs}</td>
        <td class="c">${mark(c, 'loc', 'L')}</td><td class="c">${mark(c, 'ma', 'M')}</td><td class="c">${mark(c, 'quy', 'Q')}</td><td class="c">${mark(c, 'dao', 'Đ')}</td>
      </tr>`;
    }
    const subTable = `
      <table class="ch-table ch-sub">
        <colgroup><col style="width:116px"><col style="width:84px"><col style="width:88px"><col style="width:45px"><col style="width:45px"><col style="width:45px"><col style="width:45px">
        <col style="width:116px"><col style="width:96px"><col style="width:64px"><col style="width:64px"><col style="width:64px"><col style="width:64px"></colgroup>
        <thead><tr><th>Hào</th><th>V-S</th><th class="c">Quải thần</th><th class="c">Lộc</th><th class="c">Mã</th><th class="c">Quý</th><th class="c">Đào</th>
        <th class="div">Hào</th><th>V-S</th><th class="c">Lộc</th><th class="c">Mã</th><th class="c">Quý</th><th class="c">Đào</th></tr></thead>
        <tbody>${rows2}</tbody>
      </table>`;

    const foot = `
      <div class="ch-foot">
        <span>Quẻ hỗ: <b>${esc(res.mutual.name)}</b></span>
        <span>Cung ${esc(res.main.palaceName)} (${ELEMENTS[res.main.palaceEl]}) · ${esc(res.main.orderName)}</span>
        ${conf.siteUrl ? `<span class="ch-url">${esc(conf.siteUrl)}</span>` : ''}
      </div>`;

    return `<div class="chart-watermark" aria-hidden="true">${baguaSVG(560, '#d9534f', { stroke: 1.2 })}</div>
      <div class="chart-inner">${head}${hexes}${mainTable}${subTable}${foot}</div>`;
  }

  function typeLabel(h) {
    if (h.lucXung) return 'LỤC XUNG';
    if (h.lucHop) return 'LỤC HỢP';
    if (h.order === 6) return 'DU HỒN';
    if (h.order === 7) return 'QUY HỒN';
    return '';
  }

  // Ghi chú quan hệ giữa quẻ chủ và quẻ biến (đặt ở giữa hai quẻ)
  function middleNotes(res) {
    const out = [];
    if (!res.hasMoving) out.push({ t: 'QUẺ TĨNH', cls: 'quiet' });
    if (res.phucNgam) out.push({ t: res.phucNgam.toUpperCase() });
    if (res.phanNgam) out.push({ t: res.phanNgam.toUpperCase() });
    if (res.haoPhanNgam.length) out.push({ t: 'HÀO PHẢN NGÂM: ' + res.haoPhanNgam.join(', ') });
    if (res.changed) {
      if (res.main.lucXung && res.changed.lucHop) out.push({ t: 'XUNG BIẾN HỢP' });
      else if (res.main.lucHop && res.changed.lucXung) out.push({ t: 'HỢP BIẾN XUNG' });
    }
    const mp = res.movingPos || [];
    if (res.docPhat) out.push({ t: 'ĐỘC PHÁT HÀO ' + res.docPhat });
    if (mp.length === 6) out.push({ t: 'SÁU HÀO ĐỀU ĐỘNG' });
    else if (mp.length >= 4) out.push({ t: 'LOẠN ĐỘNG' });
    (res.combos || []).filter((c) => c.full).forEach((c) => out.push({ t: 'TAM HỢP ' + c.cuc.toUpperCase(), cls: 'cuc' }));
    (res.hinhSets || []).forEach((s) => out.push({ t: 'TAM HÌNH ' + s.branches.map((b) => BRANCHES[b]).join(' ').toUpperCase() }));
    if (res.tuyQuy) out.push({ t: 'TÙY QUỶ NHẬP MỘ' });
    return out;
  }

  /* ---------- Phân tích chi tiết ---------- */
  const DUNG_OPTIONS = [
    { v: 'the', t: 'Hào Thế (bản thân)' },
    { v: 'ung', t: 'Hào Ứng (đối phương)' },
    { v: '0', t: 'Phụ Mẫu' },
    { v: '1', t: 'Huynh Đệ' },
    { v: '2', t: 'Tử Tôn' },
    { v: '3', t: 'Thê Tài' },
    { v: '4', t: 'Quan Quỷ' }
  ];
  const DUNG_HINT = {
    the: 'Bản thân người hỏi — xem mình có thuận lợi, an toàn hay không.',
    ung: 'Đối phương, người hoặc nơi mình hướng tới.',
    0: 'Cha mẹ, bề trên, thầy; nhà cửa, xe cộ, giấy tờ, văn thư, hợp đồng, tin tức, thi cử.',
    1: 'Anh chị em, bạn bè, đồng nghiệp, đối thủ cạnh tranh; chủ hao tài, tranh đoạt.',
    2: 'Con cháu, học trò, cấp dưới, vật nuôi, thuốc men; là phúc thần, giải ưu, khắc chế Quan Quỷ.',
    3: 'Tiền bạc, tài sản, hàng hóa, giá cả, lương bổng; vợ, người yêu (nam hỏi).',
    4: 'Công danh, chức vụ, cấp trên, cơ quan; chồng, người yêu (nữ hỏi); bệnh tật, tai họa, kiện tụng, trộm cướp.'
  };
  const ROLE_NAMES = { dung: 'Dụng thần', nguyen: 'Nguyên thần', ky: 'Kỵ thần', cuu: 'Cừu thần', tiet: 'Tiết thần' };
  const ROLE_SHORT = { dung: 'Dụng', nguyen: 'Nguyên', ky: 'Kỵ', cuu: 'Cừu', tiet: 'Tiết' };

  function resolveRoles(res, dungKey) {
    let rel;
    let anchorPos = null;
    if (dungKey === 'the') {
      anchorPos = res.main.the;
      rel = res.lines[anchorPos - 1].rel;
    } else if (dungKey === 'ung') {
      anchorPos = res.main.ung;
      rel = res.lines[anchorPos - 1].rel;
    } else rel = Number(dungKey);
    const gs = I.godSet(rel);
    const roleOfRel = {};
    Object.keys(gs).forEach((k) => (roleOfRel[gs[k]] = k));
    return { rel, gs, roleOfRel, anchorPos };
  }

  function chip(text, tone) {
    return `<span class="chip ${tone || ''}">${esc(text)}</span>`;
  }

  function lineState(l) {
    const out = [chip(l.vs, l.vs === 'Vượng' || l.vs === 'Tướng' ? 'good' : l.vs === 'Tử' || l.vs === 'Tù' ? 'bad' : '')];
    l.monthRel.forEach((x) => out.push(chip(x, /Phá|Khắc/.test(x) ? 'bad' : /Hình|Hại/.test(x) ? 'warn' : /Sinh|Kiến|Phù|Hợp/.test(x) ? 'good' : '')));
    l.dayRel.forEach((x) => out.push(chip(x, /Khắc/.test(x) ? 'bad' : /Xung|Hình|Hại/.test(x) ? 'warn' : /Sinh|Lâm|Phù|Hợp/.test(x) ? 'good' : '')));
    if (l.isVoid) out.push(chip('Tuần Không', 'warn'));
    (l.status || []).forEach((x) => out.push(chip(x, 'warn')));
    if (l.moving) out.push(chip('Động', 'mv'));
    return out.join('');
  }

  function overview(data) {
    const { res } = data;
    const card = (title, h, moving, extra) => {
      if (!h) {
        return `<div class="hexcard empty"><div class="hc-title">${title}</div><p class="muted">Không có hào động — quẻ tĩnh, chỉ luận quẻ chủ.</p></div>`;
      }
      const tags = [];
      tags.push(chip(h.orderName));
      if (h.lucXung) tags.push(chip('Lục Xung', 'warn'));
      if (h.lucHop) tags.push(chip('Lục Hợp', 'good'));
      return `<div class="hexcard">
        <div class="hc-title">${title}</div>
        <div class="hc-body">
          ${hexFigure(h.bits, moving, 'mini')}
          <div class="hc-text">
            <div class="hc-name">${esc(h.name)}</div>
            <div class="hc-meta">Quẻ số ${h.kw} · Thượng ${esc(I.TRIGRAMS[h.upper].name)} (${esc(I.TRIGRAMS[h.upper].image)}), hạ ${esc(I.TRIGRAMS[h.lower].name)} (${esc(I.TRIGRAMS[h.lower].image)})</div>
            <div class="hc-meta">Cung ${esc(h.palaceName)} (${ELEMENTS[h.palaceEl]}) · Thế ${h.the}, Ứng ${h.ung}</div>
            <div class="hc-omen">“${esc(h.omen)}”</div>
            <div class="hc-mean">${esc(h.meaning)}</div>
            ${extra || ''}
            <div class="chips">${tags.join('')}</div>
          </div>
        </div>
      </div>`;
    };
    const movingList = res.lines.filter((l) => l.moving).map((l) => 'hào ' + l.pos).join(', ');
    return `<section class="card dsec">
      <h3 class="sec-title">Tổng quan quẻ</h3>
      <div class="hexcards">
        ${card('Quẻ chủ', res.main, res.moving, movingList ? `<div class="hc-meta">Hào động: ${movingList}</div>` : '')}
        ${card('Quẻ biến', res.changed || res.main, null, res.changed ? '' : '<div class="hc-meta">Quẻ tĩnh — quẻ biến trùng quẻ chủ</div>')}
        ${card('Quẻ hỗ', res.mutual, null)}
      </div>
      ${res.notes.length ? `<div class="chips notes">${res.notes.map((n) => chip(n, 'note')).join('')}</div>` : ''}
    </section>`;
  }

  function timeSection(data) {
    const { cal } = data;
    const p = cal.pillars;
    const pil = (label, pp) => `<div class="pillar"><span class="pl-k">${label}</span><b>${pillar(pp)}</b><small>${ELEMENTS[STEM_EL[pp.stem]]} · ${ELEMENTS[BRANCH_EL[pp.branch]]}</small></div>`;
    const jd = jdFromDate(cal.input.d, cal.input.m, cal.input.y);
    const me = BRANCH_EL[p.month.branch];
    const order = [me, (me + 1) % 5, (me + 4) % 5, (me + 3) % 5, (me + 2) % 5];
    const labels = ['Vượng', 'Tướng', 'Hưu', 'Tù', 'Tử'];
    const lyp = cal.lunarYearPillar;
    const lunarYearNote = lyp.stem !== p.year.stem || lyp.branch !== p.year.branch
      ? ` <span class="muted">(năm âm lịch ${pillar(lyp)}; trụ năm tính theo Lập Xuân là ${pillar(p.year)})</span>`
      : ` năm ${pillar(lyp)}`;
    return `<section class="card dsec">
      <h3 class="sec-title">Thời gian &amp; Nhật – Nguyệt</h3>
      <div class="pillars">${pil('Giờ', p.hour)}${pil('Ngày', p.day)}${pil('Tháng', p.month)}${pil('Năm', p.year)}</div>
      <dl class="kv">
        <div><dt>Dương lịch</dt><dd>${fmtTime(cal.input)} · ${WEEKDAYS[jd % 7]}, ${fmtDate(cal.input)}</dd></div>
        <div><dt>Âm lịch</dt><dd>${lunarText(cal)}${lunarYearNote}${cal.shifted ? ' <span class="muted">— sau 23h, đã tính sang ngày ' + fmtDate(cal.effective) + '</span>' : ''}</dd></div>
        <div><dt>Tiết khí</dt><dd><b>${esc(cal.term.name)}</b> từ ${fmtHM(cal.term.start)} ${fmtDate(cal.term.start)}; tiết kế tiếp <b>${esc(cal.term.next.name)}</b> lúc ${fmtHM(cal.term.next.start)} ${fmtDate(cal.term.next.start)}</dd></div>
        <div><dt>Nhật thần</dt><dd>${pillar(p.day)} — ${brEl(p.day.branch)}</dd></div>
        <div><dt>Nguyệt lệnh</dt><dd>${pillar(p.month)} — ${brEl(p.month.branch)}: ${order.map((e, i) => `${ELEMENTS[e]} <b>${labels[i]}</b>`).join(' · ')}</dd></div>
        <div><dt>Tuần không</dt><dd>Tuần ${esc(cal.tuan.name)} — Không vong: <b>${cal.tuan.voids.map((v) => BRANCHES[v]).join(', ')}</b></dd></div>
      </dl>
    </section>`;
  }

  function dungSection(data, dungKey) {
    const { res } = data;
    const R = resolveRoles(res, dungKey);
    const opts = DUNG_OPTIONS.map((o) => `<option value="${o.v}"${o.v === String(dungKey) ? ' selected' : ''}>${o.t}</option>`).join('');
    const hint = DUNG_HINT[dungKey];
    const blocks = ['dung', 'nguyen', 'ky', 'cuu'].map((role) => {
      const relIdx = R.gs[role];
      let lines = res.lines.filter((l) => l.rel === relIdx);
      if (role === 'dung' && R.anchorPos) lines = [res.lines[R.anchorPos - 1]];
      const items = lines.map((l) => `<li><b>Hào ${l.pos}</b> ${esc(l.relName)} ${esc(l.canChi)} (${ELEMENTS[l.el]})${tuText(l) ? ' · ' + tuText(l) : ''}
          <div class="chips">${lineState(l)}</div>
          ${l.moving && l.changeTo ? `<div class="sub">Động hóa ${esc(l.changeTo.relName)} ${esc(l.changeTo.canChi)} — ${l.transform.map((t) => t.t).join(', ')}</div>` : ''}</li>`);
      if (!lines.length) {
        res.hidden.filter((h) => h.rel === relIdx).forEach((h) => {
          items.push(`<li><b>Không hiện</b> — phục dưới hào ${h.pos}: ${esc(h.relName)} ${esc(h.canChi)} (${ELEMENTS[h.el]})
            <div class="chips">${chip(h.vs)}${h.isVoid ? chip('Tuần Không', 'warn') : ''}${chip(h.relation)}</div></li>`);
        });
      }
      if (res.changedLines) {
        res.changedLines.forEach((c, i) => {
          if (c.fromMoving && c.rel === relIdx && !(role === 'dung' && R.anchorPos)) {
            items.push(`<li class="from-change">Biến ra ở hào ${i + 1}: ${esc(c.relName)} ${esc(c.canChi)} <div class="chips">${lineState(c)}</div></li>`);
          }
        });
      }
      return `<div class="role role-${role}">
        <div class="role-h"><span class="role-tag">${ROLE_NAMES[role]}</span> ${esc(I.RELATIVES[relIdx])}</div>
        <ul>${items.join('') || '<li class="muted">Không có trong quẻ</li>'}</ul>
      </div>`;
    });
    return `<section class="card dsec" id="dungSec">
      <h3 class="sec-title">Dụng thần</h3>
      <div class="dung-pick">
        <label for="dungSelect">Chọn Dụng thần theo việc hỏi</label>
        <select id="dungSelect">${opts}</select>
      </div>
      <p class="hint">${esc(hint)}${R.anchorPos ? ` Hào ${R.anchorPos} thuộc ${esc(I.RELATIVES[R.rel])}.` : ''}</p>
      <div class="roles">${blocks.join('')}</div>
    </section>`;
  }

  function linesSection(data, dungKey) {
    const { res } = data;
    const R = resolveRoles(res, dungKey);
    let rows = '';
    for (let i = 5; i >= 0; i--) {
      const l = res.lines[i];
      let role = R.roleOfRel[l.rel];
      // Khi Dụng thần là hào Thế/Ứng, các hào cùng lục thân khác không tính là Dụng
      if (role === 'dung' && R.anchorPos && l.pos !== R.anchorPos) role = null;
      const roleTxt = role ? ROLE_SHORT[role] : '';
      const extra = [];
      if (l.moving && l.changeTo) {
        const c = l.changeTo;
        extra.push(`→ ${esc(c.relName)} ${esc(c.canChi)}: ${c.vs} · T.Sinh Nguyệt ${esc(c.tsMonth)} · Nhật ${esc(c.tsDay)}`);
      }
      if (l.hidden) extra.push(`Phục: ${esc(l.hidden.relName)} ${esc(l.hidden.canChi)}${l.hidden.isVoid ? ' (Không)' : ''}`);
      rows += `<tr class="${l.moving ? 'mv' : ''} ${role ? 'r-' + role : ''}">
        <td class="nowrap">${lineGlyph(l.yang, l.moving, 'sm')} <b>${l.pos}</b> <span class="muted">${l.posName}</span></td>
        <td class="nowrap">${tuText(l) ? `<span class="tu-b">${tuText(l)}</span> ` : ''}${esc(l.relName)}<br><span class="el-${l.el}">${esc(l.canChi)} · ${ELEMENTS[l.el]}</span></td>
        <td>${roleTxt ? `<span class="role-mini r-${role}">${roleTxt}</span>` : ''}</td>
        <td class="nowrap">${esc(l.beast)}</td>
        <td><div class="chips">${lineState(l)}</div>${extra.length ? `<div class="sub">${extra.join('<br>')}</div>` : ''}</td>
        <td class="nowrap">${esc(l.tsDay)}</td>
        <td class="nowrap">${esc(l.tsMonth)}</td>
        <td>${l.stars.map((x) => `<span class="nowrap">${esc(x)}</span>`).join(', ') || '<span class="muted">—</span>'}</td>
      </tr>`;
    }
    return `<section class="card dsec">
      <h3 class="sec-title">Phân tích từng hào (quẻ chủ)</h3>
      <div class="tscroll"><table class="dtable">
        <thead><tr><th>Hào</th><th>Lục thân</th><th>Vai trò</th><th>Lục thú</th><th>Vượng suy · Nhật Nguyệt</th><th>T.Sinh theo Nhật</th><th>T.Sinh theo Nguyệt</th><th>Thần sát</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="hint">Ám Động: hào tĩnh bị Nhật xung mà vượng tướng; Nhật Phá: hào tĩnh suy nhược bị Nhật xung. Vòng Trường sinh tính Thổ theo Thủy.</p>
    </section>`;
  }

  function movingSection(data) {
    const { res } = data;
    if (!res.hasMoving) return '';
    const items = res.lines
      .filter((l) => l.moving)
      .reverse()
      .map((l) => {
        const c = l.changeTo;
        return `<div class="mvcard">
          <div class="mv-h">${lineGlyph(l.yang, true, 'sm')} <b>Hào ${l.pos} (${l.posName})</b> — ${l.yang ? 'Lão Dương (O)' : 'Lão Âm (X)'}</div>
          <div class="mv-flow">
            <span><b>${esc(l.relName)}</b> ${esc(l.canChi)} (${ELEMENTS[l.el]})</span>
            <span class="arrow" aria-hidden="true">→</span>
            <span><b>${esc(c.relName)}</b> ${esc(c.canChi)} (${ELEMENTS[c.el]})</span>
          </div>
          <div class="chips">${l.transform.map((t) => chip(t.t, t.tone === 'good' ? 'good' : t.tone === 'bad' ? 'bad' : '')).join('')}</div>
          <div class="sub">Hào biến theo Nguyệt: ${c.vs}${c.monthRel.length ? ' · ' + c.monthRel.join(', ') : ''} · T.Sinh ${esc(c.tsMonth)}</div>
          <div class="sub">Hào biến theo Nhật: ${c.dayRel.length ? c.dayRel.join(', ') + ' · ' : ''}T.Sinh ${esc(c.tsDay)}${c.isVoid ? ' · Tuần Không' : ''}</div>
        </div>`;
      });
    return `<section class="card dsec">
      <h3 class="sec-title">Hào động &amp; biến hóa</h3>
      <div class="mvcards">${items.join('')}</div>
    </section>`;
  }

  function shenshaSection(data) {
    const { res } = data;
    const rows = res.shensha.list.map((s) => {
      const hitMain = res.lines.filter((l) => l.marks[s.key]).map((l) => `hào ${l.pos} (${l.relShort})`);
      const hitChg = res.changedLines ? res.changedLines.filter((l) => l.marks[s.key]).map((l) => `biến ${l.pos}`) : [];
      const hits = hitMain.concat(hitChg);
      return `<tr class="${hits.length ? 'hit' : ''}"><td><b>${esc(s.name)}</b></td><td class="muted">${esc(s.basis)}</td><td>${s.branches.map((b) => BRANCHES[b]).join(', ')}</td><td>${hits.join(', ') || '<span class="muted">—</span>'}</td></tr>`;
    });
    return `<section class="card dsec">
      <h3 class="sec-title">Thần sát</h3>
      <div class="tscroll"><table class="dtable compact">
        <thead><tr><th>Thần sát</th><th>Căn cứ</th><th>Chi</th><th>Hào gặp</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table></div>
    </section>`;
  }

  function notesSection() {
    return `<section class="card dsec">
      <details class="howto">
        <summary>Quy ước tính toán</summary>
        <ul>
          <li>Nạp giáp theo Kinh Phòng; Lục thân theo ngũ hành của cung (quẻ biến vẫn lấy cung quẻ chủ).</li>
          <li>Thế/Ứng theo bát cung; quẻ biến hiển thị Thế/Ứng theo cung riêng của nó.</li>
          <li>Lục thú khởi theo can ngày: Giáp Ất – Thanh Long, Bính Đinh – Chu Tước, Mậu – Câu Trần, Kỷ – Đằng Xà, Canh Tân – Bạch Hổ, Nhâm Quý – Huyền Vũ (từ hào Sơ lên).</li>
          <li>Tháng tính theo tiết khí (Nguyệt lệnh), năm đổi tại Lập Xuân; ngày âm lịch theo lịch Việt Nam (UTC+7).</li>
          <li>Vượng – Tướng – Hưu – Tù – Tử xét theo ngũ hành của Nguyệt lệnh.</li>
          <li>Phục thần lấy từ quẻ Bát Thuần của cung khi lục thân không hiện trong quẻ chủ.</li>
          <li>Quải thần (Quái thân): Thế hào dương khởi Tý, Thế hào âm khởi Ngọ, đếm từ hào Sơ đến hào Thế.</li>
          <li>Hình: Dần–Tị–Thân, Sửu–Tuất–Mùi, Tý–Mão, tự hình Thìn/Ngọ/Dậu/Hợi. Hại: Tý–Mùi, Sửu–Ngọ, Dần–Tị, Mão–Thìn, Thân–Hợi, Dậu–Tuất.</li>
          <li>Nhập mộ: hào gặp chi Mộ của hành mình ở Nhật hoặc ở hào động (Kim mộ Sửu, Mộc mộ Mùi, Hỏa mộ Tuất, Thủy/Thổ mộ Thìn).</li>
          <li>Ứng kỳ theo Cẩm nang ứng kỳ Lục Hào (Tăng San Bốc Dịch – Các môn loại ứng kỳ tổng chú): tĩnh gặp Trị / Xung, động gặp Trị / Hợp, quá vượng gặp Mộ / Khắc, suy gặp Sinh / Vượng, nhập Mộ chờ Xung, hợp trói chờ Xung mở, Nguyệt phá Điền thực / gặp Hợp, Tuần Không Điền / Xung / Xuất Không (phân biệt Chân – Giả – Động Không), Nguyên thần gặp Trị / Xung, chế Kỵ thần, Xung phi lộ phục. Vượng suy Dụng thần chấm điểm theo Nguyệt, Nhật, động hào, hồi đầu, tiến thoái.</li>
          <li>Hương Khuê: hào bị Quái thân khắc; Sàng Trướng: hào được Quái thân sinh (cột Quải thần ghi QT / H.Khuê / S.Trướng).</li>
          <li>Lộc, Quý nhân, Dương nhẫn, Văn xương theo can ngày; Dịch mã, Đào hoa, Tướng tinh, Hoa cái, Kiếp sát, Tai sát, Mưu tinh theo chi ngày; Thiên hỷ, Thiên y theo tháng.</li>
        </ul>
      </details>
    </section>`;
  }

  /* ---------- Ứng kỳ (theo Cẩm nang ứng kỳ Lục Hào) ---------- */
  const UK_ROLE = {
    'uu-tien': ['Ưu tiên', 'good'],
    'du-phong': ['Dự phòng', 'note'],
    'tham-khao': ['Tham khảo', ''],
    'canh-bao': ['Cảnh báo', 'bad']
  };
  const UK_PHASE = { 'kết quả': 'ph-kq', 'tháo gỡ': 'ph-tg', 'trợ lực': 'ph-tl', 'kích hoạt': 'ph-kh', 'cảnh báo': 'ph-cb', 'phụ': 'ph-phu' };

  function ungKySection(data, dungKey) {
    const { res, cal } = data;
    const R0 = resolveRoles(res, dungKey);
    const u = I.ungKy(res, cal, R0.rel, R0.anchorPos);
    const from = { y: cal.effective.y, m: cal.effective.m, d: cal.effective.d };
    const jd0 = jdFromDate(from.d, from.m, from.y);
    const at = (n) => jdToDate(jd0 + n);
    const ymd = (o) => `${o.y}-${pad(o.m)}-${pad(o.d)}`;
    const shortDate = (o) => `${pad(o.d)}/${pad(o.m)}${o.y !== from.y ? '/' + o.y : ''}`;
    const s = u.subject;
    if (!s) {
      return `<section class="card dsec"><h3 class="sec-title">Ứng kỳ</h3><p class="muted">Không xác định được Dụng thần.</p></section>`;
    }

    // Phiếu tóm tắt
    const who = u.hidden
      ? `Phục thần <b>${esc(s.relName)} ${esc(s.canChi)}</b> dưới hào ${s.pos}`
      : `Hào ${s.pos} · <b>${esc(s.relName)} ${esc(s.canChi)}</b>${tuText(s) ? ' (' + tuText(s) + ')' : ''} · ${s.moving ? 'Động' : 'Tĩnh'}`;
    const lvlTone = { 'Quá vượng': 'warn', Vượng: 'good', 'Bình hòa': '', Suy: 'bad', 'Có lực': 'good', 'Vô lực': 'bad' }[u.strength.level] || '';
    const prow = (k, v) => `<div class="uk-prow"><div class="uk-pk">${k}</div><div class="uk-pv">${v}</div></div>`;
    let profile = prow('Dụng thần', who + (u.pickNote ? `<div class="sub">${esc(u.pickNote)}</div>` : ''));
    profile += prow('Vượng suy', `<span class="chip ${lvlTone} uk-lvl">${esc(u.strength.level)}</span> <span class="muted">${u.strength.why.map(esc).join(' · ')}</span>`);
    profile += prow('Trạng thái', u.states.length ? `<div class="chips">${u.states.map((x) => chip(x.t, x.tone)).join('')}</div>` : '<span class="muted">Không có trạng thái cản trở rõ (Không, Phá, Mộ, Hợp trói, Tuyệt, Kỵ khắc).</span>');
    if (!u.hidden && s.moving && s.transform) {
      profile += prow('Động biến', `<div class="chips">${s.transform.map((t) => chip(t.t, t.tone === 'good' ? 'good' : t.tone === 'bad' ? 'bad' : '')).join('')}</div>`);
    }
    if (u.conds.length) profile += prow('Điều kiện cần', u.conds.map((c) => `<div>• ${esc(c)}</div>`).join(''));

    // Bảng ứng viên
    const yearOf = (b) => {
      const y = from.y;
      for (let k = 0; k < 13; k++) if (((y + k + 8) % 12 + 12) % 12 === b) return y + k;
      return null;
    };
    const rows = u.items.slice(0, 9).map((it) => {
      const b = it.branch;
      const days = LH.cal
        .scanDays({ day: { branch: b } }, from, at(40), { limit: 3 })
        .items.map((x) => (x.jd === jd0 ? `<b>${shortDate(x.date)}</b><small class="muted"> (hôm nay)</small>` : shortDate(x.date)));
      const mon = LH.cal.scanDays({ month: { branch: b } }, from, at(400), { limit: 1 }).items[0];
      const monTxt = mon ? (mon.jd === jd0 ? `đang tháng ${BRANCHES[b]}` : `từ ${fmtDate(mon.date)}`) : '—';
      const yr = yearOf(b);
      const linkD = `tra-ngay.html#d=-1.${b}&mm=solar&f=${ymd(from)}&t=${ymd(at(366))}`;
      const linkM = `tra-ngay.html#m=-1.${b}&mm=solar&f=${ymd(from)}&t=${ymd(at(731))}`;
      const [roleTxt, roleTone] = UK_ROLE[it.role] || ['', ''];
      const reasons = it.reasons
        .slice()
        .sort((a, c) => a.group - c.group)
        .map((r) => `<span class="uk-r ${UK_PHASE[r.phase] || ''}" title="Nhóm ${r.group} · ${esc(r.phase)}">${esc(r.t)}</span>`)
        .join('');
      return `<tr class="uk-${it.role}">
        <td class="nowrap"><span class="uk-chi" style="--c:${EL_COLORS[BRANCH_EL[b]]}">${BRANCHES[b]}</span></td>
        <td class="nowrap"><span class="chip ${roleTone}">${roleTxt}</span></td>
        <td><div class="uk-rs">${reasons}</div></td>
        <td class="nowrap">${days.join(', ')}</td>
        <td class="nowrap">${monTxt}</td>
        <td class="nowrap">${yr ? (yr === from.y ? `${yr} <small class="muted">(năm nay)</small>` : yr) : '—'}</td>
        <td class="nowrap"><div class="uk-links"><a href="${linkD}" target="_blank" rel="noopener">Tra ngày</a><a href="${linkM}" target="_blank" rel="noopener">Tra tháng</a></div></td>
      </tr>`;
    });

    // Mốc theo ngày cụ thể: Xuất Không, Qua tháng phá
    const extras = u.extras.map((e) => {
      if (e.type === 'xuatKhong') {
        const n = 10 - cal.pillars.day.stem; // số ngày tới ngày Giáp kế tiếp (hết tuần)
        const d = at(n);
        return `<li><b>${esc(e.label)}:</b> từ ${fmtDate(d)} <span class="muted">(hết tuần ${esc(cal.tuan.name)}, sang tuần mới)</span></li>`;
      }
      if (e.type === 'quaThang') {
        const nextM = (cal.pillars.month.branch + 1) % 12;
        const it = LH.cal.scanDays({ month: { branch: nextM } }, from, at(40), { limit: 1 }).items[0];
        return `<li><b>${esc(e.label)}:</b> ${it ? 'từ ' + fmtDate(it.date) : '—'} <span class="muted">(sang tháng ${BRANCHES[nextM]})</span></li>`;
      }
      return '';
    });

    return `<section class="card dsec uk-sec">
      <h3 class="sec-title">Ứng kỳ</h3>
      <div class="uk-profile">${profile}</div>
      <div class="uk-legend">
        <span class="uk-r ph-kq">kết quả</span><span class="uk-r ph-tg">tháo gỡ cản trở</span><span class="uk-r ph-tl">trợ lực</span>
        <span class="uk-r ph-kh">kích hoạt</span><span class="uk-r ph-phu">dấu hiệu phụ</span><span class="uk-r ph-cb">cảnh báo</span>
      </div>
      <div class="tscroll"><table class="dtable uk-table">
        <thead><tr><th>Chi</th><th>Vai trò</th><th>Căn cứ</th><th>Ngày gần nhất</th><th>Tháng</th><th>Năm</th><th></th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table></div>
      ${extras.length ? `<ul class="uk-extras">${extras.join('')}</ul>` : ''}
      <div class="uk-notes">
        <div class="uk-pk">Lưu ý</div>
        <ul>${u.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}
          <li>Việc gần ưu tiên ngày / giờ, việc xa ưu tiên tháng / năm. Ngày có dấu hiệu chưa chắc là ngày hoàn tất (cẩm nang 8.2).</li></ul>
      </div>
      <p class="hint">Tính từ ngày lập quẻ ${fmtDate(from)}. Xếp hạng theo cẩm nang: điều kiện trực tiếp → tháo gỡ cản trở → Nguyên / Kỵ thần → động, biến hào → dấu hiệu phụ.</p>
    </section>`;
  }

  /* ---------- Hợp cục · Hình hại · Mộ · Phục thần ---------- */
  function comboSection(data) {
    const { res } = data;
    const the = res.lines[res.main.the - 1];
    const rows = [];
    const row = (k, body) => rows.push(`<div class="cb-row"><div class="cb-k">${k}</div><div class="cb-v">${body}</div></div>`);
    const toThe = (el) =>
      I.generates(el, the.el) ? chip('sinh Thế', 'good') : I.controls(el, the.el) ? chip('khắc Thế', 'bad') : el === the.el ? chip('phù Thế', 'good') : '';

    const combos = res.combos || [];
    if (combos.length) {
      row('Hợp cục', combos
        .map((c) => `<div class="cb-item"><b class="el-${c.el}">${esc(c.name)}</b> (${c.branches.map((b) => BRANCHES[b]).join(' ')}) → <b>${esc(c.relName)} cục</b>
          ${c.full ? '' : '<span class="muted">· bán hợp</span>'} ${toThe(c.el)} <span class="muted">· ${c.members.map(esc).join(' + ')}</span></div>`)
        .join(''));
    }
    (res.hinhSets || []).forEach((s) => row('Tam hình', `<b>${esc(s.name)}</b> <span class="muted">· ${s.members.map(esc).join(' + ')}</span>`));
    const flow = res.notes.filter((n) => /Độc phát|Độc tĩnh|Loạn động|Sáu hào/.test(n));
    if (flow.length) row('Hào động', flow.map(esc).join(' · '));
    const mo = res.lines.filter((l) => (l.status || []).some((x) => /Nhập Mộ/.test(x)));
    if (mo.length) {
      row('Nhập mộ', mo
        .map((l) => `<div class="cb-item">Hào ${l.pos} ${esc(l.relName)} ${esc(l.label)}: ${l.status.filter((x) => /Nhập Mộ/.test(x)).map((x) => chip(x, 'warn')).join('')}</div>`)
        .join(''));
    }
    if (res.tuyQuy) row('Tùy quỷ', `<span class="chip bad">${esc(res.tuyQuy)}</span>`);
    res.hidden.forEach((h) => {
      const v = h.verdict || { ok: false, text: '', good: [], bad: [] };
      row(`Phục thần`, `<div class="cb-item"><b>${esc(h.relName)} ${esc(h.canChi)}</b> dưới hào ${h.pos} →
        <span class="chip ${v.ok ? 'good' : 'bad'}">${esc(v.text)}</span></div>
        <div class="chips">${v.good.map((x) => chip('+ ' + x, 'good')).join('')}${v.bad.map((x) => chip('− ' + x, 'bad')).join('')}</div>`);
    });
    return `<section class="card dsec">
      <h3 class="sec-title">Hợp cục · Hình hại · Mộ · Phục thần</h3>
      ${rows.length ? `<div class="cb-list">${rows.join('')}</div>` : '<p class="muted">Không có hợp cục, tam hình, nhập mộ hay phục thần cần xét.</p>'}
      <p class="hint">Tam hợp cục chỉ thành khi chi Đế vượng (Tý, Ngọ, Mão, Dậu) là hào động của quẻ chính. Nếu quẻ chính có ít nhất hai chi của cục cùng động (chi hào biến không tính), chi còn lại lấy từ hào động, hào biến hoặc Nhật / Nguyệt (hào tĩnh không tính); nếu chỉ một mình chi Đế vượng động, hai chi còn lại phải là Nhật và Nguyệt. Bán hợp chỉ xét khi có chi Đế vượng. Kết luận phục thần là gợi ý tổng hợp theo vượng suy, Nhật Nguyệt và phi thần.</p>
    </section>`;
  }

  function details(data, dungKey) {
    return (
      overview(data) +
      timeSection(data) +
      dungSection(data, dungKey) +
      ungKySection(data, dungKey) +
      linesSection(data, dungKey) +
      movingSection(data) +
      comboSection(data) +
      shenshaSection(data) +
      notesSection()
    );
  }

  /* ---------- Văn bản thuần (sao chép) ---------- */
  function textSummary(data) {
    const { question, methodLabel, cal, res } = data;
    const out = [];
    out.push(`Việc cần xem: ${question || '—'}`);
    out.push(`Thời gian: ${fmtTime(cal.input)} ${fmtDate(cal.input)} — Âm lịch: ${lunarText(cal)} (${cal.term.name})`);
    out.push(`Can chi: ${canChiText(cal)}`);
    out.push(`Nhật lệnh: ${brEl(cal.pillars.day.branch)} · Nguyệt lệnh: ${brEl(cal.pillars.month.branch)} · Tuần không: ${cal.tuan.voids.map((v) => BRANCHES[v]).join(', ')}`);
    out.push(`Phương pháp: ${methodLabel}`);
    out.push('');
    out.push(`Quẻ chủ: ${res.main.name} (cung ${res.main.palaceName}, ${res.main.orderName}) — ${res.main.omen}`);
    if (res.changed) out.push(`Quẻ biến: ${res.changed.name} (cung ${res.changed.palaceName}) — ${res.changed.omen}`);
    out.push(`Quẻ hỗ: ${res.mutual.name}`);
    out.push('');
    for (let i = 5; i >= 0; i--) {
      const l = res.lines[i];
      const c = res.changedLines ? res.changedLines[i] : null;
      const sym = l.yang ? (l.moving ? '━━━ O' : '━━━  ') : l.moving ? '━ ━ X' : '━ ━  ';
      let s = `Hào ${i + 1} ${sym} ${(tuText(l) || '').padEnd(3)} ${l.relName} ${l.canChi}-${ELEMENTS[l.el]}`;
      if (l.isVoid) s += ' (K)';
      if (l.hidden) s += ` [Phục: ${l.hidden.relName} ${l.hidden.canChi}]`;
      if (l.moving && c) s += `  → ${c.relName} ${c.canChi}-${ELEMENTS[c.el]}${c.isVoid ? ' (K)' : ''}`;
      s += `  · ${res.beasts[i]}`;
      out.push(s);
    }
    if (res.notes.length) {
      out.push('');
      out.push('Ghi chú: ' + res.notes.join('; '));
    }
    return out.join('\n');
  }

  // Màu ngũ hành: Mộc, Hỏa, Thổ, Kim, Thủy
  const EL_COLORS = ['#2e9d48', '#e0362c', '#b7791f', '#6f7785', '#1f5fbf'];

  LH.render = { chart, details, textSummary, lineGlyph, hexFigure, baguaSVG, esc, pad, fmtDate, fmtTime, lunarText, canChiText, pillar, EL_COLORS, typeLabel, middleNotes };
})(typeof globalThis !== 'undefined' ? globalThis : window);
