import { newTestMeta } from "../lib/test-meta";

/**
 * 홈 상단 시즌 띠.
 *
 * 시즌 테스트는 열두 개가 이미 만들어져 있습니다. 날짜가 오면 아래 items 의
 * slug 세 개만 갈아끼우면 됩니다. 새로 만들 것은 없습니다.
 *
 *   9월   chuseok-food · holiday-stress · autumn-bti
 *   10월  halloween · suneung-mental · seasonal-depression(자가진단이라 /check/)
 *   11월  pepero(11/11) · first-snow · christmas-santa 는 12/11 부터
 *   12월  year-end-party · new-year-resolution · bungeoppang
 *
 * 지난 시즌 테스트는 홈에서 내리기만 하고 지우지 않습니다. 주소가 살아 있어야
 * 색인과 백링크가 남고, 내년 같은 때에 slug 만 다시 올리면 됩니다.
 */
const SEASON = {
  eyebrow: "이번 시즌",
  heading: "추석과 가을, 지금 딱 맞는 테스트",
  lead: "명절 연휴에 친구·가족과 같이 해보기 좋은 세 가지를 모았습니다.",
  items: [
    { slug: "chuseok-food", emoji: "🌕", note: "명절 상 앞에서 손이 먼저 가는 음식으로 보는 성격" },
    { slug: "holiday-stress", emoji: "😵", note: "명절에 나를 가장 지치게 하는 지점이 어디인지" },
    { slug: "autumn-bti", emoji: "🍂", note: "가을을 보내는 방식으로 알아보는 계절 성향" },
  ],
};

export default function SeasonStrip() {
  // 제목과 색은 lib/test-meta.ts 한 곳에서만 가져옵니다. 여기 따로 적어두면
  // 테스트 이름을 바꿨을 때 홈만 옛 이름으로 남습니다.
  const cards = SEASON.items
    .map((item) => {
      const meta = newTestMeta.find((m) => m.slug === item.slug);
      return meta ? { ...item, meta } : null;
    })
    .filter((card) => card !== null);

  if (cards.length === 0) return null;

  return (
    <section className="season-strip" aria-labelledby="season-strip-title">
      <div className="season-inner">
        <div className="season-head">
          <span className="eyebrow season-eyebrow">{SEASON.eyebrow}</span>
          <h2 id="season-strip-title">{SEASON.heading}</h2>
          <p>{SEASON.lead}</p>
        </div>
        <div className="season-cards">
          {cards.map((card) => (
            <a
              key={card.slug}
              className="season-card"
              href={`/tests/${card.slug}/`}
              style={{ "--accent": card.meta.color } as React.CSSProperties}
            >
              <span className="season-emoji" aria-hidden="true">{card.emoji}</span>
              <strong>{card.meta.shortTitle}</strong>
              <p>{card.note}</p>
              <span className="season-go">
                테스트하기 <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
