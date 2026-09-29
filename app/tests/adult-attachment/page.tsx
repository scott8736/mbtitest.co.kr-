import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  // 템플릿 " | MBTI 검사" 를 붙여 39자. 네이버 권장 40자 이내.
  title: "애착유형 테스트 무료 | 안정형·불안형·회피형·혼란형",
  description: "안정형·불안형·회피형·혼란형 중 나의 애착유형을 24문항으로 확인하는 무료 테스트. 유형별 특징과 궁합까지 정리했습니다.",
  keywords: ["애착유형 테스트","애착유형","애착유형 종류","성인 애착유형 검사","불안형 애착","회피형 애착","안정형 애착","혼란형 애착"],
  alternates: { canonical: "/tests/adult-attachment/" },
};

export default function Page() { return <GenericTestRunner test={genericTests["adult-attachment"]} />; }
