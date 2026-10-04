/**
 * 유료 리포트 「모리 마음숲 안내서」 설정 (2026-10-04).
 *
 * 가격은 여기 한 곳에서만 정합니다. 화면(app/report)과 결제 서버(worker/report.ts)가 같은 값을 읽고,
 * 서버는 브라우저가 보낸 금액을 절대 믿지 않습니다.
 *
 * 판매자 표시 정보(전자상거래법 제10조): 상호·대표자·사업자등록번호·통신판매업 신고번호·주소·연락처.
 * 하나라도 비어 있으면 일반 손님 주문은 열리지 않습니다(관리자 시험 결제만 가능) — isSellerInfoComplete().
 */

export const REPORT_PRODUCT = "모리 마음숲 안내서";

/** 오픈 기념 특별 이벤트가(사용자 결정 2026-10-04). 할인 전 가격은 표시하지 않습니다(판 적이 없는 가격). */
export const REPORT_PRICE = 9900;
/** 관리자 시험 결제 금액. 페이앱 최소 금액입니다. */
export const REPORT_TEST_PRICE = 1000;
/** 이벤트 기간 — 화면에 그대로 나갑니다. 비워 두면 「이벤트」 문구 없이 가격만 보입니다. */
export const REPORT_EVENT = { label: "오픈 기념 특별 이벤트", from: "2026-10-05", to: "2026-10-31" };

/** 환불 동의 문구 판. 문구를 바꾸면 판을 올립니다 — 주문마다 어느 판에 동의했는지 남깁니다. */
export const REPORT_CONSENT_VERSION = "2026-10-04";
export const REPORT_CONSENT_TEXT =
  "디지털 콘텐츠 특성상 결제 후 리포트를 열람하면 청약철회(환불)가 제한됨을 확인했고, 무료 미리보기로 내용을 확인했습니다.";

/** 가상계좌는 취소가 안 되어 뺍니다(페이앱 관리자 「결제 설정」이 우선하니 거기서도 꺼 두세요). */
export const REPORT_PAY_TYPES = "card,kakaopay,naverpay,tosspay,applepay,smilepay,payco,phone";

export const PAYAPP_USERID = "charry333";

export const SELLER = {
  name: "챠리몰",
  owner: "김영훈",
  bizNo: "543-24-01142",
  /** 통신판매업 신고번호 (사용자 제공 2026-10-04) */
  mailOrderNo: "제2021-경남사천-0189호",
  /** 사업장 주소 */
  address: "경상남도 사천시 용현면 용현로 87, 108동 404호",
  /** 고객 문의 연락처 — 사용자 지정 이메일(2026-10-04). 문의 창구는 오픈채팅도 함께 씁니다(/contact/). */
  contact: "010-2776-8898 · tiredddq492@naver.com",
  hosting: "Cloudflare, Inc.",
};

export function isSellerInfoComplete(): boolean {
  return Boolean(SELLER.name && SELLER.owner && SELLER.bizNo && SELLER.mailOrderNo && SELLER.address && SELLER.contact);
}

export const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

/** 시진 0=모름, 1=자시 … 12=해시 (사주 화면과 같은 순서) */
export const BIRTH_TIME_SLOTS = [
  "모름", "자시 (23:00~01:00)", "축시 (01:00~03:00)", "인시 (03:00~05:00)", "묘시 (05:00~07:00)",
  "진시 (07:00~09:00)", "사시 (09:00~11:00)", "오시 (11:00~13:00)", "미시 (13:00~15:00)",
  "신시 (15:00~17:00)", "유시 (17:00~19:00)", "술시 (19:00~21:00)", "해시 (21:00~23:00)",
] as const;

export type ReportOrderInput = {
  type: string;
  scores: number[];
  name: string;
  birth: string;
  bt: number;
  phone: string;
  agree: boolean;
  consentVersion: string;
};

export type CleanOrder = {
  type: string;
  scores: [number, number, number, number];
  name: string;
  birth: string;
  bt: number;
  phone: string;
};

/**
 * 주문 입력 검사. 통과하면 정리된 값을, 아니면 사용자에게 보여 줄 이유를 돌려줍니다.
 * 이름은 표지에 그대로 찍히므로 글자·숫자·공백만 남기고 10자로 자릅니다.
 */
export function validateOrder(raw: Partial<ReportOrderInput>, today: string): { ok: true; value: CleanOrder } | { ok: false; error: string } {
  const type = String(raw.type ?? "").toUpperCase();
  if (!(MBTI_TYPES as readonly string[]).includes(type)) return { ok: false, error: "검사 결과 유형을 찾지 못했어요. 검사를 다시 해 주세요." };

  const scores = Array.isArray(raw.scores) ? raw.scores.map(Number) : [];
  if (scores.length !== 4 || scores.some((s) => !Number.isInteger(s) || s < 0 || s > 100)) {
    return { ok: false, error: "검사 점수를 읽지 못했어요. 검사를 다시 해 주세요." };
  }
  // 점수와 유형이 어긋나면(E 쪽이 50 미만인데 E 유형 등) 손으로 고친 값입니다. 동점(50)은 왼쪽 글자로 갑니다.
  const left = ["E", "S", "T", "J"];
  for (let i = 0; i < 4; i++) {
    const isLeft = type[i] === left[i];
    if (isLeft ? scores[i] < 50 : scores[i] > 50) return { ok: false, error: "검사 점수와 유형이 맞지 않아요. 검사를 다시 해 주세요." };
  }

  const name = String(raw.name ?? "").normalize("NFC").replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().slice(0, 10);

  const birth = String(raw.birth ?? "").trim();
  if (birth) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
    const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    if (!m || !d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3] || +m[1] < 1900 || birth > today) {
      return { ok: false, error: "생년월일을 다시 확인해 주세요." };
    }
  }
  const bt = Number(raw.bt ?? 0);
  if (!Number.isInteger(bt) || bt < 0 || bt > 12) return { ok: false, error: "태어난 시간을 다시 골라 주세요." };

  const phone = String(raw.phone ?? "").replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(phone)) return { ok: false, error: "휴대폰 번호를 다시 확인해 주세요." };

  if (raw.agree !== true || raw.consentVersion !== REPORT_CONSENT_VERSION) {
    return { ok: false, error: "환불 안내에 동의해 주세요." };
  }
  return { ok: true, value: { type, scores: scores as [number, number, number, number], name, birth, bt: birth ? bt : 0, phone } };
}
