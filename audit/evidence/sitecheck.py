# Passive full-site check of cedar.com: every sitemap URL, then every link/image found on them.
import json, re, sys, time, urllib.request, urllib.error, urllib.parse, ssl
from concurrent.futures import ThreadPoolExecutor
from html import unescape

OUT = sys.argv[1]
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'}
ctx = ssl.create_default_context()

def fetch(url, method='GET', body=True):
    req = urllib.request.Request(url, headers=UA, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            data = r.read(3_000_000).decode('utf-8', 'replace') if body else ''
            return r.status, r.geturl(), dict(r.headers), data
    except urllib.error.HTTPError as e:
        return e.code, url, dict(e.headers or {}), ''
    except Exception as e:
        return None, url, {}, str(e)[:200]

sm = open(sys.argv[2]).read()
urls = [unescape(u) for u in re.findall(r'<loc>([^<]+)</loc>', sm)]

def page(url):
    st, final, hdr, html = fetch(url)
    time.sleep(0.2)
    r = {'url': url, 'status': st, 'final': final}
    if st != 200:
        r['error'] = html if st is None else ''
        return r
    r['title'] = unescape((re.search(r'<title>(.*?)</title>', html, re.S) or [None, ''])[1]).strip()
    m = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', html)
    r['desc'] = unescape(m.group(1)) if m else None
    m = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"', html)
    r['canonical'] = m.group(1) if m else None
    r['noindex'] = bool(re.search(r'<meta[^>]+name="robots"[^>]+noindex', html))
    r['h1'] = len(re.findall(r'<h1[\s>]', html))
    r['lang'] = (re.search(r'<html[^>]*lang="([^"]*)"', html) or [None, None])[1]
    hrefs = set()
    for h in re.findall(r'<a[^>]+href="([^"#][^"]*)"', html):
        h = unescape(h).strip()
        if h.startswith(('mailto:', 'tel:', 'javascript:')): continue
        hrefs.add(urllib.parse.urljoin(url, h).split('#')[0])
    r['links'] = sorted(hrefs)
    imgs = set(urllib.parse.urljoin(url, unescape(s)) for s in re.findall(r'<img[^>]+src="([^"]+)"', html))
    r['imgs'] = sorted(imgs)
    r['mixed'] = sorted(set(re.findall(r'(?:src|href)="(http://[^"]+)"', html)))
    r['emptyAltPlaceholder'] = len(re.findall(r'placeholder\.60f9b1840c\.svg', html))
    r['lorem'] = bool(re.search(r'lorem ipsum', html, re.I))
    return r

with ThreadPoolExecutor(6) as ex:
    pages = list(ex.map(page, urls))
print('pages fetched', len(pages), file=sys.stderr)

targets = {}
for p in pages:
    for l in p.get('links', []) + p.get('imgs', []):
        targets.setdefault(l, set()).add(p['url'])

def check(u):
    if not u.startswith('http'): return u, None
    st, final, _, err = fetch(u, 'HEAD', body=False)
    if st in (None, 403, 405, 404, 400, 500, 501):
        st2, final2, _, err2 = fetch(u, body=False)
        if st2 is not None: st, final, err = st2, final2, ''
    time.sleep(0.1)
    return u, {'status': st, 'final': final, 'error': err if st is None else ''}

with ThreadPoolExecutor(8) as ex:
    res = dict(ex.map(check, list(targets)))
print('links checked', len(res), file=sys.stderr)

json.dump({'pages': pages, 'links': {u: {**v, 'foundOn': sorted(targets[u])} for u, v in res.items() if v}}, open(OUT, 'w'), indent=1)
