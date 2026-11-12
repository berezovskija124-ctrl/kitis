/*
 * Модель расписания КИТиС поверх данных парсера (window.KITIS_DATA, файл kitis-data.js).
 *
 * Прошлые недели — из «Итогов» (журналы занятий), неделя со страницы «Неделя» — из расписания групп.
 * Какая неделя «текущая», а какая «следующая», считается по сегодняшней дате в Калининграде (UTC+2).
 * В воскресенье текущей считается новая неделя (с завтрашнего понедельника), если её расписание уже опубликовано.
 * Для проверки можно подставить время: ?now=2026-11-12T10:30
 */
(function (root) {
  'use strict';

  var D = root.KITIS_DATA || null;
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  var DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  var DAY_LOWER = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  // Звонки с kitis.ru. Понедельник — кураторский день: на сервере расписания 1-й час понедельника —
  // кураторский час («Разговоры о важном», 08:30 – 09:00), со 2-го часа идут пары по звонкам понедельника.
  var CURATOR_TIME = ['08:30', '09:00'];
  var MON_TIMES = [['09:10', '10:30'], ['10:40', '12:00'], ['12:20', '13:40'], ['13:50', '15:10'], ['16:00', '17:20'], ['17:30', '18:50']];
  var WK_TIMES = [['08:30', '10:00'], ['10:10', '11:40'], ['12:10', '13:40'], ['13:50', '15:20'], ['15:30', '17:00'], ['17:10', '18:40']];
  var TZ_OFFSET = 2 * 3600 * 1000;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function arr(v) { return v == null || v === -1 ? [] : (Array.isArray(v) ? v.filter(function (x) { return x >= 0; }) : [v]); }
  function isoToMs(iso) { return Date.parse(iso + 'T00:00:00Z'); }
  function addDays(iso, n) { return new Date(isoToMs(iso) + n * 86400000).toISOString().slice(0, 10); }
  function weekday(iso) { return (new Date(isoToMs(iso)).getUTCDay() + 6) % 7; }
  function mondayOf(iso) { return addDays(iso, -weekday(iso)); }
  function diffDays(a, b) { return Math.round((isoToMs(b) - isoToMs(a)) / 86400000); }
  function dayNum(iso) { return parseInt(iso.slice(8, 10), 10); }
  function monthOf(iso) { return parseInt(iso.slice(5, 7), 10) - 1; }
  function yearOf(iso) { return parseInt(iso.slice(0, 4), 10); }
  function toSec(hhmm) { var p = hhmm.split(':'); return parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60; }
  function times(wd) { return wd === 0 ? MON_TIMES : WK_TIMES; }
  function pairTime(wd, n) {
    if (wd === 0) return n === 1 ? CURATOR_TIME : (MON_TIMES[n - 2] || null);
    return WK_TIMES[n - 1] || null;
  }
  // номер пары, как в расписании звонков (в понедельник 1-й час сервера — кураторский час)
  function pairNum(wd, n) { return wd === 0 ? n - 1 : n; }
  function pairLabel(wd, n) { var k = pairNum(wd, n); return k <= 0 ? 'Кураторский час' : k + ' пара'; }
  function evenHours(v) { return v == null ? null : Math.round(v / 2) * 2; }

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }

  function fmtName(name) {
    var s = String(name || '').replace(/([А-ЯЁ]\.)(?=[А-ЯЁ])/g, '$1 ');
    if (/\s[А-ЯЁ]\.\s[А-ЯЁ]$/.test(s)) s += '.';
    return s;
  }

  function isVacancy(name) { return /ваканс/i.test(name || ''); }

  function dayLabel(iso) { return dayNum(iso) + ' ' + MONTHS[monthOf(iso)]; }

  function rangeLabel(a, b) {
    if (yearOf(a) !== yearOf(b)) return dayLabel(a) + ' ' + yearOf(a) + ' – ' + dayLabel(b) + ' ' + yearOf(b);
    if (monthOf(a) !== monthOf(b)) return dayLabel(a) + ' – ' + dayLabel(b) + ' ' + yearOf(b);
    return dayNum(a) + ' – ' + dayNum(b) + ' ' + MONTHS[monthOf(b)] + ' ' + yearOf(b);
  }

  function fmtTimer(secs) {
    secs = Math.max(0, Math.floor(secs));
    var h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60), s = secs % 60;
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
  }

  /* ---------- часы ---------- */

  var override = null;
  try {
    var q = /[?&]now=([^&#]+)/.exec(root.location ? root.location.search : '');
    if (q) override = decodeURIComponent(q[1]);
  } catch (e) { /* без подмены времени */ }
  var startedAt = Date.now();
  var overrideMs = null;
  if (override) {
    var om = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(override);
    if (om) overrideMs = Date.parse(om[1] + 'T' + pad(parseInt(om[2] || '8', 10)) + ':' + (om[3] || '00') + ':00Z') - TZ_OFFSET;
  }

  function clock() {
    var ms = overrideMs != null ? overrideMs + (Date.now() - startedAt) : Date.now();
    var k = new Date(ms + TZ_OFFSET);
    var iso = k.toISOString().slice(0, 10);
    return { iso: iso, wd: weekday(iso), secs: k.getUTCHours() * 3600 + k.getUTCMinutes() * 60 + k.getUTCSeconds(), simulated: overrideMs != null };
  }

  /* ---------- данные ---------- */

  var idx = { g: {}, t: {}, r: {} };
  var weekSrc = {};
  var firstMonday = null, lastMonday = null;
  var teacherLoad = {};

  function push(map, key, date, o) {
    var m = map[key] || (map[key] = {});
    (m[date] || (m[date] = [])).push(o);
  }

  if (D) {
    var dateCache = {};
    D.lessons.forEach(function (r) {
      var date = dateCache[r[0]] || (dateCache[r[0]] = addDays(D.base, r[0]));
      var o = { date: date, wd: weekday(date), n: r[1], g: r[2], sub: r[3], s: r[4], t: arr(r[5]), r: arr(r[6]), k: r[7], src: r[8] };
      push(idx.g, o.g, date, o);
      o.t.forEach(function (x) { push(idx.t, x, date, o); });
      o.r.forEach(function (x) { push(idx.r, x, date, o); });
      var mon = mondayOf(date);
      var ws = weekSrc[mon] || (weekSrc[mon] = { journal: 0, schedule: 0 });
      if (o.src === 0) ws.journal += 1; else ws.schedule += 1;
      if (!firstMonday || mon < firstMonday) firstMonday = mon;
      if (!lastMonday || mon > lastMonday) lastMonday = mon;
    });
    if (D.scheduleWeek && (!lastMonday || D.scheduleWeek > lastMonday)) lastMonday = D.scheduleWeek;
    D.load.forEach(function (rows, g) {
      rows.forEach(function (x) {
        if (x[1] < 0) return;
        var tl = teacherLoad[x[1]] || (teacherLoad[x[1]] = { subjects: [], groups: [] });
        var subj = D.subjects[x[0]];
        if (tl.subjects.indexOf(subj) < 0) tl.subjects.push(subj);
        if (tl.groups.indexOf(D.groups[g]) < 0) tl.groups.push(D.groups[g]);
      });
    });
  }

  function teacherName(i) { return D && D.teachers[i] != null ? fmtName(D.teachers[i]) : ''; }
  function roomName(i) { return D && D.rooms[i] != null ? D.rooms[i] : ''; }

  function view(o) {
    var tm = pairTime(o.wd, o.n);
    var teachers = o.t.map(teacherName);
    var rooms = o.r.map(roomName);
    var num = pairNum(o.wd, o.n);
    return {
      date: o.date, wd: o.wd, n: o.n, num: num, badge: num <= 0 ? 'К' : String(num), label: pairLabel(o.wd, o.n), curator: num <= 0,
      start: tm ? tm[0] : '', end: tm ? tm[1] : '', hasTime: !!tm,
      time: tm ? tm[0] + ' – ' + tm[1] : '',
      remote: rooms.length === 0, place: rooms.length ? rooms.map(function (x) { return /^\d/.test(x) ? 'ауд. ' + x : x; }).join(', ') : 'Дистант',
      subject: D.subjects[o.s] || '', color: subjectColor(D.subjects[o.s] || ''), type: D.types[o.k] || '',
      group: D.groups[o.g] || '', g: o.g,
      teacher: teachers.join(', '), teachers: teachers, t: o.t, t0: o.t.length ? o.t[0] : -1,
      room: rooms.join(', '), rooms: rooms, r: o.r, r0: o.r.length ? o.r[0] : -1,
      sub: o.sub, subLabel: o.sub ? o.sub + ' подгр.' : '',
      src: o.src, changed: o.src === 2
    };
  }

  function lessonsOn(kind, i, iso) {
    if (!D || i == null || i < 0) return [];
    var m = idx[kind][i];
    var list = (m && m[iso]) || [];
    return list.slice().sort(function (a, b) { return a.n - b.n || a.sub - b.sub || a.g - b.g; }).map(view);
  }

  function week(kind, i, monday) {
    var out = [];
    for (var d = 0; d < 7; d++) {
      var iso = addDays(monday, d);
      out.push({ iso: iso, wd: d, name: DAY_NAMES[d], short: DAY_SHORT[d], label: dayLabel(iso), num: dayNum(iso), lessons: lessonsOn(kind, i, iso) });
    }
    return out;
  }

  function calendarMonday() { return mondayOf(clock().iso); }
  function weekHasData(mon) { var ws = weekSrc[mon]; return !!(ws && (ws.schedule || ws.journal)); }
  // в воскресенье неделя уже закончилась — показываем новую, если на сервере она есть
  function currentMonday() {
    var c = clock();
    var mon = mondayOf(c.iso);
    if (c.wd === 6 && weekHasData(addDays(mon, 7))) return addDays(mon, 7);
    return mon;
  }

  function weekInfo(offset) {
    var cur = currentMonday();
    var mon = addDays(cur, offset * 7);
    var sat = addDays(mon, 5);
    var ws = weekSrc[mon] || { journal: 0, schedule: 0 };
    var source = ws.schedule ? 'schedule' : (ws.journal ? 'journal' : 'none');
    var sub;
    var sunday = clock().wd === 6;
    var shifted = cur !== calendarMonday();
    if (offset === 0 && sunday && shifted) sub = 'Новая неделя · начинается завтра';
    else if (offset === 0 && sunday) sub = 'Неделя закончилась · новое расписание ещё не опубликовано';
    else if (offset === -1 && shifted) sub = 'Прошлая неделя · закончилась вчера';
    else if (offset === 0) sub = 'Текущая неделя';
    else if (offset === 1) sub = 'Следующая неделя';
    else if (offset === -1) sub = 'Прошлая неделя';
    else if (offset > 1) sub = 'Через ' + offset + ' ' + plural(offset, 'неделю', 'недели', 'недель');
    else sub = (-offset) + ' ' + plural(-offset, 'неделю', 'недели', 'недель') + ' назад';
    var sourceLabel = source === 'schedule' ? 'Актуальное расписание группы' : (source === 'journal' ? 'По итогам · журнал занятий' : 'На сервере пока нет данных');
    var sourceNote = source === 'schedule' ? 'актуальное расписание' : (source === 'journal' ? 'по итогам (журнал занятий)' : 'на сервере пока нет данных');
    return {
      monday: mon, saturday: sat, offset: offset, label: rangeLabel(mon, sat), shortLabel: dayNum(mon) + ' – ' + dayNum(sat) + ' ' + MONTHS[monthOf(sat)],
      sub: sub, source: source, sourceLabel: sourceLabel, sourceNote: sourceNote, hasData: source !== 'none',
      isPast: offset < 0, isCurrent: offset === 0, isNext: offset === 1
    };
  }

  function bounds() {
    var cur = currentMonday();
    var min = firstMonday ? Math.floor(diffDays(cur, firstMonday) / 7) : 0;
    var max = lastMonday ? Math.floor(diffDays(cur, lastMonday) / 7) : 0;
    return { min: Math.min(min, 0), max: Math.max(max, 0), nextPublished: max >= 1 };
  }

  function status(kind, i) {
    var c = clock();
    var today = lessonsOn(kind, i, c.iso).filter(function (l) { return l.hasTime; });
    var cur = null, next = null, started = false;
    today.forEach(function (l) {
      var s = toSec(l.start), e = toSec(l.end);
      if (s <= c.secs && c.secs < e) { if (!cur) cur = l; }
      else if (s > c.secs) { if (!next) next = l; }
      else started = true;
    });
    if (cur) {
      var e1 = toSec(cur.end), s1 = toSec(cur.start);
      var after = today.filter(function (l) { return toSec(l.start) >= e1; })[0] || null;
      return { mode: 'now', lesson: cur, next: after, left: e1 - c.secs, total: e1 - s1, today: today, clock: c };
    }
    if (next) {
      var s2 = toSec(next.start);
      return { mode: started ? 'break' : 'before', lesson: next, next: null, left: s2 - c.secs, total: 0, today: today, clock: c };
    }
    for (var d = 1; d <= 28; d++) {
      var iso = addDays(c.iso, d);
      var ls = lessonsOn(kind, i, iso).filter(function (l) { return l.hasTime; });
      if (ls.length) return { mode: today.length ? 'after' : 'off', lesson: ls[0], next: null, inDays: d, iso: iso, left: 0, total: 0, today: today, clock: c };
    }
    return { mode: today.length ? 'after' : 'none', lesson: null, next: null, left: 0, total: 0, today: today, clock: c };
  }

  function whenLabel(iso) {
    var c = clock();
    var d = diffDays(c.iso, iso);
    if (d === 0) return 'сегодня';
    if (d === 1) return 'завтра';
    return DAY_LOWER[weekday(iso)] + ', ' + dayLabel(iso);
  }

  // «Итоги» — строки страниц vgN / vpN / vaN сервера как есть: те же часы, остаток и процент, тот же порядок.
  // kind: 'g' — группа, 't' — преподаватель, 'r' — аудитория. null — в данных этих итогов ещё нет.
  function loadOf(kind, i) {
    if (!D) return [];
    var src = kind === 'g' ? D.load : (kind === 't' ? D.loadT : D.loadR);
    if (!src) return kind === 'g' ? [] : null;
    var rows = src[i] || [];
    return rows.map(function (x, n) {
      var r = kind === 'g'
        ? { t: x[1], g: i, sub: x[2], s: x[0], k: x[3], total: x[4], plan: x[5], fact: x[6], rest: x[7], planWeek: x[8], factWeek: x[9], end: x[10], pct: x[11], j: x[12] }
        : { t: x[0], g: x[1], sub: x[2], s: x[3], k: x[4], total: x[5], plan: x[6], fact: x[7], rest: x[8], planWeek: x[9], factWeek: x[10], end: x[11], pct: x[12], j: x[13] };
      return {
        n: n + 1, subject: D.subjects[r.s] || '', color: subjectColor(D.subjects[r.s] || ''), teacher: teacherName(r.t), teacherRaw: D.teachers[r.t] || '', t: r.t, group: D.groups[r.g] || '', sub: r.sub || 0,
        type: D.types[r.k] || '', total: r.total, plan: r.plan, fact: r.fact, rest: r.rest, planWeek: r.planWeek, factWeek: r.factWeek,
        end: r.end, pct: r.pct != null ? r.pct : (r.total ? Math.round(r.fact / r.total * 100) : null), j: r.j
      };
    });
  }
  function load(g) { return loadOf('g', g); }
  // числа как на сервере: дробные — с запятой (1,8), пустые — «—»
  /* ---------- цвета предметов ----------
   * Цвет закреплён за названием предмета в данных (KITIS_DATA.colors). Его подбирает робот:
   * у каждого предмета свой спокойный цвет, цвета не повторяются и не меняются от обновления к обновлению.
   * Если в данных цвета нет (старая выгрузка), берётся запасной спокойный цвет по названию. */
  function subjectColor(name) {
    var c = D && D.colors && D.colors[name];
    if (c && /^#[0-9a-f]{6}$/i.test(c)) return c;
    var h = 0;
    for (var i = 0; i < String(name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    var hue = (h % 360) / 60, ch = 0.3, x = ch * (1 - Math.abs(hue % 2 - 1)), m = 0.62 - ch / 2;
    var rgb = hue < 1 ? [ch, x, 0] : hue < 2 ? [x, ch, 0] : hue < 3 ? [0, ch, x] : hue < 4 ? [0, x, ch] : hue < 5 ? [x, 0, ch] : [ch, 0, x];
    return '#' + rgb.map(function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); }).join('');
  }

  function fmtNum(v) { return v == null ? '—' : String(Math.round(v * 10) / 10).replace('.', ','); }

  // Пара длится 1,5 часа (в понедельник — 1 ч 20 мин). Сервер считает объём в академических часах:
  // одна пара — 2 академических часа, поэтому для пар делим на 2.
  function pairsOf(acadHours) { return acadHours == null ? null : Math.round(acadHours / 2); }
  function durationMin(l) { return l && l.hasTime ? Math.round((toSec(l.end) - toSec(l.start)) / 60) : 0; }
  function fmtHours(min) {
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    return h && m ? h + ' ч ' + m + ' мин' : (h ? h + ' ч' : m + ' мин');
  }
  function fmtPairsHours(pairs) {
    var h = pairs * 1.5;
    return pairs + ' ' + plural(pairs, 'пара', 'пары', 'пар') + ' · ' + String(h).replace('.', ',') + ' ч';
  }

  function updatedLabel() {
    if (!D || !D.updated) return '';
    var iso = D.updated.slice(0, 10);
    return dayLabel(iso) + ' ' + yearOf(iso) + ', ' + D.updated.slice(11, 16);
  }

  var teacherIdx = [];
  var groupIdx = [];
  var roomIdx = [];
  if (D) {
    D.teachers.forEach(function (n, i) { if (!isVacancy(n)) teacherIdx.push(i); });
    teacherIdx.sort(function (a, b) { return fmtName(D.teachers[a]).localeCompare(fmtName(D.teachers[b]), 'ru'); });
    D.groups.forEach(function (n, i) { groupIdx.push(i); });
    D.rooms.forEach(function (n, i) { roomIdx.push(i); });
  }

  // Из адреса берём только известные ключи, по 120 символов; битая кодировка не ломает страницу
  var HASH_KEYS = { tab: 1, group: 1, teacher: 1, room: 1, w: 1, page: 1, p: 1, q: 1, i: 1, k: 1 };
  function readHash() {
    var out = {};
    var h = '';
    try { h = (root.location && root.location.hash || '').replace(/^#/, '').slice(0, 2000); } catch (e) { return out; }
    h.split('&').forEach(function (part) {
      if (!part) return;
      var i = part.indexOf('=');
      var k, v;
      try {
        k = decodeURIComponent(i < 0 ? part : part.slice(0, i));
        v = i < 0 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
      } catch (e) { return; }
      if (!Object.prototype.hasOwnProperty.call(HASH_KEYS, k)) return;
      out[k] = String(v).replace(/[\u0000-\u001f<>]/g, '').slice(0, 120);
    });
    return out;
  }
  function hashOf(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k] != null && obj[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }).join('&');
  }
  function writeHash(obj, replace) {
    try {
      var h = hashOf(obj);
      var cur = (root.location.hash || '').replace(/^#/, '');
      if (h === cur) return;
      var url = root.location.pathname + root.location.search + (h ? '#' + h : '');
      if (replace) root.history.replaceState(null, '', url); else root.history.pushState(null, '', url);
    } catch (e) { /* без истории */ }
  }

  function changes() { return D && D.changes ? D.changes.slice() : []; }

  var RECENT_KEY = 'kitis.recent.v1';
  // Недавние: проверяем каждую запись — подменённое хранилище не должно ломать страницу
  function recent() {
    var list;
    try { list = JSON.parse(root.localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) {
      return x && typeof x === 'object' && (x.kind === 'g' || x.kind === 't' || x.kind === 'r' || x.kind === 'group' || x.kind === 'teacher' || x.kind === 'room') &&
        typeof x.name === 'string' && x.name.length > 0 && x.name.length <= 80 && !/[<>]/.test(x.name);
    }).slice(0, 6).map(function (x) { return { kind: x.kind, name: x.name }; });
  }
  function remember(kind, name) {
    if (!name) return;
    try {
      var list = recent().filter(function (x) { return !(x.kind === kind && x.name === name); });
      list.unshift({ kind: kind, name: name });
      root.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
    } catch (e) { /* без истории выбора */ }
  }

  // Избранное: группы, преподаватели и аудитории. Хранится в этом браузере; общее для всех страниц сайта.
  var FAV_KEY = 'kitis.favs.v1';
  var FAV_KINDS = { g: 1, t: 1, r: 1 };
  function readFavs() {
    var raw;
    try { raw = root.localStorage.getItem(FAV_KEY); } catch (e) { return null; }
    if (raw == null) return null;
    var list;
    try { list = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) {
      return x && typeof x === 'object' && FAV_KINDS[x.kind] === 1 && typeof x.name === 'string' && x.name.length > 0 && x.name.length <= 80 && !/[<>]/.test(x.name);
    }).slice(0, 40).map(function (x) { return { kind: x.kind, name: x.name }; });
  }
  function saveFavs(list) {
    try { root.localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, 40))); } catch (e) { /* только на эту страницу */ }
    try { root.dispatchEvent(new Event('kitis-favs')); } catch (e) { /* старый браузер */ }
  }
  // seed — своя группа из профиля: попадает в избранное, пока человек сам ничего не менял
  var favMemory = null;
  function favs(seed) {
    var list = readFavs();
    if (list == null) list = favMemory || (seed && FAV_KINDS[seed.kind] === 1 && seed.name ? [{ kind: seed.kind, name: seed.name }] : []);
    return list;
  }
  function isFav(kind, name, seed) { return favs(seed).some(function (x) { return x.kind === kind && x.name === name; }); }
  function toggleFav(kind, name, seed) {
    if (FAV_KINDS[kind] !== 1 || !name) return false;
    var list = favs(seed);
    var on = list.some(function (x) { return x.kind === kind && x.name === name; });
    list = on ? list.filter(function (x) { return !(x.kind === kind && x.name === name); }) : list.concat([{ kind: kind, name: name }]);
    favMemory = list;
    saveFavs(list);
    return !on;
  }

  root.KitisModel = {
    ready: !!D,
    data: D,
    MONTHS: MONTHS, DAY_NAMES: DAY_NAMES, DAY_SHORT: DAY_SHORT, MON_TIMES: MON_TIMES, WK_TIMES: WK_TIMES,
    plural: plural, fmtName: fmtName, fmtTimer: fmtTimer, dayLabel: dayLabel, rangeLabel: rangeLabel, whenLabel: whenLabel,
    addDays: addDays, weekday: weekday, mondayOf: mondayOf, toSec: toSec, times: times, pairTime: pairTime, pairNum: pairNum, pairLabel: pairLabel,
    CURATOR_TIME: CURATOR_TIME, evenHours: evenHours, readHash: readHash, writeHash: writeHash, changes: changes, recent: recent, remember: remember,
    clock: clock, week: week, weekInfo: weekInfo, bounds: bounds, lessonsOn: lessonsOn, status: status, load: load, loadOf: loadOf, fmtNum: fmtNum, subjectColor: subjectColor,
    updatedLabel: updatedLabel, pairsOf: pairsOf, durationMin: durationMin, fmtHours: fmtHours, fmtPairsHours: fmtPairsHours,
    favs: favs, isFav: isFav, toggleFav: toggleFav, FAV_KEY: FAV_KEY,
    groups: function () { return groupIdx.map(function (i) { return { i: i, name: D.groups[i] }; }); },
    teachers: function () { return teacherIdx.map(function (i) { return { i: i, name: fmtName(D.teachers[i]), raw: D.teachers[i] }; }); },
    // для «Итогов»: все строки списка vp.htm сервера, включая «Вакансию»
    teachersAll: function () { return D.teachers.map(function (n, i) { return { i: i, name: isVacancy(n) ? n : fmtName(n), raw: n }; }); },
    rooms: function () { return roomIdx.map(function (i) { return { i: i, name: D.rooms[i] }; }); },
    groupIndex: function (name) { return D ? D.groups.indexOf(name) : -1; },
    teacherIndex: function (name) {
      if (!D) return -1;
      for (var i = 0; i < D.teachers.length; i++) if (fmtName(D.teachers[i]) === name || D.teachers[i] === name) return i;
      return -1;
    },
    roomIndex: function (name) { return D ? D.rooms.indexOf(name) : -1; },
    teacherName: teacherName, roomName: roomName,
    teacherLoad: function (i) { return teacherLoad[i] || { subjects: [], groups: [] }; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
