"use client";

import { usePathname } from "next/navigation";

const widgetDocument = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;width:100%;min-height:140px;overflow:hidden;background:transparent}
    body{display:flex;justify-content:center;align-items:flex-start}
  </style>
</head>
<body>
  <script src="https://ads-partners.coupang.com/g.js"><\/script>
  <script>
    new PartnersCoupang.G({
      "id":1010349,
      "template":"carousel",
      "trackingCode":"AF1836025",
      "width":Math.min(680,document.documentElement.clientWidth),
      "height":140,
      "tsource":""
    });
  <\/script>
</body>
</html>`;

export default function CoupangPartners() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  return (
    <aside
      aria-label="쿠팡 파트너스 광고"
      style={{
        width: "100%",
        padding: "48px 16px 36px",
        borderTop: "1px solid #e1e5dc",
        background: "#fffefa",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: 10,
          color: "#92978f",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".08em",
        }}
      >
        추천 상품 · 광고
      </span>
      <iframe
        title="쿠팡 파트너스 추천 상품"
        srcDoc={widgetDocument}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          display: "block",
          width: "min(680px, 100%)",
          height: 140,
          margin: "0 auto",
          border: 0,
          overflow: "hidden",
          background: "transparent",
        }}
      />
    </aside>
  );
}
