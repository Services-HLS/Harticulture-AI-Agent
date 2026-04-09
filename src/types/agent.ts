export type UserRole = "admin" | "district_officer" | "farmer";
export type Language = "en" | "te";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface RoleConfig {
  id: UserRole;
  labelEn: string;
  labelTe: string;
  descEn: string;
  descTe: string;
  icon: string;
  capabilities: string[];
}

export const ROLES: RoleConfig[] = [
  {
    id: "admin",
    labelEn: "Admin",
    labelTe: "అడ్మిన్",
    descEn: "Full access: data training, system control, dashboards",
    descTe: "పూర్తి యాక్సెస్: డేటా శిక్షణ, సిస్టమ్ నియంత్రణ, డాష్‌బోర్డ్‌లు",
    icon: "🛡️",
    capabilities: [
      "Train & update datasets",
      "Manage user roles",
      "View all dashboards",
      "Configure alerts & thresholds",
      "Access PoC learnings",
    ],
  },
  {
    id: "district_officer",
    labelEn: "District Officer",
    labelTe: "జిల్లా అధికారి",
    descEn: "District-level dashboards, planning, crop analytics",
    descTe: "జిల్లా స్థాయి డాష్‌బోర్డ్‌లు, ప్రణాళిక, పంట విశ్లేషణలు",
    icon: "📊",
    capabilities: [
      "View district dashboards",
      "Mandi arrivals & price trends",
      "Crop demand forecasts",
      "Weather-based advisories",
      "Farmer profile analytics",
    ],
  },
  {
    id: "farmer",
    labelEn: "Farmer",
    labelTe: "రైతు",
    descEn: "Hyperlocal market prices, weather alerts, crop advice",
    descTe: "హైపర్‌లోకల్ మార్కెట్ ధరలు, వాతావరణ హెచ్చరికలు, పంట సలహా",
    icon: "🌾",
    capabilities: [
      "Today's market prices",
      "Crop demand alerts",
      "Weather advisories",
      "Best selling time suggestions",
      "Nearby mandi information",
    ],
  },
];
