/* Страница «О проекте»: цифры из данных и QR-код со ссылкой на сайт */
(function () {
  var D = window.KITIS_DATA;
  if (!D) return;
  var M = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
  var pl = function (n, a, b, c) { var x = n % 100, y = x % 10; return x > 10 && x < 20 ? c : y === 1 ? a : y >= 2 && y <= 4 ? b : c; };
  if (D.updated) set('upd', 'Данные сервера на ' + parseInt(D.updated.slice(8, 10), 10) + ' ' + M[parseInt(D.updated.slice(5, 7), 10) - 1] + ' ' + D.updated.slice(0, 4) + ', ' + D.updated.slice(11, 16));
  var teachers = D.teachers.filter(function (n) { return !/ваканс/i.test(n); }).length;
  set('f-groups', D.groups.length); set('f-teachers', teachers); set('f-rooms', D.rooms.length);
  set('f-pairs', D.lessons.length); set('f-pairs-l', pl(D.lessons.length, 'пара', 'пары', 'пар') + ' в расписании');
  var last = D.scheduleWeek ? Math.round((Date.parse(D.scheduleWeek) - Date.parse(D.base)) / 604800000) + 1 : 0;
  if (last) { set('f-weeks', last); set('f-weeks-l', pl(last, 'неделя', 'недели', 'недель') + ' с ' + parseInt(D.base.slice(8, 10), 10) + ' ' + M[parseInt(D.base.slice(5, 7), 10) - 1]); }
})();
(function () {
  var box = document.getElementById('qr');
  var note = document.getElementById('qr-note');
  var hide = function (text) { box.style.display = 'none'; if (text) note.textContent = text; };
  if (location.protocol === 'file:') { hide('QR-код появится, когда сайт будет опубликован (например, на GitHub Pages).'); return; }
  try {
    var url = new URL('./', location.href).href;
    box.appendChild(window.KitisQR(url, 116, '#15171C', '#FFFFFF'));
    box.setAttribute('aria-label', 'QR-код: ' + url);
  } catch (e) { hide(); }
})();
