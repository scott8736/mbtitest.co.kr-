"use client";

import { useMemo, useSyncExternalStore } from "react";
import { buildDailyReading, formatKoreanDate } from "../lib/daily-fortune";
import { seoulDateKey } from "../lib/fortune-engine";
import styles from "../lib/fortune.module.css";

/**
 * 서버(빌드 시점) 렌더에 쓰는 고정 날짜.
 *
 * 정적 배포라 빌드한 날이 HTML 에 박힙니다. 실제 날짜를 쓰면 다음 배포까지
 * 지난 날짜가 걸리므로, HTML 에는 날짜를 적지 않고 이 시드로 읽을거리만
 * 채웁니다. 브라우저에서 오늘 것으로 바뀝니다.
 */
const SERVER_DATE = "2026-01-01";

/**
 * 입력 없이 바로 읽는 오늘의 운세.
 *
 * 날짜는 마운트 뒤에 정합니다. 정적 배포라 서버 렌더 시점이 곧 빌드한 날이고,
 * 거기서 오늘을 박으면 다음 배포 전까지 지난 날짜가 걸립니다. 그래서 첫
 * HTML 에는 날짜를 적지 않은 기본 읽을거리를 두고, 브라우저에서 오늘 것으로
 * 바꿉니다. 검색엔진은 빈 화면 대신 본문을 보고, 사람은 오늘 것을 봅니다.
 *
 * @param scope  띠나 별자리처럼 사람마다 갈리는 값. 없으면 전체 공통 운세.
 * @param label  제목에 붙일 이름. 예: "쥐띠"
 */
export default function DailyFortune({ scope = "", label = "" }: { scope?: string; label?: string }) {
  // 서버 스냅샷과 클라이언트 스냅샷을 따로 주는 것이 이 상황을 위한 도구입니다.
  // 이펙트에서 setState 로 날짜를 갈아끼우면 렌더가 한 번 더 돌고, 리액트가
  // 그 패턴을 경고합니다. 날짜는 세션 중에 바뀌지 않으므로 구독도 필요 없습니다.
  const dateKey = useSyncExternalStore(
    () => () => {},
    () => seoulDateKey(),
    () => SERVER_DATE,
  );
  const live = dateKey !== SERVER_DATE;
  const reading = useMemo(() => buildDailyReading(dateKey, scope), [dateKey, scope]);

  const title = label ? `${label} 오늘의 운세` : "오늘의 총운";

  return (
    <section className={styles.section} aria-labelledby="daily-fortune-title">
      <div className={styles.dailyCard}>
        <div className={styles.dailyHead}>
          <span>{live ? formatKoreanDate(reading.dateKey) : "오늘"}</span>
          <h2 id="daily-fortune-title">{title}</h2>
        </div>

        <p className={styles.dailyHeadline}>{reading.headline}</p>

        <div className={styles.dailyMeter} aria-hidden="true">
          <i style={{ width: `${reading.score}%` }} />
        </div>
        <p className={styles.dailyScore}>
          총운 <strong>{reading.score}</strong>
          <span>/ 100</span>
        </p>

        <p className={styles.dailyDetail}>{reading.detail}</p>

        <div className={styles.dailyGrid}>
          <article>
            <span>행운의 색</span>
            <b>{reading.luckyColor}</b>
          </article>
          <article>
            <span>행운의 방향</span>
            <b>{reading.luckyDirection}</b>
          </article>
          <article>
            <span>행운의 물건</span>
            <b>{reading.luckyItem}</b>
          </article>
        </div>

        <div className={styles.dailyNotes}>
          <p>
            <b>오늘 해볼 것</b>
            {reading.advice}
          </p>
          <p>
            <b>오늘 조심할 것</b>
            {reading.caution}
          </p>
        </div>

        <p className={styles.formNote}>
          날짜를 기준으로 정해지므로 같은 날에는 몇 번을 봐도 같은 내용이 나옵니다. 새로고침으로
          바뀌지 않습니다.
        </p>
      </div>
    </section>
  );
}
