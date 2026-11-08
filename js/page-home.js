/* Код страницы home.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    this._timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    // Esc закрывает меню и возвращает фокус на кнопку «Меню»
    this._key = (e) => { if (e.key === 'Escape' && (this.state || {}).menu) this.closeMenu(); };
    window.addEventListener('keydown', this._key);
    this._pop = () => { if ((this.state || {}).menu) this.setState({ menu: false }); };
    window.addEventListener('pageshow', this._pop);
  }
  componentWillUnmount() {
    clearInterval(this._timer);
    window.removeEventListener('keydown', this._key);
    window.removeEventListener('pageshow', this._pop);
  }
  openMenu() {
    this._from = document.activeElement;
    this.setState({ menu: true });
    setTimeout(() => { const b = document.querySelector('[data-menu-close]'); if (b) b.focus(); }, 30);
  }
  closeMenu() {
    this.setState({ menu: false });
    const back = this._from;
    setTimeout(() => { try { if (back && back.focus) back.focus(); } catch (e) { /* фокус не вернуть */ } }, 30);
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
      cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
      user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
      door: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01',
      bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0',
      chart: 'M3 3v18h18M8 16v-5M13 16V8M18 16V9',
      home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
      news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5',
      image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
      phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
      shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
      info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01'
    };
    const roles = [
      { title: 'Абитуриентам', text: 'Специальности, правила приёма, подача заявления и общежитие', d: I.userPlus, href: 'abitur.html', cta: 'Поступление в КИТиС', primary: true,
        links: [['Специальности и профессии', 'abitur.html#catalog'], ['Как поступить', 'abitur.html'], ['Общежитие', 'college.html#p=ab-hostel'], ['Образовательный кредит и целевое обучение', 'college.html#p=ab-credit']] },
      { title: 'Студентам', text: 'Расписание группы, замены, справки и дистанционное обучение', d: I.users, href: 'student.html', cta: 'Кабинет студента', primary: false,
        links: [['Расписание группы', 'desktop.html'], ['Заказ справки в учебной части', 'student.html#spravka'], ['Дистанционное обучение', 'college.html#p=distance'], ['ГИА и графики аттестаций', 'college.html#p=st-gia']] },
      { title: 'Преподавателям', text: 'Своё расписание, группы, методические материалы и аттестация', d: I.board, href: 'teacher.html', cta: 'Кабинет преподавателя', primary: false,
        links: [['Моё расписание', 'teacher.html'], ['Учебно-методическая работа', 'college.html#p=tc-method'], ['Аттестация', 'college.html#p=tc-attestation'], ['Объявления для преподавателей', 'college.html#p=tc-announce']] }
    ].map((r) => ({
      title: r.title, text: r.text, d: r.d, href: r.href, cta: r.cta,
      links: r.links.map((k) => ({ l: k[0], h: k[1] })),
      iconBg: r.primary ? accent : accentSoft, iconFg: r.primary ? '#FFFFFF' : accent,
      ctaBg: r.primary ? accent : '#F1F3F6', ctaFg: r.primary ? '#FFFFFF' : '#15171C'
    }));
    const services = [
      ['Расписание занятий', I.calendar, 'desktop.html'],
      ['Расписание звонков', I.clock, 'desktop.html#tab=bells'],
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
    // фото к новостям — из альбомов, которые робот переносит с kitis.ru (та же дата и похожий заголовок)
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
    const isoOf = (d) => /^\d{2}\.\d{2}\.\d{4}$/.test(d) ? d.slice(6, 10) + '-' + d.slice(3, 5) + '-' + d.slice(0, 2) : '';
    const news = newsItems.map((x, i) => {
      const al = findAlbum(isoOf(x[0]), x[1]);
      return { date: x[0], title: x[1], tag: x[2], tagFg: tagColors[x[2]] || accent, href: 'college.html#p=news&i=' + i,
        hasPhoto: !!al, noPhoto: !al, photo: al ? al.p[0][1] : '', photoAlt: al ? (al.p[0][4] || x[1]) : '' };
    });
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
    // разделы расписания в шапке (на компьютере) и всё меню сайта (кнопка «Меню», на телефоне — главное)
    const topNav = [['Расписание', 'desktop.html'], ['Группы', 'desktop.html#tab=groups'], ['Преподаватели', 'desktop.html#tab=teachers'],
      ['Аудитории', 'desktop.html#tab=rooms'], ['Звонки', 'desktop.html#tab=bells'], ['Абитуриентам', 'abitur.html'], ['О колледже', 'college.html#p=about']].map((x) => ({ l: x[0], h: x[1] }));
    const close = () => this.setState({ menu: false });
    const menu = [
      { title: 'Расписание', items: [['Расписание занятий', I.calendar, 'desktop.html'], ['Группы', I.users, 'desktop.html#tab=groups'], ['Преподаватели', I.user, 'desktop.html#tab=teachers'],
        ['Аудитории', I.door, 'desktop.html#tab=rooms'], ['Звонки', I.bell, 'desktop.html#tab=bells'], ['Итоги', I.chart, 'desktop.html#tab=results']] },
      { title: 'Разделы сайта', items: [['Абитуриентам', I.userPlus, 'abitur.html'], ['Специальности и профессии', I.cap, 'abitur.html#catalog'], ['Студентам', I.users, 'student.html'],
        ['Преподавателям', I.board, 'teacher.html'], me ? ['Мой профиль', I.user, 'profile.html'] : ['Вход и регистрация', I.user, 'login.html']] },
      { title: 'О колледже', items: [['О колледже', I.home, 'college.html#p=about'], ['Новости', I.news, 'college.html#p=news'], ['Фотографии', I.image, 'college.html#p=photos'],
        ['Объявления и мероприятия', I.calendar, 'college.html#p=announce'], ['Центр карьеры', I.case, 'college.html#p=career'], ['Контакты', I.phone, 'college.html#p=contacts']] },
      { title: 'Официально', items: [['Сведения об образовательной организации', I.info, 'college.html#p=sveden'], ['Обращения', I.doc, 'college.html#p=forms'],
        ['Противодействие коррупции', I.shield, 'college.html#p=anti-corruption'], ['Безопасность', I.shield, 'college.html#p=security'], ['Закупки', I.case, 'college.html#p=tenders']] }
    ].map((sec) => ({ title: sec.title, items: sec.items.map((x) => ({ l: x[0], d: x[1], h: x[2], go: close })) }));
    const acct = me
      ? { href: 'profile.html', label: me.shortName || 'Профиль', aria: 'Мой профиль: ' + (me.shortName || ''), hasPhoto: !!me.photo, photo: me.photo || '', hasIni: !me.photo, ini: me.initials || '', isGuest: false }
      : { href: 'login.html', label: 'Войти', aria: 'Войти или зарегистрироваться', hasPhoto: false, photo: '', hasIni: false, ini: '', isGuest: true };
    const menuOpen = !!s.menu;
    return {
      topNav: topNav, menu: menu, menuOpen: menuOpen, menuExpanded: menuOpen ? 'true' : 'false', acct: acct,
      openMenu: () => this.openMenu(), closeMenu: () => this.closeMenu(), a11yLabel: a11yOn ? 'Обычная версия' : 'Версия для слабовидящих', a11yPressed: a11yOn ? 'true' : 'false',
      toggleA11y: (e) => { if (e && e.preventDefault) e.preventDefault(); if (window.KitisA11y) window.KitisA11y.toggle(); this.setState({ a11y: Date.now() }); },
      accent: accent, accentSoft: accentSoft, scopes: scopes, ph: ph, roles: roles, services: services, news: news, hasGallery: PH.length > 0, main: mainList, hw: hw,
      q: s.q || '', onQ: (e) => this.setState({ q: e && e.target ? e.target.value : '' }), results: results, hasResults: results.length > 0, noResults: !!q && results.length === 0,
      recent: recent, hasRecent: recent.length > 0 };
  }
}
;return Component;
};
