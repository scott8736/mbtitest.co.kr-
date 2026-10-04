import { REPORT_READY_TYPES } from "../report/content/ready";

/**
 * MBTI 검사 첫 문항 위의 얇은 리포트 미리보기 띠 (2026-10-04 사용자 요청 「후킹되게」).
 *
 * 이 화면은 방문자 절반 가까이가 1단계에서 나가는 곳이라, 질문을 아래로 밀지 않게 한 줄 높이로만 둡니다.
 * 링크를 걸지 않습니다 — 검사 도중 판매 페이지로 빠지면 완주가 줄어서, 「끝까지 하면 받을 수 있다」는
 * 완주 동기로만 씁니다. 첫 답을 고르면 사라집니다(MbtiQuiz 가 index 0 에서만 그림).
 * 효과는 관리자 화면의 첫 응답률(10-04 기준 61%)로 비교합니다.
 */
export default function ReportQuizStrip() {
  const covers = REPORT_READY_TYPES.slice(0, 5);
  if (!covers.length) return null;
  return (
    <div className="quiz-report-strip" aria-label="검사를 마치면 받을 수 있는 리포트">
      <div className="quiz-report-covers" aria-hidden="true">
        {covers.map((type) => (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다
          <img key={type} src={`/report-app/preview/${type}-1.jpg`} alt="" width={34} height={48} />
        ))}
      </div>
      <p>
        <b>40문항 끝까지 하면</b> 내 점수로 만든 <b>104쪽 「마음숲 안내서」</b>(유료) 미리보기가 열려요
      </p>
    </div>
  );
}
