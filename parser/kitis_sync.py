#!/usr/bin/env python3
"""
Робот «Материалы с kitis.ru».

Забирает с сайта колледжа официальные разделы (Сведения об образовательной организации,
Обращения, Противодействие коррупции и др.), страницы для студентов, преподавателей и
абитуриентов, а также фотографии новостей, объявлений, мероприятий и фотогалереи.
Результат сохраняется в репозиторий сайта:

  data/kitis-official.js   разделы в виде блоков (заголовки, текст, списки, таблицы, документы, фото)
  data/kitis-photos.js     фотоальбомы новостей, объявлений, мероприятий и галереи
  photos/                  сами фотографии: <id>.jpg (до 1200 px) и <id>-s.jpg (превью до 560 px)
  parser/sync-report.json  отчёт: что скачано, что не получилось

Запускается в GitHub Actions (.github/workflows/sync-kitis.yml). Локально:
  pip install beautifulsoup4 lxml pillow && python3 parser/kitis_sync.py
Переменная KITIS_BASE меняет адрес сайта (для проверки на копии).

Что не переносится: фотографии со страниц «Сведений» (портреты сотрудников) и личные данные
студентов — только ссылки на документы колледжа.
"""
import hashlib
import io
import json
import os
import re
import sys
import time
import unicodedata
from collections import Counter, OrderedDict
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse, urlsplit, urlunparse, urlunsplit, unquote
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup, Comment, NavigableString, Tag
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT_OFFICIAL = ROOT / 'data' / 'kitis-official.js'
OUT_PHOTOS = ROOT / 'data' / 'kitis-photos.js'
PHOTO_DIR = ROOT / 'photos'
REPORT = ROOT / 'parser' / 'sync-report.json'

BASE = os.environ.get('KITIS_BASE', 'https://kitis.ru').rstrip('/')
PUBLIC = 'https://kitis.ru'          # так ссылки показываются на сайте
UA = ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 '
      'KITiS-study-site-sync/1.0 (+https://github.com/berezovskija124-ctrl/kitis)')
DELAY = float(os.environ.get('KITIS_DELAY', '0.2'))
MAX_PAGE_BYTES = 4_000_000
MAX_IMG_BYTES = 25_000_000
MAX_REQUESTS = 1500
MAX_CHILDREN = 25
MAX_PHOTOS = 600
MAX_PER_ALBUM = 24
MAX_LIST_PAGES = 4
LIMIT_ALBUMS = {'news': 60, 'announce': 20, 'events': 20, 'gallery': 40, 'abitur': 40}
FULL_PX, THUMB_PX = 1200, 560
Image.MAX_IMAGE_PIXELS = 60_000_000

GROUPS = [
    ('sveden', 'Сведения об организации'),
    ('official', 'Официально'),
    ('students', 'Студентам'),
    ('teachers', 'Преподавателям'),
    ('abitur', 'Абитуриентам'),
]
# id, группа, название, подпись, значок, адрес на kitis.ru
PAGES = [
    ('forms', 'official', 'Обращения', 'Как написать в колледж', 'megaphone', '/forms/'),
    ('anti-corruption', 'official', 'Противодействие коррупции', 'Документы и сообщения', 'file', '/anti-corruption/'),
    ('security', 'official', 'Комплексная безопасность', 'Безопасность в колледже', 'target', '/security/'),
    ('antiterrorist', 'official', 'Антитеррористическая защищённость', 'Памятки и документы', 'target', '/antiterrorist/'),
    ('information-security', 'official', 'Информационная безопасность', 'Безопасность в интернете', 'laptop', '/information-security/'),
    ('bpoo', 'official', 'БПОО', 'Базовая профессиональная организация', 'star', '/BPOO/'),
    ('tenders', 'official', 'Закупки', 'Закупки колледжа', 'briefcase', '/tenders/'),
    ('obr-kredit', 'official', 'Образовательный кредит в СПО', 'Как получить кредит', 'book', '/obr-kredit/'),
    ('st-training-part', 'students', 'Учебная часть', 'Справки и заявления', 'file', '/students/training-part/'),
    ('st-materials', 'students', 'Учебные материалы', 'Материалы для занятий', 'book', '/students/educational-materials/'),
    ('st-gia', 'students', 'ГИА', 'Государственная итоговая аттестация', 'trophy', '/students/gia/'),
    ('st-attestation', 'students', 'Графики аттестаций', 'Прошедшие академические аттестации', 'calendar', '/students/grafiki-proshedshih-akademicheskih-attestacij/'),
    ('st-hostel', 'students', 'Общежитие', 'Для студентов', 'home', '/students/hostel/'),
    ('st-olympiads', 'students', 'Олимпиады и конкурсы', 'Для студентов', 'trophy', '/students/olimpiady/'),
    ('tc-docs', 'teachers', 'Методические материалы', 'Документы для преподавателей', 'book', '/teachers/docs/'),
    ('tc-attestation', 'teachers', 'Аттестация', 'Аттестация педагогов', 'star', '/teachers/attestation/'),
    ('tc-method', 'teachers', 'Учебно-методическая работа', 'Методическая служба', 'file', '/teachers/educational-methodical-work/'),
    ('tc-upbringing', 'teachers', 'Воспитательная работа', 'Планы и мероприятия', 'compass', '/teachers/educational-work/'),
    ('tc-announce', 'teachers', 'Объявления', 'Для преподавателей', 'megaphone', '/teachers/announcing/'),
    ('tc-bureaucracy', 'teachers', 'Снижение бюрократической нагрузки', 'Что изменилось для педагогов', 'clock', '/teachers/snizheniye-byurokraticheskoy-nagruzki/'),
    ('ab-hostel', 'abitur', 'Заселение в общежитие', 'Для поступающих', 'home', '/abitur/hostel/'),
    ('ab-credit', 'abitur', 'Образовательный кредит', 'Для поступающих', 'book', '/abitur/obrazovatelnyy-kredit/'),
    ('ab-target', 'abitur', 'Целевое обучение', 'Обучение по договору', 'target', '/abitur/tselevoe-obuchenie/'),
    ('ab-faq', 'abitur', 'Вопросы и ответы', 'Для поступающих', 'help', '/abitur/faq-abitur/'),
]
SVEDEN_ROOT = '/sveden/'
SVEDEN_FALLBACK = ['common', 'struct', 'document', 'education', 'eduStandarts', 'managers', 'employees',
                   'objects', 'grants', 'paid_edu', 'budget', 'vacant', 'inter', 'catering', 'ovz']
DEBUG_PATHS = {'/sveden/common/'}   # для этих страниц отчёт всегда содержит схему разметки
NO_PHOTO_PATH = re.compile(r'/sveden/|employee|manager|rukovod|sotrudnik|pedagog|staff|teachers-list|doska|pochet', re.I)
# ленты, из которых берутся фотоальбомы: сначала медиацентр колледжа, потом новости для абитуриентов
MEDIA_KINDS = [
    ('news', re.compile(r'^(все\s+)?новости', re.I), ['/press-center/news/', '/news/']),
    ('announce', re.compile(r'^(все\s+)?объявлени', re.I), ['/press-center/announcements/', '/press-center/announce/', '/press-center/ads/']),
    ('events', re.compile(r'^(все\s+)?мероприяти', re.I), ['/press-center/events/', '/press-center/meropriyatiya/']),
    ('gallery', re.compile(r'фото|галере', re.I), ['/press-center/photo/', '/press-center/gallery/']),
    ('abitur', re.compile(r'^$'), ['/abitur/news/']),
]

DOC_EXT = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp', 'zip', 'rar', '7z', 'txt', 'csv', 'sig'}
IMG_EXT = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'}
SKIP_TAGS = {'script', 'style', 'noscript', 'template', 'svg', 'canvas', 'object', 'embed', 'form', 'input', 'button',
             'select', 'textarea', 'header', 'footer', 'nav', 'aside', 'map', 'audio', 'video', 'source', 'link', 'meta'}
BLOCK_TAGS = {'p', 'div', 'section', 'article', 'main', 'blockquote', 'figure', 'figcaption', 'dl', 'dt', 'dd', 'center',
              'fieldset', 'pre', 'address', 'li', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot', 'details', 'summary', 'hr'}
NEG = re.compile(r'(^|[\s_-])(header|footer|menu|nav|navbar|sidebar|breadcrumbs?|social|share|search|cookie|modal|popup|'
                 r'subscribe|copyright|bx-panel|pagination|pager|counter|metrika|bvi|visually|special-version|up-button|scroll-?top)([\s_-]|$)', re.I)
JUNK = {'подробнее', 'читать далее', 'читать полностью', 'назад', 'вернуться назад', 'скачать', 'версия для печати', 'поделиться',
        'открыть', 'смотреть', '|', '•', '-', '—', 'далее', 'все новости', 'показать еще', 'показать ещё'}
GENERIC_LINK = re.compile(r'^(скачать|открыть|смотреть|посмотреть|ссылка|здесь|тут|файл|документ|подробнее|перейти|по ссылке|читать)\b', re.I)
MONTHS = {'январ': 1, 'феврал': 2, 'март': 3, 'апрел': 4, 'ма': 5, 'июн': 6, 'июл': 7, 'август': 8, 'сентябр': 9,
          'октябр': 10, 'ноябр': 11, 'декабр': 12}
ICONS = {'sveden': 'file'}

report = OrderedDict(source=BASE, pages=[], lists=[], errors=[], counts={})
requests_made = 0


# ---------- сеть ----------

def log(*a):
    print(*a, flush=True)


def fetch(url, limit=MAX_PAGE_BYTES):
    global requests_made
    last = None
    for attempt in range(3):
        if requests_made >= MAX_REQUESTS:
            raise RuntimeError('достигнут лимит запросов')
        requests_made += 1
        try:
            time.sleep(DELAY * (1 + attempt))
            req = Request(iri(url), headers={'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.5',
                                        'Accept': 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8'})
            with urlopen(req, timeout=45) as r:
                data = r.read(limit + 1)
                if len(data) > limit:
                    raise ValueError('слишком большой файл')
                return r.geturl(), (r.headers.get('Content-Type') or '').lower(), data
        except Exception as e:  # noqa: BLE001 — любая сетевая ошибка: пробуем ещё раз
            last = e
    raise last


def iri(u):
    """Адрес с русскими буквами и пробелами → допустимый для HTTP (уже закодированное не трогаем)."""
    p = urlsplit(u)
    host = p.netloc
    try:
        host.encode('ascii')
    except UnicodeEncodeError:
        host = host.encode('idna').decode('ascii')
    return urlunsplit((p.scheme, host, quote(p.path, safe="/%:@!$&'()*+,;=-._~"),
                       quote(p.query, safe="=&%:@!$'()*+,;/?-._~"), ''))


def to_fetch_url(u):
    """Адрес для скачивания: kitis.ru → KITIS_BASE (для проверки на копии)."""
    p = urlparse(u)
    if is_kitis_host(p.netloc) and BASE != PUBLIC:
        b = urlparse(BASE)
        return urlunparse((b.scheme, b.netloc, p.path, '', p.query, ''))
    return u


def is_kitis_host(host):
    host = (host or '').lower().split(':')[0]
    base_host = urlparse(BASE).netloc.lower().split(':')[0]
    return host in ('kitis.ru', 'www.kitis.ru') or (base_host and host == base_host)


def canon(href, base_url):
    """Абсолютная ссылка без якоря; адреса kitis.ru — всегда https://kitis.ru/..."""
    if not href:
        return ''
    href = href.strip()
    if href.startswith(('mailto:', 'tel:')):
        return href
    if re.match(r'^(javascript|data|vbscript|file):', href, re.I) or href.startswith('#'):
        return ''
    u = urljoin(base_url, href)
    p = urlparse(u)
    if p.scheme not in ('http', 'https'):
        return ''
    if is_kitis_host(p.netloc):
        path = re.sub(r'/index\.php$', '/', p.path or '/')
        return iri(urlunparse(('https', 'kitis.ru', path, '', p.query, '')))
    return urlunparse((p.scheme, p.netloc.lower(), p.path, '', p.query, ''))


def ext_of(u):
    path = unquote(urlparse(u).path).lower()
    m = re.search(r'\.([a-z0-9]{2,5})$', path)
    return m.group(1) if m else ''


def is_doc(u):
    return ext_of(u) in DOC_EXT


def is_img(u):
    return ext_of(u) in IMG_EXT


def is_kitis_page(u):
    p = urlparse(u)
    return p.netloc == 'kitis.ru' and not is_doc(u) and not is_img(u)


def path_of(u):
    p = urlparse(u).path or '/'
    return p if p.endswith('/') or '.' in p.rsplit('/', 1)[-1] else p + '/'


# ---------- текст ----------

def clean(s):
    s = unicodedata.normalize('NFC', str(s))
    s = s.replace('\xa0', ' ').replace('​', '').replace('﻿', '').replace('­', '')
    s = re.sub(r'[\u0000-\u0008\u000b-\u001f\u007f]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


JUNK_TOKEN = re.compile(r'[A-Za-z0-9_+/=-]{40,}')


def is_junk(text):
    """Служебные строки (ключи, коды встраивания) вместо текста: длинные «слова» латиницей без пробелов."""
    m = JUNK_TOKEN.findall(text)
    return bool(m) and sum(len(x) for x in m) > 0.4 * len(text) and not re.search(r'https?://', text)


def short(s, n=4000):
    s = clean(s)
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'


def file_title(u):
    name = unquote(urlparse(u).path.rsplit('/', 1)[-1])
    name = re.sub(r'\.[a-z0-9]{2,5}$', '', name, flags=re.I).replace('+', ' ').replace('_', ' ')
    return clean(name) or 'Документ'


def doc_title(text, link_text):
    """Название документа: текст пункта без слов «скачать», «открыть» и т. п."""
    text, link_text = clean(text), clean(link_text)
    if link_text and GENERIC_LINK.match(link_text):
        text = clean(text.replace(link_text, ' '))
    text = re.sub(r'^[\s\-–—:•·]+|[\s\-–—:•·(]+$', '', text)
    text = re.sub(r'\(\s*(pdf|docx?|xlsx?|rtf|zip|rar)[^)]*\)\s*$', '', text, flags=re.I).strip()
    return text if len(text) > 2 else (link_text if link_text and not GENERIC_LINK.match(link_text) else '')


def parse_date(text):
    text = text.lower()
    m = re.search(r'\b(\d{1,2})\.(\d{1,2})\.(20\d\d)\b', text)
    if m:
        return '%s-%02d-%02d' % (m.group(3), int(m.group(2)), int(m.group(1)))
    m = re.search(r'\b(\d{1,2})\s+(январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-я]*\s+(20\d\d)', text)
    if m:
        key = 'ма' if m.group(2).startswith('ма') else m.group(2)
        return '%s-%02d-%02d' % (m.group(3), MONTHS[key], int(m.group(1)))
    return ''


# ---------- страницы ----------

pages = OrderedDict()   # url -> {'soup', 'final', 'links'}


def get_page(url):
    if url in pages:
        return pages[url]
    rec = {'soup': None, 'final': url, 'links': set(), 'error': ''}
    try:
        final, ctype, data = fetch(to_fetch_url(url))
        if 'html' not in ctype and not data.lstrip()[:200].lower().startswith((b'<!doctype', b'<html')):
            raise ValueError('не HTML: ' + ctype)
        soup = BeautifulSoup(data, 'lxml')
        rec['soup'] = soup
        rec['final'] = canon(final, final) or url
        rec['links'] = {canon(a.get('href'), url) for a in soup.find_all('a', href=True)} - {''}
    except Exception as e:  # noqa: BLE001
        rec['error'] = str(e)[:200]
        report['errors'].append({'url': url, 'error': rec['error']})
        log('  ошибка', url, rec['error'])
    pages[url] = rec
    return rec


def page_title(soup):
    for h in soup.find_all('h1'):
        t = clean(h.get_text(' '))
        if 2 < len(t) < 300 and t.lower() not in ('китис', 'колледж информационных технологий и строительства'):
            return t
    t = clean(soup.title.get_text(' ')) if soup.title else ''
    return re.split(r'\s[|–—-]\s', t)[0] if t else ''


class Boiler:
    """Ссылки и тексты, которые повторяются почти на каждой странице, — это меню, шапка и подвал."""

    def __init__(self):
        self.links = set()
        self.group_links = {}
        self.texts = set()

    def build(self):
        soups = [(u, r) for u, r in pages.items() if r['soup'] is not None]
        n = len(soups)
        if not n:
            return
        cnt = Counter()
        for _, r in soups:
            cnt.update(r['links'])
        lim = max(4, int(n * 0.4))
        self.links = {l for l, c in cnt.items() if c >= lim}
        by_group = {}
        for u, r in soups:
            seg = urlparse(u).path.strip('/').split('/')[0]
            by_group.setdefault(seg, []).append(r)
        for seg, rs in by_group.items():
            if len(rs) < 3:
                continue
            c = Counter()
            for r in rs:
                c.update(r['links'])
            self.group_links[seg] = {l for l, k in c.items() if k >= max(3, int(len(rs) * 0.6))}
        tc = Counter()
        for _, r in soups:
            seen = set()
            for el in r['soup'].find_all(['p', 'li', 'span', 'div', 'h2', 'h3', 'h4', 'a', 'td']):
                if el.find(['p', 'div', 'li', 'table']):
                    continue
                t = clean(el.get_text(' '))
                if 12 <= len(t) <= 400:
                    seen.add(t)
            tc.update(seen)
        self.texts = {t for t, c in tc.items() if c >= max(4, int(n * 0.4))}
        report['counts']['boilerplate_links'] = len(self.links)
        report['counts']['boilerplate_texts'] = len(self.texts)

    def is_link(self, href, seg):
        return href in self.links or href in self.group_links.get(seg, ())


boiler = Boiler()


def strip_page(soup, url):
    """Убирает со страницы шапку, меню, подвал и повторяющиеся блоки. Возвращает (контейнер, h1)."""
    body = soup.body or soup
    for c in body.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    h1 = None
    title = page_title(soup)
    for h in body.find_all('h1'):
        if clean(h.get_text(' ')) == title:
            h1 = h
            break
    keep = set(id(x) for x in (h1.parents if h1 else []))
    keep.add(id(h1))
    for el in list(body.find_all(True)):
        if el.decomposed or id(el) in keep:
            continue
        if el.name in SKIP_TAGS and el.name != 'iframe':
            el.decompose()
            continue
        cls = ' '.join(el.get('class') or []) + ' ' + (el.get('id') or '')
        if cls.strip() and NEG.search(cls):
            el.decompose()
        # скрытые блоки не трогаем: в свёрнутых вкладках и аккордеонах тоже содержимое страницы
    seg = urlparse(url).path.strip('/').split('/')[0]
    own = path_of(url)
    main_el = h1.find_parent('main') if h1 is not None else None
    for el in list(body.find_all(['ul', 'ol', 'div', 'section', 'table', 'p', 'span'])):
        if el.decomposed or id(el) in keep:
            continue
        links = [a for a in el.find_all('a', href=True)]
        text = clean(el.get_text(' '))
        if len(links) >= 3:
            hrefs = [canon(a.get('href'), url) for a in links]
            # подразделы самой страницы — это её содержание, даже если они есть в меню сайта
            nb = sum(1 for h in hrefs if not h or (boiler.is_link(h, seg) and not (path_of(h).startswith(own) and path_of(h) != own)))
            if nb / len(links) >= 0.7:
                link_text = sum(len(clean(a.get_text(' '))) for a in links)
                if len(text) - link_text <= 40 + 0.25 * len(text):
                    el.decompose()
                    continue
        inside_main = main_el is not None and el.find_parent('main') is main_el
        if text in boiler.texts and not inside_main and not el.find(['img', 'table']):
            el.decompose()
    # контейнер: ближайший предок заголовка, в котором уже есть содержимое страницы
    if h1 is None:
        return body, None

    def weight(n):
        return (len(clean(n.get_text(' '))) + 120 * len(n.find_all('img')) + 80 * len(n.find_all('table'))
                + 60 * sum(1 for a in n.find_all('a', href=True) if is_doc(canon(a.get('href'), url))))
    base = weight(h1)
    node = h1
    while node.parent is not None and node.parent.name not in ('body', 'html', '[document]'):
        node = node.parent
        if weight(node) - base >= 150 or node is main_el:
            return node, h1
    return body, h1


class Builder:
    def __init__(self, url, title, link_map, allow_photos, skip_urls=()):
        self.url = url
        self.title = title
        self.link_map = link_map
        self.allow_photos = allow_photos
        self.skip_urls = set(skip_urls)
        self.blocks = []
        self.buf = []
        self.buf_links = []
        self.started = False
        self.photos = []          # адреса фото в порядке появления
        self.children = []        # ссылки на подстраницы
        self.seen = set()

    # -- блоки --
    def add(self, b):
        if b['t'] in ('docs', 'links', 'go', 'photos', 'list') and self.blocks and self.blocks[-1]['t'] == b['t']:
            last = self.blocks[-1]['items']
            for it in b['items']:
                if it not in last:
                    last.append(it)
            return
        if b['t'] in ('p', 'h') and self.blocks and self.blocks[-1] == b:
            return
        self.blocks.append(b)

    def add_link(self, href, text, ctx=''):
        if not href or href in self.skip_urls:
            return
        text = clean(text)
        if href.startswith(('mailto:', 'tel:')):
            return
        if is_img(href):
            self.add_photo(href, text)
            return
        if is_doc(href):
            title = text if text and not GENERIC_LINK.match(text) and len(text) > 2 else (clean(ctx) or file_title(href))
            self.add({'t': 'docs', 'items': [[short(title, 300), href, ext_of(href).upper()]]})
            return
        if is_kitis_page(href):
            path = path_of(href)
            sid = self.link_map.get(path)
            if sid and path == path_of(self.url):
                return
            if sid:
                self.add({'t': 'go', 'items': [[short(text or 'Перейти', 120), sid]]})
                return
            own = path_of(self.url)
            if path.startswith(own) and path != own:
                if href not in self.children:
                    self.children.append(href)
                return
            if path in ('/', own):
                return
        if text and text.lower() not in JUNK:
            self.add({'t': 'links', 'items': [[short(text, 200), href, 'kitis.ru' if is_kitis_page(href) else '']]})

    def add_photo(self, src, alt=''):
        if not self.allow_photos or not src or src in self.seen:
            return
        low = src.lower()
        if re.search(r'/bitrix/|/local/templates/|/templates/|logo|icon|sprite|banner|button|arrow|\.svg|\.gif', low):
            return
        self.seen.add(src)
        self.photos.append(src)
        self.add({'t': 'photos', 'items': [[src, short(alt, 200)]]})

    def flush(self):
        if not self.buf and not self.buf_links:
            return
        raw = ''.join(self.buf)
        links = self.buf_links
        self.buf, self.buf_links = [], []
        lines = [clean(x) for x in raw.split('\n')]
        lines = [x for x in lines if x and x.lower() not in JUNK]
        whole = ' '.join(lines)
        if len(links) == 1 and is_doc(links[0][0]) and len(whole) < 300:
            self.add_link(links[0][0], doc_title(whole, links[0][1]))
            return
        link_text = ''.join(clean(t) for _, t in links)
        rest = re.sub(r'\W', '', ''.join(lines))
        only_links = links and len(rest) - len(re.sub(r'\W', '', link_text)) < 3
        if not only_links:
            for ln in lines:
                if len(ln) >= 2 and not is_junk(ln):
                    self.add({'t': 'p', 'text': short(ln)})
        ctx = ' '.join(lines)
        for href, t in links:
            self.add_link(href, t, ctx if only_links and len(links) == 1 else '')

    # -- обход --
    def walk(self, node):
        for ch in list(node.children):
            if isinstance(ch, Comment):
                continue
            if isinstance(ch, NavigableString):
                if self.started:
                    self.buf.append(str(ch))
                continue
            if not isinstance(ch, Tag) or ch.decomposed:
                continue
            name = ch.name
            if name == 'h1' and clean(ch.get_text(' ')) == self.title:
                self.flush()
                self.started = True
                continue
            if not self.started:
                if ch.find('h1') is not None:
                    self.walk(ch)
                continue
            if name in SKIP_TAGS:
                continue
            if name == 'iframe':
                self.flush()
                src = canon(ch.get('src') or ch.get('data-src'), self.url)
                if re.search(r'youtube|youtu\.be|rutube|vk\.com|vkvideo|dzen', src or ''):
                    self.add({'t': 'links', 'items': [['Видео', src, '']]})
                continue
            if re.match(r'h[1-6]$', name):
                self.flush()
                t = short(ch.get_text(' '), 300)
                if t and t.lower() not in JUNK:
                    self.add({'t': 'h', 'text': t})
                for a in ch.find_all('a', href=True):
                    self.add_link(canon(a.get('href'), self.url), a.get_text(' '))
                continue
            if name in ('ul', 'ol'):
                self.flush()
                self.list(ch)
                continue
            if name == 'table':
                self.flush()
                self.table(ch)
                continue
            if name == 'img':
                self.flush()
                self.image(ch, None)
                continue
            if name == 'a':
                href = canon(ch.get('href'), self.url)
                img = ch.find('img')
                if img is not None:
                    self.flush()
                    if not href or is_img(href):
                        self.image(img, href or None)
                    else:
                        # картинка-ссылка на другую страницу (баннер, превью другой новости) — не фото раздела
                        self.add_link(href, ch.get_text(' ') or img.get('alt') or '')
                    continue
                if ch.find(['p', 'div', 'h2', 'h3', 'h4', 'li']):
                    self.flush()
                    self.walk(ch)
                    self.flush()
                    if href:
                        self.add_link(href, clean(ch.get_text(' '))[:200])
                    continue
                t = ch.get_text(' ')
                self.buf.append(t)
                if href:
                    self.buf_links.append((href, t))
                continue
            if name == 'br':
                self.buf.append('\n')
                continue
            if name in BLOCK_TAGS:
                self.flush()
                if not self.pair(ch):
                    self.walk(ch)
                self.flush()
                continue
            self.walk(ch)

    def pair(self, el):
        """Строка вида «Подпись | значение» (как в «Сведениях об организации») → пункт блока facts."""
        kids = [c for c in el.children if isinstance(c, Tag) and not c.decomposed]
        loose = clean(''.join(str(c) for c in el.children if isinstance(c, NavigableString) and not isinstance(c, Comment)))
        if len(kids) != 2 or loose or el.name not in ('div', 'tr', 'dl', 'p', 'li'):
            return False
        a, b = kids
        if a.name not in ('div', 'span', 'dt', 'td', 'th', 'strong', 'b', 'label') or b.name not in ('div', 'span', 'dd', 'td', 'p', 'a'):
            return False
        if a.find(['ul', 'ol', 'table', 'img']) or len(a.find_all(['p', 'div'])) > 2 or b.find(['ul', 'ol', 'table', 'img', 'h2', 'h3']):
            return False
        la, lb = short(a.get_text(' '), 200), short(b.get_text(' '), 1500)
        if not (2 <= len(la) <= 150) or not lb or la.endswith('.'):
            return False
        links = [canon(x.get('href'), self.url) for x in ([b] if b.name == 'a' else b.find_all('a', href=True)) if x.get('href')]
        links = [h for h in links if h]
        item = [la.rstrip(':'), lb] + ([links[0]] if len(links) == 1 else [])
        if self.blocks and self.blocks[-1]['t'] == 'facts':
            self.blocks[-1]['items'].append(item)
        else:
            self.blocks.append({'t': 'facts', 'items': [item]})
        for h in links[1:] if len(links) > 1 else []:
            self.add_link(h, '')
        return True

    def image(self, img, full):
        src = full or img.get('data-src') or img.get('data-original') or img.get('data-lazy') or img.get('src') or ''
        if not full and not src and img.get('srcset'):
            src = img.get('srcset').split(',')[0].strip().split(' ')[0]
        src = canon(src, self.url)
        try:
            w = int(re.sub(r'\D', '', str(img.get('width') or '0')) or 0)
            h = int(re.sub(r'\D', '', str(img.get('height') or '0')) or 0)
        except ValueError:
            w = h = 0
        if (w and w < 120) or (h and h < 90):
            return
        if src and urlparse(src).netloc == 'kitis.ru':
            self.add_photo(src, img.get('alt') or img.get('title') or '')

    def list(self, ul):
        items = []
        for li in ul.find_all('li', recursive=False) or ul.find_all('li'):
            links = [(canon(a.get('href'), self.url), a.get_text(' ')) for a in li.find_all('a', href=True)]
            for img in li.find_all('img'):
                self.image(img, None)
            text = short(li.get_text(' '), 1500)
            if len(links) == 1 and is_doc(links[0][0]) and len(text) < 400:
                # пункт «документ + пояснение» — это один документ, название берём из текста пункта
                self.add_link(links[0][0], doc_title(text, links[0][1]))
                continue
            link_text = re.sub(r'\W', '', ''.join(clean(t) for _, t in links))
            only = links and len(re.sub(r'\W', '', text)) - len(link_text) < 3
            if text and not only and text.lower() not in JUNK and not is_junk(text):
                items.append(text)
            for href, t in links:
                self.add_link(href, t, text if only and len(links) == 1 else '')
        if items:
            # документы, найденные внутри списка, идут после его пунктов
            tail = []
            while self.blocks and self.blocks[-1]['t'] in ('docs', 'links', 'go', 'photos'):
                tail.insert(0, self.blocks.pop())
            self.add({'t': 'list', 'items': items[:300]})
            for b in tail:
                self.blocks.append(b)

    def table(self, t):
        rows = [tr for tr in t.find_all('tr') if tr.find_parent('table') is t]
        cells_all = [[c for c in tr.find_all(['td', 'th']) if c.find_parent('tr') is tr] for tr in rows]
        # таблица для вёрстки (большие ячейки с абзацами) — разбираем как обычный текст
        if any(c.find(['p', 'ul', 'ol', 'table', 'h2', 'h3', 'img', 'div']) for r in cells_all for c in r) and \
                max((len(r) for r in cells_all), default=0) <= 2:
            for r in cells_all:
                for c in r:
                    self.walk(c)
                    self.flush()
            return
        out, head = [], []
        docs = []
        for ri, r in enumerate(cells_all):
            row = []
            for c in r:
                links = [(canon(a.get('href'), self.url), clean(a.get_text(' '))) for a in c.find_all('a', href=True)]
                links = [(h, x) for h, x in links if h]
                text = short(c.get_text(' '), 800)
                if len(links) == 1 and links[0][0] and not links[0][0].startswith(('mailto:', 'tel:')):
                    href = links[0][0]
                    label = text or links[0][1] or file_title(href)
                    if is_kitis_page(href) and self.link_map.get(path_of(href)):
                        row.append(label)
                    else:
                        row.append([label, href])
                else:
                    row.append(text)
                    docs.extend(links)
                for img in c.find_all('img'):
                    self.image(img, None)
            if not any((x if isinstance(x, str) else x[0]) for x in row):
                continue
            if ri == 0 and r and all(c.name == 'th' for c in r):
                head = [x if isinstance(x, str) else x[0] for x in row]
                continue
            out.append(row)
        if not out:
            return
        width = max(max(len(r) for r in out), len(head))
        if width == 1 and not head:
            self.add({'t': 'list', 'items': [r[0] if isinstance(r[0], str) else r[0][0] for r in out][:300]})
        else:
            width = min(width, 12)
            out = [(r + [''] * width)[:width] for r in out[:300]]
            head = (head + [''] * width)[:width] if head else []
            self.add({'t': 'table', 'plain': True, 'head': head, 'rows': out})
        for href, x in docs:
            self.add_link(href, x)


def extract(url, title, link_map, allow_photos, skip_urls=()):
    rec = get_page(url)
    if rec['soup'] is None:
        return None
    soup = BeautifulSoup(str(rec['soup']), 'lxml')   # копия: исходник нужен для поиска шаблонных блоков
    t = page_title(soup) or title
    box, h1 = strip_page(soup, url)
    b = Builder(url, clean(h1.get_text(' ')) if h1 is not None else t, link_map, allow_photos, skip_urls)
    if h1 is None or box.find('h1') is None:
        b.started = True
    b.walk(box)
    b.flush()
    # если заголовок не нашёлся внутри контейнера — обходим целиком
    if not b.blocks and not b.started:
        b.started = True
        b.walk(box)
        b.flush()
    raw_main = rec['soup'].find('main') or rec['soup'].body
    has_form = bool(raw_main and any(len(f.find_all(['input', 'textarea', 'select'])) >= 3 for f in raw_main.find_all('form')))
    if has_form:
        b.add({'t': 'links', 'items': [['Заполнить форму на сайте колледжа', url, 'Форма отправляется на kitis.ru']]})
    entry = {'url': url, 'title': t, 'container': describe(box), 'blocks': len(b.blocks),
             'photos': len(b.photos), 'children': len(b.children), 'form': has_form}
    if (len(b.blocks) <= 2 or path_of(url) in DEBUG_PATHS) and raw_main is not None:
        entry['outline'] = outline(raw_main)
        gone = []
        for el in raw_main.find_all(True):
            cls = ' '.join(el.get('class') or []) + ' ' + (el.get('id') or '')
            if (cls.strip() and NEG.search(cls)) or el.name in SKIP_TAGS:
                n = len(clean(el.get_text(' ')))
                if n > 40:
                    gone.append('%s.%s [текст %d]' % (el.name, '.'.join((el.get('class') or [])[:3]), n))
        entry['removed'] = gone[:30]
    report['pages'].append(entry)
    return {'title': t, 'blocks': b.blocks, 'photos': b.photos, 'children': b.children, 'final': rec['final']}


def outline(el, depth=0, out=None):
    """Схема разметки для отчёта (теги, классы, длина текста) — чтобы понять, почему страница вышла пустой."""
    out = [] if out is None else out
    if len(out) >= 90 or depth > 7 or not isinstance(el, Tag):
        return out
    kids = [c for c in el.children if isinstance(c, Tag)]
    cls = '.'.join((el.get('class') or [])[:3])
    txt = len(clean(el.get_text(' ')))
    links = len(el.find_all('a', href=True))
    extra = ''
    if el.name == 'a':
        extra = ' href=' + str(el.get('href'))[:60]
    if el.get('data-src') or el.get('data-url') or el.get('data-ajax'):
        extra += ' data=' + str(el.get('data-src') or el.get('data-url') or el.get('data-ajax'))[:60]
    out.append('  ' * depth + el.name + ('#' + el.get('id') if el.get('id') else '') + ('.' + cls if cls else '')
               + ' [текст %d, ссылок %d]' % (txt, links) + extra)
    if txt or el.find('img') or el.name in ('main', 'section', 'div'):
        for c in kids[:12]:
            outline(c, depth + 1, out)
    return out


def describe(el):
    parts = []
    while el is not None and getattr(el, 'name', None) not in (None, '[document]') and len(parts) < 6:
        cls = '.'.join((el.get('class') or [])[:2])
        parts.append(el.name + ('#' + el.get('id') if el.get('id') else '') + ('.' + cls if cls else ''))
        el = el.parent
    return ' < '.join(parts)


# ---------- фото ----------

photo_meta = {}     # адрес -> [f, s, w, h]
photo_by_digest = {}
photo_failed = set()


def load_previous(path, var):
    try:
        txt = path.read_text(encoding='utf-8')
        start = txt.index('{')
        return json.loads(txt[start:txt.rstrip().rstrip(';').rindex('}') + 1])
    except Exception:  # noqa: BLE001
        return None


def photo(url, alt=''):
    if url in photo_meta:
        return photo_meta[url] + [alt]
    if url in photo_failed or len(photo_meta) >= MAX_PHOTOS:
        return None
    key = hashlib.sha1(url.encode('utf-8')).hexdigest()[:14]
    full, thumb = PHOTO_DIR / (key + '.jpg'), PHOTO_DIR / (key + '-s.jpg')
    prev = prev_photos.get(url)
    if prev and full.exists() and thumb.exists():
        photo_meta[url] = prev
        return prev + [alt]
    try:
        _, ctype, data = fetch(to_fetch_url(url), MAX_IMG_BYTES)
        digest = hashlib.sha1(data).hexdigest()
        if digest in photo_by_digest:
            photo_meta[url] = photo_by_digest[digest]
            return photo_meta[url] + [alt]
        im = Image.open(io.BytesIO(data))
        im = ImageOps.exif_transpose(im)
        if im.mode not in ('RGB', 'L'):
            bg = Image.new('RGB', im.size, (255, 255, 255))
            im = im.convert('RGBA')
            bg.paste(im, mask=im.split()[-1])
            im = bg
        im = im.convert('RGB')
        if min(im.size) < 240:
            raise ValueError('маленькая картинка (значок)')
        PHOTO_DIR.mkdir(parents=True, exist_ok=True)
        a = im.copy()
        a.thumbnail((FULL_PX, FULL_PX), Image.LANCZOS)
        a.save(full, 'JPEG', quality=76, optimize=True, progressive=True)
        b = im.copy()
        b.thumbnail((THUMB_PX, THUMB_PX), Image.LANCZOS)
        b.save(thumb, 'JPEG', quality=72, optimize=True, progressive=True)
        meta = ['photos/' + full.name, 'photos/' + thumb.name, a.size[0], a.size[1]]
        photo_meta[url] = meta
        photo_by_digest[digest] = meta
        return meta + [alt]
    except Exception as e:  # noqa: BLE001
        photo_failed.add(url)
        report['errors'].append({'url': url, 'error': 'фото: ' + str(e)[:160]})
        return None


def resolve_photos(blocks):
    out = []
    for b in blocks:
        if b['t'] == 'photos':
            items = []
            for src, alt in b['items'][:MAX_PER_ALBUM]:
                p = photo(src, alt)
                if p and p[0] not in [x[0] for x in items]:
                    items.append(p)
            if items:
                out.append({'t': 'photos', 'items': items})
        else:
            out.append(b)
    return out


# ---------- разделы ----------

def section_from(page_id, group, title, short_, icon, path, link_map):
    url = PUBLIC + path
    allow = not NO_PHOTO_PATH.search(path)
    res = extract(url, title, link_map, allow)
    if res is None:
        return None
    blocks = list(res['blocks'])
    kids = 0
    for child in res['children'][:MAX_CHILDREN]:
        sub = extract(child, '', link_map, allow and not NO_PHOTO_PATH.search(child), skip_urls=[url])
        if sub is None or not sub['blocks']:
            blocks.append({'t': 'links', 'items': [[sub['title'] if sub else file_title(child), child, 'kitis.ru']]})
            continue
        kids += 1
        blocks.append({'t': 'h', 'text': sub['title'] or 'Подраздел'})
        blocks.extend(b for b in sub['blocks'] if not (b['t'] == 'go' and all(x[1] == page_id for x in b['items'])))
    for child in res['children'][MAX_CHILDREN:]:
        blocks.append({'t': 'links', 'items': [[file_title(child), child, 'kitis.ru']]})
    blocks = resolve_photos(merge_blocks(blocks))[:500]
    if not blocks:
        blocks = [{'t': 'note', 'text': 'На сайте колледжа этот раздел пока пустой.'}]
    return OrderedDict(id=page_id, group=group, title=title, short=short_, icon=icon, url=url, blocks=blocks, ok=True)


def merge_blocks(blocks):
    out = []
    for b in blocks:
        if out and b['t'] in ('docs', 'links', 'go', 'photos') and out[-1]['t'] == b['t']:
            for it in b['items']:
                if it not in out[-1]['items']:
                    out[-1]['items'].append(it)
        else:
            out.append(b)
    return out


def stub(page_id, group, title, short_, icon, url):
    return OrderedDict(id=page_id, group=group, title=title, short=short_, icon=icon, url=url, ok=False, blocks=[
        {'t': 'note', 'text': 'Раздел ещё не загрузился с сайта колледжа. Робот попробует снова следующей ночью.'},
        {'t': 'links', 'items': [[title, url, 'kitis.ru']]}])


def discover_sveden():
    rec = get_page(PUBLIC + SVEDEN_ROOT)
    found = []
    if rec['soup'] is not None:
        for a in rec['soup'].find_all('a', href=True):
            h = canon(a.get('href'), rec['final'])
            m = re.match(r'^https://kitis\.ru/sveden/([A-Za-z0-9_-]+)/$', h)
            t = clean(a.get_text(' '))
            if m and t and len(t) < 160 and m.group(1) not in [x[0] for x in found]:
                found.append((m.group(1), t))
    if len(found) < 5:
        names = {'common': 'Основные сведения', 'struct': 'Структура и органы управления', 'document': 'Документы',
                 'education': 'Образование', 'eduStandarts': 'Образовательные стандарты', 'managers': 'Руководство',
                 'employees': 'Педагогический состав', 'objects': 'Материально-техническое обеспечение',
                 'grants': 'Стипендии и меры поддержки', 'paid_edu': 'Платные образовательные услуги',
                 'budget': 'Финансово-хозяйственная деятельность', 'vacant': 'Вакантные места для приёма (перевода)',
                 'inter': 'Международное сотрудничество', 'catering': 'Организация питания', 'ovz': 'Доступная среда'}
        for k in SVEDEN_FALLBACK:
            if k not in [x[0] for x in found]:
                found.append((k, names[k]))
    return found[:20]


# ---------- новости и альбомы ----------

def discover_lists():
    """Ленты медиацентра: ищем ссылки на главной и на странице медиацентра, иначе пробуем известные адреса."""
    cands = {k: [] for k, _, _ in MEDIA_KINDS}
    for start in ('/', '/press-center/'):
        r = get_page(PUBLIC + start)
        if r['soup'] is None:
            continue
        for a in r['soup'].find_all('a', href=True):
            t = clean(a.get_text(' '))
            h = canon(a.get('href'), r['final'])
            if not h or not is_kitis_page(h) or path_of(h) == '/' or len(t) > 40:
                continue
            for kind, rx, _ in MEDIA_KINDS:
                if rx.pattern != '^$' and rx.search(t) and '/press-center/' in h:
                    u = PUBLIC + path_of(h)
                    if u not in cands[kind]:
                        cands[kind].append(u)
    lists = []
    for kind, _, guesses in MEDIA_KINDS:
        for u in cands[kind] + [PUBLIC + g for g in guesses]:
            if any(x[1] == u for x in lists):
                continue
            r = get_page(u)
            if r['soup'] is not None and page_title(r['soup']):
                lists.append((kind, u))
                break
    report['lists'] = [{'kind': k, 'url': v} for k, v in lists]
    return lists


list_dates = {}


def list_items(list_url, limit):
    """Адреса материалов ленты (с переходом по страницам) и даты, указанные рядом с ними."""
    found, queue, seen_pages = [], [list_url], set()
    base_path = path_of(list_url)
    seg = base_path.strip('/').split('/')[0]
    while queue and len(seen_pages) < MAX_LIST_PAGES and len(found) < limit:
        u = queue.pop(0)
        if u in seen_pages:
            continue
        seen_pages.add(u)
        rec = get_page(u)
        if rec['soup'] is None:
            continue
        for a in rec['soup'].find_all('a', href=True):
            h = canon(a.get('href'), rec['final'])
            if not h or not is_kitis_page(h):
                continue
            p = urlparse(h)
            if 'PAGEN_' in p.query and p.path.startswith(base_path.rstrip('/')):
                if h not in seen_pages and h not in queue:
                    queue.append(h)
                continue
            if p.query and not re.search(r'(^|&)(ELEMENT_)?ID=\d+', p.query):
                continue
            if not path_of(h).startswith(base_path) or (path_of(h) == base_path and not p.query):
                continue
            if boiler.is_link(h, seg):
                continue
            if h not in list_dates:
                box = a
                for _ in range(4):
                    box = box.parent if box.parent is not None else box
                    d = parse_date(box.get_text(' '))
                    if d:
                        list_dates[h] = d
                        break
            if h in found:
                continue
            found.append(h)
            if len(found) >= limit:
                break
    return found


def album_from(url, kind):
    res = extract(url, '', {}, True)
    if res is None:
        return None
    rec = pages[url]
    soup = rec['soup']
    date = ''
    for el in soup.select('time, [class*=date], [class*=Date]'):
        date = parse_date(el.get('datetime') or el.get_text(' '))
        if date:
            break
    if not date:
        texts = ' '.join(b.get('text', '') for b in res['blocks'][:6] if b['t'] in ('p', 'h'))
        date = parse_date(texts) or list_dates.get(url, '')
    items = []
    for src in res['photos'][:MAX_PER_ALBUM]:
        p = photo(src, res['title'])
        if p and p[0] not in [x[0] for x in items]:
            items.append(p)
    lead = next((b['text'] for b in res['blocks'] if b['t'] == 'p' and len(b['text']) > 40 and not is_junk(b['text'])
                 and len(re.findall(r'[а-яё]', b['text'], re.I)) > len(b['text']) * 0.4), '')
    return OrderedDict(id=kind[0] + '-' + hashlib.sha1(url.encode()).hexdigest()[:10], kind=kind, d=date,
                       t=res['title'], u=url, lead=short(lead, 280), p=items)


# ---------- запуск ----------

def main():
    global prev_photos
    prev_off = load_previous(OUT_OFFICIAL, 'KITIS_OFFICIAL') or {}
    prev_ph = load_previous(OUT_PHOTOS, 'KITIS_PHOTOS') or {}
    prev_photos = {}
    for k, v in (prev_ph.get('index') or {}).items():
        prev_photos[k] = v

    home = get_page(PUBLIC + '/')
    if home['soup'] is None:
        log('Сайт колледжа не открылся — данные не меняю.')
        write_report()
        return 0

    sveden = discover_sveden()
    lists = discover_lists()
    # сначала скачиваем страницы, чтобы найти повторяющиеся меню
    for sid, _ in sveden:
        get_page(PUBLIC + SVEDEN_ROOT + sid + '/')
    for p in PAGES:
        get_page(PUBLIC + p[5])
    media_urls = [(k, list_items(u, LIMIT_ALBUMS[k])) for k, u in lists]
    for k, urls in media_urls:
        for u in urls[:12]:
            get_page(u)
    boiler.build()

    link_map = {SVEDEN_ROOT: 'sv-' + sveden[0][0] if sveden else ''}
    for sid, _ in sveden:
        link_map[SVEDEN_ROOT + sid + '/'] = 'sv-' + sid
    for p in PAGES:
        link_map[p[5]] = p[0]

    prev_secs = {s['id']: s for s in prev_off.get('sections', [])}
    sections = []
    for sid, title in sveden:
        s = section_from('sv-' + sid, 'sveden', title, '', 'file', SVEDEN_ROOT + sid + '/', link_map)
        sections.append(s or prev_secs.get('sv-' + sid) or stub('sv-' + sid, 'sveden', title, '', 'file', PUBLIC + SVEDEN_ROOT + sid + '/'))
        log('сведения', sid, 'ok' if s else 'нет')
    for p in PAGES:
        s = section_from(*p, link_map)
        sections.append(s or prev_secs.get(p[0]) or stub(p[0], p[1], p[2], p[3], p[4], PUBLIC + p[5]))
        log('раздел', p[0], 'ok' if s else 'нет')

    albums = []
    prev_albums = {a['u']: a for a in prev_ph.get('albums', [])}
    seen_albums = set()
    for kind, urls in media_urls:
        for u in urls:
            if u in seen_albums:
                continue
            seen_albums.add(u)
            a = album_from(u, kind)
            if a is None:
                a = prev_albums.get(u)
            if a and a.get('p'):
                albums.append(a)
    albums.sort(key=lambda a: a.get('d') or '', reverse=True)

    groups = [OrderedDict(key=k, title=t, ids=[s['id'] for s in sections if s['group'] == k]) for k, t in GROUPS]
    official = OrderedDict(source=PUBLIC + '/', groups=groups, sections=sections)
    photos = OrderedDict(source=PUBLIC + '/', albums=albums,
                         index={u: m for u, m in photo_meta.items()})

    write_js(OUT_OFFICIAL, 'KITIS_OFFICIAL', official, prev_off)
    write_js(OUT_PHOTOS, 'KITIS_PHOTOS', photos, prev_ph)

    # фото, на которые больше ничего не ссылается, удаляем
    used = set()
    for m in photo_meta.values():
        used.update([Path(m[0]).name, Path(m[1]).name])
    if PHOTO_DIR.exists():
        for f in PHOTO_DIR.glob('*.jpg'):
            if f.name not in used:
                f.unlink()
    report['counts'].update(requests=requests_made, sections=len(sections),
                            sections_ok=sum(1 for s in sections if s.get('ok')), albums=len(albums),
                            photos=len(photo_meta))
    write_report()
    log('готово:', json.dumps(report['counts'], ensure_ascii=False))
    return 0


def write_js(path, var, obj, prev):
    body = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    digest = hashlib.sha1(body.encode('utf-8')).hexdigest()[:16]
    updated = prev.get('updated') if prev.get('digest') == digest else time.strftime('%Y-%m-%d')
    full = OrderedDict(updated=updated, digest=digest)
    full.update(obj)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('/* Сгенерировано роботом parser/kitis_sync.py с сайта kitis.ru. Не править вручную. */\n'
                    'window.' + var + ' = ' + json.dumps(full, ensure_ascii=False, separators=(',', ':')) + ';\n',
                    encoding='utf-8')


def write_report():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')


prev_photos = {}

if __name__ == '__main__':
    sys.exit(main())
