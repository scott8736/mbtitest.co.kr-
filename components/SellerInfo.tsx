import { SELLER } from "../lib/report-config";

/** 판매자 표시 정보(전자상거래법 제10조). 빈 칸은 「준비 중」으로 그대로 드러냅니다. */
export default function SellerInfo() {
  const row = (label: string, value: string) => (
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
      {row("문의", SELLER.contact)}
      {row("호스팅", SELLER.hosting)}
    </p>
  );
}
