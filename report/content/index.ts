// sync_report.py 가 만든 파일입니다. 손으로 고치지 마세요. 내용은 암호문입니다(worker/report-books.ts 가 푼다).
import saju from "./saju.json";
import ISTJ from "./ISTJ.json";
import ISFJ from "./ISFJ.json";
import INFP from "./INFP.json";

export type Sealed = { iv: string; ct: string };
export const REPORT_SEALED: Record<string, Sealed> = { ISTJ, ISFJ, INFP };
export const REPORT_SAJU_SEALED: Sealed = saju;
