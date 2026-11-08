/* Код страницы college.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  componentDidMount() {
    const read = () => {
      const M = window.KitisModel;
      const h = M ? M.readHash() : {};
      const i = h.i != null && /^\d{1,3}$/.test(h.i) ? parseInt(h.i, 10) : null;
      return { p: h.p || 'about', i: i, q: '', lb: null, albums: 8 };
    };
    this.setState(read());
    this.reveal();
    this._pop = () => { this.setState(read()); this.toTop(); };
    window.addEventListener('popstate', this._pop);
    this._a11y = () => this.setState({ a11y: Date.now() });
    window.addEventListener('kitis-a11y', this._a11y);
    // просмотр фото: Esc закрывает, стрелки листают
    this._key = (e) => {
      const lb = (this.state || {}).lb;
      if (!lb) return;
      if (e.key === 'Escape') { e.preventDefault(); this.closeLb(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.lbStep(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.lbStep(1); }
    };
    window.addEventListener('keydown', this._key);
  }
  componentWillUnmount() {
    window.removeEventListener('popstate', this._pop);
    window.removeEventListener('kitis-a11y', this._a11y);
    window.removeEventListener('keydown', this._key);
  }
  toTop() { try { window.scrollTo(0, 0); } catch (e) { /* без прокрутки */ } this.reveal(); }
  // на телефоне выбранная группа и раздел прокручиваются в зону видимости, открытая новость — к началу
  reveal() {
    setTimeout(() => {
      try {
        document.querySelectorAll('.cl-chiprow [aria-current="page"], .cl-chiprow [aria-current="true"]').forEach((c) => {
          if (c.scrollIntoView) c.scrollIntoView({ inline: 'center', block: 'nearest' });
        });
        const st = this.state || {};
        if (st.i != null) {
          const o = document.querySelector('main [aria-expanded="true"]');
          if (o) window.scrollTo({ top: Math.max(0, o.getBoundingClientRect().top + window.scrollY - 150) });
        }
      } catch (e) { /* без прокрутки */ }
    }, 40);
  }
  go(p, i) {
    const M = window.KitisModel;
    this.setState({ p: p, i: i == null ? null : i, q: '', lb: null, albums: 8 });
    if (M) M.writeHash({ p: p, i: i == null ? '' : String(i) });
    this.toTop();
  }
  openLb(list, k, caption) {
    this._lbFrom = document.activeElement;
    this.setState({ lb: { list: list, k: k, caption: caption || 'Фотография' } });
    setTimeout(() => { const b = document.querySelector('[data-lb-close]'); if (b) b.focus(); }, 30);
  }
  closeLb() {
    this.setState({ lb: null });
    const back = this._lbFrom;
    setTimeout(() => { try { if (back && back.focus) back.focus(); } catch (e) { /* фокус не вернуть */ } }, 30);
  }
  lbStep(d) {
    const lb = (this.state || {}).lb;
    if (!lb || !lb.list.length) return;
    const n = lb.list.length;
    this.setState({ lb: { list: lb.list, k: (lb.k + d + n) % n, caption: lb.caption } });
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
    const plural = (n, f) => { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : (a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2)]; };
    const stop = (e) => { if (e && e.stopPropagation) e.stopPropagation(); };
    const ICON = {
      home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
      help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5',
      megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14', calendar: 'M3 6h18v15H3zM16 3v4M8 3v4M3 10h18',
      target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01', star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
      tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z', compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM16 8l-2 6-6 2 2-6z',
      laptop: 'M4 5h16v11H4zM2 20h20', book: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
      trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM5 4h3v3a3 3 0 0 1-3-3zM19 4h-3v3a3 3 0 0 0 3-3zM12 13v4M8 21h8M9 17h6', file: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6',
      image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01'
    };
    const a11yOn = !!(window.KitisA11y && window.KitisA11y.on());
    const base = {
      accent: accent, accentSoft: accentSoft, q: s.q || '',
      a11yLabel: a11yOn ? 'Обычная версия' : 'Версия для слабовидящих', a11yPressed: a11yOn ? 'true' : 'false',
      toggleA11y: () => { if (window.KitisA11y) window.KitisA11y.toggle(); this.setState({ a11y: Date.now() }); },
      onQ: (e) => this.setState({ q: e.target.value.slice(0, 60) }),
      clearQ: () => this.setState({ q: '' }),
      lbOpen: false, lbSrc: '', lbAlt: '', lbW: 1, lbH: 1, lbCaption: '', lbCount: '', lbMulti: false,
      lbClose: (e) => { stop(e); this.closeLb(); }, lbPrev: (e) => { stop(e); this.lbStep(-1); }, lbNext: (e) => { stop(e); this.lbStep(1); },
      lbBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closeLb(); },
      lbTouchStart: (e) => { const t = e && e.changedTouches && e.changedTouches[0]; this._tx = t ? t.clientX : null; this._ty = t ? t.clientY : null; },
      lbTouchEnd: (e) => {
        const t = e && e.changedTouches && e.changedTouches[0];
        if (this._tx == null || !t) return;
        const dx = t.clientX - this._tx, dy = t.clientY - this._ty;
        this._tx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) this.lbStep(dx < 0 ? 1 : -1);
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) this.closeLb();
      }
    };
    if (!C) return Object.assign(base, { chips: [], groupChips: [], nav: [], isSearch: false, notSearch: true, title: 'Раздел не загрузился', lead: 'Не удалось загрузить материалы о колледже.', hasLead: true, blocks: [], mobileSearch: 'none', srcNote: '', hasSrc: false });

    // просмотр фото
    const lb = s.lb && s.lb.list && s.lb.list.length ? s.lb : null;
    if (lb) {
      const it = lb.list[Math.max(0, Math.min(lb.k, lb.list.length - 1))];
      Object.assign(base, { lbOpen: true, lbSrc: it[0], lbW: it[2] || 1, lbH: it[3] || 1, lbAlt: it[4] || lb.caption, lbCaption: lb.caption, lbCount: 'Фото ' + (lb.k + 1) + ' из ' + lb.list.length, lbMulti: lb.list.length > 1 });
    }
    const photoItems = (list, caption) => list.map((x, k) => ({
      s: x[1], w: x[2] || 4, h: x[3] || 3, alt: x[4] || caption || 'Фотография',
      label: 'Открыть фото ' + (k + 1) + ' из ' + list.length + (caption ? ': ' + caption : ''),
      open: () => this.openLb(list, k, caption)
    }));

    // разделы: «О колледже» + фотографии + официальные разделы, которые робот забирает с kitis.ru
    const O = window.KITIS_OFFICIAL && Array.isArray(window.KITIS_OFFICIAL.sections) ? window.KITIS_OFFICIAL : null;
    const P = window.KITIS_PHOTOS && Array.isArray(window.KITIS_PHOTOS.albums) ? window.KITIS_PHOTOS : null;
    const cleanPh = (list) => (Array.isArray(list) ? list : []).filter((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string');
    const albums = P ? P.albums.filter((a) => a && typeof a === 'object').map((a) => ({ kind: a.kind, d: typeof a.d === 'string' ? a.d : '', t: String(a.t || 'Фотографии'), lead: typeof a.lead === 'string' ? a.lead : '', p: cleanPh(a.p).slice(0, 40) })).filter((a) => a.p.length) : [];
    const byId = Object.create(null);
    const okId = (id) => typeof id === 'string' && /^[a-z0-9-]{1,60}$/i.test(id);
    C.sections.forEach((x) => { byId[x.id] = x; });
    const groups = C.groups.map((g) => ({ key: '', title: g.title, ids: g.ids.filter((id) => byId[id]) }));
    if (albums.length) {
      byId.photos = { id: 'photos', title: 'Фотографии', short: albums.length + ' ' + plural(albums.length, ['альбом', 'альбома', 'альбомов']), icon: 'image', gallery: true, blocks: [],
        lead: 'Снимки новостей, объявлений и мероприятий с сайта колледжа. Нажмите на фото, чтобы открыть его на весь экран.' };
      const media = groups.filter((g) => g.ids.indexOf('news') >= 0)[0] || groups[0];
      const at = media.ids.indexOf('events');
      media.ids.splice(at >= 0 ? at + 1 : media.ids.length, 0, 'photos');
    }
    if (O) {
      O.sections.forEach((x) => { if (x && okId(x.id) && !byId[x.id] && Array.isArray(x.blocks)) byId[x.id] = x; });
      (O.groups || []).forEach((g) => {
        const ids = (Array.isArray(g.ids) ? g.ids : []).filter((id) => okId(id) && byId[id] && id !== 'photos');
        if (ids.length) groups.push({ key: okId(g.key) ? g.key : '', title: String(g.title || 'Раздел'), ids: ids });
      });
    }
    const order = [];
    const groupOf = Object.create(null);
    groups.forEach((g) => g.ids.forEach((id) => { order.push(id); groupOf[id] = g; }));
    // #p=sveden, #p=official … — первый раздел группы
    let pid = s.p;
    const byKey = groups.filter((g) => g.key && g.key === pid)[0];
    if (byKey) pid = byKey.ids[0];
    const missing = pid && !byId[pid] && /^[a-z0-9-]{2,40}$/i.test(pid) && pid !== 'about';
    const cur = missing
      ? { id: pid, title: 'Раздел ещё загружается', short: '', icon: 'file', lead: 'Материалы этого раздела пока не пришли с сайта колледжа: робот забирает их каждую ночь.',
        blocks: [{ t: 'links', items: [['Сайт колледжа', 'https://kitis.ru/', 'kitis.ru']] }, { t: 'go', items: [['О колледже', 'about']] }] }
      : (byId[pid] || byId[order[0]]);
    const curGroup = groupOf[cur.id] || null;
    const q = (s.q || '').trim().toLowerCase();
    const isSearch = q.length >= 2;
    const stat = { $groups: M ? M.groups().length : 60, $teachers: M ? M.teachers().length : 77, $rooms: M ? M.rooms().length : 46 };
    const isHtml = (x) => /\.html/.test(x);

    const navItem = (x) => {
      const on = x.id === cur.id && !isSearch;
      return { title: x.title, sub: x.short || '', d: ICON[x.icon] || ICON.file, bg: on ? accentSoft : 'transparent', fg: on ? accent : '#15171C', weight: on ? 700 : 500, current: on ? 'page' : 'false', pick: () => this.go(x.id) };
    };
    const nav = groups.map((g) => {
      const open = g === curGroup || isSearch;
      return {
        title: g.title, count: String(g.ids.length), expanded: open ? 'true' : 'false', rot: open ? 'rotate(180deg)' : 'none', fg: open ? '#15171C' : '#5B6270',
        pick: () => this.go(g.ids[0]), items: open ? g.ids.map((id) => navItem(byId[id])) : []
      };
    });
    const groupChips = groups.map((g) => {
      const on = g === curGroup && !isSearch;
      return { title: g.title, current: on ? 'true' : 'false', bg: on ? '#15171C' : '#E6E9EE', fg: on ? '#FFFFFF' : '#3A404C', pick: () => this.go(g.ids[0]) };
    });
    const chips = (curGroup ? curGroup.ids : []).map((id) => {
      const x = byId[id];
      const on = id === cur.id && !isSearch;
      return { title: x.title, current: on ? 'page' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: () => this.go(id) };
    });

    // фото к новостям: альбом с той же датой и похожим заголовком
    const words = (t) => String(t || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim().split(' ').filter((w) => w.length >= 3);
    const albumWords = albums.map((al) => words(al.t));
    const findAlbum = (date, title) => {
      const a = words(title);
      if (!a.length) return null;
      const set = {};
      a.forEach((w) => { set[w] = 1; });
      let best = null, bs = 0;
      albums.forEach((al, k) => {
        const b = albumWords[k];
        if (!b.length) return;
        let inter = 0;
        b.forEach((w) => { if (set[w]) inter++; });
        const sc = inter / (a.length + b.length - inter) + (al.d && al.d === date ? 0.3 : 0);
        if (sc > bs) { bs = sc; best = al; }
      });
      return bs >= 0.55 ? best : null;
    };

    let src = cur.blocks;
    if (cur.gallery) {
      const KIND = { news: 'Новости', announce: 'Объявления', events: 'Мероприятия', gallery: 'Фотогалерея', abitur: 'Абитуриентам' };
      const shown = Math.min(albums.length, s.albums || 8);
      src = albums.slice(0, shown).map((al) => ({ t: 'album', al: al, kind: KIND[al.kind] || 'Фото' }));
      if (shown < albums.length) src = src.concat([{ t: 'more', n: albums.length - shown }]);
    }

    const blocks = src.map((b, bi) => {
      try { return toBlock.call(this, b, bi); } catch (e) { return { isP: false, isH: false, isNote: false, isFacts: false, isStats: false, isTimeline: false, isCards: false, isAcc: false, isTable: false, isDocs: false, isLinks: false, isList: false, isGo: false, isContact: false, isPhotos: false, isAlbum: false, isMore: false, text: '', items: [] }; }
    });
    function toBlock(b, bi) {
      const o = { isP: false, isH: false, isNote: false, isFacts: false, isStats: false, isTimeline: false, isCards: false, isAcc: false, isTable: false, isDocs: false, isLinks: false, isList: false, isGo: false, isContact: false, isPhotos: false, isAlbum: false, isMore: false, text: '', items: [] };
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
          const al = isNews ? findAlbum(x[0], x[2]) : null;
          return {
            title: isNews ? x[2] : x[0], meta: isNews ? fmtDate(x[0]) + ' · ' + x[1] + (al ? ' · ' + al.p.length + ' фото' : '') : '', hasMeta: isNews,
            paras: (isNews ? x[3] : [x[1]]).map((t) => ({ text: t })),
            hasThumb: !!al, thumb: al ? al.p[0][1] : '', hasPhotos: !!al && open, photos: al && open ? photoItems(al.p, x[2]) : [],
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
        const plain = !!b.plain;
        const head = Array.isArray(b.head) ? b.head : [];
        o.hasHead = head.some((h) => !!h);
        o.head = head.map((h, ci) => ({ h: h, align: plain || ci === 0 ? 'left' : 'right' }));
        o.rows = (b.rows || []).map((r, ri) => ({
          bg: bold.indexOf(ri) >= 0 ? '#F7F8FA' : '#FFFFFF',
          cells: r.map((c, ci) => {
            const link = Array.isArray(c) ? c : null;
            return { c: link ? link[0] : c, href: link ? link[1] : '', hasHref: !!link, noHref: !link, weight: bold.indexOf(ri) >= 0 ? 700 : 400, align: plain || ci === 0 ? 'left' : 'right', ws: plain || ci === 0 ? 'normal' : 'nowrap' };
          })
        }));
      }
      else if (b.t === 'docs') { o.isDocs = true; o.items = b.items.map((d) => ({ title: d[0], href: d[1], type: d[2] || 'Документ', ext: ((d[2] || 'PDF').split(' ')[0]).slice(0, 4) })); }
      else if (b.t === 'links') {
        o.isLinks = true;
        o.items = b.items.map((l) => {
          let host = '';
          try { host = new URL(l[1]).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
          host = host === 'xn--90aifddrld7a.xn--p1ai' ? 'мойбизнес.рф' : host;
          return { title: l[0], href: l[1], desc: l[2] && l[2] !== host ? l[2] : '', host: host };
        });
      }
      else if (b.t === 'list') { o.isList = true; o.items = b.items.map((t) => ({ text: t })); }
      else if (b.t === 'go') { o.isGo = true; o.items = b.items.map((g) => ({ label: g[0], href: isHtml(g[1]) ? g[1] : 'college.html#p=' + g[1], go: (e) => { if (isHtml(g[1])) return; if (e && e.preventDefault) e.preventDefault(); this.go(g[1]); } })); }
      else if (b.t === 'contact') { o.isContact = true; o.items = b.items.map((c) => ({ l: c[0], v: c[1], href: c[2], action: c[3] || 'Открыть', target: /^https?:/.test(c[2]) ? '_blank' : '_self' })); }
      else if (b.t === 'photos') { o.isPhotos = true; o.items = photoItems(cleanPh(b.items), cur.title); }
      else if (b.t === 'album') {
        o.isAlbum = true;
        o.title = b.al.t;
        o.meta = (b.al.d ? fmtDate(b.al.d) + ' · ' : '') + b.kind + ' · ' + b.al.p.length + ' фото';
        o.lead = b.al.lead || '';
        o.hasLead = !!o.lead;
        o.items = photoItems(b.al.p, b.al.t);
      }
      else if (b.t === 'more') { o.isMore = true; o.text = 'Показать ещё альбомы (' + b.n + ')'; o.more = () => this.setState({ albums: (s.albums || 8) + 8 }); }
      return o;
    }

    // поиск по всем разделам
    const results = [];
    if (isSearch) {
      const cellText = (c) => (Array.isArray(c) ? c[0] : c) || '';
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
        add(sec, sec.title, sec.title + ' — ' + (sec.lead || sec.short || ''));
        (sec.blocks || []).forEach((b) => {
          if (results.length - before >= 6) return;
          if (b.t === 'p' || b.t === 'note' || b.t === 'h') add(sec, sec.title, b.text);
          if (b.t === 'facts' || b.t === 'contact') b.items.forEach((f) => add(sec, f[0], f[0] + ': ' + f[1]));
          if (b.t === 'timeline') b.items.forEach((x) => add(sec, x[0] + ' — ' + x[1], x[2]));
          if (b.t === 'cards') b.items.forEach((x) => add(sec, x[1], x[1] + '. ' + x[2]));
          if (b.t === 'news') b.items.forEach((x, k) => add(sec, x[2], x[2] + '. ' + x[3].join(' '), k));
          if (b.t === 'faq') b.items.forEach((x, k) => add(sec, x[0], x[0] + ' ' + x[1], k));
          if (b.t === 'table') (b.rows || []).forEach((r) => add(sec, sec.title, r.map(cellText).filter(Boolean).join(' · ')));
          if (b.t === 'docs' || b.t === 'links') b.items.forEach((d) => add(sec, d[0], d[0] + (d[2] ? ' — ' + d[2] : '')));
          if (b.t === 'list') b.items.forEach((t) => add(sec, sec.title, t));
        });
      });
    }

    const at = order.indexOf(cur.id);
    const prev = at > 0 ? byId[order[at - 1]] : null;
    const next = at >= 0 && at < order.length - 1 ? byId[order[at + 1]] : null;
    let srcNote = 'Материалы взяты с сайта колледжа kitis.ru' + (C.updated ? ' (' + fmtDate(C.updated) + ')' : '') + ' и пересказаны. Документы открываются файлами с сайта колледжа.';
    if (cur.url) srcNote = 'Раздел перенесён с сайта колледжа автоматически' + (O && O.updated ? ', обновлено ' + fmtDate(O.updated) : '') + '. Документы открываются файлами с сайта колледжа.';
    if (cur.gallery) srcNote = 'Фотографии перенесены с сайта колледжа kitis.ru' + (P && P.updated ? ', обновлено ' + fmtDate(P.updated) : '') + '.';
    return Object.assign(base, {
      chips: chips, groupChips: groupChips, nav: nav, mobileSearch: 'block',
      isSearch: isSearch, notSearch: !isSearch, results: results, noResults: isSearch && !results.length,
      searchTitle: results.length ? 'Найдено: ' + results.length : 'Поиск',
      groupTitle: curGroup ? curGroup.title : 'О колледже', title: cur.title, lead: cur.lead || '', hasLead: !!cur.lead, blocks: blocks,
      hasPrev: !!prev, prevTitle: prev ? prev.title : '', goPrev: () => prev && this.go(prev.id),
      hasNext: !!next, nextTitle: next ? next.title : '', goNext: () => next && this.go(next.id),
      srcNote: srcNote, hasSrc: !!cur.url && /^https:\/\/kitis\.ru\//.test(cur.url), srcUrl: cur.url || ''
    });
  }
}
;return Component;
};
