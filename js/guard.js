/*
 * Первый скрипт каждой страницы сайта КИТиС (подключается в <head>, до отрисовки).
 * 1. Защита от кликджекинга: страница не показывается внутри чужого сайта (iframe).
 * 2. Одна ссылка для всех: телефон получает мобильный вид, компьютер — полный.
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

  var mode = d.getAttribute('data-switch');
  if (mode) {
    var q = loc.search, h = loc.hash;
    var w = Math.min(window.innerWidth || 9999, (window.screen && window.screen.width) || 9999);
    if (mode === 'entry') { loc.replace((w < 760 ? 'phone.html' : 'desktop.html') + q + h); return; }
    if (mode === 'to-phone' && w < 760 && !/[?&]desktop/.test(q)) { loc.replace('phone.html' + q + h); return; }
    if (mode === 'to-desktop' && w >= 1000 && !/[?&]frame/.test(q)) { loc.replace('desktop.html' + q + h); return; }
  }

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
