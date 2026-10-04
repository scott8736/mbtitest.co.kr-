import { MORI, moriImage } from "../lib/mori";
import { MORI_WORLD, VILLAGES, pairsFor, villageOf } from "../lib/mori-world";
import { typeData } from "../lib/mbti-data";

/** 마을 배지: 「🌙 달빛 호수」 처럼 마을 색 알약 */
export function VillageBadge({ code }: { code: string }) {
  const v = VILLAGES[villageOf(code)];
  return (
    <a className="village-badge" href={`/mori/#${villageOf(code)}`} style={{ "--village": v.color } as React.CSSProperties}>
      {v.name} 주민
    </a>
  );
}

/**
 * 「○○ 모리의 마음숲 프로필」 상자 — 결과 화면·유형 페이지에 둡니다 (2026-10-04).
 * 마을 · 말버릇 · 숲에서 맡은 일 · 상징 소품 · 짝꿍과 라이벌(궁합 페이지 해당 조합으로 연결).
 */
export function MoriForestCard({ code }: { code: string }) {
  const c = code.toUpperCase();
  const world = MORI_WORLD[c];
  const mori = MORI[c];
  if (!world || !mori) return null;
  const v = VILLAGES[villageOf(c)];
  const friends = pairsFor(c);
  return (
    <section className="forest-card" style={{ "--village": v.color, "--mori": mori.color } as React.CSSProperties} aria-label={`${c} 모리의 마음숲 프로필`}>
      <div className="forest-card-head">
        <span>마음숲 프로필</span>
        <VillageBadge code={c} />
      </div>
      <p className="forest-says">“{world.says}”</p>
      <p className="forest-line">{world.line}</p>
      <dl className="forest-facts">
        <div><dt>사는 곳</dt><dd>{v.name} · {v.scene}</dd></div>
        <div><dt>숲에서 맡은 일</dt><dd>{world.role}</dd></div>
        <div><dt>늘 들고 다니는 것</dt><dd>{mori.prop}</dd></div>
      </dl>
      {friends.length > 0 && (
        <div className="forest-friends">
          {friends.map((p) => {
            const other = p.a === c ? p.b : p.a;
            return (
              <a key={other + p.kind} href={`/compatibility/${c.toLowerCase()}/#${other.toLowerCase()}`}>
                <img src={moriImage(other)} width={48} height={48} alt="" loading="lazy" />
                <span>
                  <b>{p.kind === "짝꿍" ? "💞 짝꿍" : "⚡ 티격태격 라이벌"}</b>
                  {other} {typeData[other]?.name} — {p.hook}
                </span>
              </a>
            );
          })}
        </div>
      )}
      <a className="forest-more" href="/mori/">16모리가 사는 마음숲 둘러보기 →</a>
    </section>
  );
}
