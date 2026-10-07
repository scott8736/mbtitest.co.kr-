import { Fragment, type ReactNode } from "react";
import { SELLER } from "../lib/report-config";

/**
 * 연락처 글자. 이메일이 한 덩어리 글자로 나가면 Cloudflare 이메일 가리기가 /cdn-cgi/l/email-protection 링크로 바꿔
 * 검색 로봇에게는 전 페이지에 404 링크가 생깁니다(10-08 점검). @ 뒤에 <wbr>을 끼워 보이는 글자는 그대로 둡니다.
 */
export function ContactText({ value = SELLER.contact }: { value?: string }) {
  const parts = value.split("@");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && (
            <>
              @<wbr />
            </>
          )}
        </Fragment>
      ))}
    </>
  );
}

/** 판매자 표시 정보(전자상거래법 제10조). 빈 칸은 「준비 중」으로 그대로 드러냅니다. */
export default function SellerInfo() {
  const row = (label: string, value: ReactNode) => (
    <span>
      {label} {value || "준비 중"}
    </span>
  );
  return (
    <p className="seller-info">
      {row("상호", SELLER.name)}
      {row("대표", SELLER.owner)}
      {row("사업자등록번호", SELLER.bizNo)}
      {row("통신판매업 신고", SELLER.mailOrderNo)}
      {row("주소", SELLER.address)}
      {row("문의", SELLER.contact ? <ContactText /> : "")}
      {row("호스팅", SELLER.hosting)}
    </p>
  );
}
