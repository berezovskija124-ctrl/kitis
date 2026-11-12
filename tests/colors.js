// Цвета предметов: у одного предмета везде один цвет, у разных предметов — разные, и цвет совпадает с data/kitis-data.js (colors).
// Проверяет недели всех групп (текущую и прошлую), неделю трёх преподавателей и телефон.
// Запуск: python3 -m http.server 8765 в корне сайта, затем node tests/colors.js
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const B = process.env.B || 'http://127.0.0.1:8765/';
const D = JSON.parse(/window\.KITIS_DATA = (\{[\s\S]*\});\s*$/.exec(fs.readFileSync(path.join(__dirname, '..', 'data', 'kitis-data.js'), 'utf8'))[1]);
const hex = (rgb) => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(rgb || ''); return m ? '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('') : rgb; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const seenColor = {}, seenSubj = {}; let rows = 0, bad = [];
  const note = (subj, col, where) => {
    rows++;
    if (D.colors[subj] !== col) bad.push(where + ': ' + subj + ' ' + col + ' ≠ ' + D.colors[subj]);
    if (seenColor[subj] && seenColor[subj] !== col) bad.push(where + ': у «' + subj + '» два цвета');
    if (seenSubj[col] && seenSubj[col] !== subj) bad.push(where + ': цвет ' + col + ' у «' + subj + '» и «' + seenSubj[col] + '»');
    seenColor[subj] = col; seenSubj[col] = subj;
  };
  for (const g of D.groups) {
    for (const w of [0, -1]) {
      await p.goto(B + 'desktop.html?now=2026-11-12T10:30#group=' + encodeURIComponent(g) + (w ? '&w=' + w : '')); await p.reload(); await p.waitForTimeout(150);
      const items = await p.$$eval('main div[style*="inset 4px 0 0"]', (ds) => ds.map((d) => [d.querySelector('span[style*="font-weight: 600"]').innerText.trim(), getComputedStyle(d).boxShadow]));
      items.forEach(([s, sh]) => note(s, hex(sh), g));
    }
  }
  console.log('группы: проверено строк', rows, '; предметов', Object.keys(seenColor).length, '; проблем', bad.length); bad.slice(0, 5).forEach((x) => console.log('  ', x));
  const nBad = bad.length; rows = 0;
  for (const t of ['Андрийченко В.А.', 'Журский Р. Д.', 'Максимова Н. А.']) {
    const ti = D.teachers.findIndex((x) => x.replace(/\s/g, '') === t.replace(/\s/g, ''));
    await p.goto(B + 'desktop.html?now=2026-11-12T10:30#tab=teachers&teacher=' + encodeURIComponent(D.teachers[ti])); await p.reload(); await p.waitForTimeout(300);
    const items = await p.$$eval('div[style*="border-left: 3px solid"]', (ds) => ds.map((d) => [d.children[1].innerText, getComputedStyle(d).borderLeftColor]));
    items.forEach(([info, c]) => { const subj = D.subjects.filter((s) => info.includes(' · ' + s + ' · ') || info.endsWith(' · ' + s)).sort((a, z) => z.length - a.length)[0]; if (subj) note(subj, hex(c), t); });
  }
  console.log('преподаватели: строк', rows, '; новых проблем', bad.length - nBad);
  const m = await b.newContext(devices['iPhone 15']); const q = await m.newPage(); q.on('pageerror', (e) => errs.push('phone ' + e.message));
  await q.goto(B + 'phone.html?now=2026-11-12T10:30#group=' + encodeURIComponent('ИСп24-1')); await q.waitForTimeout(900);
  const ph = await q.$$eval('div[style*="inset 4px 0 0"]', (ds) => ds.map((d) => [d.querySelector('span[style*="font-weight: 600"]').innerText.trim(), getComputedStyle(d).boxShadow]));
  ph.forEach(([s, sh]) => note(s, hex(sh), 'телефон'));
  console.log('телефон: карточек', ph.length, '; всего проблем', bad.length, '; без горизонтальной прокрутки', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('ошибки страниц', JSON.stringify(errs));
  await b.close();
  process.exitCode = bad.length || errs.length ? 1 : 0;
})();
