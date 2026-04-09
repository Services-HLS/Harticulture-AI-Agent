export interface OfficerStaticQA {
  id: string;
  questionEn: string;
  questionTe: string;
  answerEn: string;
  answerTe: string;
  keywords: string[];
}

export const officerStaticQA: OfficerStaticQA[] = [
  {
    id: "officer_1",
    questionEn: "How are tomato arrivals expected to be in the Madanapalle market next week?",
    questionTe: "వచ్చే వారం మదనపల్లె మార్కెట్‌కు టమోటా రాక (arrivals) ఎలా ఉండొచ్చు?",
    answerEn:
      "According to our AI prediction, tomato arrivals are likely to increase by 20% next week, which may lead to a slight drop in prices.",
    answerTe:
      "మా AI అంచనా ప్రకారం, వచ్చే వారం టమోటా రాక 20% పెరిగే అవకాశం ఉంది. దీనివల్ల ధరలు స్వల్పంగా తగ్గే సూచనలు ఉన్నాయి.",
    keywords: ["tomato", "arrivals", "madanapalle", "టమోటా", "రాక", "మదనపల్లె"],
  },
  {
    id: "officer_2",
    questionEn: "In which areas are farmers most ready for harvest?",
    questionTe: "ఏ ఏరియాల్లో రైతులు ఎక్కువగా పంట కోతకు సిద్ధంగా ఉన్నారు?",
    answerEn:
      "Based on E-Panta sowing data, crops in 5 villages around Madanapalle are ready for harvest. Suitable logistics can now be planned.",
    answerTe:
      "ఇ-పంట డేటా ప్రకారం, మదనపల్లె చుట్టుపక్కల 5 గ్రామాల్లో పంట కోతకు సిద్ధంగా ఉంది. దీనికి సరిపోయే రవాణా ఏర్పాట్లు ప్లాన్ చేయవచ్చు.",
    keywords: ["harvest", "areas", "villages", "farmers", "కోత", "ఏరియా", "గ్రామం", "రైతులు"],
  },
  {
    id: "officer_3",
    questionEn: "Is there a projected need for market intervention strategies?",
    questionTe: "మార్కెట్ జోక్యం (market intervention) అవసరమయ్యే అవకాశం ఉందా?",
    answerEn:
      "Yes, prices are predicted to fall below the baseline in the next 10 days. It is advisable to engage FPOs and buyers now.",
    answerTe:
      "అవును, రాబోయే 10 రోజుల్లో ధరలు బేస్‌లైన్ కంటే తగ్గే అవకాశం ఉంది. కాబట్టి FPOలు మరియు కొనుగోలు దారులను ఇప్పుడే సమన్వయం చేయడం మంచిది.",
    keywords: ["market intervention", "baseline", "price fall", "fpo", "జోక్యం", "ధరలు", "FPO"],
  },
  {
    id: "officer_4",
    questionEn: "What kind of engagement are we seeing from farmers on the Voice Assistant?",
    questionTe: "రైతుల నుండి వాయిస్ అసిస్టెంట్‌కు ఎలాంటి స్పందన వస్తోంది?",
    answerEn:
      "95% of farmers consulted the voice bot this month. This has increased price transparency and significantly reduced dependence on middlemen.",
    answerTe:
      "ఈ నెలలో 95% మంది రైతులు వాయిస్ బాట్‌ను సంప్రదించారు. దీనివల్ల ధరల పారదర్శకత పెరిగింది మరియు మధ్యవర్తులపై ఆధారపడటం తగ్గింది.",
    keywords: ["voice assistant", "engagement", "middlemen", "95%", "వాయిస్", "స్పందన", "మధ్యవర్తులు"],
  },
  {
    id: "officer_5",
    questionEn: "Which crops currently show the highest gap between demand and supply?",
    questionTe: "ఏ పంటలకు డిమాండ్ మరియు సరఫరా మధ్య ఎక్కువ గ్యాప్ ఉంది?",
    answerEn:
      "Currently, there is a supply shortage for chillies despite high demand. This proactive alert has been sent to farmers via SMS and Voice calls.",
    answerTe:
      "ప్రస్తుతం మిర్చి పంటకు డిమాండ్ ఎక్కువగా ఉండి, సరఫరా తక్కువగా ఉంది. ఈ ప్రోయాక్టివ్ అలర్ట్‌ను రైతులకు SMS మరియు వాయిస్ కాల్స్ ద్వారా పంపించారు.",
    keywords: ["demand", "supply", "gap", "chillies", "మిర్చి", "డిమాండ్", "సరఫరా", "గ్యాప్"],
  },
];

export const findOfficerStaticAnswer = (
  question: string,
  language: "en" | "te"
): string | null => {
  const normalized = question.toLowerCase();

  let bestMatch: OfficerStaticQA | null = null;
  let bestScore = 0;

  for (const item of officerStaticQA) {
    const score = item.keywords.reduce((acc, keyword) => {
      return normalized.includes(keyword.toLowerCase()) ? acc + 1 : acc;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (!bestMatch || bestScore < 2) return null;
  return language === "te" ? bestMatch.answerTe : bestMatch.answerEn;
};
