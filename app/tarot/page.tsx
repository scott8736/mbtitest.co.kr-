import type { Metadata } from "next";
import Link from "next/link";
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
        <span className="eyebrow">DAILY TAROT</span>
        <h1>오늘의 타로 운세</h1>
        <p>
          보고 싶은 운세를 고르고 카드를 한 장 뽑으세요. 여섯 가지 모두 각각 볼 수 있고,
          한 번 뽑은 카드는 자정까지 그대로 유지됩니다.
        </p>
      </section>

      <section className="tarot-hub">
        {tarotFortunes.map((fortune) => (
          <Link key={fortune.slug} href={`/tarot/${fortune.slug}/`}>
            <span className="tarot-hub-icon" style={{ background: fortune.color }}>
              {fortune.icon}
            </span>
            <b>{tarotTypeLabels[fortune.type]}</b>
            <span className="tarot-hub-desc">{fortune.description}</span>
          </Link>
        ))}
      </section>

      <AdUnit position="testListFeed" />

      <section className="generic-explain">
        <h2>왜 하루에 한 번만 뽑을 수 있나요</h2>
        <p>
          마음에 드는 카드가 나올 때까지 다시 뽑을 수 있다면, 그것은 운세가 아니라 그냥
          고르기입니다. 그래서 이 타로는 뽑은 카드를 자정까지 고정합니다. 새로고침해도
          같은 카드가 나오고, 날짜가 바뀌면 자동으로 새 카드를 뽑을 수 있게 됩니다.
        </p>
        <p>
          쓰는 카드는 메이저 아르카나 22장입니다. 타로 78장 중에서 이름과 그림이 널리
          알려진, 하루의 흐름을 읽기에 충분한 카드들입니다. 정방향만 사용합니다.
        </p>
        <p>
          뽑은 결과는 이 브라우저 안에만 저장됩니다. 서버로 보내지 않으며 다른 사람이 볼
          수 없습니다. 그래서 브라우저를 바꾸거나 기록을 지우면 다시 뽑게 됩니다.
        </p>
        <p className="test-disclaimer">
          타로는 재미로 보는 콘텐츠입니다. 의학·법률·투자 판단의 근거로 삼지 마세요.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
