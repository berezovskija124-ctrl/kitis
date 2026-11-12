#!/usr/bin/env node
/*
 * Обновляет data/kitis-data.js с сервера расписания колледжа.
 *
 *   node parser/update.mjs                      — с http://94.72.18.202:8083
 *   node parser/update.mjs --base http://...    — с другого адреса (например, зеркала)
 *   node parser/update.mjs --out путь/файл.js   — записать в другое место
 *
 * Нужен Node.js 18 или новее. Сторонние пакеты не нужны.
 */
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const KitisParser = require('./kitis-parser.js');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const BASE = opt('--base', 'http://94.72.18.202:8083').replace(/\/+$/, '') + '/';
const OUT = resolve(opt('--out', resolve(here, '..', 'data', 'kitis-data.js')));
const decoder = new TextDecoder('windows-1251');

async function fetchText(path, attempt = 1) {
  try {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'kitis-raspisanie-parser' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return decoder.decode(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= 3) throw new Error(path + ': ' + err.message);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return fetchText(path, attempt + 1);
  }
}

const started = Date.now();
console.log('Сервер расписания:', BASE);
const data = await KitisParser.scrape({ fetchText, concurrency: 4, log: (m) => console.log(' ', m) });

if (!data.groups.length || !data.lessons.length) {
  console.error('С сервера ничего не пришло — файл не перезаписан.');
  process.exit(1);
}

// Прошлая выгрузка: по ней видно, у каких групп поменялась «Неделя»
let old = null;
if (existsSync(OUT)) {
  const m = /window\.KITIS_DATA = (\{[\s\S]*\});\s*$/.exec(readFileSync(OUT, 'utf8'));
  if (m) old = JSON.parse(m[1]);
}
let changes = (old && old.changes) || [];
const changed = KitisParser.changedGroups(old, data);
if (changed && changed.length) {
  changes = [{ updated: data.updated, fetched: data.fetched, week: data.scheduleWeek, groups: changed }, ...changes];
  console.log('Изменилось расписание групп:', changed.join(', '));
}
data.changes = changes.filter((c) => c.week === data.scheduleWeek).slice(0, 10);

// Цвета предметов: прежние остаются за своими предметами, новые получают свободный цвет
data.colors = KitisParser.subjectColors(data, old);

// Если на сервере ничего не поменялось, файл не трогаем (чтобы не было лишних коммитов)
if (old) {
  const strip = (d) => JSON.stringify({ ...d, fetched: '' });
  if (strip(old) === strip(data)) {
    console.log('Изменений нет — файл оставлен как есть.');
    process.exit(0);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
const head = '/* Данные сервера расписания КИТиС (' + data.source + '), собраны парсером parser/kitis-parser.js.\n'
  + ' * Обновлено на сервере: ' + data.updated + '. Собрано: ' + data.fetched + '. Не правьте вручную — файл перезаписывается. */\n';
writeFileSync(OUT, head + 'window.KITIS_DATA = ' + JSON.stringify(data) + ';\n', 'utf8');
console.log('Готово за', Math.round((Date.now() - started) / 1000), 'с:', data.groups.length, 'групп,', data.lessons.length, 'пар →', OUT);
