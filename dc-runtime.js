/*
 * Мини-движок шаблонов для страниц макета «Расписание КИТиС».
 * Понимает {{переменные}}, <sc-for>, <sc-if>, onClick / onChange
 * и класс Component extends DCLogic со setState — как в редакторе макета.
 * Без зависимостей: страница работает с любого статического хостинга (GitHub Pages).
 */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]*?)\s*\}\}$/;
  var seq = 0;

  /* ---------- значения ---------- */

  function literal(expr) {
    if (expr === 'true') return { v: true };
    if (expr === 'false') return { v: false };
    if (expr === 'null') return { v: null };
    if (/^-?\d+(\.\d+)?$/.test(expr)) return { v: parseFloat(expr) };
    var m = /^(['"])(.*)\1$/.exec(expr);
    return m ? { v: m[2] } : null;
  }

  function lookup(expr, scope) {
    var lit = literal(expr);
    if (lit) return lit.v;
    var parts = expr.split('.');
    var head = parts[0];
    var v;
    for (var s = scope; s; s = s.parent) {
      if (s.vars && Object.prototype.hasOwnProperty.call(s.vars, head)) { v = s.vars[head]; break; }
    }
    for (var i = 1; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function parseValue(str) {
    if (str == null) return { stat: '' };
    var m = WHOLE.exec(str);
    if (m) return { whole: m[1] };
    if (str.indexOf('{{') < 0) return { stat: str };
    var parts = [];
    var last = 0;
    str.replace(HOLE, function (all, expr, idx) {
      if (idx > last) parts.push(str.slice(last, idx));
      parts.push({ e: expr });
      last = idx + all.length;
      return all;
    });
    if (last < str.length) parts.push(str.slice(last));
    return { parts: parts };
  }

  function asText(v) {
    return (v == null || typeof v === 'boolean') ? '' : String(v);
  }

  function evalValue(pv, scope) {
    if ('stat' in pv) return pv.stat;
    if ('whole' in pv) return lookup(pv.whole, scope);
    var out = '';
    for (var i = 0; i < pv.parts.length; i++) {
      var p = pv.parts[i];
      out += typeof p === 'string' ? p : asText(lookup(p.e, scope));
    }
    return out;
  }

  /* ---------- компиляция шаблона ---------- */

  function compileKids(node) {
    var out = [];
    for (var c = node.firstChild; c; c = c.nextSibling) {
      var t = compile(c);
      if (t) out.push(t);
    }
    return out;
  }

  function compile(node) {
    if (node.nodeType === 3) return { k: 't', id: ++seq, pv: parseValue(node.nodeValue) };
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    if (tag === 'sc-for') {
      return { k: 'for', id: ++seq, list: parseValue(node.getAttribute('list')), as: node.getAttribute('as') || 'item', kids: compileKids(node) };
    }
    if (tag === 'sc-if') {
      return { k: 'if', id: ++seq, val: parseValue(node.getAttribute('value')), kids: compileKids(node) };
    }
    var attrs = [];
    var events = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      var name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      if (name.indexOf('data-dc-') === 0) name = name.slice(8); // d="{{…}}" спрятан от парсера SVG
      if (/^on[a-z]+$/.test(name)) {
        var ev = name.slice(2);
        if (ev === 'change') ev = 'input';
        events.push({ ev: ev, pv: parseValue(a.value) });
        continue;
      }
      attrs.push({ name: name, pv: parseValue(a.value) });
    }
    return { k: 'el', id: ++seq, tag: tag, ns: node.namespaceURI, attrs: attrs, events: events, kids: compileKids(node) };
  }

  /* ---------- построение виртуального дерева ---------- */

  function expand(kids, scope, prefix, out) {
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.k === 't') {
        out.push({ t: 1, key: prefix + c.id, text: asText(evalValue(c.pv, scope)) });
      } else if (c.k === 'if') {
        if (evalValue(c.val, scope)) expand(c.kids, scope, prefix, out);
      } else if (c.k === 'for') {
        var list = evalValue(c.list, scope) || [];
        for (var j = 0; j < list.length; j++) {
          var vars = { $index: j };
          vars[c.as] = list[j];
          expand(c.kids, { vars: vars, parent: scope }, prefix + c.id + ':' + j + '/', out);
        }
      } else {
        var attrs = {};
        for (var a = 0; a < c.attrs.length; a++) attrs[c.attrs[a].name] = evalValue(c.attrs[a].pv, scope);
        var events = {};
        for (var e = 0; e < c.events.length; e++) events[c.events[e].ev] = evalValue(c.events[e].pv, scope);
        out.push({ t: 0, key: prefix + c.id, tag: c.tag, ns: c.ns, attrs: attrs, events: events, kids: expand(c.kids, scope, '', []) });
      }
    }
    return out;
  }

  /* ---------- обновление настоящего DOM ---------- */

  function setAttr(el, name, val) {
    if (val == null || val === false) el.removeAttribute(name);
    else el.setAttribute(name, val === true ? '' : String(val));
  }

  function bindEvents(el, events) {
    el.__ev = events;
    el.__bound = el.__bound || {};
    for (var type in events) {
      if (el.__bound[type]) continue;
      el.__bound[type] = true;
      (function (t) {
        el.addEventListener(t, function (e) {
          var h = el.__ev && el.__ev[t];
          if (typeof h === 'function') h(e);
        });
      })(type);
    }
  }

  function create(v) {
    if (v.t === 1) {
      var tn = document.createTextNode(v.text);
      tn.__key = v.key;
      return tn;
    }
    var el = v.ns === SVG_NS ? document.createElementNS(SVG_NS, v.tag) : document.createElement(v.tag);
    el.__key = v.key;
    el.__attrs = {};
    for (var name in v.attrs) {
      setAttr(el, name, v.attrs[name]);
      el.__attrs[name] = v.attrs[name];
    }
    bindEvents(el, v.events);
    patchChildren(el, v.kids);
    return el;
  }

  function same(node, v) {
    if (v.t === 1) return node.nodeType === 3;
    return node.nodeType === 1 && node.localName === v.tag && node.namespaceURI === v.ns;
  }

  function update(node, v) {
    if (v.t === 1) {
      if (node.nodeValue !== v.text) node.nodeValue = v.text;
      return;
    }
    var old = node.__attrs || {};
    for (var name in v.attrs) {
      if (old[name] !== v.attrs[name]) setAttr(node, name, v.attrs[name]);
    }
    for (var o in old) {
      if (!(o in v.attrs)) node.removeAttribute(o);
    }
    node.__attrs = v.attrs;
    bindEvents(node, v.events);
    patchChildren(node, v.kids);
  }

  function patchChildren(parent, vkids) {
    var want = {};
    for (var i = 0; i < vkids.length; i++) want[vkids[i].key] = vkids[i];
    var existing = {};
    var n = parent.firstChild;
    while (n) {
      var next = n.nextSibling;
      var v = n.__key != null ? want[n.__key] : null;
      if (!v || !same(n, v) || existing[n.__key]) parent.removeChild(n);
      else existing[n.__key] = n;
      n = next;
    }
    for (var j = 0; j < vkids.length; j++) {
      var vk = vkids[j];
      var node = existing[vk.key];
      if (node) update(node, vk);
      else node = create(vk);
      var at = parent.childNodes[j];
      if (at !== node) parent.insertBefore(node, at || null);
    }
  }

  /* ---------- компонент ---------- */

  var schedule = function () {};

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(partial) {
      var prev = this.state || {};
      var next = typeof partial === 'function' ? partial(prev, this.props) : partial;
      this.state = Object.assign({}, prev, next);
      schedule();
    }
    forceUpdate() { schedule(); }
  }
  window.DCLogic = DCLogic;

  /* ---------- подгонка размеров для макетов фиксированной ширины ---------- */

  function fit(app) {
    var root = document.documentElement;
    var mode = root.getAttribute('data-fit');
    if (!mode) return;
    var w = parseFloat(root.getAttribute('data-w')) || 0;
    var h = parseFloat(root.getAttribute('data-h')) || 0;
    var bar = document.querySelector('.kb');
    var barH = bar ? bar.offsetHeight : 0;
    root.style.setProperty('--kb-h', barH + 'px');
    var vw = root.clientWidth || window.innerWidth;
    var vh = root.clientHeight || window.innerHeight;
    var z = 1;
    if (mode === 'phone') {
      var small = vw <= 520;
      root.classList.toggle('phone-full', small);
      if (!small) z = Math.min(1, (vh - barH - 68) / h);
    } else {
      z = Math.min(1, (vw - 32) / w);
    }
    app.style.zoom = String(Math.max(z, 0.2));
  }

  /* ---------- запуск ---------- */

  function boot() {
    var xdc = document.querySelector('x-dc');
    var script = document.querySelector('script[data-dc-script]');
    var app = document.getElementById('app');
    if (!xdc || !script || !app) return;

    var helmet = xdc.querySelector('helmet');
    if (helmet) {
      while (helmet.firstChild) document.head.appendChild(helmet.firstChild);
      helmet.parentNode.removeChild(helmet);
    }
    var rootKids = compileKids(xdc);
    xdc.parentNode.removeChild(xdc);

    var props = {};
    try {
      var decl = JSON.parse(script.getAttribute('data-props') || '{}');
      for (var k in decl) {
        if (k.charAt(0) !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k]['default'];
      }
    } catch (e) { /* без настроек */ }

    var Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
    var inst = new Component(props);

    var pending = false;
    function render() {
      pending = false;
      try {
        var vals = inst.renderVals ? inst.renderVals() : {};
        patchChildren(app, expand(rootKids, { vars: vals, parent: null }, '', []));
      } catch (err) {
        console.error('[макет] ошибка отрисовки', err);
      }
    }
    schedule = function () {
      if (pending) return;
      pending = true;
      Promise.resolve().then(render);
    };

    render();
    fit(app);
    window.addEventListener('resize', function () { fit(app); });
    if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
    window.addEventListener('pagehide', function () {
      if (typeof inst.componentWillUnmount === 'function') inst.componentWillUnmount();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
