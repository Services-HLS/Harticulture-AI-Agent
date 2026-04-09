export interface FarmerStaticQA {
  id: string;
  questionTe: string;
  questionEn: string;
  answerTe: string;
  answerEn: string;
  keywords: string[];
}

export const farmerStaticQA: FarmerStaticQA[] = [
  {
    id: "farmer_1",
    questionTe: "మదనపల్లె మార్కెట్లో ఈరోజు టమోటా ధర ఎంత ఉంది?",
    questionEn: "What is today's tomato price in Madanapalle market?",
    answerTe:
      "ఈరోజు మదనపల్లె మార్కెట్లో టమోటా క్వింటల్‌కు ₹2,000 నుండి ₹2,500 వరకు ఉంది. మా AI అంచనా ప్రకారం, వచ్చే మూడు రోజుల్లో ధర ₹200 వరకు తగ్గే అవకాశం ఉంది. మీరు కొంతం ఆగి అమ్మితే మంచిది.",
    answerEn:
      "Today in Madanapalle market, tomato price is around Rs. 2,000 to Rs. 2,500 per quintal. Our AI predicts a possible drop of about Rs. 200 in the next three days, so waiting a little before selling may help.",
    keywords: ["టమోటా", "మదనపల్లె", "ధర", "today", "tomato", "price", "madanapalle"],
  },
  {
    id: "farmer_2",
    questionTe: "నేను నా పంటను ఇప్పుడే కోయమా?",
    questionEn: "Should I harvest my crop now?",
    answerTe:
      "మీ స్పెసిఫిక్ పంటం వచ్చే వారం మార్కెట్‌కు సరుకు రాక తగ్గే అవకాశం ఉంది. మీరు మరో 4 రోజులు ఆగి కోత కోస్తే, మీరు 10% ఎక్కువ లాభం వచ్చే అవకాశం ఉంది.",
    answerEn:
      "For your crop, supply is likely to reduce in the coming week. If you wait about 4 more days to harvest, there is a chance of getting nearly 10% better profit.",
    keywords: ["కోయమా", "కోత", "పంట", "harvest", "crop", "profit", "లాభం"],
  },
  {
    id: "farmer_3",
    questionTe: "నా పంటకు ఎక్కడ డిమాండ్ ధర ఎక్కువగా ఉంది?",
    questionEn: "Where is demand and price higher for my crop?",
    answerTe:
      "ప్రస్తుతం మీకు దగ్గరలో ఉన్న అనంతపూర్ మార్కెట్లో మదనపల్లె కంటే ధర క్వింటల్‌కు ₹150 ఎక్కువగా ఉంది. రవాణా ఖర్చులు పోను మీకు ఇంకా ఎక్కువ నికర లాభం ఉంటుంది.",
    answerEn:
      "Currently, in the nearby Anantapur market, price is about Rs. 150 higher per quintal than Madanapalle. Even after transport costs, you can still get better net profit.",
    keywords: ["డిమాండ్", "ఎక్కడ", "అనంతపూర్", "demand", "price", "anantapur", "market"],
  },
  {
    id: "farmer_4",
    questionTe: "వచ్చే నెలలో ఏ పంట వేస్తే లాభదాయకంగా ఉంటుంది?",
    questionEn: "Which crop is profitable to sow next month?",
    answerTe:
      "రాబోయే కాలంలో మిరపకాయలకు మార్కెట్లో డిమాండ్ ఎక్కువగా ఉంటుంది అని మా AI అంచనా చెబుతుంది. అలాగే వచ్చే నెలలో వర్షపాతం కూడా సాగుకు అనుకూలంగా ఉంది, కాబట్టి మిరప పంట ధర బలంగా ఉంటుంది.",
    answerEn:
      "For the upcoming period, our AI predicts strong market demand for chillies. Rainfall outlook for next month is also favorable, so chilli crop prices may remain strong.",
    keywords: ["వచ్చే నెల", "ఏ పంట", "మిరప", "next month", "profitable", "crop", "chilli"],
  },
  {
    id: "farmer_5",
    questionTe: "దళారుల ప్రభావం లేకుండా నా పంటను ఎలా అమ్మాలి?",
    questionEn: "How can I sell my crop without middlemen influence?",
    answerTe:
      "యాప్‌లోని ప్రభుత్వ స్పాన్సర్ FPOల ద్వారా ప్రత్యక్ష కొనుగోలుదారులతో మీరు అమ్ముకోవచ్చు. దీనివల్ల మీకు మధ్యవర్తుల ఇబ్బంది లేకుండా 97% మెరుగైన ధర లభిస్తుంది.",
    answerEn:
      "You can sell through government-supported FPOs available in the app and connect directly with buyers. This reduces middlemen impact and can improve realized price significantly.",
    keywords: ["దళారులు", "మధ్యవర్తులు", "అమ్మాలి", "fpo", "middlemen", "sell", "buyers"],
  },
];

export const findFarmerStaticAnswer = (
  question: string,
  language: "en" | "te"
): string | null => {
  const normalized = question.toLowerCase();
  let best: FarmerStaticQA | null = null;
  let bestScore = 0;

  for (const item of farmerStaticQA) {
    const score = item.keywords.reduce((acc, kw) => (
      normalized.includes(kw.toLowerCase()) ? acc + 1 : acc
    ), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (!best || bestScore < 2) return null;
  return language === "te" ? best.answerTe : best.answerEn;
};
