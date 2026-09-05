# 워드프레스 자동 글쓰기 시스템 기획서

실시간으로 뜨는 이슈 중 **아직 경쟁자가 붙지 않은 주제**만 골라, 자동으로 글을 쓰고 워드프레스에 발행한 뒤,
성과를 다시 회수해 다음 주제 선정에 반영하는 파이프라인 설계.

- 대상: 워드프레스 블로그(신규 도메인 또는 서브도메인)
- 연계: mbtitest.co.kr(Next.js) — 블로그 글 → 테스트 페이지로 트래픽 유입
- 목표: 하루 3~10건 자동 발행, 발행 후 48시간 내 색인률 70% 이상, 롱테일 1페이지 진입

---

## 0. 한 줄 요약

> "속도"가 아니라 **"틈"**을 파는 구조다.
> 대형 언론이 반드시 쓸 주제는 버리고, **검색 수요는 생겼는데 아직 정리된 글이 없는 12~48시간의 공백**만 노린다.

---

## 1. 전체 아키텍처

```
[1] 수집 Collector          매 30분
     Google Trends KR / 네이버 DataLab / 네이버·다음 뉴스 / YouTube 인기 /
     커뮤니티 RSS / 자사 GSC 기회 키워드
                 │
                 ▼  raw_signals
[2] 정규화·군집 Normalizer   매 30분
     키워드 정규화 → 임베딩 군집화 → 기발행 글과 중복 제거
                 │
                 ▼  topics (status=collected)
[3] 경쟁도 평가 Scorer       매 1시간
     SERP 상위 10개 분석 → 수요/기회/경쟁 3축 점수 → 안전 필터
                 │
                 ▼  topics (status=scored | rejected)
[4] 선별 큐 Selector         매 3시간
     점수 임계값 + 일일 발행 쿼터 + 카테고리 밸런스
                 │
                 ▼  topics (status=approved)
[5] 작성 Writer              큐 소비
     아웃라인 → 근거 수집 → 본문 생성 → 자체 검증 → 이미지
                 │
                 ▼  articles (status=review | ready)
[6] 발행 Publisher           큐 소비
     WP REST API 업로드 → 카테고리/태그/썸네일/스키마 → 색인 요청
                 │
                 ▼  publish_log
[7] 성과 회수 Analyzer       매일 09:00
     GSC/GA 조회 → 리라이트·보강·통합·삭제 판단 → [3]의 가중치 갱신
```

각 단계는 **큐로 분리된 독립 작업자**다. 한 단계가 실패해도 큐에 남아 재시도되고,
어느 단계에서든 사람이 끼어들어 승인/거부할 수 있다.

---

## 2. [1] 수집 — 무엇을 어디서

| 소스 | 얻는 것 | 방식 | 주기 |
|---|---|---|---|
| Google Trends KR (Daily/Realtime RSS) | 급상승 검색어 + 상승률 | RSS 파싱 | 30분 |
| 네이버 DataLab 검색어 트렌드 API | 후보 키워드의 상대 검색량 추이 | OpenAPI | 후보 확정 시 |
| 네이버 뉴스 검색 API | 해당 키워드의 기사 수·최초 보도 시각 | OpenAPI | 후보 확정 시 |
| 다음/네이버 뉴스 RSS, 연예·스포츠 섹션 | 이슈 원문·맥락 | RSS | 30분 |
| YouTube Data API (`videos.list chart=mostPopular&regionCode=KR`) | 영상 급상승 주제 | API | 1시간 |
| 커뮤니티·커머스 인기글 RSS | 검색엔진보다 먼저 뜨는 초기 신호 | RSS | 30분 |
| 자사 Search Console API | **노출은 있는데 순위 8~30위인 쿼리** = 이미 검증된 기회 | API | 매일 |

> 핵심: Google Trends만 보면 이미 늦다. **커뮤니티 → 유튜브 → 트렌드** 순으로 신호가 전파되므로
> 커뮤니티·유튜브 신호가 있는데 트렌드에는 아직 없는 키워드가 가장 좋은 먹잇감이다.

**출력 레코드 (`raw_signals`)**
```
id, source, keyword, title, url, observed_at, metric(조회수/상승률), payload_json
```

---

## 3. [2] 정규화·군집

1. **정규화**: 공백/조사/이모지 제거, 자모 분리 오류 교정, 영문·한글 표기 통일(예: `아이폰17`/`아이폰 17`/`iPhone 17` → 동일 키)
2. **군집화**: 임베딩 코사인 유사도 0.85 이상은 한 토픽으로 병합 → 대표 키워드 1개 + 동의어 배열
3. **중복 제거**: 기발행 `articles.keywords`와 대조. 유사도 0.9 이상이면 신규 발행 대신 **기존 글 업데이트 후보**로 전환
4. **소스 다양성 점수**: 서로 다른 소스 N개에서 잡히면 신뢰도 ↑ (1개 소스만 = 노이즈 가능성)

---

## 4. [3] 경쟁도 평가 — 이 기획의 핵심

키워드를 실제로 구글/네이버에 검색해 **상위 10개 결과를 분석**한다.

### 4-1. 수집 지표

| 축 | 지표 | 측정 |
|---|---|---|
| 수요 D | 트렌드 상승률 | 최근 3시간 대비 24시간 증가율 |
| | 검색량 추정 | DataLab 상대지수 |
| | 소스 다양성 | 신호가 잡힌 소스 수 |
| 경쟁 C | 상위 10개 중 대형 도메인 비율 | 언론사·나무위키·네이버지식백과·유튜브 |
| | 제목 정확 일치 수 | 상위 10개 제목에 키워드가 그대로 있는 개수 |
| | 상위 결과 최신성 | 24시간 내 발행된 상위 결과 개수 |
| | 콘텐츠 깊이 | 상위 3개 평균 본문 길이 |
| 기회 O | 빈 SERP 신호 | 개인 블로그·저품질 페이지가 상위에 있으면 ↑ |
| | 질문형 수요 | 자동완성·연관검색어에 `뜻/누구/언제/방법` 등 존재 |
| | 자사 적합도 | 우리 사이트 주제(성격·심리·관계)와의 관련도 |

### 4-2. 점수 공식

```
D = 0.5·정규화(상승률) + 0.3·정규화(검색량) + 0.2·정규화(소스 다양성)
C = 0.4·대형도메인비율 + 0.3·(제목정확일치/10) + 0.2·최신성비율 + 0.1·정규화(본문깊이)
O = 0.5·빈SERP신호 + 0.3·질문형수요 + 0.2·자사적합도

SCORE = (D^1.2 × (1 - C) × (0.5 + O)) × 100
```

- `SCORE ≥ 55` → 자동 승인, 즉시 작성
- `35 ≤ SCORE < 55` → 초안(draft)까지만 생성, 사람 확인 후 발행
- `SCORE < 35` → 폐기 (단, 7일 뒤 재평가 대상으로 보관)

`C`가 0.75를 넘으면 점수와 무관하게 **즉시 폐기**. 대형 언론이 이미 자리를 잡은 판에는 들어가지 않는다.

### 4-3. 이슈 수명 분기

동일 키워드의 24시간 전/후 트렌드 곡선으로 판단한다.

- **단발 뉴스형** (급등 후 급락 예상): 속보 요약 + 타임라인 + FAQ. 짧게, 빠르게.
- **재검색형** (며칠간 완만히 유지): 정리·해설형 장문. 내부 링크 배치.
- **에버그린 전환형** (검색이 꺾이지 않음): 허브 글로 승격, 주기적 업데이트 스케줄 등록.

### 4-4. 안전 필터 (점수 이전에 무조건 통과해야 함)

자동 발행 **금지**:
- 사망·사고·재난·범죄 피해자 관련
- 실명 인물의 확인되지 않은 루머·사생활·열애설·질병
- 의료·금융·법률 조언(YMYL)
- 선거·정당·후보 관련
- 성인·도박·혐오 표현

→ 위 카테고리는 큐에서 `blocked` 처리하고 사람 승인 없이는 절대 발행하지 않는다. (AdSense·명예훼손·구글 정책 리스크 동시 차단)

---

## 5. [4] 선별 큐

3시간마다 `scored` 상태 토픽을 정렬해 발행 슬롯에 배정한다.

- 일일 쿼터: 초기 3건 → 색인률 안정 후 단계적 상향(최대 10건). **한 번에 늘리지 않는다.**
- 카테고리 밸런스: 한 카테고리가 하루 발행의 50%를 넘지 않도록
- 쿨다운: 같은 인물·작품·브랜드는 24시간 내 1건까지
- 신선도 만료: 승인 후 6시간 내 발행되지 않으면 재평가

---

## 6. [5] 작성 — 파이프라인 5단계

한 번의 프롬프트로 통글을 뽑지 않는다. 단계를 쪼개야 검증이 가능하다.

**1) 아웃라인**
- 검색 의도 분류(정보형/탐색형/거래형), 타이틀 후보 5개, H2 5~7개, 목표 분량 결정

**2) 근거 수집**
- 뉴스·공식 발표·통계 3개 이상 확보 → `{주장, 출처 URL, 발행일}` 배열로 고정
- **근거 배열에 없는 사실 주장은 본문에 쓰지 않는다** (할루시네이션 차단의 핵심 장치)

**3) 본문 생성**
```
H1 제목 (키워드 자연 포함, 32자 이내)
리드 2~3문장 — 결론부터
[핵심 요약 박스] 불릿 3~4개
H2 × 5~7 (각 200~400자, 필요 시 표·리스트)
[관련 심리 테스트 CTA] → mbtitest.co.kr 내부 링크
FAQ 3~5개 (자동완성·연관검색어 기반)
출처 목록 (원문 링크)
```

**4) 자체 검증** (별도 호출로 채점, 임계 미달 시 재작성)
- 근거 배열에 없는 단정 표현 검출
- 키워드 스터핑(밀도 3% 초과) 검출
- 제목·메타 길이, 중복 문장, 기존 글과의 유사도
- 안전 필터 재통과 여부
- 통과 점수 미달 3회 → 사람 검수 큐로

**5) 이미지·메타**
- 대표 이미지 생성(텍스트 오버레이 카드형) 또는 라이선스 이미지, `alt` 자동 작성
- 메타 설명 155자, OG 태그, `NewsArticle` 또는 `FAQPage` JSON-LD

### 원본성 확보 장치 (구글 "대량 생성 콘텐츠 남용" 정책 대응)

자동 생성 자체는 위반이 아니지만, **순위 조작 목적의 대량 양산**은 위반이다. 다음을 반드시 붙인다.

- 우리만 가진 데이터 삽입: 자사 테스트 응답 통계(예: "이 이슈 관련 성향 테스트 응답자 중 62%가…")
- 타임라인·비교표 등 **구조화된 재가공** (원문 요약만으로 끝내지 않기)
- 출처 명시 + 원문 링크 (기사 전문 복제 절대 금지, 사실 인용만)
- 발행량 제한 + 성과 없는 글은 삭제·통합 (양보다 생존율)

---

## 7. [6] 발행 — WordPress REST API

인증은 **Application Password**(관리자 계정 대신 발행 전용 계정 생성).

```
POST /wp-json/wp/v2/media          # 대표 이미지 업로드 → media_id
POST /wp-json/wp/v2/posts
{
  "title":    "...",
  "content":  "<!-- wp:paragraph -->...",   # 구텐베르크 블록 마크업
  "excerpt":  "메타 설명",
  "status":   "publish" | "draft",
  "categories": [12], "tags": [45, 67],
  "featured_media": media_id,
  "slug": "영문-슬러그",
  "meta": { "_yoast_wpseo_metadesc": "...", "_yoast_wpseo_focuskw": "..." }
}
```

- 카테고리·태그는 조회 후 없으면 `POST /wp/v2/categories`로 생성하고 ID 캐싱
- SEO 플러그인 메타를 REST로 쓰려면 해당 메타 키를 `register_post_meta(..., show_in_rest: true)` 로 노출하는 소형 머스트유즈 플러그인 1개 필요
- `SCORE ≥ 55`는 `publish`, 그 미만은 `draft`로 올리고 알림
- 실패 시 지수 백오프 재시도(2s→4s→8s→16s), 3회 실패 시 사람 알림

**발행 직후**
- 사이트맵 갱신 → IndexNow 핑(빙/네이버) → 구글은 사이트맵 + GSC 의존
- 내부 링크 자동 보강: 같은 카테고리 최신 글 3개 상호 연결
- 슬랙/텔레그램으로 발행 알림(제목·점수·URL)

---

## 8. [7] 성과 회수

매일 09:00, Search Console API로 전 글의 노출·클릭·평균순위를 가져와 판정한다.

| 발행 후 | 조건 | 조치 |
|---|---|---|
| 48시간 | 색인 안 됨 | 사이트맵 재제출, 내부 링크 추가 |
| 72시간 | 노출 있음 · 평균순위 11~30 | **보강 리라이트** (FAQ·표·최신 정보 추가) |
| 7일 | 노출 0 | 키워드 재타겟 후 리라이트 1회 |
| 14일 | 여전히 노출 0 | 유사 글과 **통합**하거나 삭제 + 301 |
| 상시 | 클릭 상위 20% | 허브 글로 승격, 월 1회 업데이트 스케줄 등록 |

이 결과는 [3] 스코어러의 가중치로 되먹인다. 실제로 순위가 잡힌 토픽의 SERP 특성(대형도메인비율 등)을
주 단위로 회귀시켜 계수를 조정하면, 시간이 갈수록 "우리가 이길 수 있는 판"을 더 잘 고른다.

---

## 9. 데이터 모델

```sql
CREATE TABLE raw_signals (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,           -- google_trends | naver_news | youtube | gsc | community
  keyword TEXT NOT NULL,
  title TEXT, url TEXT,
  metric REAL,                    -- 상승률/조회수 등 소스별 원지표
  payload TEXT,                   -- 원본 JSON
  observed_at TEXT NOT NULL
);

CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,       -- 정규화된 대표 키워드
  aliases TEXT,                   -- JSON 배열
  category TEXT,
  lifespan TEXT,                  -- news | research | evergreen
  demand REAL, competition REAL, opportunity REAL, score REAL,
  serp_snapshot TEXT,             -- 상위 10개 결과 JSON
  status TEXT NOT NULL,           -- collected|scored|approved|blocked|rejected|writing|published
  block_reason TEXT,
  created_at TEXT, scored_at TEXT, approved_at TEXT
);

CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id),
  title TEXT, slug TEXT, excerpt TEXT,
  content TEXT,                   -- 구텐베르크 블록 마크업
  evidence TEXT,                  -- [{claim, url, published_at}]
  quality_score REAL,
  status TEXT,                    -- drafting|review|ready|published|failed
  wp_post_id INTEGER, wp_url TEXT,
  published_at TEXT
);

CREATE TABLE performance (
  id INTEGER PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id),
  measured_on TEXT,
  impressions INTEGER, clicks INTEGER, avg_position REAL, indexed INTEGER,
  action TEXT                     -- none|rewrite|merge|delete|promote
);
```

---

## 10. 기술 스택 — 3가지 선택지

| 안 | 구성 | 장점 | 단점 |
|---|---|---|---|
| **A. Cloudflare Workers (추천)** | Cron Triggers + Queues + D1 + Workers AI/외부 LLM | 현 레포와 동일 스택, 서버 없음, 비용 거의 0, 코드로 버전 관리 | 초기 구축 코드량 있음 |
| B. n8n / Make | 노코드 워크플로 | 빠른 프로토타이핑, 시각적 디버깅 | 복잡한 스코어링 로직 관리 난이도, 호스팅 비용 |
| C. 워드프레스 플러그인(PHP) | WP 내부 wp-cron | 별도 인프라 불필요 | wp-cron 신뢰성 낮음, 장시간 작업 부적합, 사이트 부하 |

**A를 권장한다.** 이 레포가 이미 Cloudflare Workers + D1 + Drizzle 세팅이 되어 있어 그대로 확장 가능하다.

```
worker/
  cron/collect.ts     # */30 * * * *
  cron/score.ts       # 0 * * * *
  cron/select.ts      # 0 */3 * * *
  cron/analyze.ts     # 0 0 * * *   (KST 09:00)
  queue/write.ts      # 큐 소비 → 작성
  queue/publish.ts    # 큐 소비 → WP 발행
lib/pipeline/
  sources/*.ts        # 소스별 수집기
  normalize.ts  score.ts  safety.ts
  writer/outline.ts  writer/evidence.ts  writer/compose.ts  writer/verify.ts
  wordpress.ts        # WP REST 클라이언트
```

시크릿(`WP_APP_PASSWORD`, `NAVER_CLIENT_SECRET`, `LLM_API_KEY`, GSC 서비스 계정 키)은
Workers Secrets에 저장. 레포에 절대 커밋하지 않는다.

---

## 11. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 구글 "대량 생성 콘텐츠 남용" 제재 | 발행량 제한, 자사 데이터 삽입, 성과 없는 글 정리, 사람 검수 비율 유지 |
| 잘못된 사실 발행 | 근거 배열 강제 + 자체 검증 단계 + 미근거 단정 표현 차단 |
| 뉴스 저작권 | 전문 복제 금지, 사실 인용 + 출처 링크, 이미지 직접 생성 |
| 명예훼손·초상권 | 실명 인물 루머 카테고리 자동 차단 |
| AdSense 정책 위반 | 안전 필터 카테고리와 동일 기준 적용 |
| API 쿼터·차단 | 소스별 레이트 리밋, 실패 시 다른 소스로 폴백, 캐싱 |
| 중복 콘텐츠 | 발행 전 자사 글 유사도 검사, 0.9 이상은 업데이트로 전환 |

---

## 12. 단계별 구축 순서

**Phase 0 — 뼈대 (3~5일)**
D1 스키마 + WP REST 클라이언트 + 수동 토픽 1건을 넣으면 초안이 WP에 draft로 올라가는 경로 완성

**Phase 1 — 수집·선별 (1주)**
Google Trends + 네이버 뉴스 2개 소스, 정규화·군집, 스코어러 v1, 안전 필터. 발행은 전부 draft.

**Phase 2 — 자동 발행 (1주)**
작성 5단계 + 자체 검증 + 이미지·스키마. `SCORE ≥ 55` 자동 발행 개시, 하루 3건.

**Phase 3 — 되먹임 (지속)**
GSC 연동, 리라이트·통합·삭제 자동화, 스코어러 계수 주간 재학습. 쿼터 단계적 상향.

**성공 지표**
- 48시간 색인률 ≥ 70%
- 발행 글의 30일 생존율(노출 발생) ≥ 50%
- 자동 발행 중 사후 수정 필요 비율 ≤ 10%
- 블로그 → mbtitest.co.kr 테스트 페이지 유입 CTR ≥ 5%

---

## 13. 먼저 결정할 것

1. 워드프레스 도메인: 신규 도메인 vs `blog.mbtitest.co.kr` 서브도메인
2. 주제 범위: 심리·성격·관계 인접 이슈로 한정 vs 전방위 트렌드
3. 하루 발행 목표와 초기 자동 발행 비율(전부 draft로 시작 권장)
4. LLM 제공자와 월 예산 상한
5. 네이버 OpenAPI·Search Console 계정 준비 여부
