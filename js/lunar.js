/*
 * Lịch Âm Việt Nam + Can Chi + Tiết khí
 * - Đổi lịch âm: thuật toán Hồ Ngọc Đức (múi giờ +7)
 * - Tiết khí / tháng Can Chi: tính theo kinh độ biểu kiến của Mặt Trời tại đúng thời điểm lập quẻ
 */
(function (G) {
  'use strict';
  const LH = (G.LH = G.LH || {});

  const TZ = 7;
  const PI = Math.PI;
  const INT = Math.floor;

  const STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  // Ngũ hành theo thứ tự tương sinh: Mộc → Hỏa → Thổ → Kim → Thủy → Mộc
  const ELEMENTS = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'];
  const BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const STEM_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  // 24 tiết khí, chỉ số 0 = Xuân Phân (kinh độ 0°), mỗi tiết 15°
  const TERMS = [
    'Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng',
    'Hạ Chí', 'Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ',
    'Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết',
    'Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập'
  ];

  /* ---------- Ngày Julius ---------- */
  function jdFromDate(dd, mm, yy) {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }

  function jdToDate(jd) {
    let a, b, c;
    if (jd > 2299160) {
      a = jd + 32044;
      b = INT((4 * a + 3) / 146097);
      c = a - INT((b * 146097) / 4);
    } else {
      b = 0;
      c = jd + 32082;
    }
    const d = INT((4 * c + 3) / 1461);
    const e = c - INT((1461 * d) / 4);
    const m = INT((5 * e + 2) / 153);
    return {
      d: e - INT((153 * m + 2) / 5) + 1,
      m: m + 3 - 12 * INT(m / 10),
      y: b * 100 + d - 4800 + INT(m / 10)
    };
  }

  /* ---------- Thiên văn (Hồ Ngọc Đức) ---------- */
  function newMoon(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }

  // Kinh độ hình học của Mặt Trời (radian) — dùng cho thuật toán đổi lịch gốc
  function sunLongitudeRad(jdn) {
    const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L -= PI * 2 * INT(L / (PI * 2));
    return L;
  }

  function getSunLongitude(dayNumber, tz) {
    return INT((sunLongitudeRad(dayNumber - 0.5 - tz / 24) / PI) * 6);
  }

  function getNewMoonDay(k, tz) {
    return INT(newMoon(k) + 0.5 + tz / 24);
  }

  // Ghi nhớ kết quả (hàm thuần) để tra cứu hàng loạt ngày cho nhanh
  const memoM11 = new Map();
  const memoLeap = new Map();

  function getLunarMonth11(yy, tz) {
    const key = yy + '|' + tz;
    if (memoM11.has(key)) return memoM11.get(key);
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    memoM11.set(key, nm);
    return nm;
  }

  function getLeapMonthOffset(a11, tz) {
    const key = a11 + '|' + tz;
    if (memoLeap.has(key)) return memoLeap.get(key);
    const v = leapMonthOffsetRaw(a11, tz);
    memoLeap.set(key, v);
    return v;
  }

  function leapMonthOffsetRaw(a11, tz) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function solarToLunar(dd, mm, yy, tz = TZ) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, tz);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
    let a11 = getLunarMonth11(yy, tz);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, tz);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, tz);
    }
    const day = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let leap = false;
    let month = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, tz);
      if (diff >= leapMonthDiff) {
        month = diff + 10;
        if (diff === leapMonthDiff) leap = true;
      }
    }
    if (month > 12) month -= 12;
    if (month >= 11 && diff < 4) lunarYear -= 1;
    return { day, month, year: lunarYear, leap };
  }

  /* ---------- Tiết khí chính xác ---------- */
  function deltaTDays(year) {
    const t = year - 2000;
    let dt;
    if (year >= 2005 && year <= 2050) dt = 62.92 + 0.32217 * t + 0.005589 * t * t;
    else if (year > 1986 && year < 2005) dt = 63.86 + 0.3345 * t - 0.060374 * t * t;
    else dt = 69;
    return dt / 86400;
  }

  // Kinh độ biểu kiến của Mặt Trời (độ) tại thời điểm jdUT
  function apparentSunLongitude(jdUT, year) {
    const jd = jdUT + deltaTDays(year);
    const T = (jd - 2451545.0) / 36525;
    const omega = 125.04 - 1934.136 * T;
    let L = (sunLongitudeRad(jd) * 180) / PI;
    L = L - 0.00569 - 0.00478 * Math.sin((omega * PI) / 180);
    return ((L % 360) + 360) % 360;
  }

  function localToJdUT(y, m, d, hh, mi, ss, tz = TZ) {
    return jdFromDate(d, m, y) - 0.5 + (hh + mi / 60 + ss / 3600 - tz) / 24;
  }

  function jdUTToLocal(jdUT, tz = TZ) {
    const jl = jdUT + tz / 24 + 0.5;
    const jdn = INT(jl);
    let secs = Math.round((jl - jdn) * 86400);
    let dayAdd = 0;
    if (secs >= 86400) {
      secs -= 86400;
      dayAdd = 1;
    }
    const date = jdToDate(jdn + dayAdd);
    return { y: date.y, m: date.m, d: date.d, h: INT(secs / 3600), mi: INT((secs % 3600) / 60), s: secs % 60 };
  }

  // Tìm thời điểm Mặt Trời đạt kinh độ targetDeg, quanh thời điểm jdGuess (±20 ngày)
  function findTermMoment(targetDeg, jdLo, jdHi, year) {
    const diff = (jd) => {
      let x = apparentSunLongitude(jd, year) - targetDeg;
      x = ((x + 540) % 360) - 180; // về khoảng [-180, 180)
      return x;
    };
    let lo = jdLo, hi = jdHi;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (diff(mid) < 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ---------- Can Chi ---------- */
  const mod = (n, m) => ((n % m) + m) % m;

  function dayPillar(jdn) {
    return { stem: mod(jdn + 9, 10), branch: mod(jdn + 1, 12) };
  }

  function hourBranchOf(h) {
    return INT((h + 1) / 2) % 12;
  }

  function pillarName(p) {
    return STEMS[p.stem] + ' ' + BRANCHES[p.branch];
  }

  // Can tháng Dần (tháng Giêng) theo can năm: Giáp/Kỷ → Bính, Ất/Canh → Mậu, ...
  const firstMonthStem = (yearStem) => mod((yearStem % 5) * 2 + 2, 10);

  /**
   * Trụ năm + trụ tháng theo tiết khí từ kinh độ Mặt Trời.
   * Tháng Dần bắt đầu tại Lập Xuân (315°); năm đổi tại Lập Xuân.
   * y, m: năm/tháng dương lịch của thời điểm đó (để xác định năm tiết khí).
   */
  function solarPillarsFromLon(lon, y, m) {
    const monthOffset = INT(mod(lon - 315, 360) / 30); // 0 = Dần ... 11 = Sửu
    let solarYear = y;
    if (m <= 2 && monthOffset >= 10) solarYear = y - 1;
    const year = { stem: mod(solarYear + 6, 10), branch: mod(solarYear + 8, 12) };
    const month = { stem: (firstMonthStem(year.stem) + monthOffset) % 10, branch: (2 + monthOffset) % 12 };
    return { year, month, termIdx: INT(lon / 15) % 24 };
  }

  // Trụ năm + tháng theo âm lịch (năm đổi tại Tết; tháng nhuận dùng can chi của tháng chính)
  function lunarPillars(lunar) {
    const year = { stem: mod(lunar.year + 6, 10), branch: mod(lunar.year + 8, 12) };
    const month = { stem: (firstMonthStem(year.stem) + lunar.month - 1) % 10, branch: (lunar.month + 1) % 12 };
    return { year, month };
  }

  function lonAtLocal(jdn, hours) {
    const jdUT = jdn - 0.5 + (hours - TZ) / 24;
    const year = INT(2000 + (jdUT - 2451545) / 365.25);
    return { jdUT, lon: apparentSunLongitude(jdUT, year) };
  }

  // Các giờ trong ngày (theo can ngày) khớp bộ lọc can/chi giờ
  function hoursMatching(dayStem, f) {
    const out = [];
    for (let b = 0; b < 12; b++) {
      if (f.branch >= 0 && b !== f.branch) continue;
      const s = ((dayStem % 5) * 2 + b) % 10;
      if (f.stem >= 0 && s !== f.stem) continue;
      out.push({ stem: s, branch: b });
    }
    return out;
  }

  const normFilter = (x) => ({
    stem: x && Number.isInteger(x.stem) && x.stem >= 0 ? x.stem : -1,
    branch: x && Number.isInteger(x.branch) && x.branch >= 0 ? x.branch : -1
  });
  const filterSet = (f) => f.stem >= 0 || f.branch >= 0;
  const pillarOk = (f, p) => (f.stem < 0 || f.stem === p.stem) && (f.branch < 0 || f.branch === p.branch);
  // Can dương chỉ đi với chi dương, can âm với chi âm
  const validPair = (f) => f.stem < 0 || f.branch < 0 || f.stem % 2 === f.branch % 2;

  /**
   * Tìm các ngày dương lịch trong khoảng [from, to] khớp can chi năm/tháng/ngày/giờ.
   * filters: { year, month, day, hour } mỗi mục { stem, branch } (-1 hoặc bỏ trống = bất kỳ)
   * opts.monthMode: 'solar' (tháng/năm theo tiết khí — Lục Hào) | 'lunar' (theo âm lịch)
   */
  function scanDays(filters, from, to, opts) {
    const o = Object.assign({ monthMode: 'solar', limit: 1000 }, opts || {});
    const F = {};
    ['year', 'month', 'day', 'hour'].forEach((k) => (F[k] = normFilter((filters || {})[k])));
    const jd0 = jdFromDate(from.d, from.m, from.y);
    const jd1 = jdFromDate(to.d, to.m, to.y);
    const items = [];
    let total = 0;

    for (let jd = jd0; jd <= jd1; jd++) {
      const day = dayPillar(jd);
      if (!pillarOk(F.day, day)) continue;
      let hours = null;
      if (filterSet(F.hour)) {
        hours = hoursMatching(day.stem, F.hour);
        if (!hours.length) continue;
      }
      const date = jdToDate(jd);

      // Tiết khí bắt đầu trong ngày (nếu có)
      const A = lonAtLocal(jd, 0);
      const Bv = lonAtLocal(jd, 24);
      const next = jdToDate(jd + 1);
      const pa = solarPillarsFromLon(A.lon, date.y, date.m);
      const pb = solarPillarsFromLon(Bv.lon, next.y, next.m);
      let term = null;
      if (pa.termIdx !== pb.termIdx) {
        const idx = pb.termIdx;
        const t = findTermMoment(idx * 15, A.jdUT, Bv.jdUT, date.y);
        term = { idx, name: TERMS[idx], time: jdUTToLocal(t), monthChange: pa.month.branch !== pb.month.branch };
      }

      let lunar = null;
      let segments;
      if (o.monthMode === 'lunar') {
        lunar = solarToLunar(date.d, date.m, date.y);
        const lp = lunarPillars(lunar);
        segments = [{ month: lp.month, year: lp.year }];
      } else if (term && term.monthChange) {
        segments = [
          { month: pa.month, year: pa.year, until: term.time },
          { month: pb.month, year: pb.year, since: term.time }
        ];
      } else {
        segments = [{ month: pa.month, year: pa.year }];
      }
      const matched = segments.filter((s) => pillarOk(F.month, s.month) && pillarOk(F.year, s.year));
      if (!matched.length) continue;

      total++;
      if (items.length < o.limit) {
        if (!lunar) lunar = solarToLunar(date.d, date.m, date.y);
        items.push({ jd, date, weekday: jd % 7, day, segments, matched, lunar, term, hours });
      }
    }
    return { total, items, truncated: total > items.length };
  }

  /**
   * Thông tin lịch đầy đủ cho một thời điểm (giờ địa phương, coi như UTC+7).
   * @param {{y:number,m:number,d:number,h:number,mi:number,s:number}} t
   * @param {{rollover23?: boolean}} opts  rollover23: từ 23h tính sang ngày hôm sau (giờ Tý)
   */
  function getInfo(t, opts) {
    const o = Object.assign({ rollover23: true }, opts || {});
    const { y, m, d } = t;
    const h = t.h || 0, mi = t.mi || 0, s = t.s || 0;

    const jdn = jdFromDate(d, m, y);
    const shifted = o.rollover23 && h >= 23;
    const effJdn = shifted ? jdn + 1 : jdn;
    const eff = jdToDate(effJdn);

    const lunar = solarToLunar(eff.d, eff.m, eff.y);

    // Tiết khí tại đúng thời điểm
    const jdUT = localToJdUT(y, m, d, h, mi, s);
    const lon = apparentSunLongitude(jdUT, y);
    const termIdx = INT(lon / 15) % 24;
    const termStartJd = findTermMoment(termIdx * 15, jdUT - 17, jdUT + 0.0001, y);
    const nextIdx = (termIdx + 1) % 24;
    const nextStartJd = findTermMoment(nextIdx * 15, jdUT, jdUT + 17, y);

    const sp = solarPillarsFromLon(lon, y, m);
    const yearP = sp.year;
    const monthP = sp.month;

    const dayP = dayPillar(effJdn);
    const hb = hourBranchOf(h);
    const hourP = { stem: ((dayP.stem % 5) * 2 + hb) % 10, branch: hb };

    // Năm âm lịch (theo Tết) — để hiển thị cùng ngày âm
    const lunarYearP = { stem: mod(lunar.year + 6, 10), branch: mod(lunar.year + 8, 12) };

    // Tuần không theo ngày
    const head = mod(dayP.branch - dayP.stem, 12); // Giáp + head
    const voids = [(head + 10) % 12, (head + 11) % 12];

    return {
      input: { y, m, d, h, mi, s },
      shifted,
      effective: eff,
      lunar,
      lunarYearPillar: lunarYearP,
      pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
      term: {
        idx: termIdx,
        name: TERMS[termIdx],
        longitude: lon,
        start: jdUTToLocal(termStartJd),
        next: { idx: nextIdx, name: TERMS[nextIdx], start: jdUTToLocal(nextStartJd) }
      },
      tuan: { head, name: 'Giáp ' + BRANCHES[head], voids }
    };
  }

  LH.cal = {
    TZ, STEMS, BRANCHES, ELEMENTS, BRANCH_EL, STEM_EL, TERMS,
    jdFromDate, jdToDate, solarToLunar, getInfo, pillarName, hourBranchOf, mod,
    scanDays, validPair, lunarPillars
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
