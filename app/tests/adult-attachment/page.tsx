import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "성인 애착유형 테스트",
  description: "안정형·불안형·회피형·공포혼란형 중 나의 연애 애착유형을 24문항으로 확인하는 무료 성인 애착유형 테스트입니다.",
  keywords: ["애착유형 테스트","성인 애착유형 검사","불안형 애착 테스트","회피형 애착 테스트","안정형 애착 테스트","혼란형 애착"],
  alternates: { canonical: "/tests/adult-attachment/" },
};

export default function Page() { return <GenericTestRunner test={genericTests["adult-attachment"]} />; }
