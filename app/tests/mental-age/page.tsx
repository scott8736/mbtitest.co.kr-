import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";
import { pageOgImage } from "../../../lib/page-og";

export const metadata: Metadata = {
  title: "정신연령 테스트·정신나이 테스트",
  description: "15개 질문으로 나의 마음 나이와 호기심·책임감 성향을 알아보는 무료 정신연령 심리테스트입니다.",
  keywords: ["정신연령 테스트","정신나이 테스트","나의 정신연령","내 정신연령은 몇 살","정신연령 심리테스트"],
  alternates: { canonical: "/tests/mental-age/" },
  openGraph: { type: "website", url: "/tests/mental-age/", title: "정신연령 테스트·정신나이 테스트", description: "15개 질문으로 나의 마음 나이와 호기심·책임감 성향을 알아보는 무료 정신연령 심리테스트입니다.", images: [{ url: pageOgImage("/tests/mental-age/"), width: 1200, height: 630 }] },
};

export default function Page() { return <GenericTestRunner test={genericTests["mental-age"]} />; }
