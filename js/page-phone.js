/* Код страницы phone.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    const M = window.KitisModel;
    const A = window.KitisAccount;
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    const fromHash = () => {
      const h = M.readHash();
      const st = { tab: 'schedule', sub: 'pairs', group: h.group || null, sheet: null, page: h.page || '', w: h.w ? (parseInt(h.w, 10) || 0) : 0, day: null, picker: false };
      if (h.tab === 'bells' || h.tab === 'results') st.sub = h.tab;
      else if (h.tab === 'groups' || h.tab === 'teachers' || h.tab === 'rooms' || h.tab === 'menu') st.tab = h.tab;
      if (h.teacher) { st.tab = 'teachers'; st.sheet = { type: 't', key: h.teacher }; }
      if (h.room) { st.tab = 'rooms'; st.sheet = { type: 'r', key: h.room }; }
      if (st.page) st.tab = 'menu';
      return st;
    };
    const h = M.readHash();
    if (Object.keys(h).length) this.setState(fromHash());
    else {
      const me = A ? A.current() : null;
      if (me && me.role === 'student' && me.group) { this.setState({ group: me.group }); M.writeHash({ group: me.group }, true); }
    }
    this._pop = () => {
      const prev = this.state || {};
      const next = fromHash();
      this.setState(next);
      if (prev.tab !== next.tab || prev.page !== next.page || prev.sub !== next.sub || prev.group !== next.group) this.toTop();
    };
    window.addEventListener('popstate', this._pop);
  }
  componentWillUnmount() {
    clearInterval(this._timer);
    window.removeEventListener('popstate', this._pop);
  }
  toTop() {
    try {
      document.querySelectorAll('.m-scroll').forEach((e) => { e.scrollTop = 0; });
      if (document.documentElement.classList.contains('phone-full')) window.scrollTo(0, 0);
    } catch (e) { /* без прокрутки */ }
  }
  go(patch) {
    const M = window.KitisModel;
    const prev = this.state || {};
    const s = Object.assign({}, prev, patch);
    if (['tab', 'page', 'sub', 'group'].some((k) => k in patch && patch[k] !== prev[k])) this.toTop();
    this.setState(Object.assign({ picker: false, pq: '' }, patch));
    if (patch.group) M.remember('g', patch.group);
    if (patch.sheet && patch.sheet.type === 't') M.remember('t', patch.sheet.key);
    if (patch.sheet && patch.sheet.type === 'r') M.remember('r', patch.sheet.key);
    const tab = s.tab || 'schedule';
    const sub = s.sub || 'pairs';
    const sh = s.sheet || null;
    M.writeHash({
      tab: s.page ? '' : (tab === 'schedule' ? (sub === 'pairs' ? '' : sub) : tab),
      group: s.group || '', page: s.page || '',
      teacher: sh && sh.type === 't' ? sh.key : '', room: sh && sh.type === 'r' ? sh.key : '',
      w: s.w ? String(s.w) : ''
    });
  }
  renderVals() {
    const M = window.KitisModel;
    const A = window.KitisAccount;
    const s = this.state || {};
    const me = A ? A.current() : null;
    const isTeacherView = !!(me && me.role === 'teacher');
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const tab = s.tab || 'schedule';
    const sub = s.sub || 'pairs';
    const page = s.page || '';
    const group = s.group || '';
    const hasGroup = !!group;
    const role = s.role || 'student';
    const sheet = s.sheet || null;
    const gpre = s.gpre || '';
    const tl = s.tl || '';
    const gq = (s.gq || '').trim().toLowerCase();
    const tq = (s.tq || '').trim().toLowerCase();
    const set = (o) => () => this.setState(o);
    const go = (o) => () => this.go(o);
    const pl = M.plural;
    const delay = (i) => (Math.min(i, 12) * 0.035).toFixed(3) + 's';
    const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
    const roomTitle = (x) => /^\d/.test(x) ? 'Аудитория ' + x : x;
    const iniOf = (name) => { const p = name.split(' '); return (p[0] || '').charAt(0) + (p[1] || '').charAt(0); };
    const pairs = (n) => n + ' ' + pl(n, 'пара', 'пары', 'пар');
    const pairLine = (l) => l.label + (l.time ? ' · ' + l.time : '');
    const metaOf = (L) => [L.teacher, L.place].filter(Boolean).join(' · ');

    const CURATORS = { 'ИСр24-1': 'Шевченко П. С.' };
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
    const clk = M.clock();
    const b = M.bounds();
    const wMin = b.min, wMax = Math.max(b.max, 1);
    const w = Math.max(wMin, Math.min(wMax, s.w != null ? s.w : 0));
    const wi = M.weekInfo(w);
    const canPrev = w > wMin, canNext = w < wMax;
    const navBtn = (on) => ({ opacity: on ? '1' : '0.35', cursor: on ? 'pointer' : 'default' });
    const nowOf = (st, l) => st.mode === 'now' && l.date === clk.iso && l.n === st.lesson.n;

    /* ---------- что сейчас ---------- */
    const st = hasGroup ? M.status('g', gi) : { mode: 'none', lesson: null, left: 0, total: 0 };
    const L0 = st.lesson;
    let plaque;
    if (st.mode === 'now') {
      const nx = st.next;
      plaque = { live: true, badge: 'Сейчас · ' + L0.label, when: L0.time, big: M.fmtTimer(st.left), bigMono: true, bigSize: '46px', bigNote: 'до конца',
        progress: ((1 - st.left / st.total) * 100).toFixed(1), hasProgress: true, subject: L0.subject,
        meta: metaOf(L0) + (nx ? ' · далее ' + nx.label.toLowerCase() + ' в ' + nx.start : ' · последняя пара') };
    } else if (st.mode === 'break' || st.mode === 'before') {
      plaque = { live: true, badge: st.mode === 'break' ? 'Перемена' : 'Скоро занятия', when: L0.time, big: M.fmtTimer(st.left), bigMono: true, bigSize: '46px', bigNote: 'до начала',
        progress: '0', hasProgress: false, subject: L0.subject, meta: L0.label + ' · ' + metaOf(L0) };
    } else if (L0) {
      plaque = { live: false, badge: st.mode === 'after' ? 'На сегодня всё' : (clk.wd === 6 ? 'Сегодня выходной' : 'Сегодня пар нет'), when: 'следующее занятие',
        big: cap(M.whenLabel(L0.date)) + ', ' + L0.start, bigMono: false, bigSize: '28px', bigNote: L0.label,
        progress: '0', hasProgress: false, subject: L0.subject, meta: metaOf(L0) };
    } else {
      plaque = { live: false, badge: 'Пар не найдено', when: '', big: '—', bigMono: false, bigSize: '28px', bigNote: 'расписание ещё не опубликовано', progress: '0', hasProgress: false, subject: '', meta: '' };
    }
    plaque.hasSubject = !!plaque.subject;
    plaque.dot = plaque.live ? '#FF8A3D' : '#5B6270';
    plaque.anim = plaque.live ? 'kPulse 1.8s ease-out infinite' : 'none';
    plaque.bigFont = plaque.bigMono ? "'JetBrains Mono', monospace" : "'Onest', system-ui, sans-serif";

    /* ---------- неделя группы ---------- */
    const wk = hasGroup ? M.week('g', gi, wi.monday) : [];
    const showDays = wk.filter((d) => d.wd < 6 || d.lessons.length);
    const todayIdx = showDays.findIndex((d) => d.iso === clk.iso);
    const defDay = todayIdx >= 0 ? todayIdx : Math.max(0, showDays.findIndex((d) => d.lessons.length));
    const day = s.day != null && s.day < showDays.length ? s.day : defDay;
    const dayPills = showDays.map((d, i) => {
      const on = i === day;
      const today = d.iso === clk.iso;
      const cnt = d.lessons.length;
      return {
        short: today ? 'Сег.' : d.short, num: d.num, count: cnt ? pairs(cnt) : '—',
        selected: on ? 'true' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C',
        border: on ? accent : (today ? accent : '#E3E6EB'), pick: set({ day: i })
      };
    });
    const dSel = showDays[day] || { name: '', label: '', lessons: [], wd: 1, iso: '' };
    const dToday = dSel.iso === clk.iso;
    const dayLessons = dSel.lessons.map((l, k) => {
      const now = dToday && nowOf(st, l);
      const meta = [l.subLabel, l.type === 'Практика' ? 'практика' : ''].filter(Boolean).join(' · ');
      return {
        n: l.badge, start: l.hasTime ? l.start : '—', end: l.hasTime ? l.end : '', subject: l.subject, teacher: l.teacher, hasTeacher: !!l.teacher,
        room: l.place, hasRoom: !l.remote, remote: l.remote, now: now, meta: meta, hasMeta: !!meta,
        bg: now ? '#FFF4EA' : '#FFFFFF', border: now ? '#F5C9A6' : '#E3E6EB',
        numBg: now ? '#B4530F' : (l.curator ? accentSoft : '#F1F3F6'), numFg: now ? '#FFFFFF' : (l.curator ? accent : '#15171C'), delay: delay(k),
        openTeacher: go({ sheet: { type: 't', key: l.teachers[0] || '' } }),
        openRoom: go({ sheet: { type: 'r', key: l.rooms[0] || '' } })
      };
    });
    const dc = dayLessons.length;

    /* ---------- звонки ---------- */
    const monTimes = M.MON_TIMES, wkTimes = M.WK_TIMES;
    const bellDay = s.bellDay || (clk.wd === 0 ? 'mon' : 'week');
    const bellList = clk.wd === 0 ? monTimes : (clk.wd <= 5 ? wkTimes : []);
    let bellNow = -1;
    let bellProgress = '0';
    bellList.forEach((t, i) => {
      const a = M.toSec(t[0]), e = M.toSec(t[1]);
      if (a <= clk.secs && clk.secs < e) { bellNow = i; bellProgress = ((clk.secs - a) / (e - a) * 100).toFixed(1); }
    });
    const pairRow = (i, t, now) => ({ isPair: true, isEvent: false, isBreak: false, n: i + 1, time: t[0] + ' – ' + t[1], label: '', now: now, bg: now ? '#FFF4EA' : '#FFFFFF', numBg: now ? '#B4530F' : '#F1F3F6', numFg: now ? '#FFFFFF' : '#15171C' });
    const eventRow = (label, time) => ({ isPair: false, isEvent: true, isBreak: false, n: '', time: time, label: label, now: false, bg: '', numBg: '', numFg: '' });
    const breakRow = (label) => ({ isPair: false, isEvent: false, isBreak: true, n: '', time: '', label: label, now: false, bg: '', numBg: '', numFg: '' });
    let bells;
    if (bellDay === 'mon') {
      const mn = (i) => clk.wd === 0 && bellNow === i;
      bells = [eventRow('Подъём флага', '08:15 – 08:25'), breakRow('5 мин'), eventRow('Кураторский час · «Разговоры о важном»', '08:30 – 09:00'), breakRow('10 мин'),
        pairRow(0, monTimes[0], mn(0)), breakRow('10 мин'), pairRow(1, monTimes[1], mn(1)), breakRow('20 мин'),
        pairRow(2, monTimes[2], mn(2)), breakRow('10 мин'), pairRow(3, monTimes[3], mn(3)), breakRow('10 мин'),
        eventRow('Кураторский час', '15:20 – 15:50'), breakRow('10 мин'), pairRow(4, monTimes[4], mn(4)), breakRow('10 мин'), pairRow(5, monTimes[5], mn(5))];
    } else {
      const br = ['перемена 10 мин', 'перемена 30 мин', 'перемена 10 мин', 'перемена 10 мин', 'перемена 10 мин'];
      bells = [];
      wkTimes.forEach((t, i) => { bells.push(pairRow(i, t, clk.wd >= 1 && clk.wd <= 5 && bellNow === i)); if (i < br.length) bells.push(breakRow(br[i])); });
    }
    bells = bells.map((x, i) => Object.assign(x, { delay: delay(i) }));
    const bellTabs = [['mon', 'Понедельник'], ['week', 'Вт – Сб']].map((x) => {
      const on = x[0] === bellDay;
      return { label: x[1], pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ bellDay: x[0] }) };
    });

    /* ---------- итоги ---------- */
    const flat = [];
    wk.forEach((d) => d.lessons.forEach((l) => flat.push(l)));
    const countBy = (fn) => {
      const map = {};
      flat.forEach((l) => { const k = fn(l); if (k) map[k] = (map[k] || 0) + 1; });
      return Object.keys(map).map((k) => [k, map[k]]).sort((a, c) => c[1] - a[1]);
    };
    const chartBy = isTeacherView ? countBy((l) => l.subject) : countBy((l) => l.teacher);
    const maxS = chartBy.length ? chartBy[0][1] : 1;
    const bySubj = chartBy.map((x, i) => ({ label: x[0], value: pairs(x[1]), pct: Math.round(x[1] / maxS * 100), delay: delay(i) }));
    const tCnt = countBy((l) => l.teacher).length;
    const studyDays = wk.filter((d) => d.lessons.length).length;
    const stats = [
      [flat.length, pl(flat.length, 'пара на неделе', 'пары на неделе', 'пар на неделе'), accent],
      [flat.length * 2, 'часа занятий', '#15171C'],
      [studyDays, pl(studyDays, 'учебный день', 'учебных дня', 'учебных дней'), '#15171C'],
      [tCnt, pl(tCnt, 'преподаватель', 'преподавателя', 'преподавателей'), '#15171C']
    ].map((x, i) => ({ value: x[0], label: x[1], color: x[2], delay: delay(i) }));
    const loadRaw = hasGroup ? M.load(gi) : [];
    const sumOf = (k) => loadRaw.reduce((a, x) => a + (x[k] || 0), 0);
    const hTotal = sumOf('total'), hFact = sumOf('fact'), hPlan = sumOf('plan');
    const fmtD = (iso) => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) : '—';
    const loadRows = loadRaw.slice().sort((a, c) => a.subject.localeCompare(c.subject, 'ru') || a.sub - c.sub).map((x, i) => {
      const pct = x.total ? Math.min(100, Math.round(x.fact / x.total * 100)) : 0;
      const behind = isTeacherView && x.fact < x.plan;
      return {
        subject: x.subject, meta: [x.teacher, x.type, x.sub ? x.sub + ' подгр.' : ''].filter(Boolean).join(' · '),
        nums: isTeacherView ? x.fact + ' из ' + x.total + ' ч · по плану ' + x.plan + ' ч · до ' + fmtD(x.end) : 'Проведено ' + x.fact + ' из ' + x.total + ' ч · осталось ' + x.rest + ' ч',
        pct: pct, pctLabel: pct + '%', planPct: x.total ? Math.min(100, Math.round(x.plan / x.total * 100)) : 0, showPlan: isTeacherView,
        bar: behind ? '#E06A1B' : accent, state: behind ? '−' + (x.plan - x.fact) + ' ч от плана' : 'по плану',
        chipBg: behind ? '#FFE6D3' : accentSoft, chipFg: behind ? '#9A4410' : accent, delay: delay(i)
      };
    });
    const loadStats = [
      [hFact + ' из ' + hTotal + ' ч', 'проведено за семестр', accent],
      [(hTotal ? Math.round(hFact / hTotal * 100) : 0) + '%', isTeacherView ? (hFact < hPlan ? 'отстаёт от плана на ' + (hPlan - hFact) + ' ч' : 'нагрузка по плану') : 'пройдено', isTeacherView && hFact < hPlan ? '#9A4410' : '#15171C']
    ].map((x, i) => ({ value: x[0], label: x[1], color: x[2], delay: delay(i) }));

    /* ---------- группы ---------- */
    const prefixOf = (g) => { const mm = /^[^\d]+/.exec(g); return mm ? mm[0] : g; };
    const fams = {}, famOrder = [];
    GL.forEach((g) => {
      const p = prefixOf(g.name), k = p.toUpperCase();
      if (!fams[k]) { fams[k] = { forms: {}, items: [] }; famOrder.push(k); }
      fams[k].forms[p] = (fams[k].forms[p] || 0) + 1;
      fams[k].items.push(g);
    });
    const famLabel = (k) => { const f = fams[k].forms; return Object.keys(f).sort((a, c) => f[c] - f[a])[0]; };
    const prefixChips = [{ k: '', label: 'Все', count: GL.length }].concat(famOrder.map((k) => ({ k: k, label: famLabel(k), count: fams[k].items.length }))).map((c) => {
      const on = c.k === gpre;
      return { label: c.label, count: c.count, pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ gpre: c.k }) };
    });
    const pickGroup = (name) => go({ group: name, tab: 'schedule', sub: s.sub === 'results' ? 'results' : 'pairs', page: '', w: 0, day: null, sheet: null });
    let gCount = 0, shownGroups = 0;
    const isGroupsTab = !page && tab === 'groups';
    const groupSections = !isGroupsTab ? [] : famOrder.filter((k) => !gpre || k === gpre).map((k) => {
      const items = fams[k].items.filter((g) => !gq || g.name.toLowerCase().indexOf(gq) >= 0).map((g) => {
        const on = g.name === group;
        const gs = M.status('g', g.i);
        const meta = gs.mode === 'now' ? 'сейчас ' + gs.lesson.label.toLowerCase() : (CURATORS[g.name] ? 'куратор ' + CURATORS[g.name] : (on ? 'открыта' : 'открыть'));
        const it = { code: g.name, meta: meta, border: on ? '2px solid ' + accent : '1px solid #E3E6EB', bg: on ? accentSoft : '#FFFFFF', pick: pickGroup(g.name), delay: delay(gCount) };
        gCount += 1;
        return it;
      });
      shownGroups += items.length;
      return { title: famLabel(k), count: items.length, items: items };
    }).filter((sec) => sec.items.length > 0);

    /* ---------- шторка выбора группы ---------- */
    const pickerOpen = !!s.picker;
    const pq = (s.pq || '').trim().toLowerCase();
    const pickerSections = !pickerOpen ? [] : famOrder.map((k) => ({
      title: famLabel(k),
      items: fams[k].items.filter((g) => !pq || g.name.toLowerCase().indexOf(pq) >= 0).map((g) => {
        const on = g.name === group;
        return { code: g.name, bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: pickGroup(g.name) };
      })
    })).filter((sec) => sec.items.length > 0);

    /* ---------- титульный выбор ---------- */
    const ck = s.ck || 'g';
    const cq = (s.cq || '').trim().toLowerCase();
    const isChooser = !page && tab === 'schedule' && sub === 'pairs' && !hasGroup;
    const chooserTabs = [['g', 'Группа'], ['t', 'Преподаватель'], ['r', 'Аудитория']].map((x) => {
      const on = x[0] === ck;
      return { label: x[1], pressed: on ? 'true' : 'false', bg: on ? '#FFFFFF' : 'transparent', fg: on ? '#15171C' : '#FFFFFF', weight: on ? 700 : 500, shadow: on ? '0 1px 2px rgba(21, 23, 28, 0.12)' : 'none', pick: set({ ck: x[0], cq: '' }) };
    });
    let chooserItems = [];
    if (isChooser) {
      if (ck === 'g') chooserItems = GL.filter((g) => !cq || g.name.toLowerCase().indexOf(cq) >= 0).map((g, i) => ({ title: g.name, sub: CURATORS[g.name] ? 'куратор ' + CURATORS[g.name] : 'группа', pick: pickGroup(g.name), delay: delay(i) }));
      else if (ck === 't') chooserItems = TL.filter((t) => !cq || t.name.toLowerCase().indexOf(cq) >= 0).map((t, i) => ({ title: t.name, sub: M.teacherLoad(t.i).subjects[0] || 'Преподаватель', pick: go({ tab: 'teachers', sheet: { type: 't', key: t.name } }), delay: delay(i) }));
      else chooserItems = RL.filter((r) => !cq || r.name.toLowerCase().indexOf(cq) >= 0).map((r, i) => {
        const rs = M.status('r', r.i);
        return { title: r.name, sub: rs.mode === 'now' ? 'занята · ' + rs.lesson.group : 'свободна', pick: go({ tab: 'rooms', sheet: { type: 'r', key: r.name } }), delay: delay(i) };
      });
    }
    const recent = M.recent().map((x) => ({
      label: x.kind === 'r' && /^\d/.test(x.name) ? 'ауд. ' + x.name : x.name,
      pick: x.kind === 'g' ? pickGroup(x.name) : (x.kind === 't' ? go({ tab: 'teachers', sheet: { type: 't', key: x.name } }) : go({ tab: 'rooms', sheet: { type: 'r', key: x.name } }))
    }));

    /* ---------- преподаватели и аудитории ---------- */
    const letters = [];
    TL.forEach((t) => { const c = t.name.charAt(0); if (letters.indexOf(c) < 0) letters.push(c); });
    const letterChips = [''].concat(letters).map((c) => {
      const on = c === tl;
      return { label: c || 'Все', pressed: on ? 'true' : 'false', bg: on ? '#15171C' : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? '#15171C' : '#DCE0E6', pick: set({ tl: c }) };
    });
    let tk = 0;
    const isTeachersTab = !page && tab === 'teachers';
    const teacherList = !isTeachersTab ? [] : TL.filter((t) => (!tl || t.name.charAt(0) === tl) && (!tq || t.name.toLowerCase().indexOf(tq) >= 0)).map((t) => {
      const ts = M.status('t', t.i);
      const busy = ts.mode === 'now';
      const sb = busy ? 'Сейчас на паре · ' + ts.lesson.group + ' · ' + ts.lesson.place : (M.teacherLoad(t.i).subjects.slice(0, 2).join(', ') || 'Преподаватель');
      const it = { name: t.name, ini: iniOf(t.name), sub: sb, hasSub: true, busy: busy, pick: go({ sheet: { type: 't', key: t.name } }), delay: delay(tk) };
      tk += 1;
      return it;
    });

    const isRoomsTab = !page && tab === 'rooms';
    const roomSecs = {}, roomOrder = [];
    RL.forEach((r) => { const k = /^\d/.test(r.name) ? r.name.charAt(0) : 'x'; if (!roomSecs[k]) { roomSecs[k] = []; roomOrder.push(k); } roomSecs[k].push(r); });
    let rk = 0;
    const roomSections = !isRoomsTab ? [] : roomOrder.map((k) => {
      const list = roomSecs[k];
      return {
        title: k === 'x' ? 'Залы и мастерские' : list[0].name + ' – ' + list[list.length - 1].name, count: list.length,
        items: list.map((r) => {
          const rs = M.status('r', r.i);
          const busy = rs.mode === 'now';
          const it = {
            title: r.name, status: busy ? 'занята · ' + rs.lesson.group : 'свободна',
            dot: busy ? '#E06A1B' : '#3BA55C', fg: busy ? '#9A4410' : '#5B6270',
            border: busy ? '1px solid #F5C9A6' : '1px solid #E3E6EB', bg: busy ? '#FFF4EA' : '#FFFFFF',
            pick: go({ sheet: { type: 'r', key: r.name } }), delay: delay(rk)
          };
          rk += 1;
          return it;
        })
      };
    });

    const weekOf = (kind, idx, infoFn) => {
      const stx = M.status(kind, idx);
      return M.week(kind, idx, wi.monday).filter((d) => d.wd < 6 || d.lessons.length).map((d, di) => {
        const today = d.iso === clk.iso;
        const ps = d.lessons.map((l) => ({ head: pairLine(l), info: infoFn(l), fg: today && nowOf(stx, l) ? '#9A4410' : '#15171C' }));
        return { label: d.short + ', ' + d.num, pairs: ps, empty: ps.length === 0, emptyText: 'Нет пар', bg: today ? accentSoft : '#F7F8FA', delay: delay(di) };
      });
    };
    const skeleton = M.DAY_SHORT.slice(0, 6).map((ds, di) => ({ label: ds + ', ' + parseInt(M.addDays(wi.monday, di).slice(8), 10), delay: (di * 0.12).toFixed(2) + 's' }));
    const countWeek = (kind, idx) => M.week(kind, idx, wi.monday).reduce((a, d) => a + d.lessons.length, 0);
    let sheetData = { title: '', sub: '', badge: '', extra: '', hasExtra: false, listTitle: '', hasWeek: false, noWeek: false, days: [], note: '' };
    if (sheet && sheet.type === 't' && sheet.key) {
      const ti = M.teacherIndex(sheet.key);
      if (ti >= 0) {
        const info = INFO[sheet.key];
        const ld = M.teacherLoad(ti);
        const ts = M.status('t', ti);
        const n = countWeek('t', ti);
        sheetData = {
          title: info ? info[0] : sheet.key,
          sub: ts.mode === 'now' ? 'Сейчас на паре · ' + ts.lesson.group + ' · ' + ts.lesson.place : (info ? info[1] : 'Преподаватель'),
          badge: iniOf(sheet.key),
          extra: [info && info[2] ? 'Программы: ' + info[2] : '', ld.groups.length ? 'Группы: ' + ld.groups.join(', ') : ''].filter(Boolean).join(' · '),
          listTitle: 'Пары · ' + wi.shortLabel + ' · ' + (n ? pairs(n) : 'нет пар'), hasWeek: wi.hasData, noWeek: !wi.hasData,
          days: weekOf('t', ti, (l) => l.group + (l.subLabel ? ' (' + l.subLabel + ')' : '') + ' · ' + l.subject + ' · ' + l.place),
          note: wi.hasData ? 'Источник: ' + wi.sourceNote : 'Расписание на эту неделю ещё не опубликовано на сервере колледжа.'
        };
        sheetData.hasExtra = !!sheetData.extra;
      }
    } else if (sheet && sheet.type === 'r' && sheet.key) {
      const ri = M.roomIndex(sheet.key);
      if (ri >= 0) {
        const rs = M.status('r', ri);
        const busy = rs.mode === 'now';
        const n = countWeek('r', ri);
        sheetData = {
          title: roomTitle(sheet.key), sub: busy ? 'Сейчас занята · ' + rs.lesson.label.toLowerCase() + ' · ' + rs.lesson.group : 'Сейчас свободна',
          badge: /^\d/.test(sheet.key) ? sheet.key : sheet.key.slice(0, 3), extra: '', hasExtra: false,
          listTitle: 'Занятость · ' + wi.shortLabel + ' · ' + (n ? pairs(n) : 'нет пар'), hasWeek: wi.hasData, noWeek: !wi.hasData,
          days: weekOf('r', ri, (l) => l.group + (l.subLabel ? ' (' + l.subLabel + ')' : '') + ' · ' + l.subject + (l.teacher ? ' · ' + l.teacher : '')),
          note: wi.hasData ? 'Источник: ' + wi.sourceNote : 'Расписание на эту неделю ещё не опубликовано на сервере колледжа.'
        };
      }
    }

    const I = {
      cal: 'M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM16 2v4M8 2v4M3 10h18',
      users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.5 2.4 3.5 5.2',
      user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
      door: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01',
      menu: 'M4 6h16M4 12h16M4 18h16',
      home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
      plus: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6',
      cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
      board: 'M3 4h18v12H3zM12 16v4M8 20h8M7 12l3-3 3 2 4-4',
      key: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
      doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
      laptop: 'M4 5h16v11H4zM2 20h20',
      book: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h11',
      chart: 'M3 3v18h18M7 15l4-4 3 3 5-6'
    };
    const bottomDefs = [['schedule', 'Расписание', I.cal], ['groups', 'Группы', I.users], ['teachers', 'Преподаватели', I.user], ['rooms', 'Аудитории', I.door], ['menu', 'Меню', I.menu]];
    const bottom = bottomDefs.map((x) => {
      const on = x[0] === tab;
      return { label: x[1], d: x[2], current: on ? 'page' : 'false', color: on ? accent : '#5B6270', pill: on ? accentSoft : 'transparent', weight: on ? 700 : 500, pick: go({ tab: x[0], page: '', sheet: null }) };
    });

    const menuPages = [
      ['home', 'Главная колледжа', 'Новости и контакты', I.home],
      ['abitur', 'Абитуриентам', 'Специальности, приём, документы', I.plus],
      ['student', 'Кабинет студента', 'Моя группа, изменения, справки', I.cap],
      ['teacher', 'Кабинет преподавателя', 'Мои пары и материалы', I.board],
      me ? ['@profile', 'Мой профиль', me.fullName, I.key] : ['@login', 'Вход и регистрация', 'Сайт запомнит вашу группу', I.key]
    ].map((x, i) => ({
      l: x[1], s: x[2], d: x[3], delay: delay(i),
      pick: x[0] === '@profile' ? () => { window.location.href = 'profile.html'; } : (x[0] === '@login' ? () => { window.location.href = 'login.html'; } : go({ page: x[0], sheet: null }))
    }));
    const K = 'https://kitis.ru/';
    const menuLinks = [
      { title: 'О колледже', items: [['О колледже', 'college.html#p=about'], ['История', 'college.html#p=history'], ['Новости', 'college.html#p=news'], ['Объявления и мероприятия', 'college.html#p=announce'], ['Выпускникам и Центр карьеры', 'college.html#p=career'], ['Профессионалитет', 'college.html#p=professionalitet'], ['УПК', 'college.html#p=upk'], ['БЦК', 'college.html#p=bck'], ['Дистанционное обучение', 'college.html#p=distance'], ['Курсы', 'college.html#p=courses'], ['Профессиональные конкурсы', 'college.html#p=contests'], ['Вакансии', 'college.html#p=vacancy'], ['Вопрос-ответ', 'college.html#p=faq'], ['Контакты и реквизиты', 'college.html#p=contacts']] },
      { title: 'Официально', items: [['Сведения об образовательной организации', 'college.html#p=sveden'], ['Обращения', 'college.html#p=forms'], ['Противодействие коррупции', 'college.html#p=anti-corruption'], ['Комплексная безопасность', 'college.html#p=security'], ['Антитеррористическая защищённость', 'college.html#p=antiterrorist'], ['Информационная безопасность', 'college.html#p=information-security'], ['БПОО', 'college.html#p=bpoo'], ['Закупки', 'college.html#p=tenders'], ['Образовательный кредит в СПО', 'college.html#p=obr-kredit']] }
    ].map((sec) => ({ title: sec.title, items: sec.items.map((x) => ({ l: x[0], h: x[1] })) }));

    const CN = window.KITIS_COLLEGE && window.KITIS_COLLEGE.sections.filter((x) => x.id === 'news')[0];
    const newsSrc = CN ? CN.blocks[0].items.slice(0, 4).map((x) => [x[0].slice(8, 10) + '.' + x[0].slice(5, 7) + '.' + x[0].slice(0, 4), x[2]]) : [['03.11.2026', 'Гордимся: награды талантливым студенткам КИТиСа'], ['02.11.2026', 'Разговоры о важном ко Дню народного единства'], ['02.11.2026', 'Лекция «Образ будущего России» в КИТиСе'], ['31.10.2026', 'Волейболистки КИТиСа на областных соревнованиях']];
    // фото к новостям — из альбомов, которые робот переносит с kitis.ru
    const PH = window.KITIS_PHOTOS && Array.isArray(window.KITIS_PHOTOS.albums) ? window.KITIS_PHOTOS.albums.filter((a) => a && Array.isArray(a.p) && a.p.length && Array.isArray(a.p[0]) && typeof a.p[0][1] === 'string') : [];
    const words = (t) => String(t || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim().split(' ').filter((w) => w.length >= 3);
    const findAlbum = (iso, title) => {
      const a = words(title);
      if (!a.length) return null;
      const set = {};
      a.forEach((w) => { set[w] = 1; });
      let best = null, bs = 0;
      PH.forEach((al) => {
        const b = words(al.t);
        if (!b.length) return;
        let inter = 0;
        b.forEach((w) => { if (set[w]) inter++; });
        const sc = inter / (a.length + b.length - inter) + (al.d && al.d === iso ? 0.3 : 0);
        if (sc > bs) { bs = sc; best = al; }
      });
      return bs >= 0.55 ? best : null;
    };
    const news = newsSrc.map((x, i) => {
      const al = findAlbum(/^\d{2}\.\d{2}\.\d{4}$/.test(x[0]) ? x[0].slice(6, 10) + '-' + x[0].slice(3, 5) + '-' + x[0].slice(0, 2) : '', x[1]);
      return { date: x[0], title: x[1], delay: delay(i), href: 'college.html#p=news&i=' + i, hasPhoto: !!al, photo: al ? al.p[0][1] : '' };
    });
    const steps = [
      ['Выберите программы', '', 'После 9 класса — до трёх, после 11 — до пяти'],
      ['Подайте заявление', '20.06–15.08', 'Лично, почтой или через Госуслуги'],
      ['Следите за рейтингом', 'с 5.08', 'По среднему баллу профильных предметов'],
      ['Принесите оригиналы', 'до 19.08', 'Аттестат и медицинская справка'],
      ['Зачисление', 'после 19.08', 'Только с оригиналом аттестата']
    ].map((x, i) => ({ n: i + 1, title: x[0], date: x[1], text: x[2], bg: i === 0 ? accent : accentSoft, fg: i === 0 ? '#FFFFFF' : accent, delay: delay(i) }));
    const specs = [
      ['43.02.16', 'Туризм и гостеприимство'], ['09.02.09', 'Веб-разработка'], ['09.02.10', 'Разработка компьютерных игр, дополненной и виртуальной реальности'],
      ['08.02.15', 'Информационное моделирование в строительстве'], ['09.02.06', 'Сетевое и системное администрирование'], ['08.02.01', 'Строительство и эксплуатация зданий и сооружений'],
      ['08.02.14', 'Эксплуатация и обслуживание многоквартирного дома'], ['15.01.05', 'Сварщик (ручной и частично механизированной сварки (наплавки))'],
      ['08.01.28', 'Мастер отделочных строительных и декоративных работ'], ['35.01.28', 'Мастер столярного и мебельного производства']
    ].map((x, i, arr) => {
      const prof = x[0].slice(3, 5) === '01';
      return { code: x[0], name: x[1], kind: prof ? 'Профессия' : 'Специальность', fg: prof ? '#1C6B47' : '#1F46B8', line: i < arr.length - 1 ? '#EEF0F3' : 'transparent' };
    });
    const studentLinks = [
      ['Заказ справки', I.doc, 'student.html#spravka'], ['Дистанционное обучение', I.laptop, 'college.html#p=distance'],
      ['Дневник «Моя школа»', I.book, K], ['Учебные материалы', I.book, 'college.html#p=st-materials'],
      ['ГИА', I.cap, 'college.html#p=st-gia'], ['Графики аттестаций', I.chart, 'college.html#p=st-attestation']
    ].map((x, i) => ({ l: x[0], d: x[1], h: x[2], delay: delay(i) }));

    /* ---------- кабинеты ---------- */
    const myGroup = me && me.role === 'student' && me.group ? me.group : '';
    const sgi = M.groupIndex(myGroup);
    const sst = myGroup ? M.status('g', sgi) : { mode: 'none', lesson: null };
    const SL = sst.lesson;
    const stu = !myGroup ? { line: 'Войдите как студент', subject: 'Меню → Вход и регистрация', timer: '', live: false }
      : (sst.mode === 'now' ? { line: 'Сейчас ' + SL.label.toLowerCase() + ' · ' + SL.place, subject: SL.subject, timer: M.fmtTimer(sst.left), live: true }
        : (SL ? { line: (sst.mode === 'break' || sst.mode === 'before' ? 'Сегодня' : cap(M.whenLabel(SL.date))) + ' · ' + SL.label.toLowerCase() + ' в ' + SL.start + ' · ' + SL.place, subject: SL.subject, timer: sst.mode === 'break' || sst.mode === 'before' ? M.fmtTimer(sst.left) : '', live: sst.mode === 'break' || sst.mode === 'before' }
          : { line: 'Пар не найдено', subject: 'Расписание ещё не опубликовано', timer: '', live: false }));
    stu.dot = stu.live ? '#FF8A3D' : '#5B6270';
    stu.anim = stu.live ? 'kPulse 1.8s ease-out infinite' : 'none';
    const lastChange = M.changes()[0];
    const changesText = lastChange && lastChange.groups.length
      ? 'Изменения в расписании произошли у групп: ' + lastChange.groups.join(', ') + ' (' + M.dayLabel(lastChange.updated.slice(0, 10)) + ', ' + lastChange.updated.slice(11, 16) + ')'
      : 'С последней выгрузки расписания изменений нет.';
    const myTeacher = me && me.role === 'teacher' && me.teacher ? me.teacher : '';
    const tci = myTeacher ? M.teacherIndex(myTeacher) : -1;
    const tcs = tci >= 0 ? M.status('t', tci) : { mode: 'none', lesson: null };
    const TLs = tcs.lesson;
    const tc = tci < 0 ? { badge: 'Кабинет преподавателя', title: 'Войдите как преподаватель', line: 'Меню → Вход и регистрация' }
      : (tcs.mode === 'now' ? { badge: 'Вы ведёте · ' + TLs.label, title: TLs.group + ' · ' + TLs.place, line: 'До конца ' + M.fmtTimer(tcs.left) + (tcs.next ? ' · далее ' + tcs.next.label.toLowerCase() + ' в ' + tcs.next.start : ' · последняя пара') }
        : (TLs ? { badge: tcs.mode === 'break' || tcs.mode === 'before' ? 'Скоро пара' : 'Следующая пара', title: TLs.group + ' · ' + TLs.place, line: (tcs.mode === 'break' || tcs.mode === 'before' ? 'Через ' + M.fmtTimer(tcs.left) : cap(M.whenLabel(TLs.date))) + ' · ' + TLs.label.toLowerCase() + ' в ' + TLs.start }
          : { badge: 'Пар не найдено', title: '—', line: 'Расписание ещё не опубликовано' }));
    const tcWeekInfo = M.weekInfo(0);
    const teacherWeek = [];
    if (tci >= 0) M.week('t', tci, tcWeekInfo.monday).forEach((d) => d.lessons.forEach((l) => teacherWeek.push({
      day: d.short + ', ' + d.num, n: l.label, time: l.time, group: l.group, bg: d.iso === clk.iso && nowOf(tcs, l) ? '#FFF4EA' : '#F7F8FA'
    })));
    const teacherLinks = [['Методические материалы', 'college.html#p=tc-docs'], ['Аттестации', 'college.html#p=tc-attestation'], ['Учебно-методическая работа', 'college.html#p=tc-method'], ['Воспитательная работа', 'college.html#p=tc-upbringing'], ['Объявления', 'college.html#p=tc-announce'], ['Снижение бюрократической нагрузки', 'college.html#p=tc-bureaucracy']].map((x, i, arr) => ({ l: x[0], h: x[1], line: i < arr.length - 1 ? '#EEF0F3' : 'transparent' }));
    const roleDefs = [['student', 'Студент', 'Аккаунт подтвердит куратор группы.', 'student'], ['teacher', 'Преподаватель', 'ФИО сверят со списком преподавателей в расписании.', 'teacher'], ['abitur', 'Абитуриент', 'Подтверждение не нужно.', 'abitur']];
    let roleNote = roleDefs[0][2];
    const roles = roleDefs.map((x) => {
      const on = x[0] === role;
      if (on) roleNote = x[2];
      return { label: x[1], checked: on ? 'true' : 'false', border: on ? '2px solid ' + accent : '1px solid #DCE0E6', bg: on ? accentSoft : '#FFFFFF', pick: set({ role: x[0] }) };
    });
    const groupOptions = GL.map((g) => ({ code: g.name, selected: g.name === myGroup }));

    const todayLabel = M.DAY_SHORT[clk.wd].toLowerCase() + ', ' + M.dayLabel(clk.iso);
    const pageTitles = { home: ['Главная колледжа', 'kitis.ru'], abitur: ['Абитуриентам', 'Приём 2026'], student: ['Кабинет студента', myGroup || 'нужен вход'], teacher: ['Кабинет преподавателя', myTeacher || 'нужен вход'], login: ['Вход', 'Личный кабинет'], register: ['Регистрация', 'Личный кабинет'] };
    const tabTitles = { schedule: ['Расписание', (group || 'выберите группу') + ' · ' + todayLabel], groups: ['Группы', GL.length + ' групп'], teachers: ['Преподаватели', TL.length + ' преподавателей'], rooms: ['Аудитории', RL.length + ' аудиторий'], menu: ['Меню', 'Всё, что не про расписание'] };
    const tt = page ? pageTitles[page] : tabTitles[tab];
    const upd = M.updatedLabel();

    return {
      accent: accent, accentSoft: accentSoft, plaque: plaque, group: group, hasGroup: hasGroup, hasData: true, noData: false,
      groupCaption: CURATORS[group] ? 'Группа · куратор ' + CURATORS[group] : 'Группа',
      title: tt[0], subtitle: tt[1], hasPage: !!page, noPage: !page,
      isScheduleTab: !page && tab === 'schedule',
      isPairs: !page && tab === 'schedule' && sub === 'pairs' && hasGroup,
      isChooser: isChooser,
      isBellsSub: !page && tab === 'schedule' && sub === 'bells',
      isResultsSub: !page && tab === 'schedule' && sub === 'results' && hasGroup,
      isResultsNoGroup: !page && tab === 'schedule' && sub === 'results' && !hasGroup,
      isGroupsTab: isGroupsTab, isTeachersTab: isTeachersTab, isRoomsTab: isRoomsTab, isMenuTab: !page && tab === 'menu',
      isHome: page === 'home', isAbitur: page === 'abitur', isStudent: page === 'student', isTeacher: page === 'teacher', isLogin: page === 'login', isRegister: page === 'register',
      subs: [['pairs', 'Пары'], ['bells', 'Звонки'], ['results', 'Итоги']].map((x) => {
        const on = x[0] === sub;
        return { label: x[1], pressed: on ? 'true' : 'false', bg: on ? '#FFFFFF' : 'transparent', weight: on ? 700 : 500, shadow: on ? '0 1px 2px rgba(21, 23, 28, 0.12)' : 'none', pick: go({ sub: x[0] }) };
      }),
      chooserTabs: chooserTabs, cq: s.cq || '', onCq: (e) => this.setState({ cq: e && e.target ? e.target.value : '' }),
      chooserPh: ck === 'g' ? 'Группа, например ИСр24-1' : (ck === 't' ? 'Фамилия преподавателя' : 'Аудитория, например 403'),
      chooserItems: chooserItems, chooserEmpty: isChooser && chooserItems.length === 0, recent: recent, hasRecent: recent.length > 0,
      weekShort: wi.shortLabel, weekSub: wi.sub, sourceNote: wi.sourceNote, nextBadge: w === 0 && b.nextPublished,
      prevNav: navBtn(canPrev), nextNav: navBtn(canNext),
      prevWeek: go({ w: canPrev ? w - 1 : w, day: null }), nextWeek: go({ w: canNext ? w + 1 : w, day: null }),
      dayPills: dayPills, dayLessons: dayLessons, dayCols: 'repeat(' + Math.max(1, showDays.length) + ', minmax(0, 1fr))',
      dayTitle: dSel.name + (dSel.label ? ', ' + dSel.label : ''), dayCount: dc ? pairs(dc) : '',
      dayNote: dSel.wd === 0 && dc > 0, dayEmpty: dc === 0,
      dayEmptyText: wi.hasData ? 'В этот день пар нет' : (w > 0 ? 'Расписание ещё не опубликовано на сервере' : 'За эту неделю данных на сервере нет'),
      bells: bells, bellTabs: bellTabs, bellProgress: bellProgress,
      bellNote: bellDay === 'mon' ? 'Кураторский день · пара 1 ч 20 мин' : 'Вторник – суббота · пара 1 ч 30 мин',
      stats: stats, bySubj: bySubj, chartTitle: isTeacherView ? 'По дисциплинам' : 'По преподавателям', hasStats: flat.length > 0, noStats: flat.length === 0,
      loadRows: loadRows, loadStats: loadStats, hasLoad: loadRows.length > 0, updLine: upd ? 'данные на ' + upd : '',
      loadNote: isTeacherView ? 'Черта на полосе — сколько часов должно быть проведено по плану к этой дате. Видно только преподавателям.' : 'Полоса — сколько часов уже проведено. Одна пара — 2 часа.',
      prefixChips: prefixChips, groupSections: groupSections, noGroups: isGroupsTab && shownGroups === 0,
      letterChips: letterChips, teacherList: teacherList, noTeachers: isTeachersTab && teacherList.length === 0,
      teacherCount: TL.length + ' ' + pl(TL.length, 'преподаватель', 'преподавателя', 'преподавателей'),
      roomSections: roomSections, roomsTotal: RL.length, skeleton: skeleton,
      sheetOpen: !!sheet && !!sheetData.title, sheet: sheetData, closeSheet: go({ sheet: null }),
      pickerOpen: pickerOpen, pickerSections: pickerSections, pickerEmpty: pickerOpen && pickerSections.length === 0, pq: s.pq || '',
      openPicker: set({ picker: true, pq: '' }), closePicker: set({ picker: false }), onPq: (e) => this.setState({ pq: e && e.target ? e.target.value : '' }),
      bottom: bottom, menuPages: menuPages, menuLinks: menuLinks,
      news: news, steps: steps, specs: specs, studentLinks: studentLinks, stu: stu, tc: tc, teacherWeek: teacherWeek, teacherLinks: teacherLinks,
      noTeacherWeek: teacherWeek.length === 0, tcWeek: tcWeekInfo.shortLabel, changesText: changesText,
      stuName: me ? me.first || me.shortName : 'гость', stuGroupLine: myGroup ? 'Группа ' + myGroup + (CURATORS[myGroup] ? ' · куратор ' + CURATORS[myGroup] : '') : 'Войдите, чтобы видеть свою группу',
      tcName: myTeacher || 'Кабинет преподавателя', tcIni: myTeacher ? iniOf(myTeacher) : 'П',
      roles: roles, roleNote: roleNote, roleStudent: role === 'student', roleAbitur: role === 'abitur', groupOptions: groupOptions,
      goBack: () => { if (window.history.length > 1) window.history.back(); else this.go({ page: '', tab: 'menu' }); },
      goGroups: go({ tab: 'groups', page: '', sheet: null }),
      goSchedule: go({ tab: 'schedule', sub: 'pairs', page: '', group: myGroup || group || null }),
      openAbitur: go({ page: 'abitur' }), openRegister: () => { window.location.href = 'register.html'; }, openStudent: go({ page: 'student' }),
      submitRegister: () => { window.location.href = 'register.html'; },
      onGq: (e) => this.setState({ gq: e && e.target ? e.target.value : '' }),
      onTq: (e) => this.setState({ tq: e && e.target ? e.target.value : '' })
    };
  }
}
;return Component;
};
