// Сверка «Итогов» сайта с сервером расписания: data/kitis-data.js хранит строки страниц vgN/vpN/vaN как есть,
// тест открывает «Итоги» каждой группы и каждого преподавателя и сравнивает все ячейки таблицы.
// Запуск: python3 -m http.server 8765 в корне сайта, затем node tests/results-match.js
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const B = process.env.B || 'http://127.0.0.1:8765/';
const D = JSON.parse(/window\.KITIS_DATA = (\{[\s\S]*\});\s*$/.exec(fs.readFileSync(path.join(__dirname, '..', 'data', 'kitis-data.js'), 'utf8'))[1]);
const num = (v) => v == null ? '—' : String(Math.round(v * 10) / 10).replace('.', ',');
const dmy = (iso) => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '—';
const expectG = (gi) => D.load[gi].map((x, n) => [String(n + 1) + '.', D.teachers[x[1]] || '', D.groups[gi], String(x[2] || 0), D.subjects[x[0]], D.types[x[3]] || '', num(x[4]), num(x[5]), num(x[6]), num(x[7]), num(x[8]), num(x[9]), dmy(x[10]), x[11] != null ? x[11] + '%' : '—']);
const expectT = (ti) => D.loadT[ti].map((x, n) => [String(n + 1) + '.', D.teachers[x[0]] || '', D.groups[x[1]] || '', String(x[2] || 0), D.subjects[x[3]], D.types[x[4]] || '', num(x[5]), num(x[6]), num(x[7]), num(x[8]), num(x[9]), num(x[10]), dmy(x[11]), x[12] != null ? x[12] + '%' : '—']);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const tableOf = () => p.$$eval('main table tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.trim())));
  let bad = [], rowsChecked = 0, failed = 0;
  for (let gi = 0; gi < D.groupIds.length; gi++) {
    await p.goto(B + 'desktop.html#tab=results&group=' + encodeURIComponent(D.groups[gi])); await p.reload(); await p.waitForTimeout(250);
    const got = await tableOf(), exp = expectG(gi);
    rowsChecked += exp.length;
    if (JSON.stringify(got) !== JSON.stringify(exp)) bad.push('группа ' + D.groups[gi] + ': ' + JSON.stringify(got[0]) + ' ≠ ' + JSON.stringify(exp[0]) + ' (строк ' + got.length + '/' + exp.length + ')');
  }
  console.log('группы: проверено', D.groupIds.length, 'страниц,', rowsChecked, 'строк; расхождений', bad.length); bad.slice(0, 3).forEach((x) => console.log('  ', x));
  failed += bad.length; bad = []; rowsChecked = 0;
  const TL = D.teacherIds.map((id, i) => i);
  for (const ti of TL) {
    await p.goto(B + 'desktop.html#tab=results&k=t&teacher=' + encodeURIComponent(D.teachers[ti])); await p.reload(); await p.waitForTimeout(250);
    const got = await tableOf(), exp = expectT(ti);
    rowsChecked += exp.length;
    const same = JSON.stringify(got) === JSON.stringify(exp) || (exp.length === 0 && /нет строк/.test(await p.$eval('main', (e) => e.innerText)));
    if (!same) bad.push('преподаватель ' + D.teachers[ti] + ': ' + JSON.stringify(got[0]) + ' ≠ ' + JSON.stringify(exp[0]) + ' (строк ' + got.length + '/' + exp.length + ')');
  }
  console.log('преподаватели: проверено', TL.length, 'страниц,', rowsChecked, 'строк; расхождений', bad.length); bad.slice(0, 3).forEach((x) => console.log('  ', x));
  failed += bad.length;
  await p.goto(B + 'desktop.html#tab=results&k=r&room=104'); await p.reload(); await p.waitForTimeout(300);
  console.log('аудитория 104:', (await p.$eval('main', (e) => e.innerText)).match(/На сервере[^\n]*/)[0], '| строк в данных:', D.loadR.reduce((a, x) => a + x.length, 0));
  await p.goto(B + 'desktop.html#tab=results&group=' + encodeURIComponent('СОД25-1')); await p.reload(); await p.waitForTimeout(500);
  console.log('СОД25-1, строка 1:', (await tableOf())[0].join(' | '));
  const ph = await b.newContext(devices['iPhone 15']); const q = await ph.newPage(); q.on('pageerror', (e) => errs.push('phone ' + e.message));
  await q.goto(B + 'phone.html#tab=results&k=t&teacher=' + encodeURIComponent('Андрийченко В.А.')); await q.waitForTimeout(900);
  const card = await q.$$eval('section > div', (d) => d.slice(0, 1).map((x) => x.innerText.replace(/\n/g, ' | ')));
  console.log('телефон, Андрийченко, первая карточка:', card[0]);
  console.log('телефон: без сдвига по ширине', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth && innerWidth === 393));
  console.log('ошибки:', JSON.stringify(errs.slice(0, 3)));
  await b.close();
  process.exitCode = (failed || errs.length) ? 1 : 0;
})();
