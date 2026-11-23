/**
 * Tadhkira VIP - Sana'a Adhan Corner Visual Alert (Silent, Uninterrupted)
 * تنبيه مرئي صامت في الزاوية يظهر فقط لحظة دخول وقت الأذان بتوقيت صنعاء المحلي ثم يختفي تلقائياً
 * Playback continues uninterrupted; no sound and no persistent timing UI.
 */
(function () {
  'use strict';

  const SANAA_LAT = 15.3694;
  const SANAA_LON = 44.1910;
  const SANAA_TZ_HOURS = 3;
  const SANAA_TIMEZONE = 'Asia/Aden';
  const LAST_FIRED_KEY = 'tadhkira_last_adhan_key';
  const ALERT_VISIBLE_MS = 20000;

  const ADHAN_PRAYERS = [
    { key: 'fajr', arName: 'الفجر', dua: 'الصلاة خير من النوم — تقبل الله طاعتكم' },
    { key: 'dhuhr', arName: 'الظهر', dua: 'حي على الصلاة • حي على الفلاح — تقبل الله طاعتكم' },
    { key: 'asr', arName: 'العصر', dua: 'حي على الصلاة • حي على الفلاح — تقبل الله طاعتكم' },
    { key: 'maghrib', arName: 'المغرب', dua: 'حي على الصلاة • حي على الفلاح — تقبل الله طاعتكم' },
    { key: 'isha', arName: 'العشاء', dua: 'حي على الصلاة • حي على الفلاح — تقبل الله طاعتكم' }
  ];

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const dsin = (d) => Math.sin(d * D2R);
  const dcos = (d) => Math.cos(d * D2R);
  const dtan = (d) => Math.tan(d * D2R);
  const darcsin = (x) => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
  const darccos = (x) => Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
  const darctan2 = (y, x) => Math.atan2(y, x) * R2D;
  const darccot = (x) => Math.atan(1 / x) * R2D;

  function fixAngle(a) {
    a = a - 360 * Math.floor(a / 360);
    return a < 0 ? a + 360 : a;
  }

  function fixHour(h) {
    h = h - 24 * Math.floor(h / 24);
    return h < 0 ? h + 24 : h;
  }

  function julianDate(year, month, day) {
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  }

  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
    const eqT = q / 15 - fixHour(RA);
    const decl = darcsin(dsin(e) * dsin(L));
    return { decl, eqT };
  }

  function computeMidDay(jdBase, fractionHours) {
    const jd = jdBase + (fractionHours - SANAA_TZ_HOURS) / 24;
    const { eqT } = sunPosition(jd);
    return fixHour(12 - eqT) + (SANAA_TZ_HOURS - SANAA_LON / 15);
  }

  function sunAngleHour(jdBase, fractionHours, angle, direction) {
    const jd = jdBase + (fractionHours - SANAA_TZ_HOURS) / 24;
    const { decl, eqT } = sunPosition(jd);
    const noon = fixHour(12 - eqT) + (SANAA_TZ_HOURS - SANAA_LON / 15);
    const num = -dsin(angle) - dsin(decl) * dsin(SANAA_LAT);
    const den = dcos(decl) * dcos(SANAA_LAT);
    const cosH = Math.max(-1, Math.min(1, num / den));
    const diff = darccos(cosH) / 15;
    return noon + (direction === 'ccw' ? -diff : diff);
  }

  function asrHour(jdBase, fractionHours, factor) {
    const jd = jdBase + (fractionHours - SANAA_TZ_HOURS) / 24;
    const { decl, eqT } = sunPosition(jd);
    const noon = fixHour(12 - eqT) + (SANAA_TZ_HOURS - SANAA_LON / 15);
    const angle = -darccot(factor + dtan(Math.abs(SANAA_LAT - decl)));
    const num = -dsin(angle) - dsin(decl) * dsin(SANAA_LAT);
    const den = dcos(decl) * dcos(SANAA_LAT);
    const cosH = Math.max(-1, Math.min(1, num / den));
    const diff = darccos(cosH) / 15;
    return noon + diff;
  }

  function pad2(n) {
    return String(Math.floor(n)).padStart(2, '0');
  }

  function format12hArabic(hh24, mm) {
    const period = hh24 >= 12 ? 'م' : 'ص';
    const hh12 = hh24 % 12 || 12;
    return pad2(hh12) + ':' + pad2(mm) + ' ' + period;
  }

  function computeSanaaDayAdhans(year, month, day) {
    const jdBase = julianDate(year, month, day);
    let fajrH = 5;
    let dhuhrH = 12;
    let asrH = 15;
    let maghribH = 18;

    for (let pass = 0; pass < 2; pass++) {
      fajrH = sunAngleHour(jdBase, fajrH, 18.5, 'ccw');
      dhuhrH = computeMidDay(jdBase, dhuhrH) + 1 / 60;
      asrH = asrHour(jdBase, asrH, 1);
      maghribH = sunAngleHour(jdBase, maghribH, 0.8333, 'cw');
    }
    const ishaH = maghribH + 90 / 60;

    const hoursMap = {
      fajr: fixHour(fajrH),
      dhuhr: fixHour(dhuhrH),
      asr: fixHour(asrH),
      maghrib: fixHour(maghribH),
      isha: fixHour(ishaH)
    };

    return ADHAN_PRAYERS.map((meta) => {
      const totalMinutes = Math.round(hoursMap[meta.key] * 60);
      const sec = totalMinutes * 60;
      const hh24 = Math.floor(totalMinutes / 60) % 24;
      const mm = totalMinutes % 60;
      return {
        key: meta.key,
        arName: meta.arName,
        dua: meta.dua,
        sec,
        time12Ar: format12hArabic(hh24, mm)
      };
    });
  }

  function getSanaaNowParts(nowMs) {
    const d = new Date(typeof nowMs === 'number' ? nowMs : Date.now());
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: SANAA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(d);
      const map = {};
      for (const p of parts) {
        if (p.type !== 'literal') map[p.type] = Number(p.value);
      }
      const hour = (map.hour || 0) % 24;
      const minute = map.minute || 0;
      const second = map.second || 0;
      const year = map.year;
      const month = map.month;
      const day = map.day;
      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        secOfDay: hour * 3600 + minute * 60 + second,
        dateKey: `${year}-${pad2(month)}-${pad2(day)}`
      };
    } catch (_) {
      const shifted = new Date(d.getTime() + SANAA_TZ_HOURS * 3600 * 1000);
      const year = shifted.getUTCFullYear();
      const month = shifted.getUTCMonth() + 1;
      const day = shifted.getUTCDate();
      const hour = shifted.getUTCHours();
      const minute = shifted.getUTCMinutes();
      const second = shifted.getUTCSeconds();
      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        secOfDay: hour * 3600 + minute * 60 + second,
        dateKey: `${year}-${pad2(month)}-${pad2(day)}`
      };
    }
  }

  let cachedDateKey = '';
  let cachedAdhans = [];
  let cornerHideTimer = null;
  let cornerHovered = false;

  function ensureAdhans(parts) {
    if (cachedDateKey === parts.dateKey && cachedAdhans.length) return;
    cachedDateKey = parts.dateKey;
    cachedAdhans = computeSanaaDayAdhans(parts.year, parts.month, parts.day);
  }

  function scheduleCornerDismiss() {
    clearTimeout(cornerHideTimer);
    const bar = document.getElementById('adhanCornerProgressBar');
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.transition = `width ${ALERT_VISIBLE_MS / 1000}s linear`;
          bar.style.width = '0%';
        });
      });
    }
    cornerHideTimer = setTimeout(() => {
      if (!cornerHovered) dismissCornerAdhanAlert();
    }, ALERT_VISIBLE_MS);
  }

  function showCornerAdhanAlert(prayer) {
    const alertEl = document.getElementById('sanaaAdhanCornerAlert');
    if (!alertEl) return;

    const titleEl = document.getElementById('adhanCornerTitle');
    const timeEl = document.getElementById('adhanCornerTime');
    const duaEl = document.getElementById('adhanCornerDua');

    if (titleEl) titleEl.textContent = `حان الآن موعد أذان ${prayer.arName}`;
    if (timeEl) timeEl.textContent = `بتوقيت صنعاء المحلي • ${prayer.time12Ar}`;
    if (duaEl) duaEl.textContent = prayer.dua;

    alertEl.classList.remove('hidden', 'adhan-corner-exit');
    alertEl.classList.add('adhan-corner-enter');
    scheduleCornerDismiss();
  }

  function dismissCornerAdhanAlert() {
    clearTimeout(cornerHideTimer);
    const alertEl = document.getElementById('sanaaAdhanCornerAlert');
    if (!alertEl) return;
    alertEl.classList.remove('adhan-corner-enter');
    alertEl.classList.add('adhan-corner-exit');
    setTimeout(() => {
      alertEl.classList.add('hidden');
      alertEl.classList.remove('adhan-corner-exit');
    }, 260);
  }

  function tick() {
    const parts = getSanaaNowParts();
    ensureAdhans(parts);

    let lastFired = '';
    try {
      lastFired = localStorage.getItem(LAST_FIRED_KEY) || '';
    } catch (_) {}

    for (const p of cachedAdhans) {
      const fireId = `${parts.dateKey}_${p.key}`;
      if (parts.secOfDay >= p.sec && parts.secOfDay < p.sec + 90 && lastFired !== fireId) {
        try {
          localStorage.setItem(LAST_FIRED_KEY, fireId);
        } catch (_) {}
        showCornerAdhanAlert(p);
        break;
      }
    }
  }

  function init() {
    const alertEl = document.getElementById('sanaaAdhanCornerAlert');
    if (alertEl) {
      alertEl.addEventListener('mouseenter', () => {
        cornerHovered = true;
        clearTimeout(cornerHideTimer);
      });
      alertEl.addEventListener('mouseleave', () => {
        cornerHovered = false;
        if (!alertEl.classList.contains('hidden')) {
          scheduleCornerDismiss();
        }
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  window.dismissCornerAdhanAlert = dismissCornerAdhanAlert;
  window.TadhkiraPrayer = {
    computeSanaaDayAdhans,
    getSanaaNowParts,
    showCornerAdhanAlert,
    dismissCornerAdhanAlert
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
