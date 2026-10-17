/**
 * 판매 페이지 「운영자가 고른 문장」 카드 (2026-10-18 사용자 요청 — 모두에게 보임).
 *
 * 후기를 지어내지 않고, 실제 리포트 문장을 원문 그대로 인용합니다. 반응·소감은 쓰지 않습니다.
 * 유형은 사이트에서 가장 많이 나오는 ISTJ(10-04~18 검사 결과의 약 16%). 고른 쪽은 점수와 상관없이
 * 모든 ISTJ 리포트에 들어가는 장(나는 어떤 사람일까·연애)입니다. 그림은 public/report-app/quotes/.
 */
const QUOTES: { page: number; title: string; quote: string; more: string }[] = [
  {
    page: 18,
    title: "차가운 얼음 뒤에 숨은 온기",
    quote: "겉으로는 덤덤해 보여도 소중한 사람들의 기념일을 달력에 적어두고 조용히 선물을 준비하는 편입니다.",
    more: "“너 좀 차갑다”는 오해가 어디서 생기는지부터 짚고, 애정을 표현하는 방식을 따로 정리해요.",
  },
  {
    page: 20,
    title: "변화를 거부하는 것이 아니에요",
    quote: "책임을 모두 혼자 짊어지려다 보니 힘들다는 표현을 제때 하지 못해 속이 타들어 가기도 합니다.",
    more: "고집이 세다는 소리를 들을 때 실제로는 왜 그런지, 혼자 떠안지 않으려면 어떻게 말하면 되는지 적혀 있어요.",
  },
  {
    page: 25,
    title: "내 일상의 틈으로 초대하는 신호",
    quote: "앞으로의 미래 계획에 상대방을 포함하기 시작했다면 그것은 마음을 다해 다가가고 있다는 조용한 신호입니다.",
    more: "연애 장 8쪽 중 한 쪽이에요. 잘 맞는 사람, 서운할 때, 대화법이 이어져요.",
  },
];

export default function ReportQuotes() {
  return (
    <section className="rq" aria-labelledby="rq-title">
      <span className="rq-eyebrow">운영자가 고른 문장 · 리포트 원문 그대로</span>
      <h2 id="rq-title">ISTJ라면 뜨끔할 문장 3개</h2>
      <p className="rq-lead">우리 사이트에서 가장 많이 나오는 유형은 ISTJ예요. ISTJ 안내서 104쪽에서 세 문장을 고쳐 쓰지 않고 그대로 옮겼어요. 내 유형 안내서에도 이런 쪽이 유형에 맞춰 들어 있어요.</p>
      <ol className="rq-list">
        {QUOTES.map((q) => (
          <li key={q.page}>
            <p className="rq-head"><b>{q.page}쪽</b> 「{q.title}」</p>
            <blockquote>{q.quote}</blockquote>
            <p className="rq-more">{q.more}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
            <img src={`/report-app/quotes/ISTJ-${q.page}.webp`} alt={`ISTJ 안내서 ${q.page}쪽 「${q.title}」 윗부분`} width={760} height={668} loading="lazy" decoding="async" />
          </li>
        ))}
      </ol>
    </section>
  );
}
