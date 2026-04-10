export type MarketReferenceLanguage = "en" | "te";

// Keep these as plain text (voice friendly), because we inject them into prompts.
// They are intended as "reference bands/lists" to keep answers consistent,
// but the live grounded model should still verify/update when possible.

export const GUNTUR_MARKET_REFERENCE_EN = `
Guntur market reference (use as a starting point, then verify with live search):

Dry chilli (Guntur AMC, Apr 8–10, 2026, indicative):
- Average dry chilli: ₹17,500–₹19,000 per quintal (quality-dependent)
- Teja S17 (medium/best): ₹17,000–₹19,500 per quintal
- 334 Sannam (medium/best): ₹19,000–₹23,000 per quintal
- Lower grade lots may be near ₹10,000 per quintal; top high-colour premium lots may reach ~₹23,000 per quintal
Key drivers: colour/ASTA, moisture, with/without stem, grading/cleanliness, arrivals and export demand

Vegetables (Guntur retail indicative, per 1 kg unless noted; recent published trackers):
- Tomato: ~₹35 per kg
- Onion: ~₹50 per kg; small onion: ~₹80 per kg
- Potato: ~₹50 per kg
- Brinjal: ~₹30 per kg
- Okra: ~₹40 per kg
- Green chilli: ~₹50 per kg
- Ginger: ~₹180 per kg
- Beans: ~₹80 per kg; broad beans: ~₹60 per kg
- Carrot: ~₹70 per kg; beetroot: ~₹40 per kg
- Cabbage: ~₹25 per kg; capsicum: ~₹60 per kg
- Cauliflower: ~₹30 per piece
- Cucumber: ~₹30 per kg; coriander leaves: ~₹15 per bunch; mint: ~₹10 per bunch
- Bitter gourd: ~₹50 per kg; bottle gourd: ~₹20 per kg; pumpkin: ~₹20 per kg
- Ridge gourd: ~₹20 per kg; snake gourd: ~₹25 per kg; radish: ~₹30 per kg
- Drumstick: ~₹80 per kg; sweet potato: ~₹50 per kg; yam: ~₹50 per kg; colocasia: ~₹50 per kg; chayote: ~₹30 per kg
Notes: retail vs wholesale can differ; rates vary by supply, season, and quality.
`.trim();

export const GUNTUR_MARKET_REFERENCE_TE = `
గుంటూరు మార్కెట్ రిఫరెన్స్ (ముందుగా ఇవి తీసుకుని, తర్వాత లైవ్ సెర్చ్‌తో ధృవీకరించి అవసరమైతే అప్‌డేట్ చేయాలి):

ఎండు మిర్చి (గుంటూరు ఏఎంసీ, ఏప్రిల్ ఎనిమిది నుంచి పది రెండు వేల ఇరవై ఆరు, సూచనాత్మకం):
- సగటు ఎండు మిర్చి: క్వింటల్‌కు పదిహేడు వేల ఐదు వందలు నుంచి పంతొమ్మిది వేల వరకు
- తేజ ఎస్ పదిహేడు (మిడియం లేదా బెస్ట్): క్వింటల్‌కు పదిహేడు వేల నుంచి పంతొమ్మిది వేల ఐదు వందలు వరకు
- మూడు మూడు నాలుగు సన్నం (మిడియం లేదా బెస్ట్): క్వింటల్‌కు పంతొమ్మిది వేల నుంచి ఇరవై మూడు వేల వరకు
- లోయర్ గ్రేడ్ లాట్స్ క్వింటల్‌కు పదివేల దాకా ఉండొచ్చు; టాప్ హై కలర్ ప్రీమియం లాట్స్ సుమారుగా ఇరవై మూడు వేల దాకా వెళ్లొచ్చు
రేంజ్ మారడానికి కారణాలు: కలర్, తేమ, కాండంతో లేదా కాండం లేకుండా, గ్రేడింగ్, క్లీన్లినెస్, అరైవల్స్, ఎక్స్‌పోర్ట్ డిమాండ్

కూరగాయలు (గుంటూరు రిటైల్ సూచనాత్మకం, కిలోకు; ఇటీవల ప్రచురిత ట్రాకర్లు ఆధారం):
- టమాట: కిలోకు సుమారుగా ముప్పై ఐదు
- ఉల్లి: కిలోకు సుమారుగా యాభై; చిన్న ఉల్లి: కిలోకు సుమారుగా ఎనభై
- ఆలూ: కిలోకు సుమారుగా యాభై
- వంకాయ: కిలోకు సుమారుగా ముప్పై
- బెండకాయ: కిలోకు సుమారుగా నలభై
- పచ్చి మిర్చి: కిలోకు సుమారుగా యాభై
- అల్లం: కిలోకు సుమారుగా నూరు ఎనభై
- చిక్కుడు: కిలోకు సుమారుగా ఎనభై; అవర: కిలోకు సుమారుగా అరవై
- క్యారెట్: కిలోకు సుమారుగా డెబ్బై; బీట్‌రూట్: కిలోకు సుమారుగా నలభై
- క్యాబేజీ: కిలోకు సుమారుగా ఇరవై ఐదు; క్యాప్సికం: కిలోకు సుమారుగా అరవై
- కాలీఫ్లవర్: ఒక్కటికి సుమారుగా ముప్పై
- దోసకాయ: కిలోకు సుమారుగా ముప్పై; కొత్తిమీర: ఒక కట్టకు సుమారుగా పదిహేను; పుదీనా: ఒక కట్టకు సుమారుగా పది
- కాకరకాయ: కిలోకు సుమారుగా యాభై; సొరకాయ: కిలోకు సుమారుగా ఇరవై; గుమ్మడికాయ: కిలోకు సుమారుగా ఇరవై
- బీరకాయ: కిలోకు సుమారుగా ఇరవై; పొట్లకాయ: కిలోకు సుమారుగా ఇరవై ఐదు; ముల్లంగి: కిలోకు సుమారుగా ముప్పై
- మునగకాయ: కిలోకు సుమారుగా ఎనభై; చిలగడదుంప: కిలోకు సుమారుగా యాభై; సురణ్: కిలోకు సుమారుగా యాభై; చామగడ్డ: కిలోకు సుమారుగా యాభై; చౌచౌ: కిలోకు సుమారుగా ముప్పై
గమనిక: రిటైల్ రేట్లు, హోల్‌సేల్ రేట్లు వేరుగా ఉండొచ్చు; సప్లై, సీజన్, క్వాలిటీ మీద రోజుకోలా మారుతాయి.
`.trim();

export function getMarketReference(language: MarketReferenceLanguage): string {
  return language === "te" ? GUNTUR_MARKET_REFERENCE_TE : GUNTUR_MARKET_REFERENCE_EN;
}

