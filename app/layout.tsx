import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://mbtitest.co.kr";
const adsenseClient = "ca-pub-8646375689901020";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MBTI 검사 무료 | 엠비티아이 성격테스트",
    template: "%s | MBTI 검사",
  },
  description:
    "가입 없이 확인하는 무료 MBTI 검사입니다. 40개 질문으로 16가지 성격유형과 성향 지표, 강점과 주의할 점을 바로 확인해 보세요.",
  keywords: [
    "mbti 검사",
    "MBTI 검사",
    "엠비티아이 검사",
    "엠비티아검사",
    "성격테스트",
    "성격 테스트",
    "무료 MBTI 검사",
    "MBTI 성격유형검사",
    "16가지 성격유형",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "MBTI 검사",
    title: "MBTI 검사 무료 | 40문항 성격테스트",
    description:
      "40개 질문으로 알아보는 무료 MBTI 검사. 나의 16가지 성격유형과 성향 지표를 바로 확인하세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MBTI 검사 무료 | 40문항 성격테스트",
    description: "가입 없이 바로 시작하는 무료 엠비티아이 검사",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "codex-preview": "development",
    "google-adsense-account": adsenseClient,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  verification: {
    other: {
      "naver-site-verification":
        "7513b849bd09f72685fad29aa7a96e85ce1a5cbf",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
        {children}
      </body>
    </html>
  );
}
