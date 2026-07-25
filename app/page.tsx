"use client";

import { useMemo, useState } from "react";
import TestDirectory from "../components/TestDirectory";
import AdUnit from "../components/AdUnit";
import SiteFooter from "../components/SiteFooter";

type Axis = "EI" | "SN" | "TF" | "JP";
type Answer = 1 | -1;

const questions: { axis: Axis; a: string; b: string }[] = [
  { axis: "EI", a: "여러 사람과 어울릴수록 에너지가 생긴다", b: "혼자만의 시간을 가져야 에너지가 충전된다" },
  { axis: "SN", a: "확실한 사실과 경험을 먼저 본다", b: "가능성과 숨은 의미를 먼저 떠올린다" },
  { axis: "TF", a: "결정할 때 논리와 원칙이 우선이다", b: "결정이 사람에게 미칠 영향을 먼저 생각한다" },
  { axis: "JP", a: "미리 계획하고 정리해야 마음이 편하다", b: "상황에 맞춰 유연하게 움직이는 편이다" },
  { axis: "EI", a: "생각을 말하면서 정리하는 편이다", b: "충분히 생각한 뒤 말하는 편이다" },
  { axis: "SN", a: "설명은 구체적이고 실제적일수록 좋다", b: "큰 그림과 비유가 있는 설명이 더 좋다" },
  { axis: "TF", a: "솔직하고 정확한 피드백이 도움이 된다", b: "따뜻하고 배려 있는 피드백이 도움이 된다" },
  { axis: "JP", a: "마감보다 여유 있게 끝내는 편이다", b: "마감이 가까워질수록 집중력이 올라간다" },
  { axis: "EI", a: "새로운 모임에서 먼저 말을 거는 편이다", b: "상대가 말을 걸어올 때까지 지켜보는 편이다" },
  { axis: "SN", a: "검증된 방법을 활용하는 것이 안정적이다", b: "새로운 방법을 시도하는 것이 흥미롭다" },
  { axis: "TF", a: "갈등에서는 옳고 그름을 분명히 한다", b: "갈등에서는 관계와 분위기를 먼저 살핀다" },
  { axis: "JP", a: "여행 전에 일정과 동선을 정해둔다", b: "여행지에서 그날 기분대로 정한다" },
  { axis: "EI", a: "주말에 약속이 많아도 즐거운 편이다", b: "약속 없는 조용한 주말이 더 좋다" },
  { axis: "SN", a: "현재 활용할 수 있는 것을 중요하게 본다", b: "앞으로 발전할 가능성을 중요하게 본다" },
  { axis: "TF", a: "공정한 기준은 누구에게나 같아야 한다", b: "각자의 사정에 따라 기준도 달라질 수 있다" },
  { axis: "JP", a: "해야 할 일을 목록으로 관리한다", b: "중요한 일부터 그때그때 처리한다" },
  { axis: "EI", a: "관심사가 생기면 주변 사람과 바로 나눈다", b: "관심사가 생기면 혼자 깊이 파고든다" },
  { axis: "SN", a: "현실적인 해답을 찾는 데 강하다", b: "색다른 연결과 아이디어를 찾는 데 강하다" },
  { axis: "TF", a: "감정보다 문제 해결이 먼저라고 느낀다", b: "문제 해결 전에 감정을 이해해야 한다고 느낀다" },
  { axis: "JP", a: "결정이 내려지면 홀가분하다", b: "선택지를 열어두면 마음이 편하다" },
  { axis: "EI", a: "활발한 대화 속에서 아이디어가 떠오른다", b: "조용히 생각할 때 아이디어가 떠오른다" },
  { axis: "SN", a: "새 정보를 배울 때 사례부터 보고 싶다", b: "새 정보를 배울 때 원리부터 알고 싶다" },
  { axis: "TF", a: "결과가 합리적이라면 불편한 결정도 할 수 있다", b: "모두가 납득할 수 있는 과정이 결과만큼 중요하다" },
  { axis: "JP", a: "예정된 계획이 바뀌면 신경이 쓰인다", b: "예정에 없던 변화도 재미있게 받아들인다" },
  { axis: "EI", a: "여럿이 함께하는 취미가 더 즐겁다", b: "혼자 몰입할 수 있는 취미가 더 즐겁다" },
  { axis: "SN", a: "눈앞의 문제를 해결하는 데 집중한다", b: "문제 뒤에 숨은 패턴을 찾는 데 집중한다" },
  { axis: "TF", a: "토론에서는 근거가 가장 중요하다", b: "토론에서는 말투와 분위기도 중요하다" },
  { axis: "JP", a: "일정을 미리 확정하는 편이 좋다", b: "일정은 여지를 남겨두는 편이 좋다" },
  { axis: "EI", a: "낯선 사람과도 금방 공통점을 찾는다", b: "친해지는 데 시간이 필요하지만 관계는 깊다" },
  { axis: "SN", a: "실현 가능한 아이디어에 마음이 간다", b: "아직 불확실해도 독창적인 아이디어에 마음이 간다" },
  { axis: "TF", a: "칭찬보다 개선할 점을 듣는 것이 유익하다", b: "개선점도 인정과 격려 속에서 듣고 싶다" },
  { axis: "JP", a: "하루의 우선순위를 아침에 정한다", b: "하루의 흐름을 보며 우선순위를 바꾼다" },
  { axis: "EI", a: "기쁜 일이 생기면 바로 누군가에게 연락한다", b: "기쁜 일이 생기면 먼저 혼자 음미한다" },
  { axis: "SN", a: "익숙한 것을 더 능숙하게 만드는 편이다", b: "새로운 분야를 탐색하는 편이다" },
  { axis: "TF", a: "규칙은 예외 없이 적용될 때 공정하다", b: "상황을 고려한 예외가 더 공정할 때도 있다" },
  { axis: "JP", a: "물건은 정해진 자리에 있어야 편하다", b: "필요할 때 찾을 수 있으면 충분하다" },
  { axis: "EI", a: "사람이 많은 장소의 활기가 좋다", b: "사람이 적은 장소의 여유가 좋다" },
  { axis: "SN", a: "과거의 경험에서 답을 찾는 편이다", b: "새로운 가능성에서 답을 찾는 편이다" },
  { axis: "TF", a: "어려운 결정일수록 객관적으로 거리를 둔다", b: "어려운 결정일수록 당사자의 마음을 더 헤아린다" },
  { axis: "JP", a: "시작 전에 완성까지의 순서를 정한다", b: "시작한 뒤 필요한 순서를 찾아간다" },
];

const typeData: Record<string, { name: string; tagline: string; description: string; strengths: string[]; watch: string[]; color: string }> = {
  ISTJ: { name: "청렴결백한 관리자", tagline: "차분하게 기준을 세우는 현실주의자", description: "책임감과 꾸준함으로 약속을 지키며, 구체적인 사실을 바탕으로 안정적인 결과를 만듭니다.", strengths: ["신뢰할 수 있는 실행력", "정확한 판단", "꾸준한 책임감"], watch: ["변화에 적응할 시간 필요", "감정 표현을 미룰 수 있음"], color: "#66785f" },
  ISFJ: { name: "용감한 수호자", tagline: "세심하게 사람을 돌보는 조력자", description: "작은 변화도 놓치지 않는 관찰력과 따뜻한 책임감으로 주변 사람에게 안정감을 줍니다.", strengths: ["세심한 배려", "성실한 지원", "뛰어난 기억력"], watch: ["자신의 필요를 뒤로 미룸", "과한 책임을 떠안을 수 있음"], color: "#769778" },
  INFJ: { name: "선의의 옹호자", tagline: "통찰로 더 나은 방향을 그리는 이상주의자", description: "사람과 세상의 깊은 의미를 읽고, 가치 있는 변화를 조용하지만 끈기 있게 이끌어갑니다.", strengths: ["깊은 통찰", "공감과 신념", "창의적 문제 해결"], watch: ["완벽을 추구하기 쉬움", "혼자 고민을 쌓아둘 수 있음"], color: "#6d8d79" },
  INTJ: { name: "용의주도한 전략가", tagline: "큰 그림을 설계하는 독립적 사고가", description: "복잡한 문제의 구조를 빠르게 파악하고 장기적인 계획을 세워 효율적인 길을 찾아냅니다.", strengths: ["전략적 사고", "높은 독립성", "개선점 발견"], watch: ["기준이 지나치게 높을 수 있음", "감정적 맥락을 놓칠 수 있음"], color: "#4e6e66" },
  ISTP: { name: "만능 재주꾼", tagline: "직접 부딪혀 해답을 찾는 해결사", description: "상황을 냉정하게 관찰하고 필요한 순간 빠르게 움직이며 실제로 작동하는 해법을 만듭니다.", strengths: ["탁월한 문제 해결", "위기 대응력", "유연한 실용성"], watch: ["장기 계획에 흥미를 잃을 수 있음", "속마음을 잘 드러내지 않음"], color: "#5c7774" },
  ISFP: { name: "호기심 많은 예술가", tagline: "자신만의 감각으로 오늘을 사는 탐험가", description: "섬세한 감각과 열린 마음으로 일상의 아름다움을 발견하고, 자신의 가치에 따라 유연하게 움직입니다.", strengths: ["따뜻한 감수성", "뛰어난 적응력", "진솔한 표현"], watch: ["갈등을 피하려 할 수 있음", "장기 결정을 미룰 수 있음"], color: "#85a06c" },
  INFP: { name: "열정적인 중재자", tagline: "진심과 가능성을 믿는 이상주의자", description: "자신의 가치와 사람의 가능성을 소중히 여기며, 풍부한 상상력으로 의미 있는 이야기를 만듭니다.", strengths: ["깊은 공감", "창의적 상상력", "강한 가치관"], watch: ["현실적인 실행이 늦어질 수 있음", "비판을 오래 마음에 담음"], color: "#6d9b82" },
  INTP: { name: "논리적인 사색가", tagline: "끊임없이 원리를 탐구하는 아이디어 뱅크", description: "당연해 보이는 것도 다시 질문하고, 논리적 분석과 독창적인 연결로 새로운 관점을 제시합니다.", strengths: ["논리적 분석", "지적 호기심", "독창적인 아이디어"], watch: ["생각이 실행보다 앞설 수 있음", "일상적인 반복에 지침"], color: "#547c78" },
  ESTP: { name: "모험을 즐기는 사업가", tagline: "순간을 읽고 기회를 잡는 행동가", description: "현장의 변화를 빠르게 감지하고 대담한 행동력과 유머로 주변에 활기를 불어넣습니다.", strengths: ["빠른 상황 판단", "대담한 실행", "뛰어난 적응력"], watch: ["장기 결과를 놓칠 수 있음", "지루함을 쉽게 느낌"], color: "#b58752" },
  ESFP: { name: "자유로운 연예인", tagline: "즐거움과 온기를 전하는 분위기 메이커", description: "사람들과 순간의 기쁨을 나누며, 현실 감각과 따뜻한 관심으로 일상을 특별하게 만듭니다.", strengths: ["밝은 에너지", "현실적인 센스", "사람을 편하게 하는 힘"], watch: ["계획적인 관리가 어려울 수 있음", "갈등에 민감함"], color: "#c48c5e" },
  ENFP: { name: "재기발랄한 활동가", tagline: "가능성을 발견하고 사람을 연결하는 영감가", description: "새로운 아이디어와 사람에게서 에너지를 얻고, 진정성 있는 열정으로 변화를 시작합니다.", strengths: ["풍부한 아이디어", "소통과 공감", "새로운 도전"], watch: ["관심이 자주 바뀔 수 있음", "세부 마무리를 놓칠 수 있음"], color: "#b68a50" },
  ENTP: { name: "뜨거운 논쟁을 즐기는 변론가", tagline: "고정관념을 뒤집는 영리한 탐험가", description: "서로 다른 아이디어를 빠르게 연결하고, 질문과 토론을 통해 더 나은 가능성을 찾아냅니다.", strengths: ["민첩한 사고", "대담한 혁신", "설득력 있는 소통"], watch: ["반복 업무에 약함", "논쟁이 감정에 미칠 영향을 놓침"], color: "#a77d4c" },
  ESTJ: { name: "엄격한 관리자", tagline: "질서와 실행으로 목표를 이루는 리더", description: "명확한 기준과 조직력으로 사람과 자원을 움직이며 약속한 결과를 끝까지 만들어냅니다.", strengths: ["강한 추진력", "명확한 조직력", "현실적인 판단"], watch: ["다른 속도를 답답해할 수 있음", "융통성이 부족해 보일 수 있음"], color: "#58758a" },
  ESFJ: { name: "사교적인 외교관", tagline: "사람을 모으고 조화를 만드는 협력가", description: "주변의 필요를 빠르게 알아차리고 따뜻한 소통과 책임감으로 편안한 공동체를 만듭니다.", strengths: ["관계 형성", "세심한 협력", "높은 책임감"], watch: ["타인의 평가에 민감함", "거절을 어려워할 수 있음"], color: "#6c8695" },
  ENFJ: { name: "정의로운 사회운동가", tagline: "사람의 성장을 이끄는 따뜻한 리더", description: "사람의 장점을 알아보고 진심 어린 소통과 비전으로 함께 성장하는 방향을 제시합니다.", strengths: ["공감형 리더십", "설득과 동기부여", "관계 통찰"], watch: ["타인에게 지나치게 몰입함", "자기 돌봄을 미룰 수 있음"], color: "#657f89" },
  ENTJ: { name: "대담한 통솔자", tagline: "목표를 구조화하고 성과를 만드는 지휘자", description: "도전적인 목표를 선명하게 제시하고 전략과 결단력으로 조직을 앞으로 움직입니다.", strengths: ["전략적 리더십", "빠른 의사결정", "목표 달성력"], watch: ["속도를 강요할 수 있음", "감정적 신호를 놓칠 수 있음"], color: "#506c7a" },
};

const typeDetails: Record<string, { love: string; work: string; stress: string; growth: string[] }> = {
  ISTJ:{love:"말보다 약속과 꾸준한 행동으로 마음을 보여줍니다. 신뢰가 쌓일수록 오래 책임지는 관계를 만듭니다.",work:"정확한 기준과 절차가 있는 환경에서 강하며, 맡은 일을 끝까지 안정적으로 완성합니다.",stress:"갑작스러운 변경과 무책임한 태도가 반복되면 지칩니다. 혼자 정리할 시간과 예측 가능한 일상이 회복에 도움이 됩니다.",growth:["감정을 사실처럼 분명하게 표현하기","완벽한 준비 전에도 작은 변화를 시도하기","도움을 요청하는 것도 책임의 일부로 보기"]},
  ISFJ:{love:"상대의 취향과 일상을 세심하게 기억하고 생활 속 돌봄으로 애정을 표현합니다.",work:"사람에게 실제 도움이 되는 일을 성실하게 지원하며 보이지 않는 빈틈을 잘 채웁니다.",stress:"고마움을 받지 못한 채 책임만 늘어나면 소진됩니다. 거절과 자기 돌봄이 필요합니다.",growth:["내 필요를 먼저 확인하기","부탁을 모두 받아들이지 않기","서운함을 쌓기 전에 말하기"]},
  INFJ:{love:"가벼운 만남보다 가치관과 내면을 깊이 나누는 관계를 원합니다.",work:"사람과 조직의 숨은 흐름을 읽고 장기적인 의미가 있는 방향을 설계합니다.",stress:"가치와 현실의 차이가 크거나 감정적 소음이 많으면 쉽게 지칩니다.",growth:["완벽한 이해를 기다리지 않고 말하기","혼자 해결하려는 습관 줄이기","작은 현실적 행동으로 생각을 옮기기"]},
  INTJ:{love:"독립성을 존중하면서도 지적 신뢰와 장기적인 방향이 맞는 관계를 중요하게 봅니다.",work:"복잡한 구조를 분석하고 더 효율적인 시스템을 만드는 데 강합니다.",stress:"비효율과 반복적인 간섭이 계속되면 냉소적이 되거나 관계를 차단할 수 있습니다.",growth:["결론 전에 상대의 감정을 확인하기","성과와 별개로 과정을 인정하기","쉬는 시간도 전략에 포함하기"]},
  ISTP:{love:"각자의 자유를 존중하고 필요할 때 실질적인 도움을 주며 마음을 표현합니다.",work:"현장에서 문제를 빠르게 파악하고 직접 고치는 실용적인 해결사입니다.",stress:"감정 설명을 강요받거나 선택권이 사라지면 거리를 두고 싶어집니다.",growth:["잠수 대신 필요한 시간을 말하기","장기 계획에 최소 기준 세우기","도움을 행동뿐 아니라 말로도 표현하기"]},
  ISFP:{love:"상대의 개성과 감정을 존중하며 자연스럽고 따뜻한 순간을 함께 만들고 싶어 합니다.",work:"감각과 사람에 대한 이해를 활용해 실제 경험의 품질을 높입니다.",stress:"강한 비판과 갈등이 이어지면 마음을 닫고 결정을 미룰 수 있습니다.",growth:["불편한 상황에서도 내 기준 말하기","장기 목표를 작은 단계로 나누기","비판과 나의 가치를 분리하기"]},
  INFP:{love:"진심과 가치관이 통하는 관계에서 깊이 헌신하며 상대의 가능성을 믿습니다.",work:"의미 있는 주제에 창의성과 공감을 더해 독창적인 결과를 만듭니다.",stress:"가치가 무시되거나 반복적인 현실 업무가 쌓이면 무기력해질 수 있습니다.",growth:["생각을 일정과 행동으로 연결하기","상대를 이상화하지 않기","완성보다 제출을 우선하는 연습하기"]},
  INTP:{love:"감정 표현은 조용하지만 생각과 관심사를 오래 나누는 방식으로 가까워집니다.",work:"복잡한 원리를 분석하고 기존 방식에서 보지 못한 가능성을 발견합니다.",stress:"의미 없는 반복과 지나친 감정 요구가 계속되면 생각 속으로 숨을 수 있습니다.",growth:["생각이 완벽해지기 전에 시도하기","감정을 논리로만 해석하지 않기","생활 리듬을 외부 장치로 관리하기"]},
  ESTP:{love:"함께 즐기고 직접 경험하는 관계를 선호하며 호감이 생기면 빠르게 행동합니다.",work:"변화가 빠른 현장에서 기회를 포착하고 즉각적인 해결책을 만듭니다.",stress:"통제받거나 변화 없는 일상이 길어지면 충동적인 선택을 할 수 있습니다.",growth:["행동 전 장기 결과 한 번 보기","상대의 느린 감정 속도 기다리기","지루한 기본 관리도 루틴화하기"]},
  ESFP:{love:"표현이 풍부하고 함께하는 순간을 특별하게 만들며 사랑받는 느낌을 나누고 싶어 합니다.",work:"사람과 현장의 분위기를 살리고 현실적인 센스로 경험을 즐겁게 만듭니다.",stress:"갈등과 부정적인 평가가 지속되면 감정을 피하거나 과소비로 풀 수 있습니다.",growth:["즐거움과 회피를 구분하기","재정·일정의 기본 틀 만들기","불편한 감정도 짧게 말하기"]},
  ENFP:{love:"새로운 가능성과 깊은 대화를 함께 나눌 수 있는 관계에서 열정적으로 사랑합니다.",work:"사람과 아이디어를 연결하고 새로운 시작에 필요한 에너지를 만듭니다.",stress:"자유가 제한되거나 세부 마무리가 누적되면 흥미를 잃고 자책할 수 있습니다.",growth:["시작보다 마무리 개수 관리하기","모든 가능성을 동시에 잡지 않기","감정이 큰 날에는 결정을 미루기"]},
  ENTP:{love:"재미있는 대화와 지적 자극을 즐기며 관계 안에서도 자유와 변화를 원합니다.",work:"고정관념을 깨고 여러 가능성을 빠르게 실험하는 혁신적인 문제 해결자입니다.",stress:"반복과 세밀한 통제가 길어지면 논쟁적이거나 산만해질 수 있습니다.",growth:["이기는 토론보다 이해를 선택하기","아이디어의 마지막 20% 완성하기","상대의 감정을 반박하지 않고 확인하기"]},
  ESTJ:{love:"관계의 방향과 책임을 분명하게 하며 현실적인 행동으로 안정감을 줍니다.",work:"목표와 역할을 명확히 정하고 조직을 빠르게 실행 단계로 이끕니다.",stress:"기준이 지켜지지 않거나 진행이 느리면 통제 강도가 높아질 수 있습니다.",growth:["다른 방식도 결과를 낼 수 있음을 인정하기","지시 전에 이유를 설명하기","감정적 피로를 일정에 반영하기"]},
  ESFJ:{love:"표현과 돌봄이 풍부하며 서로의 일상에 적극적으로 참여하는 관계를 원합니다.",work:"사람을 연결하고 필요한 지원을 빠르게 제공해 협력적인 분위기를 만듭니다.",stress:"노력을 알아주지 않거나 관계가 불안정하면 타인의 평가에 과도하게 집중할 수 있습니다.",growth:["모두에게 좋은 사람이 되려 하지 않기","거절을 관계 단절로 해석하지 않기","혼자만의 기준과 취미 만들기"]},
  ENFJ:{love:"상대의 성장을 응원하고 관계의 미래를 함께 그리며 따뜻하게 이끕니다.",work:"사람의 장점을 발견하고 공동의 목표에 참여하도록 동기를 부여합니다.",stress:"다른 사람의 문제까지 책임지려 하면 감정적으로 소진됩니다.",growth:["도움과 통제를 구분하기","내 감정도 같은 비중으로 듣기","상대가 스스로 선택할 시간을 주기"]},
  ENTJ:{love:"존중과 성장을 중요하게 여기며 관계의 문제도 함께 해결할 프로젝트처럼 다룹니다.",work:"도전적인 목표를 세우고 자원과 사람을 구조화해 성과를 만들어냅니다.",stress:"통제할 수 없는 지연과 무능한 의사결정이 반복되면 공격적으로 보일 수 있습니다.",growth:["해결 전에 감정을 인정하기","쉬는 것을 성과의 반대로 보지 않기","상대의 속도와 동기를 질문하기"]},
};

function BrainMark() {
  return <span className="brain-mark" aria-hidden="true">✦</span>;
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "test" | "result">("home");
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<Axis, number>>({ EI: 0, SN: 0, TF: 0, JP: 0 });
  const [result, setResult] = useState("INFJ");

  const progress = ((index + 1) / questions.length) * 100;
  const resultInfo = typeData[result];
  const percentages = useMemo(() => {
    const totalPerAxis = questions.filter((q) => q.axis === "EI").length;
    const labels: Record<Axis, [string, string]> = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };
    return (Object.keys(labels) as Axis[]).map((axis) => {
      const left = Math.round(((scores[axis] + totalPerAxis) / (2 * totalPerAxis)) * 100);
      return { axis, left: labels[axis][0], right: labels[axis][1], value: Math.max(10, Math.min(90, left)) };
    });
  }, [scores, result]);

  const start = () => {
    setScores({ EI: 0, SN: 0, TF: 0, JP: 0 });
    setIndex(0);
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answer = (value: Answer) => {
    const axis = questions[index].axis;
    const next = { ...scores, [axis]: scores[axis] + value };
    if (index < questions.length - 1) {
      setScores(next);
      setIndex(index + 1);
    } else {
      const type = `${next.EI >= 0 ? "E" : "I"}${next.SN >= 0 ? "S" : "N"}${next.TF >= 0 ? "T" : "F"}${next.JP >= 0 ? "J" : "P"}`;
      setScores(next);
      setResult(type);
      setScreen("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const share = async () => {
    const text = `나의 MBTI는 ${result}, ${resultInfo.name}! 무료 MBTI 검사로 당신의 유형도 확인해보세요.`;
    if (navigator.share) await navigator.share({ title: "마음결 MBTI 결과", text, url: location.href });
    else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      alert("결과 링크를 복사했습니다.");
    }
  };

  const downloadResult = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#172A46"); gradient.addColorStop(.58, "#302268"); gradient.addColorStop(1, resultInfo.color);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.beginPath(); ctx.arc(900, 160, 280, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#DCD4FF"; ctx.font = "700 30px sans-serif"; ctx.fillText("MY MBTI RESULT", 90, 120);
    ctx.fillStyle = "#fff"; ctx.font = "900 130px sans-serif"; ctx.fillText(result, 90, 330);
    ctx.font = "800 52px sans-serif"; ctx.fillText(resultInfo.name, 90, 420);
    ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = "500 34px sans-serif"; ctx.fillText(resultInfo.tagline, 90, 490);
    resultInfo.strengths.forEach((x, i) => { ctx.fillStyle = "#fff"; ctx.font = "600 29px sans-serif"; ctx.fillText(`✦ ${x}`, 90, 650 + i * 64); });
    ctx.fillStyle = "#fff"; ctx.font = "700 30px sans-serif"; ctx.fillText("나도 무료 MBTI 검사하기", 90, 930);
    ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = "500 24px sans-serif"; ctx.fillText(location.host, 90, 975);
    const link = document.createElement("a"); link.download = `mbti-${result}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "MBTI 검사",
            alternateName: ["엠비티아이 검사", "성격테스트"],
            url: "https://mbti-personality-test.scott33333.chatgpt.site",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "All",
            inLanguage: "ko-KR",
            offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
            description: "40개 질문으로 16가지 성격유형을 알아보는 무료 MBTI 검사",
          }),
        }}
      />
      <header className="site-header">
        <button className="logo" onClick={() => setScreen("home")} aria-label="처음으로">
          <BrainMark /><span><b>MBTI 검사</b></span>
        </button>
        <div className="header-meta" aria-label="검사 안내">
          <span>◇ 40개 문항</span><i />
          <span>◷ 약 6분</span><i />
          <span>♧ 결과 즉시 확인</span>
        </div>
        <nav className="site-nav" aria-label="주요 메뉴">
          <a className="active" href="/">MBTI 검사</a>
          <a href="/tests">심리테스트</a>
        </nav>
      </header>

      {screen === "home" && (
        <>
          <section className="hero wellness-hero">
            <div className="hero-copy">
              <span className="eyebrow">FREE PERSONALITY TEST</span>
              <h1>나를 이해하는<br /><em>가장 선명한 질문</em></h1>
              <p>40개의 일상적인 질문으로 알아보는 무료 MBTI 검사.<br />지금의 나와 더 가까운 문장을 골라보세요.</p>
              <button className="primary-button" onClick={start}>무료 MBTI 검사 시작 <span>→</span></button>
              <div className="trust-chips"><span>✓ 가입 없음</span><span>⚡ 결과 즉시 확인</span></div>
            </div>
            <div className="hero-floating-card" aria-label="검사 특징">
              <span>PERSONALITY SIGNAL</span>
              <strong>16가지 유형</strong>
              <div><i>E · I</i><i>S · N</i><i>T · F</i><i>J · P</i></div>
            </div>
          </section>
          <section className="dimension-strip">
            {[
              ["E · I", "에너지 방향", "함께 또는 혼자"],
              ["S · N", "정보 인식", "사실 또는 가능성"],
              ["T · F", "판단 기준", "논리 또는 가치"],
              ["J · P", "생활 방식", "계획 또는 유연함"],
            ].map(([code, title, desc]) => <article key={code}><b>{code}</b><div><strong>{title}</strong><span>{desc}</span></div></article>)}
          </section>
          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} label="메인 콘텐츠 광고" />
          <section className="home-note">
            <p>성격은 네 글자로 끝나지 않습니다.</p>
            <h2>결과보다 중요한 건<br />나를 이해하는 과정이에요.</h2>
            <div className="note-grid"><span>솔직하게 답하기</span><span>너무 오래 고민하지 않기</span><span>편안한 마음으로 즐기기</span></div>
          </section>
          <section className="more-tests" aria-labelledby="more-tests-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">다른 심리테스트</span>
                <h2 id="more-tests-title">나를 이해하는 다음 질문</h2>
              </div>
              <a href="/tests">전체 테스트 보기 <span>→</span></a>
            </div>
            <TestDirectory compact />
          </section>
          <section className="seo-content" aria-labelledby="mbti-guide-title">
            <div className="seo-intro">
              <span className="eyebrow">MBTI 성격유형 가이드</span>
              <h2 id="mbti-guide-title">MBTI 검사란 무엇인가요?</h2>
              <p>MBTI 검사는 사람의 성격 선호 경향을 에너지 방향, 정보 인식, 판단 기준, 생활 방식의 네 가지 지표로 살펴보는 성격테스트입니다. 각 지표의 결과를 조합하면 INTJ, ENFP처럼 네 글자로 된 16가지 성격유형을 확인할 수 있습니다.</p>
              <p>이 무료 엠비티아이 검사는 일상에서 자주 마주치는 상황을 바탕으로 구성했습니다. 결과는 자신을 이해하고 대화하는 데 참고하는 자료이며, 사람의 모든 성격이나 능력을 단정하는 진단은 아닙니다.</p>
            </div>
            <div className="guide-grid">
              <article><b>01</b><h3>문항을 편하게 읽기</h3><p>최근의 실제 모습을 떠올리며 두 문장 중 더 자연스러운 쪽을 선택하세요.</p></article>
              <article><b>02</b><h3>솔직하게 답하기</h3><p>되고 싶은 모습보다 평소 반복해서 보이는 행동을 기준으로 답하면 좋습니다.</p></article>
              <article><b>03</b><h3>결과를 참고하기</h3><p>유형별 강점과 주의점을 관계, 업무, 자기이해에 가볍게 활용해 보세요.</p></article>
            </div>
            <h2>MBTI 4가지 성격 지표</h2>
            <div className="indicator-grid">
              <article><strong>E 외향형 · I 내향형</strong><p>사람과 활동에서 에너지를 얻는지, 혼자 생각하는 시간에서 충전하는지를 살펴봅니다.</p></article>
              <article><strong>S 감각형 · N 직관형</strong><p>구체적인 사실과 경험을 우선하는지, 가능성과 의미를 먼저 보는지를 살펴봅니다.</p></article>
              <article><strong>T 사고형 · F 감정형</strong><p>논리와 원칙을 중심으로 판단하는지, 사람과 가치를 중요하게 보는지를 살펴봅니다.</p></article>
              <article><strong>J 판단형 · P 인식형</strong><p>계획과 결정을 선호하는지, 상황에 맞춘 유연한 선택을 편하게 느끼는지를 살펴봅니다.</p></article>
            </div>
            <section className="type-guide" aria-labelledby="type-guide-title">
              <span className="eyebrow">16가지 성격유형 한눈에 보기</span>
              <h2 id="type-guide-title">MBTI 유형별 특징</h2>
              <p className="section-lead">네 가지 지표를 조합하면 16가지 유형이 만들어집니다. 같은 유형이라도 성장 환경과 경험에 따라 모습은 달라질 수 있으므로 대표적인 성향으로 참고해 주세요.</p>
              {[
                ["NT", "분석형", "논리, 전략, 지식과 새로운 아이디어를 중시하는 유형", ["INTJ","INTP","ENTJ","ENTP"]],
                ["NF", "외교형", "공감, 의미, 성장과 사람 사이의 연결을 중시하는 유형", ["INFJ","INFP","ENFJ","ENFP"]],
                ["SJ", "관리자형", "책임, 안정, 현실적인 기준과 꾸준한 실행을 중시하는 유형", ["ISTJ","ISFJ","ESTJ","ESFJ"]],
                ["SP", "탐험가형", "경험, 감각, 유연성과 빠른 상황 대응을 중시하는 유형", ["ISTP","ISFP","ESTP","ESFP"]],
              ].map(([group, title, desc, codes]) => (
                <div className="type-group" key={group as string}>
                  <div className="group-heading"><b>{group as string}</b><div><h3>{title as string}</h3><p>{desc as string}</p></div></div>
                  <div className="type-cards">{(codes as string[]).map((code) => <article key={code}><strong>{code}</strong><h4>{typeData[code].name}</h4><p>{typeData[code].tagline}</p></article>)}</div>
                </div>
              ))}
            </section>
            <section className="article-body">
              <h2>무료 MBTI 검사를 더 정확하게 하는 방법</h2>
              <h3>되고 싶은 모습보다 평소 행동을 선택하세요</h3>
              <p>성격테스트를 할 때 이상적인 모습이나 직장에서 요구받는 역할을 기준으로 답하면 실제 선호와 다른 결과가 나올 수 있습니다. 특별한 날의 행동보다는 지난 몇 달 동안 자주 반복한 선택을 떠올리는 편이 좋습니다.</p>
              <h3>중간 성향도 자연스러운 결과입니다</h3>
              <p>외향과 내향, 사고와 감정처럼 두 성향은 서로 반대되는 능력이 아니라 어느 쪽을 조금 더 편하게 사용하는지를 보여주는 지표입니다. 결과 비율이 비슷하다면 상황에 따라 양쪽 특성이 모두 자연스럽게 나타날 수 있습니다.</p>
              <h3>검사 결과가 바뀌어도 틀린 것은 아닙니다</h3>
              <p>새로운 직무, 관계 변화, 생활환경과 현재 컨디션은 자기보고식 문항의 답변에 영향을 줄 수 있습니다. 결과가 달라졌다면 네 글자만 비교하기보다 각 지표의 비율과 설명에서 꾸준히 반복되는 부분을 살펴보세요.</p>
              <h2>MBTI 성격테스트 결과 활용법</h2>
              <div className="use-grid">
                <article><h3>대인관계</h3><p>상대의 유형을 단정하기보다 서로 편하게 느끼는 소통 방식이 왜 다른지 이해하는 대화의 출발점으로 활용하세요.</p></article>
                <article><h3>직장과 협업</h3><p>정보를 구체적으로 받을 때 편한지, 큰 그림부터 이해할 때 편한지 확인하면 업무 전달과 협업 방식을 조정하는 데 도움이 됩니다.</p></article>
                <article><h3>공부와 자기계발</h3><p>혼자 집중하는 시간과 함께 토론하는 시간, 계획형 학습과 유연한 탐색 중 어떤 환경에서 집중이 잘되는지 점검해 보세요.</p></article>
              </div>
              <div className="accuracy-note">
                <h2>검사 결과를 볼 때 꼭 알아둘 점</h2>
                <p>이 사이트의 무료 MBTI 검사는 자기이해를 돕기 위해 네 가지 선호 지표를 간단히 살펴보는 비공식 성격테스트입니다. 의료·상담 목적의 심리검사, 채용 평가 또는 공식 MBTI® 검사를 대신하지 않습니다. 중요한 결정을 내릴 때는 검사 결과 하나로 사람의 능력이나 적합성을 판단하지 마세요.</p>
              </div>
            </section>
            <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_CONTENT_SLOT} label="콘텐츠 내 광고" />
            <div className="faq">
              <h2>MBTI 검사 자주 묻는 질문</h2>
              <details><summary>MBTI 검사는 무료인가요?</summary><p>네. 회원가입이나 결제 없이 40개 문항에 답하고 결과를 바로 확인할 수 있습니다.</p></details>
              <details><summary>검사 시간은 얼마나 걸리나요?</summary><p>보통 약 5~7분이 걸립니다. 너무 오래 고민하기보다 평소 모습에 가까운 답을 선택해 주세요.</p></details>
              <details><summary>MBTI 결과가 매번 달라질 수 있나요?</summary><p>현재의 환경, 역할, 컨디션과 답변 기준에 따라 결과가 달라질 수 있습니다. 한 번의 결과로 자신을 단정하지 않는 것이 좋습니다.</p></details>
              <details><summary>성격테스트 결과를 어떻게 활용하나요?</summary><p>나의 소통 방식과 선호를 이해하거나 서로의 차이를 대화하는 참고 자료로 활용할 수 있습니다.</p></details>
              <details><summary>전문 심리검사를 대신할 수 있나요?</summary><p>아닙니다. 이 검사는 자기이해를 위한 간이 성격테스트이며 전문적인 심리 평가나 진단을 대신하지 않습니다.</p></details>
            </div>
          </section>
        </>
      )}

      {screen === "test" && (
        <section className="test-shell">
          <div className="test-top"><button onClick={() => setScreen("home")}>← 나가기</button><span>{index + 1} / {questions.length}</span></div>
          <div className="progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="question-card">
            <span className="question-kicker">둘 중 나와 더 가까운 문장은?</span>
            <h2>평소의 나를 떠올리며<br />한 가지를 선택해 주세요.</h2>
            <div className="answers">
              <button onClick={() => answer(1)}><span>A</span><strong>{questions[index].a}</strong><small>이 문장에 더 가까워요</small></button>
              <em>또는</em>
              <button onClick={() => answer(-1)}><span>B</span><strong>{questions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
            </div>
          </div>
          <p className="test-tip">생각이 길어지면 처음 마음이 간 문장을 선택해 보세요.</p>
        </section>
      )}

      {screen === "result" && (
        <section className="result-shell" style={{ "--result-color": resultInfo.color } as React.CSSProperties}>
          <span className="result-kicker">검사가 완료되었습니다</span>
          <div className="result-code">{result}</div>
          <h1>{resultInfo.name}</h1>
          <p className="result-tagline">{resultInfo.tagline}</p>
          <p className="result-description">{resultInfo.description}</p>
          <div className="result-grid">
            <article className="axis-card">
              <h2>나의 성향 지표</h2>
              {percentages.map((p) => <div className="axis-row" key={p.axis}><div><b>{p.left}</b><span>{p.axis === "EI" ? "에너지" : p.axis === "SN" ? "인식" : p.axis === "TF" ? "판단" : "생활"}</span><b>{p.right}</b></div><div className="axis-bar"><i style={{ left: `${p.value}%` }} /></div></div>)}
            </article>
            <article className="trait-card"><h2>빛나는 강점</h2>{resultInfo.strengths.map((x) => <p key={x}>✦ {x}</p>)}</article>
            <article className="trait-card watch"><h2>기억하면 좋은 점</h2>{resultInfo.watch.map((x) => <p key={x}>○ {x}</p>)}</article>
          </div>
          <div className="mbti-deep-result">
            <article><span>LOVE</span><h2>연애와 가까운 관계</h2><p>{typeDetails[result].love}</p></article>
            <article><span>WORK</span><h2>일과 협업 스타일</h2><p>{typeDetails[result].work}</p></article>
            <article><span>RECOVERY</span><h2>스트레스 신호와 회복</h2><p>{typeDetails[result].stress}</p></article>
          </div>
          <div className="growth-plan mbti-growth"><span>GROWTH POINT</span><h2>나를 더 편안하게 만드는 실천</h2>{typeDetails[result].growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
          <div className="result-actions"><button className="primary-button" onClick={share}>결과 공유하기 <span>↗</span></button><button className="secondary-button" onClick={downloadResult}>결과 이미지 저장</button><button className="secondary-button" onClick={start}>다시 검사하기</button></div>
          <p className="disclaimer">본 테스트는 자기이해를 위한 간이 성격 테스트이며, 전문적인 심리 진단을 대신하지 않습니다.</p>
          <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT} label="검사 결과 광고" />
          <div className="related-results mbti-related">
            <span className="eyebrow">NEXT TEST</span><h2>지금 결과와 이어서 해보세요</h2>
            <div>
              <a href="/tests/adult-attachment"><span>연애</span><strong>성인 애착유형 테스트</strong><small>24문항 · 약 5분</small><i>내 애착유형 확인하기 →</i></a>
              <a href="/tests/egen-teto"><span>성격</span><strong>에겐·테토 성향 테스트</strong><small>20문항 · 약 3~4분</small><i>에겐·테토 비율 보기 →</i></a>
              <a href="/tests/mental-age"><span>재미</span><strong>정신연령 테스트</strong><small>15문항 · 약 2~3분</small><i>내 마음 나이 확인하기 →</i></a>
            </div>
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
