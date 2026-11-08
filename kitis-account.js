/*
 * Аккаунты сайта расписания КИТиС.
 * Сайт статический (GitHub Pages), своего сервера у него нет, поэтому учётные записи
 * хранятся в браузере (localStorage): вход запоминается на этом устройстве.
 * Пароль хранится только в виде хеша SHA-256.
 *
 * ФИО — только русские буквы: цифры, латиница и знаки препинания отбрасываются при вводе,
 * ненормативная лексика не принимается.
 */
(function (root) {
  'use strict';

  var KEY = 'kitis.accounts.v1';
  var MAX_NAME = 30;

  /* ---------- хранилище ---------- */

  function load() {
    try {
      var db = JSON.parse(root.localStorage.getItem(KEY) || 'null');
      if (db && Array.isArray(db.users)) return db;
    } catch (e) { /* пусто */ }
    return { users: [], current: null };
  }

  function save(db) {
    try { root.localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { return false; }
  }

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
    var s = String(v || '');
    if (!s) return required ? 'Укажите: ' + label.toLowerCase() : '';
    if (!/^[А-ЯЁа-яё]+$/.test(s)) return label + ': только русские буквы';
    if (s.length < 2) return label + ': слишком коротко';
    if (hasProfanity(s)) return label + ': недопустимое слово';
    return '';
  }

  function cleanEmail(v) { return String(v || '').replace(/[^A-Za-z0-9@._+\-]/g, '').slice(0, 80).toLowerCase(); }
  function checkEmail(v) {
    if (!v) return 'Укажите e-mail';
    return /^[a-z0-9._+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(v) ? '' : 'E-mail указан с ошибкой';
  }
  function checkPassword(v) {
    if (!v) return 'Придумайте пароль';
    if (v.length < 6) return 'Пароль — не короче 6 символов';
    return '';
  }

  /* ---------- пароль ---------- */

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function hashPassword(email, pass) {
    var text = 'kitis|' + email + '|' + pass;
    try {
      if (root.crypto && root.crypto.subtle && root.TextEncoder) {
        return root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(hex);
      }
    } catch (e) { /* нет WebCrypto */ }
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return Promise.resolve('x' + (h >>> 0).toString(16));
  }

  /* ---------- учётные записи ---------- */

  function publicUser(u) {
    if (!u) return null;
    var out = {};
    for (var k in u) if (k !== 'hash') out[k] = u[k];
    out.fullName = [u.last, u.first, u.middle].filter(Boolean).join(' ');
    out.shortName = u.first || u.last || 'Профиль';
    out.initials = ((u.last || '').charAt(0) + (u.first || '').charAt(0)).toUpperCase() || 'К';
    out.roleLabel = u.role === 'teacher' ? 'Преподаватель' : (u.role === 'abitur' ? 'Абитуриент' : 'Студент');
    return out;
  }

  function current() {
    var db = load();
    if (!db.current) return null;
    for (var i = 0; i < db.users.length; i++) if (db.users[i].id === db.current) return publicUser(db.users[i]);
    return null;
  }

  function validateProfile(f, lists) {
    var e = {};
    var last = checkName(f.last, 'Фамилия', true); if (last) e.last = last;
    var first = checkName(f.first, 'Имя', true); if (first) e.first = first;
    var middle = checkName(f.middle, 'Отчество', false); if (middle) e.middle = middle;
    if (f.role === 'student') {
      if (!f.group) e.group = 'Выберите свою группу';
      else if (lists && lists.groups && lists.groups.indexOf(f.group) < 0) e.group = 'Такой группы нет в расписании';
    }
    if (f.role === 'teacher') {
      if (!f.teacher) e.teacher = 'Выберите себя в списке преподавателей';
      else if (lists && lists.teachers && lists.teachers.indexOf(f.teacher) < 0) e.teacher = 'Такого преподавателя нет в расписании';
    }
    return e;
  }

  function register(f, lists) {
    var e = validateProfile(f, lists);
    var em = checkEmail(f.email); if (em) e.email = em;
    var pw = checkPassword(f.password); if (pw) e.password = pw;
    if (!pw && f.password !== f.password2) e.password2 = 'Пароли не совпадают';
    if (!f.consent) e.consent = 'Нужно согласие на обработку данных';
    var db = load();
    if (!em && db.users.some(function (u) { return u.email === f.email; })) e.email = 'Этот e-mail уже зарегистрирован — войдите';
    if (Object.keys(e).length) return Promise.resolve({ ok: false, errors: e });
    return hashPassword(f.email, f.password).then(function (h) {
      var u = {
        id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        role: f.role || 'student', last: f.last, first: f.first, middle: f.middle || '',
        group: f.role === 'student' ? f.group : '', teacher: f.role === 'teacher' ? f.teacher : '',
        interest: f.role === 'abitur' ? (f.interest || '') : '',
        email: f.email, hash: h, photo: '', created: new Date().toISOString()
      };
      db.users.push(u);
      db.current = u.id;
      if (!save(db)) return { ok: false, errors: { form: 'Браузер не даёт сохранить данные (приватный режим?)' } };
      return { ok: true, user: publicUser(u) };
    });
  }

  function login(email, password) {
    var db = load();
    var u = null;
    for (var i = 0; i < db.users.length; i++) if (db.users[i].email === email) u = db.users[i];
    if (!email || !password) return Promise.resolve({ ok: false, error: 'Введите e-mail и пароль' });
    if (!u) return Promise.resolve({ ok: false, error: 'Аккаунт с таким e-mail на этом устройстве не найден' });
    return hashPassword(email, password).then(function (h) {
      if (h !== u.hash) return { ok: false, error: 'Неверный пароль' };
      db.current = u.id;
      save(db);
      return { ok: true, user: publicUser(u) };
    });
  }

  function logout() {
    var db = load();
    db.current = null;
    save(db);
  }

  function update(fields, lists) {
    var db = load();
    var u = null;
    for (var i = 0; i < db.users.length; i++) if (db.users[i].id === db.current) u = db.users[i];
    if (!u) return { ok: false, errors: { form: 'Сначала войдите' } };
    var next = {};
    for (var k in u) next[k] = u[k];
    ['last', 'first', 'middle', 'group', 'teacher', 'interest', 'photo'].forEach(function (key) {
      if (fields[key] !== undefined) next[key] = fields[key];
    });
    var e = validateProfile(next, lists);
    if (Object.keys(e).length) return { ok: false, errors: e };
    for (var j = 0; j < db.users.length; j++) if (db.users[j].id === u.id) db.users[j] = next;
    if (!save(db)) return { ok: false, errors: { form: 'Не удалось сохранить: фото слишком большое или браузер запрещает хранение' } };
    return { ok: true, user: publicUser(next) };
  }

  function removeAccount() {
    var db = load();
    db.users = db.users.filter(function (u) { return u.id !== db.current; });
    db.current = null;
    save(db);
  }

  // Фото: уменьшаем до 320 px и сохраняем как JPEG, чтобы поместилось в хранилище браузера
  function photoFromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Выберите картинку: JPG, PNG или HEIC')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Не удалось прочитать файл')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Этот формат картинки браузер не открыл — попробуйте JPG')); };
        img.onload = function () {
          var size = 320;
          var s = Math.min(img.width, img.height);
          var canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  root.KitisAccount = {
    current: current, register: register, login: login, logout: logout, update: update, remove: removeAccount,
    photoFromFile: photoFromFile, cleanName: cleanName, cleanEmail: cleanEmail, checkName: checkName,
    checkEmail: checkEmail, checkPassword: checkPassword, hasProfanity: hasProfanity
  };
})(typeof window !== 'undefined' ? window : globalThis);
