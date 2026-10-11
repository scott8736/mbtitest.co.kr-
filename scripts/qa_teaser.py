"""mbtitest 한 페이지 검사 + 예고 화면 + 결과 링크 정밀 QA (2026-10-11).

광고·통계 요청은 막고 UA 에 bot 을 넣는다(애드센스 무효 트래픽 방지).
사용: python qa_teaser.py [BASE] [필터]
"""
import asyncio, json, re, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://mbtitest.co.kr"
ONLY = sys.argv[2] if len(sys.argv) > 2 else ""
UA = "Mozilla/5.0 (Linux; Android 14) mbtitest-qa-bot"
BLOCK = re.compile(r"googlesyndication|doubleclick|adtrafficquality|googletagmanager|fundingchoices|google-analytics|/api/event|/api/pv|/api/track")

results = []  # (name, ok, detail)


def add(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("OK   " if ok else "FAIL ") + name + ("" if ok else "  -> " + detail), flush=True)


def sitemap_paths():
    req = urllib.request.Request(BASE + "/sitemap.xml", headers={"User-Agent": UA})
    xml = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    return [re.sub(r"^https?://[^/]+", "", u) for u in locs]


async def new_page(browser, mobile=True):
    ctx = await browser.new_context(user_agent=UA, viewport={"width": 390, "height": 844} if mobile else {"width": 1280, "height": 900})
    await ctx.route(BLOCK, lambda r: r.abort())
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    page.on("console", lambda m: errors.append("console: " + m.text[:200]) if m.type == "error" and "Failed to load resource" not in m.text else None)
    return ctx, page, errors


async def teaser_checks(page, name, href_expect):
    """예고 화면 공통 계약: CTA 는 진짜 a 링크, 첫 화면 안에 보임, 가로 스크롤 없음, 3초 기다려도 저절로 안 넘어감."""
    cta = page.locator("a.mbti-teaser-cta")
    await cta.wait_for(timeout=8000)
    href = await cta.get_attribute("href")
    url_before = page.url
    await page.wait_for_timeout(3000)
    if page.url != url_before:
        add(name + " 자동 이동 없음", False, f"{url_before} -> {page.url}")
        return False
    box = await cta.bounding_box()
    vw = await page.evaluate("[document.documentElement.scrollWidth, window.innerWidth]")
    problems = []
    if href != href_expect:
        problems.append(f"href={href} 기대={href_expect}")
    if not box or box["y"] + box["height"] > 844 * 1.6:
        problems.append(f"버튼 위치 y={box and round(box['y'])}")
    if vw[0] > vw[1] + 1:
        problems.append(f"가로 스크롤 {vw}")
    masked = page.locator(".test-teaser-traits span.masked, .mbti-teaser-letters span.masked")
    for k in range(await masked.count()):
        if not await masked.nth(k).is_visible():
            problems.append("가린 칸이 화면에 안 보임")
            break
    add(name + " 예고 화면", not problems, "; ".join(problems))
    return True


async def click_cta_and_wait(page, path_expect):
    async with page.expect_navigation(timeout=15000):
        await page.locator("a.mbti-teaser-cta").click()
    return page.url.replace(BASE, "").split("?")[0] == path_expect


async def qa_mbti(browser):
    ctx, page, errors = await new_page(browser)
    try:
        await page.goto(BASE + "/tests/mbti/", wait_until="networkidle")
        start = page.url
        cheer = False
        for i in range(40):
            btns = page.locator(".mbti-quiz .answers button")
            await btns.first.wait_for(timeout=5000)
            await btns.nth(i % 2).click()
            if i == 19:
                cheer = await page.locator(".step-cheer").count() > 0
            if page.url != start:
                add("MBTI 중간 페이지 이동 없음", False, f"{i + 1}번 뒤 {page.url}")
                return
        add("MBTI 중간 페이지 이동 없음", True)
        add("MBTI 21번 절반 문구", cheer, "step-cheer 없음")
        if not await teaser_checks(page, "MBTI", "/mbti-result/"):
            return
        letters = await page.locator(".mbti-teaser-letters span").all_inner_texts()
        hidden = 0
        for k in range(await page.locator(".mbti-teaser-letters span.masked").count()):
            hidden += await page.locator(".mbti-teaser-letters span.masked").nth(k).is_visible()
        add("MBTI 4글자 중 2글자만", len(letters) == 4 and hidden == 2 and letters[1] == "?" and letters[3] == "?", str(letters))
        ok = await click_cta_and_wait(page, "/mbti-result/")
        add("MBTI 결과 링크 이동", ok, page.url)
        await page.wait_for_selector(".mori-portrait figcaption b", timeout=10000)
        code = (await page.locator(".mori-portrait figcaption b").inner_text()).split()[0]
        add("MBTI 결과 유형이 예고 글자와 일치", code[0] == letters[0] and code[2] == letters[2], f"예고 {letters} 결과 {code}")
        add("MBTI 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    finally:
        await ctx.close()


async def qa_generic(browser, slug):
    ctx, page, errors = await new_page(browser)
    name = f"테스트 {slug}"
    try:
        await page.goto(f"{BASE}/tests/{slug}/", wait_until="networkidle")
        await page.locator("button.primary-button").first.click()
        start = page.url
        n = 0
        while await page.locator(".test-shell .answers button").count() > 0 and n < 80:
            await page.locator(".test-shell .answers button").nth(n % 2).click()
            n += 1
            if page.url != start:
                add(name + " 중간 이동 없음", False, f"{n}번 뒤 {page.url}")
                return
        if not await teaser_checks(page, name, f"/tests/{slug}/result/"):
            return
        trait = (await page.locator(".test-teaser-traits span").first.inner_text()).strip()
        ok = await click_cta_and_wait(page, f"/tests/{slug}/result/")
        await page.wait_for_selector(".rich-result h1", timeout=10000)
        pills = await page.locator(".trait-pills span").all_inner_texts()
        add(name + f" 결과({n}문항)", ok and trait in pills, f"url={page.url} 예고키워드={trait} 결과={pills}")
        add(name + " 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add(name, False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_iq(browser):
    ctx, page, errors = await new_page(browser)
    try:
        await page.goto(BASE + "/tests/iq/", wait_until="networkidle")
        await page.locator("button.primary-button").first.click()
        for _ in range(20):
            await page.locator(".screener-options button").first.click()
        if not await teaser_checks(page, "IQ", "/tests/iq/result/"):
            return
        ok = await click_cta_and_wait(page, "/tests/iq/result/")
        await page.wait_for_selector(".screener-score strong", timeout=10000)
        score = await page.locator(".screener-score strong").inner_text()
        add("IQ 결과", ok and "/ 20" in score, score)
        add("IQ 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add("IQ", False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_tarot(browser, slug):
    ctx, page, errors = await new_page(browser)
    name = f"타로 {slug}"
    try:
        await page.goto(f"{BASE}/tarot/{slug}/", wait_until="networkidle")
        await page.locator(".tarot-deck button").nth(2).click()
        if not await teaser_checks(page, name, f"/tarot/{slug}/result/"):
            return
        sym = await page.locator(".test-teaser .tarot-symbol").inner_text()
        ok = await click_cta_and_wait(page, f"/tarot/{slug}/result/")
        await page.wait_for_selector(".rich-result .tarot-card-face b", timeout=10000)
        sym2 = await page.locator(".rich-result .tarot-symbol").first.inner_text()
        add(name + " 결과 카드가 예고와 같음", ok and sym == sym2, f"{sym} vs {sym2}")
        add(name + " 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add(name, False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_screener(browser, slug, urgent):
    ctx, page, errors = await new_page(browser)
    name = f"자가진단 {slug} {'위급' if urgent else '보통'}"
    try:
        await page.goto(f"{BASE}/check/{slug}/", wait_until="networkidle")
        await page.locator("button.primary-button").first.click()
        n = 0
        while await page.locator(".screener-options button").count() > 0 and n < 60:
            opts = page.locator(".screener-options button")
            await opts.nth((await opts.count()) - 1 if urgent else 0).click()
            n += 1
        if urgent:
            await page.wait_for_timeout(800)
            has_teaser = await page.locator("a.mbti-teaser-cta").count()
            has_help = await page.locator(".screener-help").count()
            # 최고점이 '도움 필요' 구간이 아닌 진단도 있을 수 있어, 예고가 뜨면 내용으로 다시 판단한다.
            add(name + " 바로 결과+상담 안내", has_teaser == 0 and has_help > 0, f"teaser={has_teaser} help={has_help}")
        else:
            if not await teaser_checks(page, name, f"/check/{slug}/result/"):
                return
            ok = await click_cta_and_wait(page, f"/check/{slug}/result/")
            await page.wait_for_selector(".screener-score", timeout=10000)
            add(name + " 결과", ok, page.url)
        add(name + " 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add(name, False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_fortune(browser, mode):
    ctx, page, errors = await new_page(browser)
    name = f"운세 {mode}"
    try:
        await page.goto(f"{BASE}/fortune/{mode}/", wait_until="networkidle")
        await page.fill("#fortune-year", "1990")
        await page.fill("#fortune-month", "5")
        await page.fill("#fortune-day", "17")
        if mode == "saju-mbti":
            await page.select_option("#fortune-mbti", "ENFP")
        await page.locator("form button[type=submit]").first.click()
        if not await teaser_checks(page, name, f"/fortune/{mode}/result/"):
            return
        chips = await page.locator(".test-teaser-traits span").all_inner_texts()
        ok = await click_cta_and_wait(page, f"/fortune/{mode}/result/")
        await page.wait_for_timeout(1500)
        body = await page.locator("main").inner_text()
        add(name + " 결과", ok and chips[0] in body and "undefined" not in body and "NaN" not in body, f"chips={chips} len={len(body)}")
        add(name + " 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add(name, False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_gunghap(browser):
    ctx, page, errors = await new_page(browser)
    try:
        await page.goto(BASE + "/fortune/gunghap/", wait_until="networkidle")
        for p, (y, m, d) in (("a", ("1990", "5", "17")), ("b", ("1992", "11", "3"))):
            await page.fill(f"#couple-{p}-year", y)
            await page.fill(f"#couple-{p}-month", m)
            await page.fill(f"#couple-{p}-day", d)
        await page.locator("form button[type=submit]").first.click()
        if not await teaser_checks(page, "궁합", "/fortune/gunghap/result/"):
            return
        rel = (await page.locator(".test-teaser-traits span").first.inner_text()).split("·")[-1].strip()
        ok = await click_cta_and_wait(page, "/fortune/gunghap/result/")
        await page.wait_for_timeout(1500)
        body = await page.locator("main").inner_text()
        add("궁합 결과(일간 관계 일치)", ok and rel in body and "/ 100" in body, f"rel={rel}")
        add("궁합 콘솔 오류 없음", not errors, " | ".join(errors[:3]))
    except Exception as e:
        add("궁합", False, repr(e)[:200])
    finally:
        await ctx.close()


async def qa_direct(browser, path, expect_prefix):
    """세션 없이 결과 주소·옛 2단계 주소를 열면 첫 화면으로 돌아가야 한다."""
    ctx, page, errors = await new_page(browser)
    try:
        await page.goto(BASE + path, wait_until="networkidle")
        await page.wait_for_timeout(2500)
        now = page.url.replace(BASE, "").split("?")[0]
        add(f"직접 열기 {path}", now == expect_prefix, f"-> {now}")
    except Exception as e:
        add(f"직접 열기 {path}", False, repr(e)[:200])
    finally:
        await ctx.close()


async def main():
    from playwright.async_api import async_playwright
    paths = sitemap_paths()
    generic = sorted({m.group(1) for p in paths if (m := re.match(r"^/tests/([^/]+)/$", p))} - {"mbti", "iq"})
    tarot = sorted({m.group(1) for p in paths if (m := re.match(r"^/tarot/([^/]+)/$", p))})
    checks = sorted({m.group(1) for p in paths if (m := re.match(r"^/check/([^/]+)/$", p))})
    print(f"테스트 {len(generic)} · 타로 {len(tarot)} · 자가진단 {len(checks)}", flush=True)
    sem = asyncio.Semaphore(4)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()

        async def run(coro):
            async with sem:
                await coro

        jobs = [qa_mbti(browser), qa_iq(browser), qa_gunghap(browser)]
        jobs += [qa_fortune(browser, m) for m in ("today", "saju", "saju-mbti")]
        jobs += [qa_generic(browser, s) for s in generic]
        jobs += [qa_tarot(browser, s) for s in tarot]
        jobs += [qa_screener(browser, s, False) for s in checks] + [qa_screener(browser, s, True) for s in checks]
        directs = [("/mbti-result/", "/tests/mbti/"), ("/tests/mbti/step2/", "/tests/mbti/"), ("/tests/iq/result/", "/tests/iq/"),
                   ("/fortune/gunghap/result/", "/fortune/gunghap/"), ("/fortune/today/result/", "/fortune/today/")]
        if generic:
            directs += [(f"/tests/{generic[0]}/result/", f"/tests/{generic[0]}/"), (f"/tests/{generic[0]}/step2/", f"/tests/{generic[0]}/")]
        if tarot:
            directs.append((f"/tarot/{tarot[0]}/result/", f"/tarot/{tarot[0]}/"))
        if checks:
            directs.append((f"/check/{checks[0]}/result/", f"/check/{checks[0]}/"))
        jobs += [qa_direct(browser, a, b) for a, b in directs]
        if ONLY:
            jobs = [j for j in jobs if ONLY in j.cr_code.co_name] or jobs
        await asyncio.gather(*(run(j) for j in jobs))
        await browser.close()

    fails = [r for r in results if not r[1]]
    print(f"\n합계 {len(results)} · 통과 {len(results) - len(fails)} · 실패 {len(fails)}")
    for n, _, d in fails:
        print(" -", n, "->", d)
    json.dump(results, open("qa_teaser_result.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


asyncio.run(main())
