/*
 * Парсер сервера расписания КИТиС (программа «Экспресс-расписание»).
 * Источник: http://94.72.18.202:8083
 *
 *   cg.htm / cp.htm / ca.htm  — списки групп, преподавателей, аудиторий
 *   cgN.htm                   — «Неделя»: текущее расписание группы
 *   vg.htm / vgN.htm          — «Итоги»: выполнение нагрузки группы
 *   jN.htm                    — «Журнал занятий»: каждая строка — одна проведённая пара
 *
 * Прошлые недели собираются из журналов, неделя со страницы «Неделя» — из расписания групп.
 * Без зависимостей: работает в браузере (на странице сервера) и в Node 18+.
 */
(function (root) {
  'use strict';

  var ENTITIES = { nbsp: ' ', quot: '"', amp: '&', lt: '<', gt: '>', laquo: '«', raquo: '»', ndash: '–', mdash: '—' };

  function text(html) {
    return String(html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&(#\d+|[a-z]+);/gi, function (all, name) {
        if (name.charAt(0) === '#') return String.fromCharCode(parseInt(name.slice(1), 10));
        return ENTITIES[name.toLowerCase()] != null ? ENTITIES[name.toLowerCase()] : all;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function attr(attrs, name) {
    var m = new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs || '');
    return m ? (m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]) : null;
  }

  function anchors(html) {
    var out = [];
    var re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    var m;
    while ((m = re.exec(html))) {
      out.push({ href: attr(m[1], 'href') || '', cls: attr(m[1], 'class') || '', text: text(m[2]) });
    }
    return out;
  }

  function idOf(href, prefix) {
    var m = new RegExp('^\\.?/?' + prefix + '(\\d+)\\.htm$', 'i').exec(String(href || '').trim());
    return m ? parseInt(m[1], 10) : null;
  }

  function rows(html) {
    return String(html).split(/<tr\b[^>]*>/i).slice(1);
  }

  function cells(row) {
    var out = [];
    var re = /<td\b([^>]*)>([\s\S]*?)(?=<td\b|<\/tr>|$)/gi;
    var m;
    while ((m = re.exec(row))) {
      out.push({ attrs: m[1], html: m[2].replace(/<\/td>\s*$/i, ''), cls: (attr(m[1], 'class') || '').toLowerCase() });
    }
    return out;
  }

  function isoDate(dmy) {
    var m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(dmy || '');
    return m ? m[3] + '-' + m[2] + '-' + m[1] : null;
  }

  function num(s) {
    var v = parseFloat(String(s || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
    return isNaN(v) ? null : v;
  }

  /* ---------- страницы ---------- */

  function parseList(html, prefix) {
    var seen = {};
    return anchors(html).reduce(function (acc, a) {
      var id = idOf(a.href, prefix);
      if (id != null && a.text && !seen[id]) { seen[id] = 1; acc.push({ id: id, name: a.text }); }
      return acc;
    }, []);
  }

  function parseUpdated(html) {
    var m = /Обновлено:\s*(\d{2}\.\d{2}\.\d{4})\s*в\s*(\d{1,2}:\d{2})/.exec(text(html));
    return m ? isoDate(m[1]) + 'T' + (m[2].length === 4 ? '0' + m[2] : m[2]) : null;
  }

  function parseTitle(html) {
    var m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    return m ? text(m[1]) : '';
  }

  // «Итоги»: выполнение нагрузки группы
  function parseLoad(html) {
    var items = [];
    rows(html).forEach(function (r) {
      var c = cells(r);
      if (c.length < 13 || c[1].cls !== 'vp') return;
      var j = null;
      anchors(c[4].html).forEach(function (a) { if (j == null) j = idOf(a.href, 'j'); });
      var pct = /alt\s*=\s*"?(\d+)/i.exec(c[13] ? c[13].html : '');
      items.push({
        teacher: text(c[1].html), group: text(c[2].html), sub: num(text(c[3].html)) || 0,
        subject: text(c[4].html), j: j, type: text(c[5].html),
        total: num(text(c[6].html)), plan: num(text(c[7].html)), fact: num(text(c[8].html)), rest: num(text(c[9].html)),
        planWeek: num(text(c[10].html)), factWeek: num(text(c[11].html)), end: isoDate(text(c[12].html)),
        pct: pct ? parseInt(pct[1], 10) : null
      });
    });
    return items;
  }

  // «Журнал занятий»
  function parseJournal(html) {
    var subj = /<li\s+class\s*=\s*"?zgr"?[^>]*>([\s\S]*?)<\/li>\s*<li[^>]*>([\s\S]*?)<\/li>/i.exec(html);
    var out = { subject: subj ? text(subj[1]) : '', cutoff: subj ? isoDate(text(subj[2])) : null, rows: [] };
    rows(html).forEach(function (r) {
      var c = cells(r);
      if (c.length < 7 || c[1].cls !== 'vp') return;
      var date = isoDate(text(c[1].html));
      var pair = num(text(c[2].html));
      if (!date || !pair) return;
      out.rows.push({
        date: date, pair: pair, group: text(c[3].html), sub: num(text(c[4].html)) || 0,
        teacher: text(c[5].html), room: text(c[6].html)
      });
    });
    return out;
  }

  // «Неделя»: текущее расписание группы
  function parseWeek(html) {
    var out = [];
    var date = null;
    rows(html).forEach(function (r) {
      var c = cells(r);
      var i = 0;
      if (c[0] && /\d{2}\.\d{2}\.\d{4}/.test(text(c[0].html))) { date = isoDate(text(c[0].html)); i = 1; }
      if (!date || !c[i] || c[i].cls !== 'hd') return;
      var pair = num(text(c[i].html));
      if (!pair) return;
      var lessonCells = c.slice(i + 1);
      var col = 0;
      lessonCells.forEach(function (cell) {
        var span = parseInt(attr(cell.attrs, 'colspan') || '1', 10) || 1;
        var sub = span >= 2 ? 0 : col + 1;
        col += span;
        if (cell.cls === 'nul' || !text(cell.html)) return;
        var cur = null;
        var list = [];
        anchors(cell.html).forEach(function (a) {
          var j = idOf(a.href, 'j');
          if (j != null || /\bz1\b/.test(a.cls)) {
            cur = { date: date, pair: pair, sub: sub, subject: a.text, j: j, rooms: [], teachers: [], cls: cell.cls };
            list.push(cur);
          } else if (cur && (idOf(a.href, 'ca') != null || /\bz2\b/.test(a.cls))) {
            cur.rooms.push(a.text);
          } else if (cur && (idOf(a.href, 'cp') != null || /\bz3\b/.test(a.cls))) {
            cur.teachers.push(a.text);
          }
        });
        if (!list.length) list.push({ date: date, pair: pair, sub: sub, subject: text(cell.html), j: null, rooms: [], teachers: [], cls: cell.cls });
        out.push.apply(out, list);
      });
    });
    return out;
  }

  /* ---------- сбор ---------- */

  function pool(items, limit, fn) {
    var i = 0;
    var results = new Array(items.length);
    function next() {
      if (i >= items.length) return Promise.resolve();
      var k = i++;
      return Promise.resolve(fn(items[k], k)).then(function (v) { results[k] = v; return next(); });
    }
    var runners = [];
    for (var n = 0; n < Math.min(limit, items.length); n++) runners.push(next());
    return Promise.all(runners).then(function () { return results; });
  }

  function mondayOf(iso) {
    var d = new Date(iso + 'T12:00:00Z');
    var wd = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wd);
    return d.toISOString().slice(0, 10);
  }

  function dayDiff(a, b) {
    return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
  }

  /**
   * opts.fetchText(path) → Promise<string> (страница в кодировке windows-1251 уже раскодирована)
   * opts.concurrency — сколько страниц качать одновременно (по умолчанию 4)
   * opts.log(msg)
   */
  function scrape(opts) {
    var fetchText = opts.fetchText;
    var log = opts.log || function () {};
    var limit = opts.concurrency || 4;
    var state = { groups: [], teachers: [], rooms: [], updated: null };

    return Promise.all([fetchText('cg.htm'), fetchText('cp.htm'), fetchText('ca.htm')]).then(function (lists) {
      state.groups = parseList(lists[0], 'cg');
      state.teachers = parseList(lists[1], 'cp');
      state.rooms = parseList(lists[2], 'ca');
      state.updated = parseUpdated(lists[0]);
      log('Списки: групп ' + state.groups.length + ', преподавателей ' + state.teachers.length + ', аудиторий ' + state.rooms.length);
      return pool(state.groups, limit, function (g) {
        return Promise.all([fetchText('cg' + g.id + '.htm'), fetchText('vg' + g.id + '.htm')]).then(function (p) {
          return { week: parseWeek(p[0]), load: parseLoad(p[1]), title: parseTitle(p[0]) };
        });
      });
    }).then(function (perGroup) {
      state.perGroup = perGroup;
      var jids = {};
      perGroup.forEach(function (pg) {
        pg.load.forEach(function (it) { if (it.j != null) jids[it.j] = 1; });
        pg.week.forEach(function (l) { if (l.j != null) jids[l.j] = 1; });
      });
      var list = Object.keys(jids).map(Number).sort(function (a, b) { return a - b; });
      log('Расписание и итоги групп получены. Журналов: ' + list.length);
      var done = 0;
      return pool(list, limit, function (id) {
        return fetchText('j' + id + '.htm').then(function (h) {
          done++;
          if (done % 100 === 0) log('Журналы: ' + done + ' из ' + list.length);
          var j = parseJournal(h);
          j.id = id;
          return j;
        });
      });
    }).then(function (journals) {
      return build(state, journals);
    });
  }

  function build(state, journals) {
    var idx = function () {
      var list = [];
      var map = {};
      return {
        list: list,
        get: function (name) {
          name = String(name || '').trim();
          if (!name) return -1;
          if (!(name in map)) { map[name] = list.length; list.push(name); }
          return map[name];
        }
      };
    };
    var G = idx(); var T = idx(); var R = idx(); var S = idx(); var K = idx();
    state.groups.forEach(function (g) { G.get(g.name); });
    state.teachers.forEach(function (t) { T.get(t.name); });
    state.rooms.forEach(function (r) { R.get(r.name); });
    K.get('');

    var types = {};
    state.perGroup.forEach(function (pg) {
      pg.load.forEach(function (it) { if (it.j != null) types[it.j] = it.type; });
    });

    // неделя со страницы «Неделя»
    var weekDates = {};
    state.perGroup.forEach(function (pg) { pg.week.forEach(function (l) { weekDates[l.date] = 1; }); });
    var cutoff = null;
    journals.forEach(function (j) { if (j.cutoff && (!cutoff || j.cutoff > cutoff)) cutoff = j.cutoff; });
    var wd = Object.keys(weekDates).sort();
    var weekStart = wd.length ? mondayOf(wd[0]) : (cutoff ? mondayOf(cutoff) : null);
    var firstScheduleDay = wd.length ? wd[0] : cutoff;

    var all = [];
    var minDate = null;
    var teacherList = function (s) { return String(s || '').split(/\s*[,;]\s*/).filter(Boolean); };
    var tIdx = function (names) {
      var ids = names.map(function (n) { return T.get(n); }).filter(function (v) { return v >= 0; });
      return ids.length === 0 ? -1 : ids.length === 1 ? ids[0] : ids;
    };
    var rIdx = function (names) {
      var ids = names.map(function (n) { return R.get(n); }).filter(function (v) { return v >= 0; });
      return ids.length === 0 ? -1 : ids.length === 1 ? ids[0] : ids;
    };

    journals.forEach(function (j) {
      var s = S.get(j.subject);
      var k = K.get(types[j.id] || '');
      j.rows.forEach(function (r) {
        if (firstScheduleDay && r.date >= firstScheduleDay) return; // эту неделю берём из «Недели»
        var g = G.get(r.group);
        all.push({ date: r.date, row: [0, r.pair, g, r.sub, s, tIdx(teacherList(r.teacher)), rIdx([r.room]), k, 0] });
      });
    });

    state.groups.forEach(function (g, gi) {
      state.perGroup[gi].week.forEach(function (l) {
        var s = S.get(l.subject);
        var k = K.get(l.j != null ? (types[l.j] || '') : '');
        var changed = l.cls && l.cls !== 'ur' ? 1 : 0;
        all.push({ date: l.date, row: [0, l.pair, G.get(g.name), l.sub, s, tIdx(l.teachers), rIdx(l.rooms), k, 1 + changed] });
      });
    });

    // убрать повторы (одна пара может попасть из нескольких журналов)
    var seen = {};
    var lessons = [];
    all.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : a.row[2] - b.row[2] || a.row[1] - b.row[1] || a.row[3] - b.row[3];
    });
    all.forEach(function (x) {
      if (!minDate || x.date < minDate) minDate = x.date;
      var key = x.date + '|' + x.row.slice(1, 7).join('|');
      if (seen[key]) return;
      seen[key] = 1;
      lessons.push(x);
    });
    var base = minDate ? mondayOf(minDate) : weekStart;
    lessons = lessons.map(function (x) { x.row[0] = dayDiff(base, x.date); return x.row; });

    var load = state.groups.map(function (g, gi) {
      return state.perGroup[gi].load.map(function (it) {
        return [S.get(it.subject), T.get(it.teacher), it.sub, K.get(it.type), it.total, it.plan, it.fact, it.rest,
          it.planWeek, it.factWeek, it.end, it.pct, it.j];
      });
    });

    return {
      v: 1,
      source: 'http://94.72.18.202:8083',
      updated: state.updated,
      fetched: new Date().toISOString(),
      base: base,
      scheduleWeek: weekStart,
      groups: G.list,
      groupIds: state.groups.map(function (g) { return g.id; }),
      teachers: T.list,
      teacherIds: state.teachers.map(function (t) { return t.id; }),
      rooms: R.list,
      roomIds: state.rooms.map(function (r) { return r.id; }),
      subjects: S.list,
      types: K.list,
      // [день от base, пара, группа, подгруппа (0 — вся группа), дисциплина, преподаватель (-1 | число | массив),
      //  аудитория (-1 | число | массив), тип занятия, источник: 0 — журнал, 1 — «Неделя», 2 — «Неделя» с изменением]
      lessons: lessons,
      // по группам: [дисциплина, преподаватель, подгруппа, тип, всего, план, факт, остаток, план в нед., факт в нед., окончание, %, журнал]
      load: load
    };
  }

  /* ---------- что изменилось в «Неделе» между двумя выгрузками ---------- */

  function weekKeys(d) {
    var out = {};
    if (!d || !d.lessons) return out;
    var baseMs = Date.parse(d.base + 'T12:00:00Z');
    var list = function (v, names) {
      var a = v == null || v === -1 ? [] : (Array.isArray(v) ? v : [v]);
      return a.map(function (i) { return names[i] || ''; }).sort().join(',');
    };
    d.lessons.forEach(function (r) {
      if (!(r[8] >= 1)) return; // только расписание со страницы «Неделя»
      var date = new Date(baseMs + r[0] * 86400000).toISOString().slice(0, 10);
      var g = d.groups[r[2]];
      (out[g] || (out[g] = [])).push([date, r[1], r[3], d.subjects[r[4]], list(r[5], d.teachers), list(r[6], d.rooms)].join('|'));
    });
    return out;
  }

  // Группы, у которых поменялись пары на той же опубликованной неделе. null — неделя другая, сравнивать нечего.
  function changedGroups(prev, next) {
    if (!prev || !next || !prev.scheduleWeek || prev.scheduleWeek !== next.scheduleWeek) return null;
    var a = weekKeys(prev), b = weekKeys(next);
    var seen = {};
    var out = [];
    (next.groups || []).concat(Object.keys(a)).forEach(function (g) {
      if (seen[g]) return;
      seen[g] = 1;
      if ((a[g] || []).slice().sort().join('\n') !== (b[g] || []).slice().sort().join('\n')) out.push(g);
    });
    return out;
  }

  var api = {
    text: text, parseList: parseList, parseLoad: parseLoad, parseJournal: parseJournal, parseWeek: parseWeek,
    parseUpdated: parseUpdated, scrape: scrape, build: build, mondayOf: mondayOf, changedGroups: changedGroups
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KitisParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
