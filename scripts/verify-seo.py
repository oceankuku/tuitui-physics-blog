#!/usr/bin/env python3
"""Verify published inventory, source Markdown, SEO metadata and local assets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import sys, json, re, hashlib, xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1] if len(sys.argv) > 1 else root / 'dist').resolve()

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.meta=[]; self.images=[]; self.schemas=[]; self.schema=None; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='link': self.links.append(a)
        if tag=='meta': self.meta.append(a)
        if tag=='img': self.images.append(a)
        if tag=='script' and a.get('type')=='application/ld+json': self.schema=''
    def handle_data(self, data):
        if self.schema is not None: self.schema+=data
    def handle_endtag(self, tag):
        if tag=='script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema)); self.schema=None

def local_asset(path):
    target = (out / unquote(urlparse(path).path).lstrip('/')).resolve()
    assert target.is_relative_to(out) and target.is_file(), 'Missing local asset: '+path

index=json.loads((out/'content-index.json').read_text())
entries=index['entries']; site=index['site'].rstrip('/')
assert len({e['url'] for e in entries})==len(entries), 'Duplicate canonical URLs'
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls={e.text for e in ET.parse(out/'sitemap.xml').findall('s:url/s:loc',ns)}
assert {site+'/', site+'/blog/', site+'/materials/'}.issubset(urls)
feed=ET.parse(out/'rss.xml'); items=feed.findall('./channel/item')
assert {i.findtext('link') for i in items} == {e['url'] for e in entries}
assert len(items)==len(entries)
llms=(out/'llms.txt').read_text()
source_ids=set()
for p in (root/'src/content/blog').rglob('*'):
    if p.suffix not in {'.md','.mdx'}: continue
    raw=p.read_text().lstrip('\ufeff'); front=raw.split('---',2)[1]
    if re.search(r"^draft:\s*['\"]?true['\"]?\s*(?:#.*)?$",front,re.M): continue
    source_ids.add('blog/'+str(p.relative_to(root/'src/content/blog').with_suffix('')))
assert {e['id'] for e in entries}==source_ids, 'Published inventory mismatch'
image_count=0
for e in entries:
    assert e['url'].startswith(site+'/')
    path=urlparse(e['url']).path
    assert path.endswith('/') and e['url'] in urls
    page=Page((out/path.lstrip('/')/'index.html').read_text())
    assert [l['href'] for l in page.links if l.get('rel')=='canonical']==[e['url']]
    assert any(l.get('type')=='text/markdown' and l.get('href')==e['markdownUrl'] for l in page.links)
    assert any(m.get('property')=='og:type' and m.get('content')=='article' for m in page.meta)
    article=next(s for s in page.schemas if s.get('@type')=='BlogPosting')
    assert article['dateModified']==e['updatedAt'] and article['headline']==e['title']
    assert article['author']['name']==e['author']
    assert e['markdownUrl'] in llms
    md=(out/urlparse(e['markdownUrl']).path.lstrip('/')).read_text()
    source=root/'src/content'/(e['id']+'.md')
    if not source.exists(): source=source.with_suffix('.mdx')
    body=source.read_text().lstrip('\ufeff').split('---',2)[2].lstrip('\r\n')
    assert md.split('\n\n---\n\n',1)[1].lstrip('\r\n')==body, e['id']+' body changed'
    for image in page.images:
        src=image.get('src','')
        if src.startswith('/') and not src.startswith('//'): local_asset(src)
        if src.startswith('/_content-images/'):
            image_count+=1
            assert int(image['width'])>0 and int(image['height'])>0
            assert image['loading'] in ['eager','lazy']
            assert image.get('sizes')
            for candidate in image['srcset'].split(', '): local_asset(candidate.split(' ')[0])
    for meta in page.meta:
        if meta.get('property')=='og:image' and meta.get('content','').startswith(site+'/'): local_asset(meta['content'])
notfound=Page((out/'404.html').read_text())
assert any(m.get('name')=='robots' and 'noindex' in m.get('content','') for m in notfound.meta)
assert not any(l.get('rel')=='canonical' for l in notfound.links)
assert f'Sitemap: {site}/sitemap.xml' in (out/'robots.txt').read_text()
for path in ['favicon.ico','brand/logo.png','brand/favicon-16.png','brand/favicon-32.png','brand/apple-touch-icon.png','brand/og-default.png']: local_asset('/'+path)
materials=(out/'materials/index.html').read_text()
page=Page(materials)
assert [l['href'] for l in page.links if l.get('rel')=='canonical']==[site+'/materials/']
assets=json.loads(re.search(r'<script[^>]*id="static-assets-data"[^>]*>(.*?)</script>',materials,re.S).group(1))
assert len({a['id'] for a in assets})==len(assets), 'Duplicate gallery images'
gallery_paths=set()
for asset in assets:
    local_asset(asset['preview'])
    assert asset['width']>0 and asset['height']>0
    for path in asset['aliases']:
        local_asset(path); gallery_paths.add(path)
        assert hashlib.sha256((out/path.lstrip('/')).read_bytes()).hexdigest().startswith(asset['id']), 'Gallery alias changed: '+path
for folder in ['site-assets','brand','blog-images','material-library']:
    for p in (root/'public'/folder).rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.ico'}:
            assert '/'+p.relative_to(root/'public').as_posix() in gallery_paths, 'Missing gallery asset: '+str(p)
assert '/favicon.ico' in gallery_paths
for record in json.loads((root/'docs/static-assets-import.json').read_text())['files']:
    assert hashlib.sha256((out/record['path'].lstrip('/')).read_bytes()).hexdigest()==record['sha256'], 'Imported original changed: '+record['path']
print(f'PASS: {len(entries)} public articles; source-identical Markdown; canonical/schema/feed/sitemap/robots; {image_count} responsive images; 404 and brand assets; {len(assets)} gallery images and imported originals')
