/* Код страницы teacher.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
  }
  componentWillUnmount() {
    clearInterval(this._timer);
  }
  renderVals() {
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';

    const M = window.KitisModel;
    const clk = M.clock();
    const pl = M.plural;
    const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
    const fmtRoom = (x) => !x ? '' : (/^\d/.test(x) ? 'ауд. ' + x : x);
    const pairs = (n) => n + ' ' + pl(n, 'пара', 'пары', 'пар');
    const LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
    const todayLong = LONG[clk.wd] + ', ' + M.dayLabel(clk.iso);
    const inLabel = (secs) => { const mm = Math.round(secs / 60); return mm >= 60 ? 'Через ' + Math.floor(mm / 60) + ' ч ' + (mm % 60) + ' мин' : 'Через ' + mm + ' мин'; };
    const plaqueOf0 = (st, titleFn) => {
      const L = st.lesson;
      if (st.mode === 'now') return { live: true, badge: titleFn.nowBadge + ' · ' + L.label, big: M.fmtTimer(st.left), mono: true, size: '60px', note: 'до конца пары · ' + L.time,
        progress: ((1 - st.left / st.total) * 100).toFixed(1), hasProgress: true, title: titleFn.title(L), subject: L.subject,
        meta: st.next ? 'Далее: ' + st.next.label.toLowerCase() + ' в ' + st.next.start + ' · ' + st.next.place : 'Это последняя пара сегодня' };
      if (st.mode === 'break' || st.mode === 'before') return { live: true, badge: st.mode === 'break' ? 'Перемена' : 'Скоро занятия', big: M.fmtTimer(st.left), mono: true, size: '60px', note: 'до начала: ' + L.label.toLowerCase() + ' · ' + L.time,
        progress: '0', hasProgress: false, title: titleFn.title(L), subject: L.subject, meta: 'Начало в ' + L.start };
      if (L) return { live: false, badge: st.mode === 'after' ? 'На сегодня пары закончились' : (clk.wd === 6 ? 'Сегодня выходной' : 'Сегодня пар нет'), big: cap(M.whenLabel(L.date)), mono: false, size: '40px',
        note: 'следующее занятие · ' + L.label.toLowerCase() + ' · ' + L.time, progress: '0', hasProgress: false, title: titleFn.title(L), subject: L.subject, meta: '' };
      return { live: false, badge: 'Пар не найдено', big: '—', mono: false, size: '40px', note: 'расписание ещё не опубликовано', progress: '0', hasProgress: false, title: '', subject: '', meta: '' };
    };
    // цвет предмета у таблички «сейчас идёт»
    const plaqueOf = (st, titleFn) => Object.assign(plaqueOf0(st, titleFn), { color: st.lesson ? st.lesson.color : 'transparent' });
    const finishPlaque = (pq) => Object.assign(pq, {
      dot: pq.live ? '#FF8A3D' : '#5B6270', anim: pq.live ? 'kPulse 1.8s ease-out infinite' : 'none',
      font: pq.mono ? "'JetBrains Mono', monospace" : "'Onest', system-ui, sans-serif", hasTitle: !!pq.title, hasSubject: !!pq.subject, hasMeta: !!pq.meta
    });
    const dayList = (kind, idx) => {
      let lessons = M.lessonsOn(kind, idx, clk.iso);
      let title = 'Сегодня', isToday = true;
      if (!lessons.length) {
        for (let d = 1; d <= 14; d++) {
          const iso = M.addDays(clk.iso, d);
          const ls = M.lessonsOn(kind, idx, iso);
          if (ls.length) { lessons = ls; title = cap(M.whenLabel(iso)); isToday = false; break; }
        }
      }
      return { title: lessons.length ? title : 'Сегодня', isToday: isToday, lessons: lessons };
    };
    const stateOf = (l, isToday) => {
      if (!isToday || !l.hasTime) return { label: 'по расписанию', kind: 'next' };
      const a = M.toSec(l.start), e = M.toSec(l.end);
      if (clk.secs >= e) return { label: 'Прошла', kind: 'done' };
      if (clk.secs >= a) return { label: 'Идёт · ' + Math.ceil((e - clk.secs) / 60) + ' мин', kind: 'now' };
      return { label: inLabel(a - clk.secs), kind: 'next' };
    };

    const A = window.KitisAccount;
    const me = A ? A.current() : null;
    const NKEY = 'kitis.notify.v1';
    let notif = {};
    try { notif = JSON.parse(window.localStorage.getItem(NKEY) || '{}') || {}; } catch (e) { notif = {}; }
    if (typeof notif !== 'object' || Array.isArray(notif)) notif = {};
    const saveNotif = (patch) => {
      const next = Object.assign({}, notif, patch);
      let ok = true;
      try { window.localStorage.setItem(NKEY, JSON.stringify({ before: next.before !== false, changes: next.changes !== false })); } catch (e) { ok = false; }
      this.setState({ notifyMsg: ok ? 'Сохранено на этом устройстве' : 'Браузер не дал сохранить настройку' });
      clearTimeout(this._nm); this._nm = setTimeout(() => this.setState({ notifyMsg: '' }), 2500);
    };
    const acct = { acctHref: me ? 'profile.html' : 'login.html', hasPhoto: !!(me && me.photo), noPhoto: !(me && me.photo), photo: me && me.photo ? me.photo : '', acctIni: me ? me.initials : '→', acctLabel: me ? me.shortName : 'Войти' };
    const TC = me && me.role === 'teacher' && me.teacher ? me.teacher : '';
    const ti = TC ? M.teacherIndex(TC) : -1;
    const tst = ti >= 0 ? M.status('t', ti) : { mode: 'none', lesson: null };
    const pq = ti < 0 ? finishPlaque({ live: false, badge: 'Кабинет преподавателя', big: 'Войдите', mono: false, size: '40px', note: 'как преподаватель — и выберите себя в списке', progress: '0', hasProgress: false, title: '', subject: '', meta: '' }) : finishPlaque(plaqueOf(tst, { nowBadge: 'Вы ведёте', title: (L) => L.group + (L.subLabel ? ' (' + L.subLabel + ')' : '') + ' · ' + L.place }));
    const sst = this.state || {};
    const bw = M.bounds();
    const wMin = bw.min, wMax = bw.max;
    const wOff = Math.max(wMin, Math.min(wMax, sst.w || 0));
    const wi = M.weekInfo(wOff);
    const wk = ti >= 0 ? M.week('t', ti, wi.monday).slice(0, 6) : M.week('t', -1, wi.monday).slice(0, 6);
    let count = 0, maxPair = 6;
    let hasCurator = false;
    wk.forEach((d) => d.lessons.forEach((l) => { count += 1; if (l.num > maxPair) maxPair = l.num; if (l.num <= 0) hasCurator = true; }));
    const heads = wk.map((d) => {
      const on = d.iso === clk.iso;
      return { label: d.short + ', ' + d.num + (on ? ' · сегодня' : ''), bg: on ? accent : '#F7F8FA', fg: on ? '#FFFFFF' : '#15171C' };
    });
    const grid = [];
    for (let p = hasCurator ? 0 : 1; p <= maxPair; p++) {
      const pt = p === 0 ? M.CURATOR_TIME : M.WK_TIMES[p - 1];
      grid.push({
        n: p === 0 ? 'Кураторский час' : p + ' пара', time: p === 0 ? 'пн, ' + pt[0] + ' – ' + pt[1] : (pt ? 'вт–сб ' + pt[0] + ' – ' + pt[1] : ''),
        cells: wk.map((d) => {
          const ls = d.lessons.filter((l) => l.num === p);
          const has = ls.length > 0;
          const now = has && tst.mode === 'now' && d.iso === clk.iso && tst.lesson.num === p;
          return {
            has: has, group: ls.map((l) => l.group + (l.sub ? ' · ' + l.sub + ' п/г' : '')).join(', '), room: has ? ls[0].place : '',
            subject: has ? ls[0].subject : '', color: has ? ls[0].color : 'transparent',
            bg: now ? '#FFF4EA' : (has ? accentSoft : '#FAFBFC'), border: now ? '#F5C9A6' : (has ? 'transparent' : '#EEF0F3'),
            fg: now ? '#9A4410' : '#15171C', sub: now ? '#9A4410' : '#3A404C'
          };
        })
      });
    }
    const dl = ti >= 0 ? dayList('t', ti) : { title: 'Сегодня', isToday: true, lessons: [] };
    const today = dl.lessons.map((l) => {
      const s2 = stateOf(l, dl.isToday);
      const c = s2.kind === 'done' ? ['#5B6270', '#F7F8FA', '#F1F3F6', '#5B6270'] : (s2.kind === 'now' ? ['#9A4410', '#FFF4EA', '#B4530F', '#FFFFFF'] : [accent, '#FFFFFF', accentSoft, accent]);
      return { n: l.badge, time: l.time || '—', subject: l.subject, color: l.color, title: l.group + ' · ' + l.place, state: s2.label, stateFg: c[0], bg: c[1], numBg: c[2], numFg: c[3] };
    });
    const ld = M.teacherLoad(ti);
    const CUR = { 'ИСр24-1': 'Куратор — Шевченко П. С.' };
    const myGroups = ld.groups.map((g) => {
      const gIdx = M.groupIndex(g);
      const subs = M.load(gIdx).filter((x) => x.t === ti).map((x) => x.subject).filter((x, k, arr) => arr.indexOf(x) === k);
      const n = wk.reduce((acc, d) => acc + d.lessons.filter((l) => l.group === g).length, 0);
      return { name: g, note: CUR[g] || 'Группа', subjects: subs.join(', ') + ' · ' + (n ? pairs(n) : 'нет пар') + ' на неделе' };
    });
    const links = [
      ['Методические материалы', 'M2 6h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 6h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z', 'college.html#p=tc-docs'],
      ['Аттестации', 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8', 'college.html#p=tc-attestation'],
      ['Учебно-методическая работа', 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6', 'college.html#p=tc-method'],
      ['Воспитательная работа', 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.5 2.4 3.5 5.2', 'college.html#p=tc-upbringing'],
      ['Объявления', 'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6', 'college.html#p=tc-announce'],
      ['Снижение бюрократической нагрузки', 'M20 6 9 17l-5-5', 'college.html#p=tc-bureaucracy']
    ].map((x) => ({ l: x[0], d: x[1], h: x[2], bg: accentSoft, fg: accent }));
    return {
      accent: accent, accentSoft: accentSoft,
      heads: heads, grid: grid, today: today, links: links, pq: pq, acctHref: acct.acctHref, hasPhoto: acct.hasPhoto, noPhoto: acct.noPhoto, photo: acct.photo, acctIni: acct.acctIni, acctLabel: acct.acctLabel, todayLong: todayLong, myGroups: myGroups,
      listTitle: dl.title, noToday: today.length === 0, weekShort: wi.shortLabel, sourceNote: wi.sourceNote,
      prevWeek: () => this.setState({ w: Math.max(wMin, wOff - 1) }), nextWeek: () => this.setState({ w: Math.min(wMax, wOff + 1) }),
      noPrev: wOff <= wMin, noNext: wOff >= wMax, prevOp: wOff <= wMin ? '0.4' : '1', nextOp: wOff >= wMax ? '0.4' : '1',
      printWeek: () => { try { window.print(); } catch (e) { /* печать недоступна */ } },
      report: () => {
        const who = TC || (me ? me.fullName : 'Преподаватель');
        const body = 'Здравствуйте!\n\n' + who + ' сообщает:\n\n';
        window.location.href = 'mailto:info@kitis.ru?subject=' + encodeURIComponent('Сообщение в учебную часть — ' + who) + '&body=' + encodeURIComponent(body);
      },
      notify1: notif.before !== false, notify2: notif.changes !== false, notifyMsg: sst.notifyMsg || '', hasNotifyMsg: !!sst.notifyMsg,
      onNotify1: (e) => saveNotif({ before: !!e.target.checked }), onNotify2: (e) => saveNotif({ changes: !!e.target.checked }),
      pairsLabel: pairs(count), tcLine: TC ? TC + ' · кабинет преподавателя' : 'Вы не вошли как преподаватель'
    };
  }
}
;return Component;
};
