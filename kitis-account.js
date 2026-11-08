/*
 * Аккаунты сайта расписания КИТиС — база данных в браузере (localStorage), версия 2.
 *
 * Сайт статический (GitHub Pages), своего сервера у него нет, поэтому база живёт на устройстве:
 *  - пароль не хранится: только соль + PBKDF2-SHA-256 (150 000 итераций, WebCrypto);
 *  - после 5 неверных паролей вход блокируется на 30 с, дальше — дольше (до 15 мин);
 *  - на «нет такого e-mail» и «неверный пароль» ответ одинаковый — по нему не узнать, есть ли аккаунт;
 *  - каждая запись проверяется при чтении: подменённые или битые данные отбрасываются;
 *  - «Запомнить меня» выключен — вход живёт до закрытия вкладки, включён — 30 дней;
 *  - фото — только JPEG 320×320, который сайт сам пересобирает из картинки.
 * ФИО — только русские буквы, ненормативная лексика не принимается.
 */
(function (root) {
  'use strict';

  var KEY = 'kitis.accounts.v2';
  var OLD_KEY = 'kitis.accounts.v1';
  var SESSION_KEY = 'kitis.session.v2';
  var MAX_NAME = 30;
  var ITER = 150000;
  var SESSION_DAYS = 30;
  var MAX_USERS = 200;
  var PHOTO_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/]+={0,2}$/;
  var NAME_RE = /^[А-ЯЁа-яё]{1,30}$/;
  var ROLES = { student: 1, teacher: 1, abitur: 1 };

  function ls() { try { return root.localStorage; } catch (e) { return null; } }
  function ss() { try { return root.sessionStorage; } catch (e) { return null; } }
  function now() { return Date.now(); }

  /* ---------- проверка ввода ---------- */

  // Корни, которые не встречаются в настоящих фамилиях и именах
  var BAD_ANYWHERE = ['хуй', 'хуё', 'пизд', 'пёзд', 'бляд', 'блят', 'ебан', 'ебат', 'ебал', 'ебло', 'ебуч', 'ебну', 'ёбан', 'ёбну',
    'уебо', 'уеба', 'уёб', 'выеб', 'заеб', 'наеб', 'долбоеб', 'долбоёб', 'мудак', 'мудил', 'пидор', 'пидар', 'пидр', 'залуп',
    'гандон', 'гондон', 'шлюх', 'сучар', 'сучк', 'дрочи', 'дрочу', 'говн', 'мразь', 'шалав', 'ублюд', 'пиздец', 'хуев', 'хуёв', 'хуесос'];
  // Слова целиком (в составе других слов могут быть нормальными: «Суков», «Мандарина»)
  var BAD_WORDS = ['бля', 'сука', 'суки', 'суку', 'сукин', 'хер', 'херня', 'хрень', 'жопа', 'жопу', 'жопе', 'манда', 'курва', 'педик',
    'лох', 'лохушка', 'дебил', 'идиот', 'придурок', 'дура', 'дурак', 'урод', 'тварь', 'чмо', 'хуя', 'хуи', 'хую', 'хуе', 'еба', 'ебу', 'ебись'];

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/(.)\1+/g, '$1');
  }

  function hasProfanity(s) {
    var raw = String(s || '').toLowerCase();
    var n = norm(s);
    for (var i = 0; i < BAD_ANYWHERE.length; i++) {
      var w = BAD_ANYWHERE[i];
      if (raw.indexOf(w) >= 0 || n.indexOf(norm(w)) >= 0) return true;
    }
    var words = n.split(/[^а-я]+/).filter(Boolean);
    for (var j = 0; j < words.length; j++) {
      for (var k = 0; k < BAD_WORDS.length; k++) if (words[j] === norm(BAD_WORDS[k])) return true;
    }
    return false;
  }

  // Оставляет только русские буквы, первая — заглавная
  function cleanName(v) {
    var s = String(v || '').replace(/[^А-ЯЁа-яё]/g, '').slice(0, MAX_NAME);
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  }

  function checkName(v, label, required) {
    var s = typeof v === 'string' ? v : '';
    if (!s) return required ? 'Укажите: ' + label.toLowerCase() : '';
    if (!NAME_RE.test(s)) return label + ': только русские буквы';
    if (s.length < 2) return label + ': слишком коротко';
    if (hasProfanity(s)) return label + ': недопустимое слово';
    return '';
  }

  function cleanEmail(v) { return String(v || '').replace(/[^A-Za-z0-9@._+\-]/g, '').slice(0, 80).toLowerCase(); }
  function checkEmail(v) {
    if (!v) return 'Укажите e-mail';
    if (typeof v !== 'string' || v.length > 80) return 'E-mail указан с ошибкой';
    return /^[a-z0-9._+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(v) ? '' : 'E-mail указан с ошибкой';
  }
  function checkPassword(v) {
    if (!v) return 'Придумайте пароль';
    if (typeof v !== 'string') return 'Пароль указан с ошибкой';
    if (v.length < 8) return 'Пароль — не короче 8 символов';
    if (v.length > 72) return 'Пароль — не длиннее 72 символов';
    if (!/[A-Za-zА-ЯЁа-яё]/.test(v) || !/[0-9]/.test(v)) return 'В пароле нужны буквы и цифры';
    return '';
  }

  /* ---------- база ---------- */

  function str(v, max, re) {
    if (typeof v !== 'string') return '';
    v = v.slice(0, max);
    return re && !re.test(v) ? '' : v;
  }
  function hexOk(v, len) { return typeof v === 'string' && v.length === len && /^[0-9a-f]+$/.test(v); }

  // Проверка одной записи: всё лишнее и подозрительное отбрасывается
  function sanitizeUser(u) {
    if (!u || typeof u !== 'object' || Array.isArray(u)) return null;
    if (typeof u.id !== 'string' || !/^u[a-z0-9]{4,24}$/.test(u.id)) return null;
    if (!ROLES[u.role]) return null;
    var email = typeof u.email === 'string' ? u.email : '';
    if (checkEmail(email)) return null;
    if (checkName(u.last, 'Фамилия', true) || checkName(u.first, 'Имя', true) || checkName(u.middle || '', 'Отчество', false)) return null;
    var pw = u.pw;
    if (!pw && hexOk(u.hash, 64)) pw = { alg: 'sha256-v1', hash: u.hash };
    if (!pw || typeof pw !== 'object') return null;
    if (pw.alg === 'pbkdf2-sha256') {
      if (!hexOk(pw.salt, 32) || !hexOk(pw.hash, 64) || typeof pw.it !== 'number' || pw.it < 10000 || pw.it > 2000000) return null;
      pw = { alg: pw.alg, it: pw.it, salt: pw.salt, hash: pw.hash };
    } else if (pw.alg === 'sha256-v1') {
      if (!hexOk(pw.hash, 64)) return null;
      pw = { alg: pw.alg, hash: pw.hash };
    } else return null;
    return {
      id: u.id, role: u.role, last: u.last, first: u.first, middle: u.middle || '',
      group: u.role === 'student' ? str(u.group, 40, /^[0-9A-Za-zА-ЯЁа-яё\-]*$/) : '',
      teacher: u.role === 'teacher' ? str(u.teacher, 80, /^[А-ЯЁа-яё .\-]*$/) : '',
      interest: u.role === 'abitur' ? str(u.interest, 160, /^[^<>]*$/) : '',
      email: email,
      photo: typeof u.photo === 'string' && u.photo.length < 200000 && PHOTO_RE.test(u.photo) ? u.photo : '',
      created: str(u.created, 30, /^[0-9T:.\-Z]*$/), updated: str(u.updated, 30, /^[0-9T:.\-Z]*$/),
      pw: pw
    };
  }

  function sanitizeGuard(g) {
    var out = {};
    if (!g || typeof g !== 'object') return out;
    Object.keys(g).slice(0, 60).forEach(function (k) {
      var x = g[k];
      if (!/^[a-z0-9._+\-@]{3,80}$/.test(k) || !x || typeof x !== 'object') return;
      out[k] = { fails: Math.min(100, Math.max(0, x.fails | 0)), until: typeof x.until === 'number' ? x.until : 0 };
    });
    return out;
  }

  function load() {
    var store = ls();
    var raw = null;
    try { raw = JSON.parse(store && store.getItem(KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw) {
      // перенос со старой версии базы
      var old = null;
      try { old = JSON.parse(store && store.getItem(OLD_KEY) || 'null'); } catch (e) { old = null; }
      if (old && Array.isArray(old.users)) {
        raw = { v: 2, users: old.users, guard: {} };
        var db0 = clean(raw);
        if (old.current && db0.users.some(function (u) { return u.id === old.current; })) writeSession(old.current, true);
        save(db0);
        try { store.removeItem(OLD_KEY); } catch (e) { /* пусть лежит */ }
        return db0;
      }
    }
    return clean(raw);
  }
  function clean(raw) {
    var db = { v: 2, users: [], guard: {} };
    if (!raw || typeof raw !== 'object') return db;
    var seen = {};
    (Array.isArray(raw.users) ? raw.users : []).slice(0, MAX_USERS).forEach(function (u) {
      var c = sanitizeUser(u);
      if (c && !seen[c.id] && !seen[c.email]) { seen[c.id] = 1; seen[c.email] = 1; db.users.push(c); }
    });
    db.guard = sanitizeGuard(raw.guard);
    return db;
  }

  function save(db) {
    var store = ls();
    if (!store) return false;
    try { store.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { return false; }
  }

  /* ---------- сеанс ---------- */

  function writeSession(id, remember) {
    var l = ls(), s = ss();
    try { if (l) l.removeItem(SESSION_KEY); if (s) s.removeItem(SESSION_KEY); } catch (e) { /* пусто */ }
    if (!id) return;
    var rec = JSON.stringify({ id: id, exp: remember ? now() + SESSION_DAYS * 864e5 : 0 });
    try { (remember ? l : s || l).setItem(SESSION_KEY, rec); } catch (e) { /* без сеанса */ }
  }
  function readSession() {
    var stores = [ss(), ls()];
    for (var i = 0; i < stores.length; i++) {
      var st = stores[i];
      if (!st) continue;
      var x = null;
      try { x = JSON.parse(st.getItem(SESSION_KEY) || 'null'); } catch (e) { x = null; }
      if (!x || typeof x.id !== 'string') continue;
      if (x.exp && x.exp < now()) { try { st.removeItem(SESSION_KEY); } catch (e) { /* пусто */ } continue; }
      return x.id;
    }
    return null;
  }

  /* ---------- пароль ---------- */

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function unhex(h) {
    var out = new Uint8Array(h.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }
  function subtle() { return root.crypto && root.crypto.subtle && root.TextEncoder ? root.crypto.subtle : null; }
  var NO_CRYPTO = 'Этот браузер не умеет безопасно хранить пароль. Откройте сайт по ссылке https:// в современном браузере.';

  function randomHex(n) {
    var a = new Uint8Array(n);
    root.crypto.getRandomValues(a);
    return hex(a.buffer);
  }
  function pbkdf2(pass, saltHex, it) {
    var c = subtle();
    if (!c) return Promise.reject(new Error(NO_CRYPTO));
    return c.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) { return c.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: it }, key, 256); })
      .then(hex);
  }
  function sha256v1(email, pass) {
    var c = subtle();
    if (!c) return Promise.reject(new Error(NO_CRYPTO));
    return c.digest('SHA-256', new TextEncoder().encode('kitis|' + email + '|' + pass)).then(hex);
  }
  function makePw(pass) {
    var salt = randomHex(16);
    return pbkdf2(pass, salt, ITER).then(function (h) { return { alg: 'pbkdf2-sha256', it: ITER, salt: salt, hash: h }; });
  }
  function same(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var r = 0;
    for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }
  function verify(u, pass) {
    if (u.pw.alg === 'pbkdf2-sha256') return pbkdf2(pass, u.pw.salt, u.pw.it).then(function (h) { return same(h, u.pw.hash); });
    return sha256v1(u.email, pass).then(function (h) { return same(h, u.pw.hash); });
  }
  var DUMMY_SALT = '00000000000000000000000000000000';

  /* ---------- защита от перебора ---------- */

  var LOCK_AFTER = 5;
  function lockLeft(db, email) {
    var g = db.guard[email];
    return g && g.until > now() ? Math.ceil((g.until - now()) / 1000) : 0;
  }
  function fail(db, email) {
    var g = db.guard[email] || (db.guard[email] = { fails: 0, until: 0 });
    g.fails += 1;
    if (g.fails >= LOCK_AFTER) g.until = now() + Math.min(15 * 60, 30 * Math.pow(2, g.fails - LOCK_AFTER)) * 1000;
    var keys = Object.keys(db.guard);
    if (keys.length > 50) delete db.guard[keys[0]];
    save(db);
  }
  function waitText(sec) {
    return sec >= 60 ? Math.ceil(sec / 60) + ' мин' : sec + ' с';
  }

  /* ---------- учётные записи ---------- */

  function publicUser(u) {
    if (!u) return null;
    return {
      id: u.id, role: u.role, last: u.last, first: u.first, middle: u.middle, group: u.group, teacher: u.teacher,
      interest: u.interest, email: u.email, photo: u.photo, created: u.created,
      fullName: [u.last, u.first, u.middle].filter(Boolean).join(' '),
      shortName: u.first || u.last || 'Профиль',
      initials: ((u.last || '').charAt(0) + (u.first || '').charAt(0)).toUpperCase() || 'К',
      roleLabel: u.role === 'teacher' ? 'Преподаватель' : (u.role === 'abitur' ? 'Абитуриент' : 'Студент')
    };
  }

  function findCurrent(db) {
    var id = readSession();
    if (!id) return null;
    for (var i = 0; i < db.users.length; i++) if (db.users[i].id === id) return db.users[i];
    return null;
  }
  function current() { return publicUser(findCurrent(load())); }

  function validateProfile(f, lists) {
    var e = {};
    var last = checkName(f.last, 'Фамилия', true); if (last) e.last = last;
    var first = checkName(f.first, 'Имя', true); if (first) e.first = first;
    var middle = checkName(f.middle || '', 'Отчество', false); if (middle) e.middle = middle;
    if (!ROLES[f.role]) e.role = 'Выберите, кто вы';
    if (f.role === 'student') {
      if (!f.group) e.group = 'Выберите свою группу';
      else if (typeof f.group !== 'string' || (lists && lists.groups && lists.groups.indexOf(f.group) < 0)) e.group = 'Такой группы нет в расписании';
    }
    if (f.role === 'teacher') {
      if (!f.teacher) e.teacher = 'Выберите себя в списке преподавателей';
      else if (typeof f.teacher !== 'string' || (lists && lists.teachers && lists.teachers.indexOf(f.teacher) < 0)) e.teacher = 'Такого преподавателя нет в расписании';
    }
    if (f.interest != null && (typeof f.interest !== 'string' || f.interest.length > 160 || /[<>]/.test(f.interest))) e.interest = 'Выберите специальность из списка';
    if (f.photo != null && f.photo !== '' && (typeof f.photo !== 'string' || f.photo.length >= 200000 || !PHOTO_RE.test(f.photo))) e.photo = 'Фото можно загрузить только кнопкой «Загрузить фото»';
    return e;
  }

  function register(f, lists) {
    f = f || {};
    var email = cleanEmail(f.email);
    var e = validateProfile(f, lists);
    var em = checkEmail(email); if (em) e.email = em;
    var pw = checkPassword(f.password); if (pw) e.password = pw;
    if (!pw && f.password !== f.password2) e.password2 = 'Пароли не совпадают';
    if (!f.consent) e.consent = 'Нужно согласие на обработку данных';
    var db = load();
    if (!em && db.users.some(function (u) { return u.email === email; })) e.email = 'Этот e-mail уже зарегистрирован на этом устройстве — войдите';
    if (!e.email && db.users.length >= MAX_USERS) e.form = 'На этом устройстве уже слишком много аккаунтов';
    if (!subtle()) e.form = NO_CRYPTO;
    if (Object.keys(e).length) return Promise.resolve({ ok: false, errors: e });
    return makePw(f.password).then(function (pwRec) {
      var stamp = new Date().toISOString();
      var u = {
        id: 'u' + randomHex(8),
        role: f.role, last: f.last, first: f.first, middle: f.middle || '',
        group: f.role === 'student' ? f.group : '', teacher: f.role === 'teacher' ? f.teacher : '',
        interest: f.role === 'abitur' ? (f.interest || '') : '',
        email: email, photo: '', created: stamp, updated: stamp, pw: pwRec
      };
      var db2 = load();
      if (db2.users.some(function (x) { return x.email === email; })) return { ok: false, errors: { email: 'Этот e-mail уже зарегистрирован на этом устройстве — войдите' } };
      db2.users.push(u);
      if (!save(db2)) return { ok: false, errors: { form: 'Браузер не даёт сохранить данные (приватный режим или нет места)' } };
      writeSession(u.id, f.remember !== false);
      return { ok: true, user: publicUser(u) };
    }, function (err) { return { ok: false, errors: { form: err.message || NO_CRYPTO } }; });
  }

  var GENERIC = 'Неверный e-mail или пароль';
  function login(emailIn, password, remember) {
    var email = cleanEmail(emailIn);
    if (!email || !password) return Promise.resolve({ ok: false, error: 'Введите e-mail и пароль' });
    if (typeof password !== 'string' || password.length > 200) return Promise.resolve({ ok: false, error: GENERIC });
    var db = load();
    var left = lockLeft(db, email);
    if (left) return Promise.resolve({ ok: false, locked: left, error: 'Слишком много попыток. Подождите ' + waitText(left) + ' и попробуйте снова' });
    var u = null;
    for (var i = 0; i < db.users.length; i++) if (db.users[i].email === email) u = db.users[i];
    // для несуществующего e-mail считаем такой же хеш, чтобы ответ шёл столько же времени
    var check = u ? verify(u, password) : pbkdf2(password, DUMMY_SALT, ITER).then(function () { return false; });
    return check.then(function (ok) {
      var db2 = load();
      if (!ok) {
        fail(db2, email);
        var l2 = lockLeft(db2, email);
        return { ok: false, locked: l2, error: l2 ? 'Слишком много попыток. Подождите ' + waitText(l2) + ' и попробуйте снова' : GENERIC };
      }
      delete db2.guard[email];
      var fresh = null;
      for (var j = 0; j < db2.users.length; j++) if (db2.users[j].id === u.id) fresh = db2.users[j];
      if (!fresh) return { ok: false, error: GENERIC };
      var upgrade = fresh.pw.alg !== 'pbkdf2-sha256' ? makePw(password).then(function (p) { fresh.pw = p; }) : Promise.resolve();
      return upgrade.then(function () {
        save(db2);
        writeSession(fresh.id, remember !== false);
        return { ok: true, user: publicUser(fresh) };
      });
    }, function (err) { return { ok: false, error: err.message || NO_CRYPTO }; });
  }

  function logout() { writeSession(null); }

  function update(fields, lists) {
    fields = fields || {};
    var db = load();
    var u = findCurrent(db);
    if (!u) return { ok: false, errors: { form: 'Сначала войдите' } };
    var next = {};
    for (var k in u) if (Object.prototype.hasOwnProperty.call(u, k)) next[k] = u[k];
    ['last', 'first', 'middle', 'group', 'teacher', 'interest', 'photo'].forEach(function (key) {
      if (fields[key] !== undefined) next[key] = fields[key];
    });
    var e = validateProfile(next, lists);
    if (Object.keys(e).length) return { ok: false, errors: e };
    next.updated = new Date().toISOString();
    var checked = sanitizeUser(next);
    if (!checked) return { ok: false, errors: { form: 'Данные профиля не прошли проверку' } };
    for (var j = 0; j < db.users.length; j++) if (db.users[j].id === u.id) db.users[j] = checked;
    if (!save(db)) return { ok: false, errors: { form: 'Не удалось сохранить: в браузере нет места или хранение запрещено' } };
    return { ok: true, user: publicUser(checked) };
  }

  function withPassword(password, action) {
    var db = load();
    var u = findCurrent(db);
    if (!u) return Promise.resolve({ ok: false, error: 'Сначала войдите' });
    if (!password) return Promise.resolve({ ok: false, error: 'Введите текущий пароль' });
    var left = lockLeft(db, u.email);
    if (left) return Promise.resolve({ ok: false, error: 'Слишком много попыток. Подождите ' + waitText(left) });
    return verify(u, String(password)).then(function (ok) {
      var db2 = load();
      if (!ok) { fail(db2, u.email); return { ok: false, error: 'Неверный пароль' }; }
      delete db2.guard[u.email];
      return action(db2, u.id);
    }, function (err) { return { ok: false, error: err.message || NO_CRYPTO }; });
  }

  function changePassword(oldPass, newPass, newPass2) {
    var bad = checkPassword(newPass);
    if (bad) return Promise.resolve({ ok: false, error: bad });
    if (newPass !== newPass2) return Promise.resolve({ ok: false, error: 'Новые пароли не совпадают' });
    if (newPass === oldPass) return Promise.resolve({ ok: false, error: 'Новый пароль совпадает со старым' });
    return withPassword(oldPass, function (db, id) {
      return makePw(newPass).then(function (p) {
        db.users.forEach(function (x) { if (x.id === id) { x.pw = p; x.updated = new Date().toISOString(); } });
        return save(db) ? { ok: true } : { ok: false, error: 'Не удалось сохранить' };
      });
    });
  }

  function removeAccount(password) {
    return withPassword(password, function (db, id) {
      db.users = db.users.filter(function (x) { return x.id !== id; });
      save(db);
      writeSession(null);
      return { ok: true };
    });
  }

  // Фото: уменьшаем до 320 px и пересобираем в JPEG — в базу попадает только картинка, никакого кода
  var MAX_FILE = 15 * 1024 * 1024;
  function photoFromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('Файл не выбран')); return; }
      if (!/^image\/(jpeg|png|webp|gif|heic|heif|bmp|avif)$/.test(file.type)) { reject(new Error('Выберите фотографию: JPG, PNG или WebP')); return; }
      if (file.size > MAX_FILE) { reject(new Error('Фото больше 15 МБ — выберите поменьше')); return; }
      var url;
      try { url = URL.createObjectURL(file); } catch (e) { reject(new Error('Не удалось прочитать файл')); return; }
      var img = new Image();
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Этот формат картинки браузер не открыл — попробуйте JPG')); };
      img.onload = function () {
        URL.revokeObjectURL(url);
        if (!img.width || !img.height || img.width * img.height > 60e6) { reject(new Error('Слишком большое разрешение — выберите другое фото')); return; }
        var size = 320;
        var s = Math.min(img.width, img.height);
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        var out = canvas.toDataURL('image/jpeg', 0.85);
        if (!PHOTO_RE.test(out)) { reject(new Error('Не удалось обработать фото')); return; }
        resolve(out);
      };
      img.src = url;
    });
  }

  root.KitisAccount = {
    version: 2, storage: 'browser',
    current: current, register: register, login: login, logout: logout, update: update,
    changePassword: changePassword, remove: removeAccount,
    photoFromFile: photoFromFile, cleanName: cleanName, cleanEmail: cleanEmail, checkName: checkName,
    checkEmail: checkEmail, checkPassword: checkPassword, hasProfanity: hasProfanity
  };
})(typeof window !== 'undefined' ? window : globalThis);
