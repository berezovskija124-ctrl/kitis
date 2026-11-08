// Проверка сайта на взлом: XSS через адрес, подмена хранилища и данных, кликджекинг, перебор пароля, загрузка файлов.
// Запуск: из папки сайта поднять сервер  python3 -m http.server 8765 --bind 127.0.0.1
// и в другом окне  npm i playwright && npx playwright install chromium && node tests/attack.js
const { chromium, devices } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const B = process.env.B || 'http://127.0.0.1:8765/';
const OUT = [];
const log = (ok, name, info) => { OUT.push({ ok, name, info }); console.log((ok ? 'ЗАЩИЩЕНО ' : 'УЯЗВИМО  ') + name + (info ? ' — ' + info : '')); };

const XSS = 'x"><img src=x onerror="window.__pwn=1;alert(1)"><svg onload="window.__pwn=1">';
const JSU = 'javascript:window.__pwn=1//';

async function probe(p) {
  return p.evaluate(() => ({
    pwn: !!window.__pwn,
    imgx: document.querySelectorAll('img[src="x"],svg[onload],[onerror]').length,
    jsLinks: [...document.querySelectorAll('[href],[src],[action],[formaction]')].filter(e => /^\s*(javascript|vbscript|data:text)/i.test(e.getAttribute('href') || e.getAttribute('src') || e.getAttribute('action') || e.getAttribute('formaction') || '')).length,
    proto: ({}).polluted === 1,
    text: document.body ? document.body.innerText.length : 0,
  }));
}

async function visit(ctx, url, opts = {}) {
  const p = await ctx.newPage();
  const errs = []; let dialogs = 0;
  p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  p.on('dialog', d => { dialogs++; d.dismiss().catch(() => {}); });
  if (opts.route) await p.route(opts.route.pattern, opts.route.handler);
  try { await p.goto(url, { waitUntil: 'load', timeout: 15000 }); } catch (e) { errs.push('goto ' + e.message.slice(0, 80)); }
  await p.waitForTimeout(opts.wait || 700);
  if (opts.act) { try { await opts.act(p); } catch (e) { errs.push('act ' + e.message.slice(0, 100)); } await p.waitForTimeout(400); }
  const r = await probe(p).catch(() => ({ pwn: false, imgx: 0, jsLinks: 0, text: 0 }));
  await p.close();
  return Object.assign(r, { errs, dialogs });
}
const bad = r => r.pwn || r.dialogs || r.imgx || r.jsLinks || r.proto;
const brief = r => `pwn=${r.pwn} alert=${r.dialogs} inj=${r.imgx} js-ссылок=${r.jsLinks}` + (r.errs.length ? ' ошибки: ' + r.errs.slice(0, 2).join(' | ') : '') + (r.text < 50 ? ' (страница пустая!)' : '');

(async () => {
  const b = await chromium.launch();
  const desk = { viewport: { width: 1440, height: 900 } };
  const phone = devices['iPhone 13'];

  // 1. XSS через адрес
  const hashes = {
    'группа с HTML': '#group=' + encodeURIComponent(XSS),
    'преподаватель с HTML': '#tab=teachers&teacher=' + encodeURIComponent(XSS),
    'аудитория javascript:': '#tab=rooms&room=' + encodeURIComponent(JSU),
    'битая кодировка': '#group=%E0%A4%A&tab=%',
    '__proto__ в адресе': '#__proto__=1&constructor=1&tab=__proto__&group=toString',
    'огромный адрес 200 КБ': '#group=' + 'Я'.repeat(200000),
  };
  for (const [page, opts] of [['desktop', desk], ['phone', phone]]) {
    const ctx = await b.newContext(opts);
    for (const [k, h] of Object.entries(hashes)) {
      const r = await visit(ctx, B + page + '.html?desktop=1' + h);
      log(!bad(r) && !r.errs.length && r.text > 50, `${page}: адрес — ${k}`, brief(r));
    }
    await ctx.close();
  }

  {
    const ctx = await b.newContext(desk);
    for (const h of ['#p=' + encodeURIComponent(XSS), '#p=__proto__&i=99999', '#p=news&i=-1', '#p=news&i=' + encodeURIComponent(JSU), '#q=' + encodeURIComponent(XSS)]) {
      const r = await visit(ctx, B + 'college.html' + h);
      log(!bad(r) && !r.errs.length && r.text > 50, 'college: адрес ' + h.slice(0, 30), brief(r));
    }
    const p = await ctx.newPage(); let dl = 0; p.on('dialog', d => { dl++; d.dismiss(); });
    await p.goto(B + 'college.html'); await p.waitForTimeout(500);
    await p.fill('aside input[type=search]', XSS); await p.waitForTimeout(400);
    const pr = await probe(p);
    log(!bad(pr) && !dl, 'college: HTML в поиске', `pwn=${pr.pwn} inj=${pr.imgx}`);
    await ctx.close();
  }

  // 2. ?now= мусор
  {
    const ctx = await b.newContext(desk);
    for (const q of ['?now=0000-00-00T99:99', '?now=%', '?now=' + encodeURIComponent('<script>alert(1)</script>'), '?now=275760-09-13T10:00', '?now=2026-02-30T25:61']) {
      const r = await visit(ctx, B + 'desktop.html' + q + '#group=ИСр24-1');
      log(!bad(r) && !r.errs.length && r.text > 50, `desktop: время ${q.slice(0, 40)}`, brief(r));
    }
    await ctx.close();
  }

  // 3. Подмена localStorage
  const evilDb = {
    users: [
      { id: 'u1', role: 'student', last: XSS, first: '<b>Иван</b>', middle: '', group: XSS, teacher: '', email: 'a@b.ru', hash: 'x', photo: JSU, created: 'x' },
      { id: 'u2', role: 'teacher', last: 'Петров', first: 'Пётр', teacher: { toString: 1 }, email: 5, hash: 'y', photo: 'data:text/html,<script>window.__pwn=1</script>' },
      null, 7, 'строка',
    ],
    current: 'u1',
  };
  const evilRecent = [null, 5, 'x', { kind: 'group', name: XSS }, { kind: 'teacher', name: JSU }, { kind: '__proto__', name: {} }];
  for (const [label, db] of [['злой аккаунт студента', evilDb], ['злой аккаунт преподавателя', Object.assign({}, evilDb, { current: 'u2' })], ['мусор вместо базы', '{"users":5,"current":{}}'], ['не JSON', '{{{']]) {
    for (const [mode, opts] of [['desk', desk], ['phone', phone]]) {
      const ctx = await b.newContext(opts);
      await ctx.addInitScript(([db, rec]) => {
        try {
          const v = typeof db === 'string' ? db : JSON.stringify(db);
          localStorage.setItem('kitis.accounts.v1', v); localStorage.setItem('kitis.accounts.v2', v);
          localStorage.setItem('kitis.session.v2', JSON.stringify({ id: (db && db.current) || 'u1', exp: 0 }));
          localStorage.setItem('kitis.recent.v1', JSON.stringify(rec));
        } catch (e) {}
      }, [db, evilRecent]);
      const res = [];
      for (const pg of ['desktop', 'phone', 'home', 'student', 'teacher', 'profile', 'login', 'register', 'college', 'abitur']) {
        const r = await visit(ctx, B + pg + '.html?desktop=1&frame=1');
        if (bad(r) || r.errs.length || r.text < 50) res.push(pg + ': ' + brief(r));
      }
      log(!res.length, `${mode}: хранилище — ${label}`, res.join(' ; '));
      await ctx.close();
    }
  }

  // 4. Подмена данных сервера (если сервер колледжа отдаст HTML в названиях)
  {
    const src = fs.readFileSync(path.join(__dirname, '../data/kitis-data.js'), 'utf8');
    const D = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
    D.groups[0] = XSS; D.teachers[0] = XSS; D.rooms[0] = JSU; D.subjects[0] = XSS;
    if (D.subjects[1] != null) D.subjects[1] = JSU;
    const body = 'window.KITIS_DATA = ' + JSON.stringify(D) + ';';
    for (const [mode, opts] of [['desk', desk], ['phone', phone]]) {
      const ctx = await b.newContext(opts);
      const res = [];
      for (const pg of ['desktop', 'phone', 'home', 'register', 'about', 'college']) {
        for (const h of ['', '#group=' + encodeURIComponent(XSS), '#tab=teachers', '#tab=rooms', '#tab=groups']) {
          const r = await visit(ctx, B + pg + '.html?desktop=1&frame=1&now=2026-11-12T10:30' + h, { route: { pattern: '**/data/kitis-data.js', handler: rt => rt.fulfill({ body, contentType: 'application/javascript' }) } });
          if (bad(r) || r.errs.length) res.push(pg + h.slice(0, 12) + ': ' + brief(r));
          if (pg !== 'desktop' && pg !== 'phone') break;
        }
      }
      log(!res.length, `${mode}: отравленные данные расписания`, res.join(' ; '));
      await ctx.close();
    }
  }

  // 5. Кликджекинг: чужой сайт встраивает наш в iframe
  {
    const ctx = await b.newContext(desk);
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/nonexistent-404');
    await p.setContent(`<h1>Чужой сайт</h1><iframe id=f src="${B}login.html" style="width:900px;height:600px;opacity:.5"></iframe>`);
    await p.waitForTimeout(1500);
    const f = p.frames().find(fr => fr.url().includes('login.html'));
    const visible = f ? await f.evaluate(() => { const el = document.querySelector('input'); return !!(el && el.getClientRects().length && getComputedStyle(document.documentElement).display !== 'none'); }).catch(() => false) : false;
    log(!visible, 'кликджекинг: вход внутри чужого iframe', visible ? 'форма входа видна и кликабельна во фрейме чужого сайта' : '');
    await ctx.close();
  }

  // 6–7. Пароли: перебор, перечисление аккаунтов, хранение
  {
    const ctx = await b.newContext(desk);
    const p = await ctx.newPage();
    await p.goto(B + 'register.html');
    await p.waitForTimeout(500);
    const reg = await p.evaluate(async () => {
      const L = { groups: window.KitisModel.groups().map(g => g.name), teachers: window.KitisModel.teachers().map(t => t.name) };
      return window.KitisAccount.register({ role: 'student', last: 'Тестов', first: 'Тест', middle: '', group: L.groups[0], email: 'victim@test.ru', password: 'qwerty123', password2: 'qwerty123', consent: true }, L);
    });
    const stored = await p.evaluate(() => localStorage.getItem('kitis.accounts.v2') || localStorage.getItem('kitis.accounts.v1'));
    const db = JSON.parse(stored);
    const u = db.users.find(x => x.email === 'victim@test.ru');
    const plainSha = crypto.createHash('sha256').update('kitis|victim@test.ru|qwerty123').digest('hex');
    const weak = u && (u.hash === plainSha || !(u.pw && u.pw.salt && u.pw.it >= 100000));
    if (u && u.pw) u.alg = u.pw.alg + ', ' + u.pw.it + ' итераций';
    log(reg.ok && !weak, 'хранение пароля', weak ? 'хеш без соли (SHA-256 одной итерацией) — подбирается по словарю за секунды' : (u ? 'соль + ' + (u.alg || '?') : 'регистрация не удалась ' + JSON.stringify(reg)));
    await p.evaluate(() => window.KitisAccount.logout());
    const t0 = Date.now();
    const tries = await p.evaluate(async () => {
      const out = [];
      for (let i = 0; i < 40; i++) { const r = await window.KitisAccount.login('victim@test.ru', 'wrong' + i); out.push(r.error || 'ok'); }
      const right = await window.KitisAccount.login('victim@test.ru', 'qwerty123');
      return { out, right: right.ok, rightErr: right.error };
    });
    const locked = tries.out.filter(x => /попыт|подожд|заблок/i.test(x)).length;
    log(locked > 0, 'перебор пароля (40 попыток подряд)', locked ? `после ${40 - locked} попыток вход блокируется` : `все 40 попыток проверены без задержки за ${Date.now() - t0} мс`);
    const e1 = await p.evaluate(() => window.KitisAccount.login('nobody@test.ru', 'x').then(r => r.error));
    const e2 = await p.evaluate(() => window.KitisAccount.login('victim@test.ru', 'x').then(r => r.error));
    log(e1 === e2 || /попыт/.test(e2), 'перечисление аккаунтов', e1 === e2 ? '' : `«${e1}» и «${e2}» — по ответу видно, есть ли такой e-mail`);
    // обход фильтра ФИО через прямой вызов
    const byp = await p.evaluate(async () => {
      await window.KitisAccount.login('victim@test.ru', 'qwerty123');
      const r = window.KitisAccount.update({ last: '<img src=x onerror=alert(1)>', first: 'Хуй' });
      const r2 = window.KitisAccount.update({ photo: 'javascript:alert(1)' });
      const r2b = window.KitisAccount.update({ group: '<b>x</b>' });
      const r3 = window.KitisAccount.update({ photo: 'data:image/svg+xml,<svg onload=alert(1)>' });
      return [r.ok, r2.ok, r3.ok, r2b.ok];
    });
    log(!byp[0], 'ФИО с HTML/матом в обход формы', byp[0] ? 'принято' : '');
    log(!byp[1] && !byp[2] && !byp[3], 'фото javascript:/SVG и группа с HTML в обход формы', (byp[1] || byp[2]) ? 'принято: ' + JSON.stringify(byp) : '');
    await ctx.close();
  }

  // 8. Загрузка файлов в профиль
  {
    const ctx = await b.newContext(desk);
    const p = await ctx.newPage();
    let dialogs = 0; p.on('dialog', d => { dialogs++; d.dismiss(); });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(B + 'register.html'); await p.waitForTimeout(400);
    await p.evaluate(async () => {
      const L = { groups: window.KitisModel.groups().map(g => g.name), teachers: window.KitisModel.teachers().map(t => t.name) };
      await window.KitisAccount.register({ role: 'student', last: 'Фотов', first: 'Фото', group: L.groups[0], email: 'photo@test.ru', password: 'qwerty123', password2: 'qwerty123', consent: true }, L);
    });
    await p.goto(B + 'profile.html'); await p.waitForTimeout(500);
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kitis-atk-'));
    fs.writeFileSync(path.join(dir, 'evil.svg'), '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__pwn=1;alert(1)"><script>window.__pwn=1;alert(2)</script><rect width="10" height="10"/></svg>');
    fs.writeFileSync(path.join(dir, 'fake.jpg'), 'это не картинка <script>alert(1)</script>');
    fs.writeFileSync(path.join(dir, 'big.jpg'), Buffer.alloc(30 * 1024 * 1024, 1));
    const input = await p.$('input[type=file]');
    const res = [];
    for (const f of ['evil.svg', 'fake.jpg', 'big.jpg']) {
      if (!input) { res.push('нет поля загрузки'); break; }
      const t0 = Date.now();
      await input.setInputFiles(path.join(dir, f)).catch(e => res.push(f + ' ' + e.message.slice(0, 60)));
      await p.waitForTimeout(1200);
      const st = await p.evaluate(() => ({ pwn: !!window.__pwn, photo: (JSON.parse(localStorage.getItem('kitis.accounts.v2') || '{}').users || []).map(u => u && u.photo ? String(u.photo).slice(0, 30) : '').join(','), msg: document.body.innerText.match(/(Выберите[^\n]*|Не удалось[^\n]*|слишком[^\n]*|формат[^\n]*)/i)?.[0] || '' }));
      res.push(`${f}: ${st.pwn ? 'СКРИПТ ВЫПОЛНЕН' : 'скрипт не выполнен'}, фото=${st.photo || 'нет'}, сообщение «${st.msg}», ${Date.now() - t0} мс`);
    }
    log(!dialogs && !res.some(x => /ВЫПОЛНЕН|svg\+xml/.test(x)), 'загрузка файлов в профиль', res.join(' ; ') + (errs.length ? ' ошибки: ' + errs.slice(0, 2).join('|') : ''));
    fs.rmSync(dir, { recursive: true, force: true });
    await ctx.close();
  }

  // 9. Статика: CSP, внешние скрипты без SRI, eval
  {
    const dir = path.join(__dirname, '..');
    const htmls = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    const noCsp = htmls.filter(f => !/Content-Security-Policy/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    log(!noCsp.length, 'политика безопасности контента (CSP)', noCsp.length ? 'нет на ' + noCsp.length + ' страницах' : '');
    const ext = [];
    htmls.forEach(f => { const t = fs.readFileSync(path.join(dir, f), 'utf8'); (t.match(/<script[^>]+src="https?:[^"]+"[^>]*>/g) || []).forEach(s => { if (!/integrity=/.test(s)) ext.push(f + ': ' + s.match(/src="([^"]+)"/)[1]); }); });
    log(!ext.length, 'внешние скрипты без проверки целостности', ext.join(' ; '));
    const rt = fs.readFileSync(path.join(dir, 'dc-runtime.js'), 'utf8');
    log(!/new Function|eval\(/.test(rt), 'выполнение кода из строки (new Function)', /new Function/.test(rt) ? 'движок собирает компоненты через new Function — мешает строгой CSP' : '');
    const wf = fs.readFileSync(path.join(dir, '.github/workflows/update-schedule.yml'), 'utf8');
    log(/permissions:/.test(wf) && /concurrency:/.test(wf), 'GitHub Actions: права и одновременные запуски', (/permissions:/.test(wf) ? '' : 'нет блока permissions; ') + (/concurrency:/.test(wf) ? '' : 'нет concurrency'));
  }

  
  console.log('\nИТОГО: уязвимо ' + OUT.filter(x => !x.ok).length + ' из ' + OUT.length);
  await b.close();
})();
