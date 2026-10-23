"use client";

import { SELLER } from "../lib/report-config";

/**
 * 메일 보내기 버튼. HTML 에 mailto: 링크를 두면 Cloudflare 이메일 가리기가 /cdn-cgi/l/email-protection 링크로 바꿔
 * 로봇에게 404 링크가 생기므로(SellerInfo 의 ContactText 참고), 누를 때 주소를 만듭니다.
 */
export default function MailButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => { window.location.href = `mailto:${SELLER.contact}`; }}>
      {children}
    </button>
  );
}
