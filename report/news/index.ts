// scripts/sync-news.mjs 가 만든 파일입니다. 손으로 고치지 마세요. 내용은 암호문입니다(worker/report-news.ts 가 푼다).
import type { Sealed } from "../content/index";
import ISTJ from "./ISTJ.json";
import ISFJ from "./ISFJ.json";
import INFJ from "./INFJ.json";
import INTJ from "./INTJ.json";
import ISTP from "./ISTP.json";
import ISFP from "./ISFP.json";
import INFP from "./INFP.json";
import INTP from "./INTP.json";
import ESTP from "./ESTP.json";
import ESFP from "./ESFP.json";
import ENFP from "./ENFP.json";
import ENTP from "./ENTP.json";
import ESTJ from "./ESTJ.json";
import ESFJ from "./ESFJ.json";
import ENFJ from "./ENFJ.json";
import ENTJ from "./ENTJ.json";

export const NEWS_SEALED: Record<string, Sealed> = { ISTJ, ISFJ, INFJ, INTJ, ISTP, ISFP, INFP, INTP, ESTP, ESFP, ENFP, ENTP, ESTJ, ESFJ, ENFJ, ENTJ };
