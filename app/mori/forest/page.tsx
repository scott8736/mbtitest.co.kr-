import type { Metadata } from "next";
import ContentHeader from "../../../components/ContentHeader";
import MoriForestGame from "../../../components/MoriForestGame";
import SiteFooter from "../../../components/SiteFooter";
import { typeData } from "../../../lib/mbti-data";
import { FOREST_QUESTS } from "../../../lib/mori-forest";
import { VILLAGES } from "../../../lib/mori-world";
import { testCatalog } from "../../../lib/test-catalog";
import "./forest.css";

/**
 * 모리 게임 「마음숲 산책」 (2026-10-07). 게임과 소개를 한 장에 둡니다 — 사이트에 한 장뿐인 고유 페이지라 색인합니다.
 * 게임 영역에는 광고를 붙이지 않습니다(AdUnit 없음, 자동 광고는 google-auto-ads-ignore 로 제외).
 */
export const metadata: Metadata = {
  title: "마음숲 산책 — 내 모리랑 16모리 만나기",
  description: "MBTI 결과로 깨어난 내 모리와 네 마을을 산책하며 친구 모리 16명의 부탁을 들어주는 무료 웹 게임.",
  alternates: { canonical: "/mori/forest/" },
  openGraph: {
    type: "website",
    url: "/mori/forest/",
    title: "내 모리랑 마음숲 산책",
    description: "네 마을, 16모리, 16가지 부탁. 내 모리를 데리고 숲을 걸어 봐요.",
    images: [{ url: "/images/og/mbti-mori-og.jpg", width: 1200, height: 630, alt: "16모리" }],
  },
};

export default function MoriForestPage() {
  const names = Object.fromEntries(Object.keys(typeData).map((c) => [c, typeData[c].name]));
  const testTitles = Object.fromEntries(
    FOREST_QUESTS.map((q) => [q.slug, testCatalog.find((t) => t.slug === q.slug)?.shortTitle ?? q.slug]),
  );
  return (
    <main className="mf-page">
      <ContentHeader active="/mori/forest" />
      <MoriForestGame names={names} testTitles={testTitles} />

      <section className="mf-about">
        <h2>마음숲 산책은 이런 게임이에요</h2>
        <p>
          MBTI 검사를 마치면 내 마음속 숲의 정령 <b>모리</b>가 깨어나요. 내 모리를 데리고 마음숲의 네 마을을 걸으며
          친구 모리를 만나고, 친구들이 건네는 부탁을 하나씩 들어주는 휴대폰 웹 게임이에요. 가입도 다운로드도 없어요.
        </p>
        <h2>네 마을과 열여섯 가지 부탁</h2>
        <ul>
          {(Object.keys(VILLAGES) as (keyof typeof VILLAGES)[]).map((k) => (
            <li key={k}>
              <b>{VILLAGES[k].name}</b> ({VILLAGES[k].group}) — {VILLAGES[k].scene}. 주민 모리 넷이 각자 다른 테스트를 권해요.
            </li>
          ))}
        </ul>
        <p>
          부탁은 모두 이 사이트의 무료 테스트예요. 테스트를 마치고 돌아오면 결과가 도감 「특별 모리」 칸에 들어가고,
          한 마을의 부탁 넷을 다 들어주면 마을 도장을 받아요. 도장 네 개를 모으면 지도가 완성돼요.
        </p>
        <h2>저장과 개인정보</h2>
        <p>
          진행 상황은 지금 쓰는 휴대폰(브라우저)에만 저장되고 서버로 보내지 않아요. 브라우저 기록을 지우면 처음부터 다시 시작해요.
          모리와 마음숲은 이 사이트의 자체 캐릭터 세계관이고, 어느 모리가 더 낫거나 못한 일은 없어요.
        </p>
        <p><a href="/mori/">마음숲 16모리 세계관 자세히 보기 →</a></p>
      </section>
      <SiteFooter />
    </main>
  );
}
