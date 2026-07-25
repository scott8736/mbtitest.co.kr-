import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "에겐녀 테스트·테토녀 테스트",
  description: "나는 에겐형일까 테토형일까? 20문항으로 에겐녀·테토녀·에겐남·테토남 성향과 차이를 확인하는 무료 재미형 테스트입니다.",
  keywords: ["에겐녀 테스트","테토녀 테스트","에겐남 테스트","테토남 테스트","에겐 테토 테스트","테토녀 에겐녀 차이","에겐녀 테토남 궁합"],
  alternates: { canonical: "/tests/egen-teto" },
};

export default function Page() { return <GenericTestRunner test={genericTests["egen-teto"]} />; }
