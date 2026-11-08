/*
 * Первый скрипт каждой страницы сайта КИТиС (подключается в <head>, до отрисовки).
 * 1. Защита от кликджекинга: страница не показывается внутри чужого сайта (iframe).
 * 2. Адрес сайта открывает главную страницу; расписание: телефон получает мобильный вид, компьютер — полный.
 * 3. Версия для слабовидящих: включается до отрисовки, чтобы страница не мигала.
 */
(function () {
  'use strict';
  var d = document.documentElement;
  var loc = window.location;

  var framed = false;
  if (loc.protocol !== 'file:' && window.top !== window.self) {
    try { framed = window.top.location.origin !== loc.origin; } catch (e) { framed = true; }
  }
  if (framed) {
    d.setAttribute('data-framed', '');
    document.addEventListener('DOMContentLoaded', function () {
      var body = document.body;
      while (body.firstChild) body.removeChild(body.firstChild);
      var p = document.createElement('p');
      p.style.cssText = 'font:16px/1.5 system-ui,sans-serif;padding:24px;margin:0';
      var a = document.createElement('a');
      a.href = loc.href;
      a.target = '_top';
      a.rel = 'noopener';
      a.textContent = 'Открыть сайт расписания КИТиС в отдельной вкладке';
      p.appendChild(a);
      body.appendChild(p);
    });
    return;
  }

  // Версия сайта, которую человек выбрал сам («Полная версия» на телефоне, «Версия для телефона»
  // на компьютере). Запоминается до закрытия вкладки; в адресе ничего не остаётся.
  var VIEW_KEY = 'kitis.view';
  function getView() { try { return window.sessionStorage.getItem(VIEW_KEY) || ''; } catch (e) { return ''; } }
  function setView(v) { try { window.sessionStorage.setItem(VIEW_KEY, v); } catch (e) { /* без запоминания */ } }
  // старые ссылки вида ?desktop=1, ?frame=1, ?view=phone: запоминаем выбор и убираем параметр из адреса
  var legacy = { desktop: 'desktop', frame: 'phone' };
  function dec(x) { try { return decodeURIComponent(x); } catch (e) { return ''; } }   // битый адрес не ломает страницу
  var parts = loc.search.replace(/^\?/, '').split('&').filter(Boolean);
  var kept = parts.filter(function (p) {
    var k = dec(p.split('=')[0] || '').toLowerCase();
    var v = dec(p.split('=')[1] || '').toLowerCase();
    if (legacy[k]) { setView(legacy[k]); return false; }
    if (k === 'view') { if (v === 'phone' || v === 'desktop') setView(v); return false; }
    return true;
  });
  var q = kept.length ? '?' + kept.join('&') : '';
  if (kept.length !== parts.length) {
    try { window.history.replaceState(window.history.state, '', loc.pathname + q + loc.hash); } catch (e) { /* адрес останется */ }
  }
  var view = getView();

  var mode = d.getAttribute('data-switch');
  if (mode) {
    var h = loc.hash;
    var w = Math.min(window.innerWidth || 9999, (window.screen && window.screen.width) || 9999);
    if (mode === 'entry') {
      // адрес сайта открывает главную страницу колледжа — и на компьютере, и на телефоне;
      // старые ссылки на расписание (#group=…, #teacher=…, #room=…, #tab=…) по-прежнему ведут в расписание
      var toSchedule = /(^#|&)(group|teacher|room|tab)=/.test(h);
      if (!toSchedule) { loc.replace('home.html' + q + h); return; }
      loc.replace((view ? (view === 'phone' ? 'phone.html' : 'desktop.html') : (w < 760 ? 'phone.html' : 'desktop.html')) + q + h); return;
    }
    if (mode === 'to-phone' && w < 760 && view !== 'desktop') { loc.replace('phone.html' + q + h); return; }
    if (mode === 'to-desktop' && w >= 1000 && view !== 'phone') { loc.replace('desktop.html' + q + h); return; }
  }
  // Демо-время (?now=2026-11-12T10:30): говорим об этом в полосе «Учебный проект» и даём выйти
  var demo = /(?:^|&)now=([^&]+)/.exec(q.replace(/^\?/, ''));
  if (demo) {
    document.addEventListener('DOMContentLoaded', function () {
      var bar = document.querySelector('.kb');
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(dec(demo[1]));
      if (!bar || !m) return;
      var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      var span = document.createElement('span');
      span.textContent = 'Демо: время на сайте — ' + parseInt(m[3], 10) + ' ' + MON[parseInt(m[2], 10) - 1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '') + ' · ';
      var a = document.createElement('a');
      a.href = loc.pathname + q.replace(/([?&])now=[^&]*&?/, '$1').replace(/[?&]$/, '') + loc.hash;
      a.textContent = 'настоящее время';
      span.appendChild(a);
      bar.appendChild(span);
    });
  }
  // ссылка с data-view="phone" / "desktop" запоминает выбранную версию перед переходом
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-view]') : null;
    var v = a ? a.getAttribute('data-view') : '';
    if (v === 'phone' || v === 'desktop') setView(v);
  }, true);

  var KEY = 'kitis.a11y';
  function read() { try { return window.localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function apply(on) { d.classList.toggle('a11y', !!on); }
  apply(read());
  window.KitisA11y = {
    on: function () { return d.classList.contains('a11y'); },
    toggle: function () {
      var on = !d.classList.contains('a11y');
      apply(on);
      try { window.localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* только на эту страницу */ }
      window.dispatchEvent(new Event('kitis-a11y'));
      return on;
    }
  };
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(e.newValue === '1'); });

  // 4. Запасной экран. Если страница не отрисовалась (например, браузер взял из кэша
  //    старый скрипт от прошлой версии сайта), один раз перезагружаем её сами,
  //    а если и это не помогло — показываем понятное сообщение вместо пустого экрана.
  var RELOAD_KEY = 'kitis.reload';
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('script[data-dc-script]')) return;
    setTimeout(function () {
      if (d.hasAttribute('data-dc-ready')) {
        try { window.sessionStorage.removeItem(RELOAD_KEY); } catch (e) { /* нет хранилища */ }
        return;
      }
      var last = 0;
      try { last = +window.sessionStorage.getItem(RELOAD_KEY) || 0; } catch (e) { last = Date.now(); }
      if (Date.now() - last > 60000) {
        try { window.sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch (e) { /* без повтора */ }
        loc.reload();
        return;
      }
      rescue();
    }, 3000);
  });

  function rescue() {
    var host = document.getElementById('app') || document.body;
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'max-width:420px;margin:48px auto;padding:24px;border-radius:16px;background:#fff;'
      + 'box-shadow:0 1px 3px rgba(0,0,0,.08);font:16px/1.5 Onest,system-ui,sans-serif;color:#1d2433;text-align:center';
    var h = document.createElement('div');
    h.style.cssText = 'font-weight:700;font-size:18px;margin-bottom:8px';
    h.textContent = 'Страница не загрузилась';
    var p = document.createElement('div');
    p.style.cssText = 'color:#5b6476;margin-bottom:16px';
    p.textContent = 'Сайт только что обновился, и браузер мог взять старую копию. Обновите страницу через минуту.';
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Обновить страницу';
    b.style.cssText = 'font:inherit;font-weight:600;padding:12px 20px;border:0;border-radius:12px;background:#2D5BE3;color:#fff;cursor:pointer';
    b.addEventListener('click', function () {
      try { window.sessionStorage.removeItem(RELOAD_KEY); } catch (e) { /* нет хранилища */ }
      loc.reload();
    });
    box.appendChild(h); box.appendChild(p); box.appendChild(b);
    host.appendChild(box);
  }
  // любая кнопка или ссылка с data-a11y-toggle включает и выключает версию для слабовидящих
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-a11y-toggle]') : null;
    if (!t) return;
    e.preventDefault();
    window.KitisA11y.toggle();
  });
})();
