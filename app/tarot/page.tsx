import type { Metadata } from "next";
import Link from "next/link";
import { moriImage } from "../../lib/mori";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import AdUnit from "../../components/AdUnit";
import { tarotFortunes, tarotTypeLabels } from "../../lib/tarot";
import "./tarot.css";

export const metadata: Metadata = {
  title: "오늘의 타로 운세 — 종합·연애·금전·건강 무료",
  description:
    "종합운, 연애운, 금전운, 건강운, 직장운, 학업운까지 여섯 가지 오늘의 타로 운세를 회원가입 없이 무료로 봅니다. 하루 한 번, 자정에 새 카드가 열립니다.",
  keywords: [
    "오늘의 타로",
    "오늘의 운세",
    "타로 운세",
    "무료 타로",
    "타로 연애운",
    "타로 금전운",
  ],
  alternates: { canonical: "/tarot/" },
};

export default function TarotHubPage() {
  return (
    <main className="generic-test tarot">
      <SiteHeader active="/tarot" />

      <section className="generic-intro">
        <span className="eyebrow">🔮 오늘의 타로</span>
        <h1>오늘의 타로 운세</h1>
        <p>
          보고 싶은 운세를 고르고 카드를 한 장 뽑으세요. 여섯 가지 모두 각각 볼 수 있고,
          다른 질문이 떠오르면 몇 번이든 다시 뽑을 수 있습니다.
        </p>
      </section>

      <section className="tarot-hub">
        {tarotFortunes.map((fortune) => (
          <Link key={fortune.slug} href={`/tarot/${fortune.slug}/`}>
            <span className="tarot-hub-icon">
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다 */}
              <img src={moriImage(fortune.mori)} alt="" width={56} height={56} loading="lazy" />
            </span>
            <b>{tarotTypeLabels[fortune.type]}</b>
            <span className="tarot-hub-desc">{fortune.description}</span>
          </Link>
        ))}
      </section>

      <AdUnit position="testListFeed" />

      <section className="generic-explain">
        <h2>타로는 어떻게 뽑나요</h2>
        <p>
          마음속 질문을 하나 떠올리고 다섯 장 중 마음이 가는 카드를 고르세요. 결과를 본 뒤
          다른 질문이 떠오르면 「카드 다시 뽑기」로 몇 번이든 새로 뽑을 수 있습니다.
        </p>
        <p>
          쓰는 카드는 메이저 아르카나 22장입니다. 타로 78장 중에서 이름과 그림이 널리
          알려진, 하루의 흐름을 읽기에 충분한 카드들입니다. 정방향만 사용합니다.
        </p>
        <p>
          뽑은 카드는 서버로 보내지도, 저장하지도 않습니다. 다른 사람이 내 결과를 볼 수
          없습니다.
        </p>
        <p className="test-disclaimer">
          타로는 재미로 보는 콘텐츠입니다. 의학·법률·투자 판단의 근거로 삼지 마세요.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
