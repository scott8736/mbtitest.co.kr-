#!/usr/bin/env bash
# 배포 파이프라인이 실행하는 빌드.
#
# next build 로 정적 페이지를 뽑은 뒤, 관리자 화면과 접속 로그를 담당하는 워커를
# out/_worker.js 로 함께 내보냅니다. Cloudflare 는 출력 디렉터리에 _worker.js 가
# 있으면 그 파일이 모든 요청을 먼저 받고, 나머지는 env.ASSETS 로 넘어갑니다.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"

next build

out="${root}/out"
[[ -d "${out}" ]] || {
  echo "next build 산출물(out/)이 없습니다." >&2
  exit 66
}

./node_modules/.bin/esbuild worker/pages-entry.ts \
  --bundle \
  --format=esm \
  --target=es2022 \
  --platform=browser \
  --conditions=workerd,worker,browser \
  --outfile="${out}/_worker.js" \
  --log-level=warning

# 정적 파일은 워커를 거치지 않게 해서 호출 수를 아낍니다.
# 여기 적힌 경로 외의 요청만 _worker.js 가 받습니다.
cat > "${out}/_routes.json" <<'JSON'
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/_next/*",
    "/images/*",
    "/favicon.svg",
    "/file.svg",
    "/globe.svg",
    "/window.svg",
    "/ads.txt",
    "/robots.txt",
    "/sitemap.xml"
  ]
}
JSON

echo "Built out/ with _worker.js ($(wc -c < "${out}/_worker.js") bytes)"
