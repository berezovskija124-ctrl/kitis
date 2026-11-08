#!/usr/bin/env node
/*
 * Схема страниц «Итоги» на сервере расписания: какие ссылки в меню, какие колонки в таблицах.
 * Нужна, чтобы парсер читал итоги групп, преподавателей и аудиторий точно так, как их показывает сервер.
 *   node parser/server-probe.mjs  → parser/server-report.json
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const P = createRequire(import.meta.url)('./kitis-parser.js');
const BASE = 'http://94.72.18.202:8083/';
const dec = new TextDecoder('windows-1251');
const get = async (p) => { const r = await fetch(BASE + p, { signal: AbortSignal.timeout(20000) }); return { status: r.status, html: dec.decode(await r.arrayBuffer()) }; };

function tables(html) {
  return html.split(/<table\b/i).slice(1).map((t) => {
    const rows = t.split(/<\/table>/i)[0].split(/<tr\b[^>]*>/i).slice(1).map((r) => {
      const out = [];
      const re = /<t([dh])\b([^>]*)>([\s\S]*?)(?=<t[dh]\b|<\/tr>|$)/gi;
      let m;
      while ((m = re.exec(r))) {
        const hrefs = [...m[3].matchAll(/href\s*=\s*"?([^"\s>]+)/gi)].map((x) => x[1]).slice(0, 3);
        const cls = (/class\s*=\s*"?([\w-]+)/i.exec(m[2]) || [])[1] || '';
        const span = (/colspan\s*=\s*"?(\d+)/i.exec(m[2]) || [])[1] || '';
        const rs = (/rowspan\s*=\s*"?(\d+)/i.exec(m[2]) || [])[1] || '';
        const img = (/<img[^>]*alt\s*=\s*"?([^">]*)/i.exec(m[3]) || [])[1];
        out.push(m[1] + (cls ? '.' + cls : '') + (span ? ' cs' + span : '') + (rs ? ' rs' + rs : '') + ' «' + P.text(m[3]).slice(0, 50) + '»' + (hrefs.length ? ' →' + hrefs.join(',') : '') + (img != null ? ' img:' + img : ''));
      }
      return out;
    }).filter((r) => r.length);
    return { rows: rows.length, head: rows.slice(0, 4), tail: rows.slice(-2) };
  });
}

const report = { at: new Date().toISOString(), pages: {} };
const home = await get('cg.htm');
const menu = [...home.html.matchAll(/<a\b[^>]*href\s*=\s*"?([^"\s>]+)[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => [m[1], P.text(m[2])])
  .filter(([h]) => !/^(cg|cp|ca)\d+\.htm$/i.test(h));
report.menu = menu;
const lists = [...new Set(menu.map(([h]) => h).filter((h) => /^[a-z]+\.htm$/i.test(h)))];
for (const p of lists.concat(['vg.htm', 'vp.htm', 'va.htm', 'index.htm'])) {
  if (report.pages[p]) continue;
  try {
    const r = await get(p);
    const links = [...r.html.matchAll(/href\s*=\s*"?([a-z]+)(\d+)\.htm/gi)].map((m) => m[1]);
    const first = {};
    for (const m of r.html.matchAll(/href\s*=\s*"?([a-z]+)(\d+)\.htm/gi)) if (!(m[1] in first)) first[m[1]] = m[1] + m[2] + '.htm';
    report.pages[p] = { status: r.status, title: (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(r.html) || [])[1] && P.text(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(r.html)[1]),
      linkKinds: Object.fromEntries([...new Set(links)].map((k) => [k, links.filter((x) => x === k).length])), first, tables: tables(r.html), text: P.text(r.html).slice(0, 400) };
  } catch (e) { report.pages[p] = { error: String(e) }; }
}
// первая страница каждого вида «итогов»
for (const p of Object.values(report.pages)) {
  for (const f of Object.values(p.first || {})) {
    if (!/^v/i.test(f) || report.pages[f]) continue;
    try { const r = await get(f); report.pages[f] = { status: r.status, title: P.text((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(r.html) || [])[1] || ''), tables: tables(r.html), text: P.text(r.html).slice(0, 600) }; } catch (e) { report.pages[f] = { error: String(e) }; }
  }
}
writeFileSync(resolve(here, 'server-report.json'), JSON.stringify(report, null, 1));
console.log('Готово:', Object.keys(report.pages).join(', '));
