/* Код страницы college.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    const read = () => {
      const M = window.KitisModel;
      const h = M ? M.readHash() : {};
      const i = h.i != null && /^\d{1,3}$/.test(h.i) ? parseInt(h.i, 10) : null;
      return { p: h.p || 'about', i: i, q: '' };
    };
    this.setState(read());
    this.reveal();
    this._pop = () => { this.setState(read()); this.toTop(); };
    window.addEventListener('popstate', this._pop);
    this._a11y = () => this.setState({ a11y: Date.now() });
    window.addEventListener('kitis-a11y', this._a11y);
  }
  componentWillUnmount() {
    window.removeEventListener('popstate', this._pop);
    window.removeEventListener('kitis-a11y', this._a11y);
  }
  toTop() { try { window.scrollTo(0, 0); } catch (e) { /* без прокрутки */ } this.reveal(); }
  // на телефоне выбранный раздел в ленте чипов прокручивается в зону видимости, открытая новость — к началу
  reveal() {
    setTimeout(() => {
      try {
        const c = document.querySelector('.cl-chips [aria-current="page"]');
        if (c && c.scrollIntoView) c.scrollIntoView({ inline: 'center', block: 'nearest' });
        const st = this.state || {};
        if (st.i != null) {
          const o = document.querySelector('main [aria-expanded="true"]');
          if (o) window.scrollTo({ top: Math.max(0, o.getBoundingClientRect().top + window.scrollY - 140) });
        }
      } catch (e) { /* без прокрутки */ }
    }, 40);
  }
  go(p, i) {
    const M = window.KitisModel;
    this.setState({ p: p, i: i == null ? null : i, q: '' });
    if (M) M.writeHash({ p: p, i: i == null ? '' : String(i) });
    this.toTop();
  }
  renderVals() {
    const C = window.KITIS_COLLEGE;
    const M = window.KitisModel;
    const s = this.state || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const fmtDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) ? parseInt(d.slice(8, 10), 10) + ' ' + MONTHS[parseInt(d.slice(5, 7), 10) - 1] + ' ' + d.slice(0, 4) : d;
    const delay = (i) => (Math.min(i, 8) * 0.04).toFixed(2) + 's';
    const ICON = {
      home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
      help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5',
      megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14', calendar: 'M3 6h18v15H3zM16 3v4M8 3v4M3 10h18',
      target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01', star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
      tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z', compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM16 8l-2 6-6 2 2-6z',
      laptop: 'M4 5h16v11H4zM2 20h20', book: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
      trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM5 4h3v3a3 3 0 0 1-3-3zM19 4h-3v3a3 3 0 0 0 3-3zM12 13v4M8 21h8M9 17h6', file: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6'
    };
    const a11yOn = !!(window.KitisA11y && window.KitisA11y.on());
    const base = {
      accent: accent, accentSoft: accentSoft, q: s.q || '',
      a11yLabel: a11yOn ? 'Обычная версия' : 'Версия для слабовидящих', a11yPressed: a11yOn ? 'true' : 'false',
      toggleA11y: () => { if (window.KitisA11y) window.KitisA11y.toggle(); this.setState({ a11y: Date.now() }); },
      onQ: (e) => this.setState({ q: e.target.value.slice(0, 60) }),
      clearQ: () => this.setState({ q: '' })
    };
    if (!C) return Object.assign(base, { chips: [], nav: [], isSearch: false, notSearch: true, title: 'Раздел не загрузился', lead: 'Не удалось загрузить материалы о колледже.', blocks: [], mobileSearch: 'none' });

    const byId = {};
    C.sections.forEach((x) => { byId[x.id] = x; });
    const order = [];
    const groupOf = {};
    C.groups.forEach((g) => g.ids.forEach((id) => { if (byId[id]) { order.push(id); groupOf[id] = g.title; } }));
    const cur = byId[s.p] || byId[order[0]];
    const q = (s.q || '').trim().toLowerCase();
    const isSearch = q.length >= 2;
    const stat = { $groups: M ? M.groups().length : 60, $teachers: M ? M.teachers().length : 77, $rooms: M ? M.rooms().length : 46 };
    const isHtml = (x) => /\.html/.test(x);

    const navItem = (x) => {
      const on = x.id === cur.id && !isSearch;
      return { title: x.title, sub: x.short, d: ICON[x.icon] || ICON.file, bg: on ? accentSoft : 'transparent', fg: on ? accent : '#15171C', weight: on ? 700 : 500, current: on ? 'page' : 'false', pick: () => this.go(x.id) };
    };
    const nav = C.groups.map((g) => ({ title: g.title, items: g.ids.filter((id) => byId[id]).map((id) => navItem(byId[id])) }));
    const chips = order.map((id) => {
      const x = byId[id];
      const on = id === cur.id && !isSearch;
      return { title: x.title, current: on ? 'page' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: () => this.go(id) };
    });

    const blocks = cur.blocks.map((b, bi) => {
      const o = { isP: false, isH: false, isNote: false, isFacts: false, isStats: false, isTimeline: false, isCards: false, isAcc: false, isTable: false, isDocs: false, isLinks: false, isList: false, isGo: false, isContact: false, text: '', items: [] };
      if (b.t === 'p') { o.isP = true; o.text = b.text; }
      else if (b.t === 'h') { o.isH = true; o.text = b.text; }
      else if (b.t === 'note') { o.isNote = true; o.text = b.text; }
      else if (b.t === 'facts') { o.isFacts = true; o.items = b.items.map((f) => ({ l: f[0], v: f[1], href: f[2] || '', hasHref: !!f[2], noHref: !f[2] })); }
      else if (b.t === 'stats') { o.isStats = true; o.items = b.items.map((x) => ({ v: String(stat[x[0]] != null ? stat[x[0]] : x[0]), l: x[1] })); }
      else if (b.t === 'timeline') { o.isTimeline = true; o.items = b.items.map((x, k) => ({ year: x[0], title: x[1], text: x[2], line: k === b.items.length - 1 ? 'transparent' : '#DCE0E6', delay: delay(k) })); }
      else if (b.t === 'cards') { o.isCards = true; o.items = b.items.map((x) => ({ tag: x[0], title: x[1], text: x[2] })); }
      else if (b.t === 'news' || b.t === 'faq') {
        o.isAcc = true;
        o.items = b.items.map((x, k) => {
          const open = s.i === k;
          const isNews = b.t === 'news';
          return {
            title: isNews ? x[2] : x[0], meta: isNews ? fmtDate(x[0]) + ' · ' + x[1] : '', hasMeta: isNews,
            paras: (isNews ? x[3] : [x[1]]).map((t) => ({ text: t })),
            open: open, expanded: open ? 'true' : 'false', rot: open ? 'rotate(180deg)' : 'none', border: open ? accent : '#E3E6EB',
            toggle: () => {
              const next = (this.state || {}).i === k ? null : k;
              this.setState({ i: next });
              if (M) M.writeHash({ p: cur.id, i: next == null ? '' : String(next) }, true);
            }
          };
        });
      }
      else if (b.t === 'table') {
        o.isTable = true;
        const bold = b.bold || [];
        o.head = b.head.map((h, ci) => ({ h: h, align: ci === 0 ? 'left' : 'right' }));
        o.rows = b.rows.map((r, ri) => ({ bg: bold.indexOf(ri) >= 0 ? '#F7F8FA' : '#FFFFFF', cells: r.map((c, ci) => ({ c: c, weight: bold.indexOf(ri) >= 0 ? 700 : 400, align: ci === 0 ? 'left' : 'right', ws: ci === 0 ? 'normal' : 'nowrap' })) }));
      }
      else if (b.t === 'docs') { o.isDocs = true; o.items = b.items.map((d) => ({ title: d[0], href: d[1], type: d[2] || 'Документ', ext: ((d[2] || 'PDF').split(' ')[0]).slice(0, 4) })); }
      else if (b.t === 'links') { o.isLinks = true; o.items = b.items.map((l) => { let host = ''; try { host = new URL(l[1]).hostname.replace(/^www\./, ''); } catch (e) { host = ''; } return { title: l[0], href: l[1], desc: l[2] || '', host: host === 'xn--90aifddrld7a.xn--p1ai' ? 'мойбизнес.рф' : host }; }); }
      else if (b.t === 'list') { o.isList = true; o.items = b.items.map((t) => ({ text: t })); }
      else if (b.t === 'go') { o.isGo = true; o.items = b.items.map((g) => ({ label: g[0], href: isHtml(g[1]) ? g[1] : 'college.html#p=' + g[1], go: (e) => { if (isHtml(g[1])) return; if (e && e.preventDefault) e.preventDefault(); this.go(g[1]); } })); }
      else if (b.t === 'contact') { o.isContact = true; o.items = b.items.map((c) => ({ l: c[0], v: c[1], href: c[2], action: c[3] || 'Открыть', target: /^https?:/.test(c[2]) ? '_blank' : '_self' })); }
      return o;
    });

    // поиск по всем разделам
    const results = [];
    if (isSearch) {
      const add = (sec, title, text, i) => {
        if (results.length >= 40) return;
        const low = String(text).toLowerCase();
        const at = low.indexOf(q);
        if (at < 0) return;
        const from = Math.max(0, at - 60);
        const str = String(text);
        results.push({ section: sec.title, title: title, pre: (from ? '…' : '') + str.slice(from, at), hit: str.slice(at, at + q.length), post: str.slice(at + q.length, at + q.length + 90) + (at + q.length + 90 < str.length ? '…' : ''), pick: () => this.go(sec.id, i) });
      };
      order.forEach((id) => {
        const sec = byId[id];
        const before = results.length;
        add(sec, sec.title, sec.title + ' — ' + sec.lead);
        sec.blocks.forEach((b) => {
          if (results.length - before >= 6) return;
          if (b.t === 'p' || b.t === 'note') add(sec, sec.title, b.text);
          if (b.t === 'facts' || b.t === 'contact') b.items.forEach((f) => add(sec, f[0], f[0] + ': ' + f[1]));
          if (b.t === 'timeline') b.items.forEach((x) => add(sec, x[0] + ' — ' + x[1], x[2]));
          if (b.t === 'cards') b.items.forEach((x) => add(sec, x[1], x[1] + '. ' + x[2]));
          if (b.t === 'news') b.items.forEach((x, k) => add(sec, x[2], x[2] + '. ' + x[3].join(' '), k));
          if (b.t === 'faq') b.items.forEach((x, k) => add(sec, x[0], x[0] + ' ' + x[1], k));
          if (b.t === 'table') b.rows.forEach((r) => add(sec, sec.title, r.filter(Boolean).join(' · ')));
          if (b.t === 'docs' || b.t === 'links') b.items.forEach((d) => add(sec, d[0], d[0] + (d[2] ? ' — ' + d[2] : '')));
          if (b.t === 'list') b.items.forEach((t) => add(sec, sec.title, t));
        });
      });
    }

    const at = order.indexOf(cur.id);
    const prev = at > 0 ? byId[order[at - 1]] : null;
    const next = at < order.length - 1 ? byId[order[at + 1]] : null;
    const upd = C.updated ? ' (' + fmtDate(C.updated) + ')' : '';
    return Object.assign(base, {
      chips: chips, nav: nav, mobileSearch: 'block',
      isSearch: isSearch, notSearch: !isSearch, results: results, noResults: isSearch && !results.length,
      searchTitle: results.length ? 'Найдено: ' + results.length : 'Поиск',
      groupTitle: groupOf[cur.id] || 'О колледже', title: cur.title, lead: cur.lead, blocks: blocks,
      hasPrev: !!prev, prevTitle: prev ? prev.title : '', goPrev: () => prev && this.go(prev.id),
      hasNext: !!next, nextTitle: next ? next.title : '', goNext: () => next && this.go(next.id),
      updLabel: upd
    });
  }
}
;return Component;
};
