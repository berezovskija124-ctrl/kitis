/* Код страницы home.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
  }
  componentWillUnmount() {
    clearInterval(this._timer);
  }
  renderVals() {
    const s = this.state || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const scope = s.scope || 'group';
    const scopeList = [
      ['group', 'Группа', 'Например, ИСр24-1'],
      ['teacher', 'Преподаватель', 'Например, Сергиеня'],
      ['room', 'Аудитория', 'Например, 214']
    ];
    let ph = scopeList[0][2];
    const scopes = scopeList.map((x) => {
      const on = x[0] === scope;
      if (on) ph = x[2];
      return {
        label: x[1], pressed: on ? 'true' : 'false',
        bg: on ? '#FFFFFF' : 'transparent', weight: on ? 600 : 500,
        shadow: on ? '0 1px 2px rgba(21, 23, 28, 0.10)' : 'none',
        pick: () => this.setState({ scope: x[0], q: '' })
      };
    });
    const I = {
      userPlus: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6',
      users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.5 2.4 3.5 5.2',
      board: 'M3 4h18v12H3zM12 16v4M8 20h8M7 12l3-3 3 2 4-4',
      calendar: 'M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM16 2v4M8 2v4M3 10h18',
      clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
      doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
      laptop: 'M4 5h16v11H4zM2 20h20',
      book: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h11',
      case: 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
      award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8',
      cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6'
    };
    const roles = [
      { title: 'Абитуриентам', text: 'Специальности, правила приёма, подача заявления и общежитие', d: I.userPlus, href: 'abitur.html', cta: 'Поступление в КИТиС', primary: true,
        links: [['Специальности и профессии', 'abitur.html'], ['Как поступить', 'abitur.html'], ['Общежитие', 'abitur.html'], ['Образовательный кредит и целевое обучение', 'abitur.html']] },
      { title: 'Студентам', text: 'Расписание группы, замены, справки и дистанционное обучение', d: I.users, href: 'student.html', cta: 'Кабинет студента', primary: false,
        links: [['Расписание группы', 'desktop.html'], ['Заказ справки в учебной части', 'student.html'], ['Дистанционное обучение', 'student.html'], ['ГИА и графики аттестаций', 'student.html']] },
      { title: 'Преподавателям', text: 'Своё расписание, группы, методические материалы и аттестация', d: I.board, href: 'teacher.html', cta: 'Кабинет преподавателя', primary: false,
        links: [['Моё расписание', 'teacher.html'], ['Методические материалы', 'teacher.html'], ['Аттестация', 'teacher.html'], ['Объявления для преподавателей', 'teacher.html']] }
    ].map((r) => ({
      title: r.title, text: r.text, d: r.d, href: r.href, cta: r.cta,
      links: r.links.map((k) => ({ l: k[0], h: k[1] })),
      iconBg: r.primary ? accent : accentSoft, iconFg: r.primary ? '#FFFFFF' : accent,
      ctaBg: r.primary ? accent : '#F1F3F6', ctaFg: r.primary ? '#FFFFFF' : '#15171C'
    }));
    const services = [
      ['Расписание занятий', I.calendar, 'desktop.html'],
      ['Расписание звонков', I.clock, 'desktop.html'],
      ['Заказать справку', I.doc, 'student.html#spravka'],
      ['Дистанционное обучение', I.laptop, 'college.html#p=distance'],
      ['Дневник «Моя школа»', I.book, 'student.html'],
      ['Центр карьеры', I.case, 'college.html#p=career'],
      ['Профессионалитет', I.award, 'college.html#p=professionalitet'],
      ['ЦОПП и курсы', I.cap, 'college.html#p=courses']
    ].map((x) => ({ l: x[0], d: x[1], h: x[2], bg: accentSoft, fg: accent }));
    const tagColors = { 'Достижения': '#1F46B8', 'События': '#6233B5', 'Спорт': '#1C6B47', 'Для студентов': '#1F46B8', 'Воспитательная работа': '#6233B5', 'Новости спорта': '#1C6B47', 'Волонтёры': '#9A4410' };
    const CN = window.KITIS_COLLEGE && window.KITIS_COLLEGE.sections.filter((x) => x.id === 'news')[0];
    const newsItems = CN ? CN.blocks[0].items.slice(0, 4).map((x) => [x[0].slice(8, 10) + '.' + x[0].slice(5, 7) + '.' + x[0].slice(0, 4), x[2], x[1]]) : [
      ['03.11.2026', 'Гордимся: награды талантливым студенткам КИТиСа', 'Достижения'],
      ['02.11.2026', 'Разговоры о важном ко Дню народного единства', 'События'],
      ['02.11.2026', 'Лекция «Образ будущего России» в КИТиСе', 'События'],
      ['31.10.2026', 'Волейболистки КИТиСа на областных соревнованиях', 'Спорт']
    ];
    const news = newsItems.map((x, i) => ({ date: x[0], title: x[1], tag: x[2], tagFg: tagColors[x[2]] || accent, href: 'college.html#p=news&i=' + i }));
    const mainList = [
      ['19.10.2026', 'День открытых дверей!'],
      ['23.09.2026', 'Праздничные мероприятия ко Дню среднего профессионального образования'],
      ['20.08.2026', '«Кадры» — бесплатное обучение в рамках национального проекта'],
      ['19.06.2026', 'Приёмная комиссия открыта!']
    ].map((x, i, arr) => ({ date: x[0], title: x[1], line: i < arr.length - 1 ? '#EEF0F3' : 'transparent', href: 'college.html#p=events' }));
    const M = window.KitisModel;
    const A = window.KitisAccount;
    const me = A ? A.current() : null;
    const hrefOf = (kind, name) => kind === 'g' ? 'desktop.html#group=' + encodeURIComponent(name)
      : (kind === 't' ? 'desktop.html#tab=teachers&teacher=' + encodeURIComponent(name) : 'desktop.html#tab=rooms&room=' + encodeURIComponent(name));
    const rec = M.recent();
    const recent = rec.map((x) => ({ label: x.kind === 'r' && /^\d/.test(x.name) ? 'ауд. ' + x.name : x.name, href: hrefOf(x.kind, x.name), go: () => M.remember(x.kind, x.name) }));
    const q = (s.q || '').trim().toLowerCase();
    let results = [];
    if (q) {
      if (scope === 'group') results = M.groups().filter((g) => g.name.toLowerCase().indexOf(q) >= 0).slice(0, 6).map((g) => ({ title: g.name, sub: 'Расписание группы', href: hrefOf('g', g.name), go: () => M.remember('g', g.name) }));
      else if (scope === 'teacher') results = M.teachers().filter((x) => x.name.toLowerCase().indexOf(q) >= 0).slice(0, 6).map((x) => ({ title: x.name, sub: M.teacherLoad(x.i).subjects[0] || 'Преподаватель', href: hrefOf('t', x.name), go: () => M.remember('t', x.name) }));
      else results = M.rooms().filter((r) => r.name.toLowerCase().indexOf(q) >= 0).slice(0, 6).map((r) => ({ title: /^\d/.test(r.name) ? 'Аудитория ' + r.name : r.name, sub: 'Занятость на неделю', href: hrefOf('r', r.name), go: () => M.remember('r', r.name) }));
    }
    const myGroup = me && me.role === 'student' && me.group ? me.group : (rec.filter((x) => x.kind === 'g')[0] || {}).name || '';
    const st = myGroup ? M.status('g', M.groupIndex(myGroup)) : { mode: 'none', lesson: null };
    const L = st.lesson;
    let hw;
    if (!myGroup) hw = { line: 'Таймер до конца пары', subject: 'Выберите группу — сайт её запомнит', timer: '→', note: '', live: false };
    else if (st.mode === 'now') hw = { line: myGroup + ' · сейчас ' + L.label.toLowerCase() + ' · ' + L.place, subject: L.subject, timer: M.fmtTimer(st.left), note: 'до конца', live: true };
    else if (st.mode === 'break' || st.mode === 'before') hw = { line: myGroup + ' · ' + L.label.toLowerCase() + ' в ' + L.start + ' · ' + L.place, subject: L.subject, timer: M.fmtTimer(st.left), note: 'до начала', live: true };
    else if (L) hw = { line: myGroup + ' · ' + M.whenLabel(L.date) + ' · ' + L.label.toLowerCase(), subject: L.subject, timer: L.start, note: 'начало', live: false };
    else hw = { line: myGroup, subject: 'Расписание ещё не опубликовано', timer: '—', note: '', live: false };
    hw.href = myGroup ? hrefOf('g', myGroup) : 'desktop.html';
    hw.dot = hw.live ? '#FF8A3D' : '#5B6270';
    hw.anim = hw.live ? 'kPulse 1.8s ease-out infinite' : 'none';
    const a11yOn = !!(window.KitisA11y && window.KitisA11y.on());
    return { a11yLabel: a11yOn ? 'Обычная версия' : 'Версия для слабовидящих', a11yPressed: a11yOn ? 'true' : 'false',
      toggleA11y: (e) => { if (e && e.preventDefault) e.preventDefault(); if (window.KitisA11y) window.KitisA11y.toggle(); this.setState({ a11y: Date.now() }); },
      accent: accent, accentSoft: accentSoft, scopes: scopes, ph: ph, roles: roles, services: services, news: news, main: mainList, hw: hw,
      q: s.q || '', onQ: (e) => this.setState({ q: e && e.target ? e.target.value : '' }), results: results, hasResults: results.length > 0, noResults: !!q && results.length === 0,
      recent: recent, hasRecent: recent.length > 0 };
  }
}
;return Component;
};
