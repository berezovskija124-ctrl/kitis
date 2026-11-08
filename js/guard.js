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
  // любая кнопка или ссылка с data-a11y-toggle включает и выключает версию для слабовидящих
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-a11y-toggle]') : null;
    if (!t) return;
    e.preventDefault();
    window.KitisA11y.toggle();
  });
})();
