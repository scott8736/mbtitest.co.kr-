"""사이트맵 전 페이지: 상태 코드 + 옛 사주랩 주소 잔존 + 운영 JS·CSS 묶음의 옛 주소."""
import re, sys, urllib.request, concurrent.futures as cf
BASE="https://mbtitest.co.kr"; UA="mbtitest-qa-bot"
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":UA}),timeout=30)
        return r.status, r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e: return e.code, ""
    except Exception as e: return 0, repr(e)
_, xml = get(BASE+"/sitemap.xml")
urls = re.findall(r"<loc>([^<]+)</loc>", xml)
print("사이트맵", len(urls), flush=True)
bad=[]; old=[]; assets=set()
def one(u):
    st, html = get(u)
    return u, st, ("sajulab.kr" in html), set(re.findall(r'/_next/static/[^"\']+\.(?:js|css)', html))
with cf.ThreadPoolExecutor(8) as ex:
    for u, st, has_old, a in ex.map(one, urls):
        if st != 200: bad.append((u, st))
        if has_old: old.append(u)
        assets |= a
print("200 아님", len(bad), bad[:10])
print("HTML 에 sajulab.kr", len(old), old[:10])
with cf.ThreadPoolExecutor(8) as ex:
    hits=[a for a,(st,t) in zip(sorted(assets), ex.map(lambda a:get(BASE+a), sorted(assets))) if "sajulab.kr" in t]
print("JS·CSS 묶음", len(assets), "개 중 sajulab.kr 포함", len(hits), hits[:5])
