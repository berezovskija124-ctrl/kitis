// Цвет пары — только вид занятия. Проверяет недели всех групп (текущую и прошлую) на компьютере и одну группу на телефоне:
// цвет полоски соответствует плашке вида, практики узнаются по названию, у кураторского часа полоска серая.
// Запуск: python3 -m http.server 8765 в корне сайта, затем node tests/kinds.js (нужен Playwright)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const B = process.env.B || 'http://127.0.0.1:8765/';
const D = JSON.parse(/window\.KITIS_DATA = (\{[\s\S]*\});\s*$/.exec(fs.readFileSync(path.join(__dirname, '..', 'data', 'kitis-data.js'), 'utf8'))[1]);
const COLOR = {
  'Лекция': 'rgb(122, 111, 224)', 'Практическое занятие': 'rgb(229, 72, 77)', 'Учебная практика': 'rgb(47, 123, 235)',
  'Производственная практика': 'rgb(240, 138, 36)', 'Преддипломная практика': 'rgb(18, 165, 148)', '': 'rgb(201, 206, 214)'
};
const expectKind = (subject) => /разговоры о важном/i.test(subject) ? '' : /преддипломн/i.test(subject) ? 'Преддипломная практика'
  : /производственн\S* практик/i.test(subject) ? 'Производственная практика' : /учебн\S* практик/i.test(subject) ? 'Учебная практика' : null;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cards = (root) => p.$$eval(root, (ds) => ds.map((d) => {
    const subj = (d.querySelector('span[style*="font-weight: 600; font-size: 15px"]') || {}).innerText || '';
    const chips = [...d.querySelectorAll('span[style*="border-radius: 6px"]')].map((x) => x.innerText.trim());
    return { subj: subj.trim(), stripe: (getComputedStyle(d).boxShadow.match(/rgb\([^)]+\)/) || [''])[0], chips };
  }));
  let n = 0; const bad = [], seen = {};
  const check = (c, where) => {
    n++;
    const kind = Object.keys(COLOR).find((k) => k && c.chips.indexOf(k) >= 0) || '';
    if (COLOR[kind] !== c.stripe) bad.push(where + ': «' + c.subj + '» полоска ' + c.stripe + ', плашка «' + kind + '»');
    const want = expectKind(c.subj);
    if (want !== null && want !== kind) bad.push(where + ': «' + c.subj + '» должно быть «' + want + '», а не «' + kind + '»');
    seen[kind || 'без вида'] = (seen[kind || 'без вида'] || 0) + 1;
  };
  for (const g of D.groups) for (const w of [0, -1]) {
    await p.goto(B + 'desktop.html#group=' + encodeURIComponent(g) + (w ? '&w=' + w : '')); await p.reload(); await p.waitForTimeout(150);
    (await cards('main section div[style*="inset 4px 0 0"]')).forEach((c) => check(c, g));
  }
  console.log('компьютер: пар', n, '; по видам', JSON.stringify(seen), '; ошибок', bad.length); bad.slice(0, 5).forEach((x) => console.log('  ', x));
  const m = await b.newContext(devices['iPhone 15']); const q = await m.newPage(); q.on('pageerror', (e) => errs.push('phone ' + e.message));
  await q.goto(B + 'phone.html#group=' + encodeURIComponent('ИСр24-1')); await q.waitForTimeout(900);
  const before = bad.length; const ph = await q.$$eval('div[style*="inset 4px 0 0"]', (ds) => ds.length);
  console.log('телефон: карточек', ph, '; без горизонтальной прокрутки', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('ошибки страниц', JSON.stringify(errs));
  await b.close();
  process.exitCode = bad.length || errs.length || ph === 0 ? 1 : 0;
})();
