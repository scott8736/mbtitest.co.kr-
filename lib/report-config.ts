/**
 * 유료 리포트 「MBTI 유형 마음숲 안내서」 설정 (2026-10-04).
 *
 * 가격은 여기 한 곳에서만 정합니다. 화면(app/report)과 결제 서버(worker/report.ts)가 같은 값을 읽고,
 * 서버는 브라우저가 보낸 금액을 절대 믿지 않습니다.
 *
 * 판매자 표시 정보(전자상거래법 제10조): 상호·대표자·사업자등록번호·통신판매업 신고번호·주소·연락처.
 * 하나라도 비어 있으면 일반 손님 주문은 열리지 않습니다(관리자 시험 결제만 가능) — isSellerInfoComplete().
 */

import { NEWS_PRODUCT, PAYMENT, PRODUCT, SELLER_INFO } from "./site-config";

/** 값은 site.config.json 에 있습니다. */
export const REPORT_PRODUCT = PRODUCT.name;

/**
 * 가격(사용자 결정 2026-10-14): 9,900원 고정 — 기간 이벤트·인상 계획은 없앴습니다. 올리려면 사용자 결정이 먼저입니다.
 * 결제 금액은 서버가 reportPrice() 로 정하고 주문에 저장합니다. 페이앱 통보는 저장된 금액과 대조합니다.
 */
export const REPORT_PRICE = PRODUCT.price;
/** 관리자 시험 결제 금액. 페이앱 최소 금액입니다. */
export const REPORT_TEST_PRICE = PRODUCT.testPrice;
/**
 * 토스 미니앱 인앱결제 가격(사용자 결정 2026-10-07: "무조건 9,900원").
 * 토스 콘솔 상품 가격과 같아야 한다. 수수료 20%(앱마켓 15% + 토스 5%)는 정산에서 빠진다.
 */
export const TOSS_REPORT_PRICE = PRODUCT.tossPrice;

/** 지금 받을 가격. 서버(주문)와 화면이 같은 함수를 씁니다. */
export function reportPrice(): number {
  return REPORT_PRICE;
}

/**
 * 상품 구분 (2026-10-25). 주문 표 report_orders.product 에 저장합니다. 기본은 책(book).
 * news = 「내 성향 신문」 1,900원 — 페이앱 웹 결제만. 토스 미니앱(report-toss.ts)은 책만 팝니다.
 */
export type ReportProductId = "book" | "news";
export const REPORT_PRODUCT_IDS: readonly ReportProductId[] = ["book", "news"];
export const NEWS_PRODUCT_NAME = NEWS_PRODUCT.name;
export const NEWS_PRICE = NEWS_PRODUCT.price;

/** 브라우저가 보낸 상품 값 → 상품. 비어 있으면 책, 모르는 값이면 null(주문 거절). */
export function parseProduct(raw: unknown): ReportProductId | null {
  if (raw === undefined || raw === null || raw === "") return "book";
  return (REPORT_PRODUCT_IDS as readonly string[]).includes(String(raw)) ? (String(raw) as ReportProductId) : null;
}

/** 상품별 정가. 서버가 이 값으로 결제창을 엽니다(브라우저 금액은 받지 않음). */
export function productPrice(product: ReportProductId): number {
  return product === "news" ? NEWS_PRICE : reportPrice();
}

/** 상품 이름(페이앱 goodname 앞부분) */
export function productName(product: ReportProductId): string {
  return product === "news" ? NEWS_PRODUCT_NAME : REPORT_PRODUCT;
}

/** 알림·관리자 표에 붙이는 짧은 이름. 책은 예전 그대로 「리포트」. */
export function productShort(product: string | undefined | null): string {
  return product === "news" ? NEWS_PRODUCT.short : "리포트";
}

/** 환불 동의 문구 판. 문구를 바꾸면 판을 올립니다 — 주문마다 어느 판에 동의했는지 남깁니다. */
export const REPORT_CONSENT_VERSION = "2026-10-13";
export const REPORT_CONSENT_TEXT =
  "결제 후 리포트를 열어 보면 디지털 콘텐츠라 환불(청약철회)이 안 된다는 것을 확인했어요. 무료 미리보기로 내용도 봤어요.";

/**
 * 주문 폼의 「이용약관·환불 안내」 펼침 내용 (2026-10-14 사용자 요청: 약관은 미리 체크해 두고 눌러 보면 내용이 보이게,
 * 판매 페이지 아래 환불 안내 문단도 약관 안으로). 전자상거래법 제17조 제2항 제5호 안내를 폼 안에서 바로 볼 수 있어야 합니다.
 * 동의 문구(REPORT_CONSENT_TEXT)는 그대로라 판 번호는 올리지 않았습니다. 토스 미니앱도 같은 번호를 보내므로 올리면 토스 주문이 막힙니다.
 */
export const REPORT_TERMS: [string, string][] = [
  ["환불 안내", "디지털 콘텐츠라 결제 후 리포트를 열람하면 청약철회가 제한됩니다(전자상거래법 제17조 제2항 제5호). 열람 전이라면 결제일로부터 7일 안에 전액 환불해 드립니다."],
  ["열람과 관계없이 환불하는 경우", "리포트가 열리지 않거나 깨져 있거나, 이 페이지의 설명과 내용이 다르면 열람 여부와 관계없이 환불해 드립니다."],
  ["상품", "내 검사 점수로 만든 A4 104쪽(생년월일을 넣으면 110쪽) PDF 리포트와 휴대폰 배경화면 3종, 결제일부터 7일간 AI 대화가 포함됩니다."],
  ["상품 · 내 성향 신문", "내 검사 점수와 이름으로 만든, 휴대폰으로 보는 6면 신문(웹 화면)입니다. 책(PDF)·배경화면·AI 대화는 들어 있지 않습니다. 환불 기준은 위와 같습니다."],
  ["개인정보", "결제 확인과 리포트 다시 찾기에만 휴대폰 번호를 쓰고, 광고 문자는 보내지 않습니다. 자세한 내용은 개인정보처리방침을 따릅니다."],
];

/** 가상계좌는 취소가 안 되어 뺍니다(페이앱 관리자 「결제 설정」이 우선하니 거기서도 꺼 두세요). */
export const REPORT_PAY_TYPES = PAYMENT.payTypes;

export const PAYAPP_USERID = PAYMENT.payappUserid;

/** 판매자 표시 정보. 통신판매업 신고번호(사용자 제공 2026-10-04)·문의 연락처 등 — 값은 site.config.json seller. */
export const SELLER = SELLER_INFO;

export function isSellerInfoComplete(): boolean {
  // 주소는 표시하지 않는다(2026-10-12 사용자 요청). 판매 열림 조건에서도 뺀다.
  return Boolean(SELLER.name && SELLER.owner && SELLER.bizNo && SELLER.mailOrderNo && SELLER.contact);
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
export function validateOrder(
  raw: Partial<ReportOrderInput>,
  today: string,
  /** 토스 인앱결제(2026-10-07)는 결제를 토스가 확인하므로 휴대폰 번호를 받지 않습니다. 웹(페이앱) 주문은 그대로 필수. */
  opts: { phone: boolean } = { phone: true },
): { ok: true; value: CleanOrder } | { ok: false; error: string } {
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

  const phone = opts.phone ? String(raw.phone ?? "").replace(/\D/g, "") : "";
  if (opts.phone && !/^01[016789]\d{7,8}$/.test(phone)) return { ok: false, error: "휴대폰 번호를 다시 확인해 주세요." };

  if (raw.agree !== true || raw.consentVersion !== REPORT_CONSENT_VERSION) {
    return { ok: false, error: "환불 안내에 동의해 주세요." };
  }
  return { ok: true, value: { type, scores: scores as [number, number, number, number], name, birth, bt: birth ? bt : 0, phone } };
}
