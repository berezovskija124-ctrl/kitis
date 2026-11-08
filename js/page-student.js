/* Код страницы student.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    if (window.location.hash === '#spravka') this.setState({ spravka: true });
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
    const plaqueOf = (st, titleFn) => {
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

    const states = {
      done: { bg: '#F1F3F6', fg: '#5B6270', numBg: '#F1F3F6', numFg: '#5B6270' },
      now: { bg: '#FFE6D3', fg: '#9A4410', numBg: '#B4530F', numFg: '#FFFFFF' },
      next: { bg: accentSoft, fg: accent, numBg: accentSoft, numFg: accent }
    };
    const A = window.KitisAccount;
    const me = A ? A.current() : null;
    const acct = { acctHref: me ? 'profile.html' : 'login.html', hasPhoto: !!(me && me.photo), noPhoto: !(me && me.photo), photo: me && me.photo ? me.photo : '', acctIni: me ? me.initials : '→', acctLabel: me ? me.shortName : 'Войти' };
    const myGroup = me && me.role === 'student' && me.group ? me.group : '';
    const gi = M.groupIndex(myGroup);
    const hrefOf = (kind, name) => kind === 'g' ? 'desktop.html#group=' + encodeURIComponent(name) : (kind === 't' ? 'desktop.html#tab=teachers&teacher=' + encodeURIComponent(name) : 'desktop.html#tab=rooms&room=' + encodeURIComponent(name));
    const favList = (myGroup ? [{ kind: 'g', name: myGroup, mine: true }] : []).concat(M.recent().filter((x) => !(x.kind === 'g' && x.name === myGroup))).slice(0, 5);
    const favs = favList.map((x) => ({ title: x.kind === 'r' && /^\d/.test(x.name) ? 'Аудитория ' + x.name : x.name, note: x.mine ? 'моя группа' : (x.kind === 'g' ? 'группа' : (x.kind === 't' ? 'преподаватель' : 'аудитория')), href: hrefOf(x.kind, x.name), bg: x.mine ? accentSoft : 'transparent' }));
    const ch = M.changes()[0];
    const changesText = ch && ch.groups.length ? 'Изменения в расписании произошли у групп: ' + ch.groups.join(', ') : 'С последней выгрузки изменений в расписании нет';
    const pq = !myGroup ? finishPlaque({ live: false, badge: 'Кабинет студента', big: 'Войдите', mono: false, size: '40px', note: 'чтобы видеть свою группу', progress: '0', hasProgress: false, title: 'Регистрация занимает минуту: ФИО, группа, e-mail и пароль', subject: '', meta: '' }) : finishPlaque(plaqueOf(M.status('g', gi), { nowBadge: 'Сейчас', title: (L) => [L.teacher, L.place].filter(Boolean).join(' · ') }));
    const dl = myGroup ? dayList('g', gi) : { title: 'Пары', isToday: true, lessons: [] };
    const today = dl.lessons.map((l) => {
      const s2 = stateOf(l, dl.isToday);
      const sx = states[s2.kind];
      return { n: l.badge, time: l.time || '—', subject: l.subject, meta: [l.teacher, l.place, l.subLabel].filter(Boolean).join(' · '), state: s2.label, chipBg: sx.bg, chipFg: sx.fg, numBg: sx.numBg, numFg: sx.numFg };
    });
    const sst = this.state || {};
    const openSpravka = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.setState({ spravka: true, spErr: '' });
      setTimeout(() => { const f = document.getElementById('spravka'); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
    };
    const clip = (v, n) => String(v || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
    const spName = sst.spName != null ? sst.spName : (me ? me.fullName : '');
    const spGroup = sst.spGroup != null ? sst.spGroup : (myGroup || '');
    const myChanged = !!(ch && myGroup && ch.groups.indexOf(myGroup) >= 0);
    const notes = [
      { text: myGroup ? (myChanged ? 'Расписание вашей группы ' + myGroup + ' изменилось — проверьте пары на неделю.' : 'Расписание группы ' + myGroup + ' не менялось с прошлой выгрузки.') : 'Войдите и укажите группу, чтобы видеть изменения своего расписания.', dot: myChanged ? '#E06A1B' : '#1C6B47', bg: myChanged ? '#FFF4EA' : '#F4F5F7' },
      { text: changesText, dot: '#5B6270', bg: '#F4F5F7' },
      { text: 'Данные расписания с сервера колледжа обновляются автоматически каждые 2 часа в учебные дни.', dot: '#5B6270', bg: '#F4F5F7' }
    ];
    const panels = {
      notesOpen: !!sst.notes, notesExpanded: sst.notes ? 'true' : 'false', notes: notes,
      toggleNotes: () => this.setState({ notes: !(this.state || {}).notes }),
      spravkaOpen: !!sst.spravka, openSpravka: openSpravka, closeSpravka: () => this.setState({ spravka: false }),
      spName: spName, spGroup: spGroup, spErr: sst.spErr || '', hasSpErr: !!sst.spErr,
      onSpName: (e) => this.setState({ spName: clip(e.target.value, 90), spErr: '' }),
      onSpGroup: (e) => this.setState({ spGroup: clip(e.target.value, 20), spErr: '' }),
      onSpWhere: (e) => { this._spWhere = clip(e.target.value, 80); },
      onSpCount: (e) => { this._spCount = Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)); },
      sendSpravka: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const st2 = this.state || {};
        const name = clip(st2.spName != null ? st2.spName : spName, 90).trim();
        const grp = clip(st2.spGroup != null ? st2.spGroup : spGroup, 20).trim();
        if (name.length < 5) { this.setState({ spErr: 'Укажите фамилию, имя и отчество' }); return; }
        if (!grp) { this.setState({ spErr: 'Укажите группу' }); return; }
        const body = 'Здравствуйте! Прошу подготовить справку об обучении.\n\nФИО: ' + name + '\nГруппа: ' + grp + '\nКуда нужна справка: ' + (this._spWhere || 'по месту требования') + '\nКоличество экземпляров: ' + (this._spCount || 1) + '\n';
        window.location.href = 'mailto:info@kitis.ru?subject=' + encodeURIComponent('Справка об обучении — ' + grp) + '&body=' + encodeURIComponent(body);
      }
    };
    const services = [
      ['Заказ справки в учебной части', 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6', '#spravka'],
      ['Дистанционное обучение', 'M4 5h16v11H4zM2 20h20', 'college.html#p=distance'],
      ['Дневник «Моя школа»', 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h11', 'home.html'],
      ['Учебные материалы', 'M2 6h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 6h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z', 'college.html#p=st-materials'],
      ['Государственная итоговая аттестация', 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5', 'college.html#p=st-gia'],
      ['Графики академических аттестаций', 'M3 3v18h18M7 15l4-4 3 3 5-6', 'college.html#p=st-attestation'],
      ['Общежитие', 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', 'college.html#p=st-hostel'],
      ['Олимпиады и конкурсы', 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8', 'college.html#p=st-olympiads']
    ].map((x) => ({ l: x[0], d: x[1], h: x[2], bg: accentSoft, fg: accent, go: x[2] === '#spravka' ? openSpravka : undefined }));
    return Object.assign({ accent: accent, accentSoft: accentSoft, today: today, services: services, pq: pq, todayLong: todayLong, listTitle: myGroup ? dl.title : 'Пары', noToday: today.length === 0,
      stuName: me ? me.first || me.shortName : 'гость', stuLine: myGroup ? 'Студент · ' + myGroup + (myGroup === 'ИСр24-1' ? ' · куратор Шевченко П. С.' : '') : 'Вы не вошли — войдите, чтобы видеть свою группу',
      changesText: changesText, favs: favs, noFavs: favs.length === 0 }, acct, panels);
  }
}
;return Component;
};
