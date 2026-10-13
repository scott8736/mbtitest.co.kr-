/**
 * 쪽마다 다른 og:image 경로 (2026-10-14).
 *
 * 운세·성향 테스트·자가진단·타로 147쪽이 사이트 공통 이미지 한 장을 같이 써서 네이버 검색 썸네일이
 * 전부 같았다. 이제 경로(슬러그)별로 1200x630 이미지가 하나씩 있다.
 * scripts/make_page_og.py 가 scripts/page-og-manifest.json 으로 public/images/og/pages/ 를 만든다.
 * 새 쪽을 추가하면 매니페스트에 한 줄 넣고 스크립트를 다시 돌린다 (tests/page-og.test.mjs 가 빠지면 막는다).
 *
 * 슬러그 규칙: 경로의 앞뒤 / 를 떼고 나머지 / 를 - 로. "/fortune/dream/snake/" -> "fortune-dream-snake"
 */
export const pageOgSlug = (path: string) => path.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");

export const pageOgImage = (path: string) => `/images/og/pages/${pageOgSlug(path)}.jpg`;
