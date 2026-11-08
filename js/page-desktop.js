/* Код страницы desktop.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    const M = window.KitisModel;
    const A = window.KitisAccount;
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    const fromHash = () => {
      const h = M.readHash();
      return {
        tab: h.tab || 'schedule', group: h.group || null, teacher: h.teacher || null, room: h.room || null,
        w: h.w ? (parseInt(h.w, 10) || 0) : 0, menu: false, drop: false
      };
    };
    const h = M.readHash();
    if (Object.keys(h).length) this.setState(fromHash());
    else {
      const me = A ? A.current() : null;
      if (me && me.role === 'student' && me.group) { this.setState({ group: me.group }); M.writeHash({ group: me.group }, true); }
      else if (me && me.role === 'teacher' && me.teacher) { this.setState({ tab: 'teachers', teacher: me.teacher }); M.writeHash({ tab: 'teachers', teacher: me.teacher }, true); }
    }
    this._pop = () => this.setState(fromHash());
    window.addEventListener('popstate', this._pop);
    // избранное, изменённое на другой странице или вкладке
    this._fav = () => this.setState({ favTick: Date.now() });
    this._store = (e) => { if (e.key === M.FAV_KEY) this._fav(); };
    window.addEventListener('kitis-favs', this._fav);
    window.addEventListener('storage', this._store);
  }
  componentWillUnmount() {
    clearInterval(this._timer);
    window.removeEventListener('popstate', this._pop);
    window.removeEventListener('kitis-favs', this._fav);
    window.removeEventListener('storage', this._store);
  }
  go(patch) {
    const M = window.KitisModel;
    const s = Object.assign({}, this.state || {}, patch);
    this.setState(Object.assign({ menu: false, drop: false, dq: '' }, patch));
    if (patch.group) M.remember('g', patch.group);
    if (patch.teacher) M.remember('t', patch.teacher);
    if (patch.room) M.remember('r', patch.room);
    const tab = s.tab || 'schedule';
    M.writeHash({
      tab: tab === 'schedule' ? '' : tab, group: s.group || '',
      teacher: tab === 'teachers' ? (s.teacher || '') : '', room: tab === 'rooms' ? (s.room || '') : '', w: s.w ? String(s.w) : ''
    });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* без прокрутки */ }
  }
  renderVals() {
    const M = window.KitisModel;
    const A = window.KitisAccount;
    const s = this.state || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const me = A ? A.current() : null;
    const isTeacherView = !!(me && me.role === 'teacher');
    const tab = s.tab || 'schedule';
    const group = s.group || '';
    const hasGroup = !!group;
    // избранное хранится в браузере (KitisModel); своя группа из профиля — в избранном по умолчанию
    const favSeed = me && me.group ? { kind: 'g', name: me.group } : null;
    const favList = M.favs(favSeed);
    const isFavOf = (k, n) => !!n && favList.some((x) => x.kind === k && x.name === n);
    const fav = isFavOf('g', group);
    const menuOpen = !!s.menu;
    const dropOpen = !!s.drop;
    const tKey = s.teacher || '';
    const rKey = s.room || '';
    const gpre = s.gpre || '';
    const tl = s.tl || '';
    const gq = (s.gq || '').trim().toLowerCase();
    const tq = (s.tq || '').trim().toLowerCase();
    const set = (o) => () => this.setState(o);
    const go = (o) => () => this.go(o);
    const pl = M.plural;
    const delay = (i) => (Math.min(i, 14) * 0.035).toFixed(3) + 's';
    const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
    const roomTitle = (x) => /^\d/.test(x) ? 'Аудитория ' + x : x;
    const iniOf = (name) => { const p = name.split(' '); return (p[0] || '').charAt(0) + (p[1] || '').charAt(0); };
    const pairs = (n) => n + ' ' + pl(n, 'пара', 'пары', 'пар');
    const pairLine = (l) => l.label + (l.time ? ' · ' + l.time : '');

    const CURATORS = { 'ИСр24-1': 'Шевченко Полина Сергеевна' };
    const INFO = {
      'Шевченко П. С.': ['Шевченко Полина Сергеевна', 'Преподаватель · куратор ИСр24-1', '09.02.06, 09.02.07 (разработчик), 08.02.01'],
      'Молите Д. А.': ['Молите Дарья Андреевна', 'Преподаватель', ''],
      'Храмов С. С.': ['Храмов Станислав Семенович', 'Преподаватель', '09.02.06, 09.02.07 (разработчик)'],
      'Котельников А. М.': ['Котельников Алексей Михайлович', 'Преподаватель', ''],
      'Андрийченко В. А.': ['Андрийченко Виктория Александровна', 'Преподаватель', '08.02.14, 09.02.06, 09.02.07 (разработчик), 08.02.01, 08.01.28'],
      'Чертищев В. А.': ['Чертищев Владимир Александрович', 'Руководитель физического воспитания', '09.02.06, 09.02.07 (разработчик), 08.02.01']
    };

    const GL = M.groups(), TL = M.teachers(), RL = M.rooms();
    const gi = M.groupIndex(group);
    const ti = tKey ? M.teacherIndex(tKey) : -1;
    const ri = rKey ? M.roomIndex(rKey) : -1;
    const clk = M.clock();
    const b = M.bounds();
    // дальше последней опубликованной недели не листаем: пустая неделя только путает
    const wMin = b.min, wMax = b.max;
    const w = Math.max(wMin, Math.min(wMax, s.w != null ? s.w : 0));
    const wi = M.weekInfo(w);
    const nowOf = (st, l) => st.mode === 'now' && l.date === clk.iso && l.n === st.lesson.n;
    const statusLine = (L) => [L.teacher, L.place].filter(Boolean).join(' · ');

    /* ---------- что сейчас у группы ---------- */
    const st = hasGroup ? M.status('g', gi) : { mode: 'none', lesson: null, left: 0, total: 0 };
    const L0 = st.lesson;
    const whenOf = (l) => M.whenLabel(l.date);
    let plaque;
    if (st.mode === 'now') {
      const nx = st.next;
      plaque = {
        live: true, badge: 'Сейчас идёт · ' + L0.label, when: M.DAY_SHORT[L0.wd].toLowerCase() + ', ' + M.dayLabel(L0.date) + ' · ' + L0.time,
        big: M.fmtTimer(st.left), bigSize: '66px', bigMono: true, bigNote: 'до конца', progress: ((1 - st.left / st.total) * 100).toFixed(1), hasProgress: true,
        subject: L0.subject, meta: statusLine(L0),
        foot: nx ? 'Далее ' + nx.label + ' в ' + nx.start + (nx.place === L0.place ? ' · там же' : ' · ' + nx.place) : 'Это последняя пара сегодня'
      };
    } else if (st.mode === 'break' || st.mode === 'before') {
      plaque = {
        live: true, badge: st.mode === 'break' ? 'Перемена' : 'Скоро занятия', when: 'сегодня · ' + L0.time,
        big: M.fmtTimer(st.left), bigSize: '66px', bigMono: true, bigNote: 'до начала: ' + L0.label.toLowerCase(), progress: '0', hasProgress: false,
        subject: L0.subject, meta: statusLine(L0), foot: 'Начало в ' + L0.start
      };
    } else if (L0) {
      plaque = {
        live: false, badge: st.mode === 'after' ? 'На сегодня пары закончились' : (clk.wd === 6 ? 'Сегодня выходной' : 'Сегодня пар нет'),
        when: 'Следующее занятие', big: cap(whenOf(L0)) + ', ' + L0.start, bigSize: '40px', bigMono: false, bigNote: L0.label, progress: '0', hasProgress: false,
        subject: L0.subject, meta: statusLine(L0), foot: ''
      };
    } else {
      plaque = {
        live: false, badge: 'Пар не найдено', when: '', big: '—', bigSize: '40px', bigMono: false, bigNote: 'Ближайшее расписание группы ещё не опубликовано',
        progress: '0', hasProgress: false, subject: '', meta: '', foot: ''
      };
    }
    plaque.hasFoot = !!plaque.foot;
    plaque.hasSubject = !!plaque.subject;
    plaque.bigFont = plaque.bigMono ? "'JetBrains Mono', monospace" : "'Onest', system-ui, sans-serif";

    let pill;
    if (st.mode === 'now') pill = { text: group + ' · ' + L0.label + ' · ' + L0.place, timer: M.fmtTimer(st.left), live: true };
    else if (st.mode === 'break' || st.mode === 'before') pill = { text: group + ' · до начала: ' + L0.label.toLowerCase(), timer: M.fmtTimer(st.left), live: true };
    else if (L0) pill = { text: group + ' · ' + whenOf(L0) + ' к ' + L0.start, timer: '', live: false };
    else pill = { text: group + ' · пар не найдено', timer: '', live: false };
    pill.dot = pill.live ? '#FF8A3D' : '#5B6270';
    pill.anim = pill.live ? 'kPulse 1.8s ease-out infinite' : 'none';
    pill.hasTimer = !!pill.timer;

    /* ---------- неделя группы ---------- */
    const wk = hasGroup ? M.week('g', gi, wi.monday) : [];
    let pairsCount = 0, studyDays = 0;
    const lessonView = (l, today) => {
      const now = today && nowOf(st, l);
      const meta = [l.subLabel, l.type === 'Практика' ? 'практика' : ''].filter(Boolean).join(' · ');
      return {
        n: l.badge, start: l.hasTime ? l.start : '—', end: l.hasTime ? l.end : '', subject: l.subject,
        teacher: l.teacher, hasTeacher: !!l.teacher, room: l.place, hasRoom: !l.remote, remote: l.remote, meta: meta, hasMeta: !!meta,
        now: now, nowLabel: 'Идёт · осталось ' + Math.ceil(st.left / 60) + ' мин',
        bg: now ? '#FFF4EA' : '#FFFFFF', numBg: now ? '#B4530F' : (l.curator ? accentSoft : '#F1F3F6'), numFg: now ? '#FFFFFF' : (l.curator ? accent : '#15171C'),
        openTeacher: go({ tab: 'teachers', teacher: l.teachers[0] || '', tl: '' }),
        openRoom: go({ tab: 'rooms', room: l.rooms[0] || '' })
      };
    };
    const days = wk.filter((d) => d.wd < 6 || d.lessons.length).map((d, i) => {
      const today = d.iso === clk.iso;
      const lessons = d.lessons.map((l) => lessonView(l, today));
      const cnt = lessons.length;
      pairsCount += cnt;
      if (cnt) studyDays += 1;
      return {
        name: d.name, date: d.label,
        chip: today ? 'Сегодня' : (cnt ? pairs(cnt) : (wi.hasData ? 'Нет пар' : 'Нет данных')),
        chipBg: today ? accent : '#F1F3F6', chipFg: today ? '#FFFFFF' : '#3A404C',
        hasNote: d.wd === 0 && cnt > 0, empty: cnt === 0,
        emptyText: wi.hasData ? 'Пар нет' : (w > 0 ? 'Расписание ещё не опубликовано на сервере' : 'За эту неделю данных на сервере нет'),
        borderColor: today ? accent : '#E3E6EB', shadow: today ? '0 0 0 1px ' + accent : 'none',
        headBg: today ? accentSoft : '#FFFFFF', delay: delay(i), lessons: lessons
      };
    });
    const lastChange = M.changes()[0];
    const changed = lastChange && lastChange.groups.indexOf(group) >= 0
      ? { has: true, text: 'Расписание изменено ' + M.dayLabel(lastChange.updated.slice(0, 10)) + ', ' + lastChange.updated.slice(11, 16) }
      : { has: false, text: '' };

    const I = {
      cal: 'M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM16 2v4M8 2v4M3 10h18',
      phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
      users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.5 2.4 3.5 5.2',
      user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
      door: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01',
      bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0',
      chart: 'M3 3v18h18M8 16v-5M13 16V8M18 16V9',
      home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
      plus: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6',
      cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
      board: 'M3 4h18v12H3zM12 16v4M8 20h8M7 12l3-3 3 2 4-4',
      key: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3'
    };
    const tabDefs = [['schedule', 'Расписание', I.cal], ['groups', 'Группы', I.users], ['teachers', 'Преподаватели', I.user], ['rooms', 'Аудитории', I.door], ['bells', 'Звонки', I.bell], ['results', 'Итоги', I.chart]];
    const tabs = tabDefs.map((x) => {
      const on = x[0] === tab;
      return { label: x[1], d: x[2], current: on ? 'page' : 'false', bg: on ? accentSoft : 'transparent', fg: on ? accent : '#3A404C', weight: on ? 700 : 500, pick: go({ tab: x[0] }) };
    });

    /* ---------- группы: семейства по буквам ---------- */
    const prefixOf = (g) => { const mm = /^[^\d]+/.exec(g); return mm ? mm[0] : g; };
    const fams = {}, famOrder = [];
    GL.forEach((g) => {
      const p = prefixOf(g.name), k = p.toUpperCase();
      if (!fams[k]) { fams[k] = { key: k, forms: {}, items: [] }; famOrder.push(k); }
      fams[k].forms[p] = (fams[k].forms[p] || 0) + 1;
      fams[k].items.push(g);
    });
    const famLabel = (k) => { const f = fams[k].forms; return Object.keys(f).sort((a, c) => f[c] - f[a])[0]; };
    const prefixChips = [{ k: '', label: 'Все', count: GL.length }].concat(famOrder.map((k) => ({ k: k, label: famLabel(k), count: fams[k].items.length }))).map((c) => {
      const on = c.k === gpre;
      return { label: c.label, count: c.count, pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ gpre: c.k }) };
    });
    const groupMeta = (g) => {
      const gs = M.status('g', g.i);
      if (gs.mode === 'now') return 'Сейчас ' + gs.lesson.label.toLowerCase() + ' · ' + gs.lesson.place;
      if (CURATORS[g.name]) return 'Куратор ' + CURATORS[g.name].split(' ')[0] + ' ' + CURATORS[g.name].split(' ').slice(1).map((x) => x.charAt(0) + '.').join(' ');
      const cnt = M.week('g', g.i, wi.monday).reduce((a, d) => a + d.lessons.length, 0);
      return cnt ? pairs(cnt) + ' за неделю' : 'Нет пар за неделю';
    };
    let gCount = 0, shownGroups = 0;
    const groupSections = tab !== 'groups' ? [] : famOrder.filter((k) => !gpre || k === gpre).map((k) => {
      const items = fams[k].items.filter((g) => !gq || g.name.toLowerCase().indexOf(gq) >= 0).map((g) => {
        const on = g.name === group;
        const it = {
          code: g.name, meta: groupMeta(g), isFav: isFavOf('g', g.name), star: accent,
          border: on ? '2px solid ' + accent : '1px solid #E3E6EB', bg: on ? accentSoft : '#FFFFFF',
          pick: go({ group: g.name, tab: 'schedule', w: 0 }), delay: delay(gCount)
        };
        gCount += 1;
        return it;
      });
      shownGroups += items.length;
      return { title: famLabel(k), count: items.length + ' ' + pl(items.length, 'группа', 'группы', 'групп'), items: items };
    }).filter((sec) => sec.items.length > 0);

    /* ---------- выпадающий список групп ---------- */
    const dq = (s.dq || '').trim().toLowerCase();
    const dropSections = !dropOpen ? [] : famOrder.map((k) => ({
      title: famLabel(k),
      items: fams[k].items.filter((g) => !dq || g.name.toLowerCase().indexOf(dq) >= 0).map((g) => {
        const on = g.name === group;
        return { code: g.name, bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: go({ group: g.name, tab: tab === 'results' ? 'results' : 'schedule', w: 0 }) };
      })
    })).filter((sec) => sec.items.length > 0);

    /* ---------- титульная страница: выбор ---------- */
    const ck = s.ck || 'g';
    const cq = (s.cq || '').trim().toLowerCase();
    const chooserTabs = [['g', 'Группа'], ['t', 'Преподаватель'], ['r', 'Аудитория']].map((x) => {
      const on = x[0] === ck;
      return { label: x[1], selected: on ? 'true' : 'false', bg: on ? '#FFFFFF' : 'rgba(255,255,255,0.08)', fg: on ? '#15171C' : '#FFFFFF', pick: set({ ck: x[0], cq: '' }) };
    });
    const isChooser = tab === 'schedule' && !hasGroup;
    let chooserItems = [];
    if (isChooser) {
      if (ck === 'g') chooserItems = GL.filter((g) => !cq || g.name.toLowerCase().indexOf(cq) >= 0).map((g, i) => ({ title: g.name, sub: groupMeta(g), pick: go({ group: g.name, tab: 'schedule', w: 0 }), delay: delay(i) }));
      else if (ck === 't') chooserItems = TL.filter((t) => !cq || t.name.toLowerCase().indexOf(cq) >= 0).map((t, i) => {
        const ts = M.status('t', t.i);
        return { title: t.name, sub: ts.mode === 'now' ? 'Сейчас на паре · ' + ts.lesson.group : (M.teacherLoad(t.i).subjects[0] || 'Преподаватель'), pick: go({ tab: 'teachers', teacher: t.name }), delay: delay(i) };
      });
      else chooserItems = RL.filter((r) => !cq || r.name.toLowerCase().indexOf(cq) >= 0).map((r, i) => {
        const rs = M.status('r', r.i);
        return { title: r.name, sub: rs.mode === 'now' ? 'Занята · ' + rs.lesson.group : 'Свободна', pick: go({ tab: 'rooms', room: r.name }), delay: delay(i) };
      });
    }
    const recent = M.recent().map((x) => ({
      label: x.kind === 'r' && /^\d/.test(x.name) ? 'ауд. ' + x.name : x.name,
      pick: x.kind === 'g' ? go({ group: x.name, tab: 'schedule', w: 0 }) : (x.kind === 't' ? go({ tab: 'teachers', teacher: x.name }) : go({ tab: 'rooms', room: x.name }))
    }));

    /* ---------- неделя преподавателя и аудитории ---------- */
    const weekOf = (kind, idx, infoFn) => {
      const list = M.week(kind, idx, wi.monday).filter((d) => d.wd < 6 || d.lessons.length);
      const stx = M.status(kind, idx);
      return list.map((d, di) => {
        const today = d.iso === clk.iso;
        const ps = d.lessons.map((l) => {
          const now = today && nowOf(stx, l);
          return { head: pairLine(l), info: infoFn(l), fg: now ? '#9A4410' : '#15171C' };
        });
        return { label: d.short + ', ' + d.num, pairs: ps, empty: ps.length === 0, emptyText: 'Нет пар', bg: today ? accentSoft : '#F7F8FA', delay: delay(di) };
      });
    };
    const skeleton = M.DAY_SHORT.slice(0, 6).map((ds, di) => ({ label: ds + ', ' + parseInt(M.addDays(wi.monday, di).slice(8), 10), delay: (di * 0.12).toFixed(2) + 's' }));
    const countWeek = (kind, idx) => M.week(kind, idx, wi.monday).reduce((a, d) => a + d.lessons.length, 0);

    const letters = [];
    TL.forEach((t) => { const c = t.name.charAt(0); if (letters.indexOf(c) < 0) letters.push(c); });
    const letterChips = [''].concat(letters).map((c) => {
      const on = c === tl;
      return { label: c || 'Все', pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ tl: c }) };
    });
    let tCount = 0;
    const teacherList = tab !== 'teachers' ? [] : TL.filter((t) => (!tl || t.name.charAt(0) === tl) && (!tq || t.name.toLowerCase().indexOf(tq) >= 0)).map((t) => {
      const on = t.name === tKey;
      const ts = M.status('t', t.i);
      const busy = ts.mode === 'now';
      const sub = busy ? 'Сейчас на паре · ' + ts.lesson.group + ' · ' + ts.lesson.place : (M.teacherLoad(t.i).subjects.slice(0, 2).join(', ') || 'Преподаватель');
      const it = {
        name: t.name, ini: iniOf(t.name), sub: sub, hasSub: true, busy: busy, isFav: isFavOf('t', t.name),
        avBg: on ? accent : accentSoft, avFg: on ? '#FFFFFF' : accent,
        border: on ? '2px solid ' + accent : '1px solid #E3E6EB', bg: on ? accentSoft : '#FFFFFF',
        pick: go({ teacher: t.name, tab: 'teachers' }), delay: delay(tCount)
      };
      tCount += 1;
      return it;
    });
    const favBtn = (k, n) => {
      const on = isFavOf(k, n);
      return { pressed: on ? 'true' : 'false', label: on ? 'В избранном' : 'В избранное', fill: on ? 'currentColor' : 'none',
        bg: on ? accentSoft : '#FFFFFF', fg: on ? accent : '#15171C', border: on ? 'transparent' : '#DCE0E6',
        toggle: () => { M.toggleFav(k, n, favSeed); this.setState({ favTick: Date.now() }); } };
    };
    const favPick = (x) => x.kind === 'g' ? go({ group: x.name, tab: 'schedule', w: 0 }) : (x.kind === 't' ? go({ tab: 'teachers', teacher: x.name }) : go({ tab: 'rooms', room: x.name }));
    const favLabel = (x) => x.kind === 'r' && /^\d/.test(x.name) ? 'ауд. ' + x.name : x.name;
    const favOfKind = (k) => { const items = favList.filter((x) => x.kind === k).map((x) => ({ label: favLabel(x), pick: favPick(x) })); return { has: items.length > 0, items: items }; };
    const info = INFO[tKey];
    const tLoad = M.teacherLoad(ti);
    const tCnt = ti >= 0 ? countWeek('t', ti) : 0;
    const selT = {
      has: ti >= 0, none: ti < 0, fav: favBtn('t', tKey),
      full: info ? info[0] : tKey, ini: iniOf(tKey || 'П П'),
      posText: info ? info[1] : 'Преподаватель',
      prog: info ? info[2] : '', hasProg: !!(info && info[2]),
      groups: tLoad.groups.length ? 'Группы: ' + tLoad.groups.join(', ') : '', hasGroups: tLoad.groups.length > 0,
      count: tCnt ? pairs(tCnt) + ' на неделе' : 'на этой неделе пар нет',
      hasWeek: wi.hasData, noWeek: !wi.hasData,
      days: tab === 'teachers' && ti >= 0 ? weekOf('t', ti, (l) => l.group + (l.subLabel ? ' (' + l.subLabel + ')' : '') + ' · ' + l.subject + ' · ' + l.place) : []
    };

    const roomSecs = {}, roomOrder = [];
    RL.forEach((r) => { const k = /^\d/.test(r.name) ? r.name.charAt(0) : 'x'; if (!roomSecs[k]) { roomSecs[k] = []; roomOrder.push(k); } roomSecs[k].push(r); });
    let rCount = 0;
    const rq = (s.rq || '').trim().toLowerCase().replace(/^ауд(итория)?\.?\s*/, '');
    const rf = s.rf || 'all';
    const roomFilters = [['all', 'Все'], ['free', 'Свободные сейчас'], ['busy', 'Занятые сейчас']].map((x) => {
      const on = x[0] === rf;
      return { label: x[1], pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ rf: x[0] }) };
    });
    const roomSections = tab !== 'rooms' ? [] : roomOrder.map((k) => {
      const list = roomSecs[k].filter((r) => {
        if (rq && r.name.toLowerCase().indexOf(rq) < 0) return false;
        if (rf === 'all') return true;
        return (M.status('r', r.i).mode === 'now') === (rf === 'busy');
      });
      const items = list.map((r) => {
        const rs = M.status('r', r.i);
        const busy = rs.mode === 'now';
        const cnt = countWeek('r', r.i);
        const on = r.name === rKey;
        const it = {
          title: r.name, status: busy ? 'Занята · ' + rs.lesson.group : (cnt ? pairs(cnt) + ' за неделю' : 'Свободна всю неделю'),
          dot: busy ? '#E06A1B' : (cnt ? accent : '#C9CED6'), fg: busy ? '#9A4410' : '#5B6270',
          border: on ? '2px solid ' + accent : '1px solid #E3E6EB', bg: on ? accentSoft : '#FFFFFF', isFav: isFavOf('r', r.name),
          pick: go({ room: r.name, tab: 'rooms' }), delay: delay(rCount)
        };
        rCount += 1;
        return it;
      });
      if (!list.length) return null;
      const all = roomSecs[k];
      return { title: k === 'x' ? 'Залы, библиотека, мастерские' : all[0].name + ' – ' + all[all.length - 1].name, count: list.length, items: items };
    }).filter(Boolean);
    const rs0 = ri >= 0 ? M.status('r', ri) : { mode: 'none' };
    const rBusy = rs0.mode === 'now';
    const rCnt = ri >= 0 ? countWeek('r', ri) : 0;
    const selR = {
      has: ri >= 0, none: ri < 0, fav: favBtn('r', rKey),
      title: roomTitle(rKey),
      status: rBusy ? 'Сейчас занята · ' + rs0.lesson.label.toLowerCase() + ' · ' + rs0.lesson.group : 'Сейчас свободна',
      count: rCnt ? pairs(rCnt) + ' на неделе' : 'на этой неделе пар нет',
      chipBg: rBusy ? '#FFE6D3' : '#F1F3F6', chipFg: rBusy ? '#9A4410' : '#3A404C',
      hasWeek: wi.hasData, noWeek: !wi.hasData,
      days: tab === 'rooms' && ri >= 0 ? weekOf('r', ri, (l) => l.group + (l.subLabel ? ' (' + l.subLabel + ')' : '') + ' · ' + l.subject + (l.teacher ? ' · ' + l.teacher : '')) : []
    };

    /* ---------- звонки ---------- */
    const monTimes = M.MON_TIMES, wkTimes = M.WK_TIMES;
    const bellWd = clk.wd;
    const bellList = bellWd === 0 ? monTimes : (bellWd <= 5 ? wkTimes : []);
    let bellNow = -1, bellNext = -1;
    bellList.forEach((t, i) => {
      const a = M.toSec(t[0]), e = M.toSec(t[1]);
      if (a <= clk.secs && clk.secs < e) bellNow = i;
      else if (a > clk.secs && bellNext < 0) bellNext = i;
    });
    let bellPill, bellTimer = '', bellProgress = '0';
    if (bellNow >= 0) {
      const t = bellList[bellNow], e = M.toSec(t[1]), a = M.toSec(t[0]);
      bellPill = 'Сейчас ' + (bellNow + 1) + ' пара · до звонка'; bellTimer = M.fmtTimer(e - clk.secs);
      bellProgress = ((clk.secs - a) / (e - a) * 100).toFixed(1);
    } else if (bellNext >= 0) {
      bellPill = (bellNext === 0 ? 'До начала занятий' : 'Перемена · до ' + (bellNext + 1) + ' пары'); bellTimer = M.fmtTimer(M.toSec(bellList[bellNext][0]) - clk.secs);
    } else {
      bellPill = bellWd === 6 ? 'Сегодня выходной' : 'Занятия на сегодня закончились';
    }
    const pairRow = (i, t, now) => ({ isPair: true, isEvent: false, isBreak: false, n: i + 1, time: t[0] + ' – ' + t[1], label: '', now: now, bg: now ? '#FFF4EA' : '#FFFFFF', numBg: now ? '#B4530F' : '#F1F3F6', numFg: now ? '#FFFFFF' : '#15171C' });
    const eventRow = (label, time) => ({ isPair: false, isEvent: true, isBreak: false, n: '', time: time, label: label, now: false, bg: '', numBg: '', numFg: '' });
    const breakRow = (label) => ({ isPair: false, isEvent: false, isBreak: true, n: '', time: '', label: label, now: false, bg: '', numBg: '', numFg: '' });
    const monNow = (i) => bellWd === 0 && bellNow === i;
    const monRows = [
      eventRow('Подъём флага', '08:15 – 08:25'), breakRow('перемена 5 мин'),
      eventRow('Кураторский час · «Разговоры о важном»', '08:30 – 09:00'), breakRow('перемена 10 мин'),
      pairRow(0, monTimes[0], monNow(0)), breakRow('перемена 10 мин'),
      pairRow(1, monTimes[1], monNow(1)), breakRow('перемена 20 мин'),
      pairRow(2, monTimes[2], monNow(2)), breakRow('перемена 10 мин'),
      pairRow(3, monTimes[3], monNow(3)), breakRow('перемена 10 мин'),
      eventRow('Кураторский час', '15:20 – 15:50'), breakRow('перемена 10 мин'),
      pairRow(4, monTimes[4], monNow(4)), breakRow('перемена 10 мин'),
      pairRow(5, monTimes[5], monNow(5))
    ];
    const wkBreaks = ['перемена 10 мин', 'перемена 30 мин', 'перемена 10 мин', 'перемена 10 мин', 'перемена 10 мин'];
    const wkRows = [];
    wkTimes.forEach((t, i) => { wkRows.push(pairRow(i, t, bellWd >= 1 && bellWd <= 5 && bellNow === i)); if (i < wkBreaks.length) wkRows.push(breakRow(wkBreaks[i])); });
    const bellCols = [
      { title: 'Понедельник', sub: 'Кураторский день · пара 1 ч 20 мин', today: bellWd === 0, border: bellWd === 0 ? accent : '#E3E6EB', shadow: bellWd === 0 ? '0 0 0 1px ' + accent : 'none', delay: '0s', rows: monRows },
      { title: 'Вторник – суббота', sub: 'Пара 1 ч 30 мин', today: bellWd >= 1 && bellWd <= 5, border: bellWd >= 1 && bellWd <= 5 ? accent : '#E3E6EB', shadow: bellWd >= 1 && bellWd <= 5 ? '0 0 0 1px ' + accent : 'none', delay: '.08s', rows: wkRows }
    ];

    /* ---------- итоги ---------- */
    const flat = [];
    wk.forEach((d) => d.lessons.forEach((l) => flat.push(l)));
    const countBy = (fn) => {
      const map = {};
      flat.forEach((l) => { const k = fn(l); if (k) map[k] = (map[k] || 0) + 1; });
      return Object.keys(map).map((k) => [k, map[k]]).sort((a, c) => c[1] - a[1]);
    };
    const toRows = (arr2) => {
      const max = arr2.length ? arr2[0][1] : 1;
      return arr2.map((x, i) => ({ label: x[0], valueLabel: pairs(x[1]), pct: Math.round(x[1] / max * 100), delay: delay(i) }));
    };
    const bySubj = countBy((l) => l.subject);
    const byTeacher = countBy((l) => l.teacher);
    const byDay = wk.filter((d) => d.wd < 6 || d.lessons.length).map((d) => [d.name + ', ' + d.num, d.lessons.length]);
    const maxDay = Math.max(1, Math.max.apply(null, byDay.map((x) => x[1]).concat([0])));
    const hasStats = flat.length > 0;
    const charts = [
      { title: 'По дням', rows: byDay.map((x, i) => ({ label: x[0], valueLabel: pairs(x[1]), pct: Math.round(x[1] / maxDay * 100), delay: delay(i) })) },
      { title: 'По преподавателям', rows: toRows(byTeacher) }
    ].concat(isTeacherView ? [{ title: 'По дисциплинам', rows: toRows(bySubj) }] : []);
    const stats = [
      [flat.length, pl(flat.length, 'пара на неделе', 'пары на неделе', 'пар на неделе'), accent],
      [M.fmtHours(flat.reduce((a, l) => a + M.durationMin(l), 0)), 'занятий на неделе', '#15171C'],
      [studyDays, pl(studyDays, 'учебный день', 'учебных дня', 'учебных дней'), '#15171C'],
      [byTeacher.length, pl(byTeacher.length, 'преподаватель', 'преподавателя', 'преподавателей'), '#15171C']
    ].map((x, i) => ({ value: x[0], label: x[1], color: x[2], delay: delay(i) }));

    const loadRaw = hasGroup ? M.load(gi) : [];
    const sumOf = (k) => loadRaw.reduce((a, x) => a + (x[k] || 0), 0);
    const hTotal = sumOf('total'), hFact = sumOf('fact'), hPlan = sumOf('plan');
    const fmtD = (iso) => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '—';
    const P = M.pairsOf;
    const pairsW = (n) => n + ' ' + pl(n, 'пара', 'пары', 'пар');
    const pairsAcc = (n) => n + ' ' + pl(n, 'пару', 'пары', 'пар');
    const pairsGen = (n) => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'пары' : 'пар');
    const loadRows = loadRaw.slice().sort((a, c) => a.subject.localeCompare(c.subject, 'ru') || a.sub - c.sub).map((x, i) => {
      const pct = x.total ? Math.min(100, Math.round(x.fact / x.total * 100)) : 0;
      const planPct = x.total ? Math.min(100, Math.round(x.plan / x.total * 100)) : 0;
      const behind = isTeacherView && x.fact < x.plan;
      return {
        subject: x.subject, meta: [x.teacher, x.type, x.sub ? x.sub + ' подгр.' : ''].filter(Boolean).join(' · '),
        nums: isTeacherView ? 'Проведено ' + P(x.fact) + ' из ' + pairsGen(P(x.total)) + ' · по плану к этой дате ' + pairsW(P(x.plan)) + ' · осталось ' + pairsW(P(x.rest))
          : 'Проведено ' + P(x.fact) + ' из ' + pairsGen(P(x.total)) + ' · осталось ' + pairsW(P(x.rest)),
        end: 'до ' + fmtD(x.end), pct: pct, pctLabel: pct + '%', planPct: planPct, showPlan: isTeacherView,
        bar: behind ? '#E06A1B' : accent, chipBg: behind ? '#FFE6D3' : accentSoft, chipFg: behind ? '#9A4410' : accent,
        state: behind ? 'Отстаёт от плана на ' + pairsAcc(P(x.plan) - P(x.fact)) : 'По плану', delay: delay(i)
      };
    });
    const loadStats = [
      [pairsW(P(hTotal)), 'всего за семестр · ' + String(P(hTotal) * 1.5).replace('.', ',') + ' ч', '#15171C'],
      [pairsW(P(hFact)), 'проведено · ' + String(P(hFact) * 1.5).replace('.', ',') + ' ч', accent],
      [pairsW(Math.max(0, P(hTotal) - P(hFact))), 'осталось · ' + String(Math.max(0, P(hTotal) - P(hFact)) * 1.5).replace('.', ',') + ' ч', '#15171C'],
      [(hTotal ? Math.round(hFact / hTotal * 100) : 0) + '%', 'пройдено', isTeacherView && hFact < hPlan ? '#9A4410' : '#15171C']
    ].map((x, i) => ({ value: x[0], label: x[1], color: x[2], delay: delay(i) }));

    /* ---------- меню ---------- */
    const K = 'https://kitis.ru/';
    const menuDefs = [
      { title: 'Разделы сайта', icons: true, items: [
        ['Версия для телефона', 'Расписание на маленьком экране', 'phone.html', I.phone, 'phone'],
        ['Главная колледжа', 'Новости, объявления, контакты', 'home.html', I.home],
        ['Абитуриентам', 'Специальности, приём, документы', 'abitur.html', I.plus],
        ['Студентам', 'Кабинет студента, справки, дистант', 'student.html', I.cap],
        ['Преподавателям', 'Кабинет преподавателя, материалы', 'teacher.html', I.board],
        me ? ['Мой профиль', me.fullName, 'profile.html', I.key] : ['Вход и регистрация', 'Сайт запомнит вашу группу', 'login.html', I.key]
      ] },
      { title: 'О колледже', icons: false, items: [['О колледже', '', 'college.html#p=about'], ['История', '', 'college.html#p=history'], ['Новости', '', 'college.html#p=news'], ['Объявления и мероприятия', '', 'college.html#p=announce'], ['Выпускникам и Центр карьеры', '', 'college.html#p=career'], ['Профессионалитет', '', 'college.html#p=professionalitet'], ['УПК', '', 'college.html#p=upk'], ['БЦК', '', 'college.html#p=bck'], ['Дистанционное обучение', '', 'college.html#p=distance'], ['Курсы', '', 'college.html#p=courses'], ['Профессиональные конкурсы', '', 'college.html#p=contests'], ['Вакансии', '', 'college.html#p=vacancy'], ['Вопрос-ответ', '', 'college.html#p=faq'], ['Контакты и реквизиты', '', 'college.html#p=contacts']] },
      { title: 'Официально', icons: false, items: [['Сведения об образовательной организации', '', 'college.html#p=sveden'], ['Обращения', '', 'college.html#p=forms'], ['Противодействие коррупции', '', 'college.html#p=anti-corruption'], ['Комплексная безопасность', '', 'college.html#p=security'], ['Антитеррористическая защищённость', '', 'college.html#p=antiterrorist'], ['Информационная безопасность', '', 'college.html#p=information-security'], ['БПОО', '', 'college.html#p=bpoo'], ['Закупки', '', 'college.html#p=tenders'], ['Образовательный кредит в СПО', '', 'college.html#p=obr-kredit']] }
    ];
    const menu = menuDefs.map((sec, si) => ({
      title: sec.title, line: si === 0 ? 'transparent' : '#EEF0F3', delay: delay(si + 1),
      items: sec.items.map((x) => ({ l: x[0], s: x[1], hasSub: !!x[1], h: x[2], d: x[3] || '', view: x[4] || '', hasIcon: sec.icons, iconBg: accentSoft, iconFg: accent, weight: sec.icons ? 600 : 500 }))
    }));

    const upd = M.updatedLabel();
    const navBtn = (on) => ({ opacity: on ? '1' : '0.4', cursor: on ? 'pointer' : 'default' });
    const canPrev = w > wMin, canNext = w < wMax;
    return {
      accent: accent, accentSoft: accentSoft, plaque: plaque, pill: pill,
      acct: me ? { href: 'profile.html', hasPhoto: !!me.photo, photo: me.photo || '', hasInitials: !me.photo, initials: me.initials, label: me.shortName, padL: '6px' }
        : { href: 'login.html', hasPhoto: false, photo: '', hasInitials: false, initials: '', label: 'Войти', padL: '16px' },
      tabs: tabs, group: group, hasGroup: hasGroup, noGroup: !hasGroup, groupLabel: group || 'выбрать',
      groupsTotal: GL.length, teachersTotal: TL.length, roomsTotal: RL.length,
      ctxLine: (upd ? 'Данные сервера на ' + upd + ' · ' : '') + GL.length + ' групп · ' + TL.length + ' преподавателей · ' + RL.length + ' аудиторий',
      updLine: upd ? 'данные на ' + upd : 'данные не загружены',
      isSchedule: tab === 'schedule' && hasGroup, isChooser: isChooser, isGroups: tab === 'groups', isTeachers: tab === 'teachers',
      isRooms: tab === 'rooms', isBells: tab === 'bells', isResults: tab === 'results' && hasGroup, isResultsNoGroup: tab === 'results' && !hasGroup,
      chooserTabs: chooserTabs, cq: s.cq || '', chooserItems: chooserItems, chooserEmpty: isChooser && chooserItems.length === 0,
      chooserPh: ck === 'g' ? 'Группа, например ИСр24-1' : (ck === 't' ? 'Фамилия преподавателя' : 'Номер аудитории, например 403'),
      chooserListTitle: (ck === 'g' ? 'Группы' : (ck === 't' ? 'Преподаватели' : 'Аудитории')) + ' · ' + chooserItems.length,
      chooserMin: ck === 't' ? '220px' : '150px',
      chooserSub: (upd ? 'Данные сервера колледжа на ' + upd + '. ' : '') + 'Выберите группу, преподавателя или аудиторию — сайт покажет неделю и сколько осталось до конца пары.',
      recent: recent, hasRecent: recent.length > 0, favChips: favList.map((x) => ({ label: favLabel(x), pick: favPick(x) })), hasFavs: favList.length > 0,
      favT: favOfKind('t'), favR: favOfKind('r'), rq: s.rq || '', roomFilters: roomFilters, noRooms: tab === 'rooms' && roomSections.length === 0,
      onRq: (e) => this.setState({ rq: e && e.target ? e.target.value.slice(0, 40) : '' }),
      onCq: (e) => this.setState({ cq: e && e.target ? e.target.value : '' }),
      curatorLine: CURATORS[group] ? 'Куратор — ' + CURATORS[group] : 'Расписание группы с сервера колледжа',
      favPressed: fav ? 'true' : 'false', favLabel: fav ? 'В избранном' : 'В избранное', favFill: fav ? 'currentColor' : 'none',
      favBg: fav ? accentSoft : '#FFFFFF', favFg: fav ? accent : '#15171C', favBorder: fav ? 'transparent' : '#DCE0E6',
      pairsLabel: pairsCount ? pairs(pairsCount) + ' на неделе' : 'Пар на неделе нет',
      daysLabel: studyDays + ' ' + pl(studyDays, 'учебный день', 'учебных дня', 'учебных дней'),
      changed: changed,
      sourceLabel: wi.sourceLabel,
      weekLabel: wi.label, weekShort: wi.shortLabel, weekSub: wi.sub + ' · ' + wi.sourceNote, notCurrent: w !== 0, days: days,
      nextBadge: w === 0 && b.nextPublished, prevNav: navBtn(canPrev), nextNav: navBtn(canNext), prevOff: !canPrev, nextOff: !canNext,
      nextTitle: canNext ? '' : 'Следующая неделя ещё не опубликована на сервере колледжа',
      prefixChips: prefixChips, groupSections: groupSections, noGroups: tab === 'groups' && shownGroups === 0,
      letterChips: letterChips, teacherList: teacherList, noTeachers: tab === 'teachers' && teacherList.length === 0, selT: selT,
      roomSections: roomSections, selR: selR, skeleton: skeleton, bellCols: bellCols,
      bellPill: bellPill, bellTimer: bellTimer, hasBellTimer: !!bellTimer, bellLive: bellNow >= 0, bellProgress: bellProgress,
      progress: plaque.progress,
      hasStats: hasStats, noStats: !hasStats, stats: stats, charts: charts,
      hasLoad: loadRows.length > 0, noLoad: loadRows.length === 0, loadRows: loadRows, loadStats: loadStats,
      loadNote: isTeacherView ? 'Полоса — сколько пар проведено из всего объёма, чёрная черта — сколько должно быть проведено по плану к этой дате. Пара длится 1,5 часа (в понедельник — 1 ч 20 мин). Видно только преподавателям.' : 'Полоса — сколько пар уже проведено из всего объёма. Пара длится 1,5 часа, в понедельник — 1 ч 20 мин.',
      menu: menu, menuOpen: menuOpen, menuExpanded: menuOpen ? 'true' : 'false',
      dropOpen: dropOpen, dropExpanded: dropOpen ? 'true' : 'false', dropBorder: dropOpen ? accent : '#DCE0E6', dropEmpty: dropOpen && dropSections.length === 0, dropRot: dropOpen ? '180' : '0', dropSections: dropSections, dq: s.dq || '',
      toggleDrop: set({ drop: !dropOpen, dq: '' }), closeDrop: set({ drop: false }),
      onDq: (e) => this.setState({ dq: e && e.target ? e.target.value : '' }),
      openMenu: set({ menu: true }), closeMenu: set({ menu: false }),
      goGroups: go({ tab: 'groups' }), goBells: go({ tab: 'bells' }), goResults: go({ tab: 'results' }),
      goToday: go({ tab: 'schedule', w: 0 }), clearGroup: go({ group: null, tab: 'schedule', w: 0 }),
      prev: go({ w: canPrev ? w - 1 : w }), next: go({ w: canNext ? w + 1 : w }),
      toggleFav: () => { M.toggleFav('g', group, favSeed); this.setState({ favTick: Date.now() }); },
      onGq: (e) => this.setState({ gq: e && e.target ? e.target.value : '' }),
      onTq: (e) => this.setState({ tq: e && e.target ? e.target.value : '' })
    };
  }
}
;return Component;
};
