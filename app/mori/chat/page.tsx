import type { Metadata } from "next";
import ContentHeader from "../../../components/ContentHeader";
import MoriChat from "../../../components/MoriChat";
import SiteFooter from "../../../components/SiteFooter";
import { CHAT_FREE_PER_DAY } from "../../../lib/mori-chat";
import { testCatalog } from "../../../lib/test-catalog";
import { CHAT_RECS } from "../../../lib/mori-chat-recs";
import "./chat.css";

/**
 * 「모리 AI 대화」 (2026-10-08 초안). 대화 화면이 본문이라 검색에 내보낼 글이 없습니다 — 열기 전까지 색인하지 않습니다.
 * 대화 영역에는 광고를 붙이지 않습니다(SiteFooter ads=false).
 */
export const metadata: Metadata = {
  title: "모리랑 이야기하기 — 마음숲 AI 대화",
  description: `내 MBTI 모리와 이야기해 봐요. 하루 ${CHAT_FREE_PER_DAY}번 무료, 가입 없이 바로.`,
  alternates: { canonical: "/mori/chat/" },
  robots: { index: false, follow: true },
};

/**
 * 대화 중 추천 카드에 넣는 무료 심리테스트. 마음건강(자가진단) 분야는 뺍니다 — 고민 이야기 중에 진단 검사를 권하는 모양이 되면 안 됩니다.
 * MBTI 검사도 뺍니다(내 모리가 없는 사람에게는 고르기 화면에서 따로 권합니다).
 */
const CHAT_TESTS = testCatalog
  .filter((t) => t.status === "published" && t.slug !== "mbti" && t.category !== "마음건강")
  .map((t) => ({ slug: t.slug, href: t.href, title: t.shortTitle, icon: t.icon, desc: t.description }));

export default function MoriChatPage() {
  return (
    <main className="mc-page">
      <ContentHeader active="/mori" />
      <MoriChat tests={CHAT_TESTS} recs={CHAT_RECS} />
      <section className="mc-about">
        <h2>모리 대화는 이렇게 써요</h2>
        <ul>
          <li>하루 {CHAT_FREE_PER_DAY}번은 무료예요. 가입하지 않아도 돼요.</li>
          <li>모리는 마음숲 세계관 속 AI 캐릭터예요. 사람이 답하지 않고, 상담이나 진단을 대신하지 않아요.</li>
          <li>대화 내용은 이 사이트 서버에 저장하지 않아요. 대화 기록은 이 기기 브라우저에만 7일 남고 「대화 지우기」로 바로 지울 수 있어요. 이름·전화번호 같은 개인정보는 적지 말아 주세요.</li>
          <li>심리테스트를 하러 다녀와도 대화는 그대로예요. 화면 위쪽 「이어가기」 버튼으로 돌아오면 돼요.</li>
          <li>많이 힘들 때는 혼자 견디지 마세요. 자살예방상담전화 109(24시간), 정신건강위기상담 1577-0199.</li>
        </ul>
      </section>
      <SiteFooter ads={false} />
    </main>
  );
}
