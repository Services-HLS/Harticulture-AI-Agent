import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminTrainingPanel } from "@/components/AdminTrainingPanel";
import { QueryChat } from "@/components/QueryChat";
import { ROLES, type Language, type UserRole } from "@/types/agent";
import { Globe, LogOut, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    // Default to Telugu for the farmer role
    const savedRole = localStorage.getItem('agrisense_role') || role;
    return savedRole === "farmer" ? "te" : "en";
  });
  const [adminTab, setAdminTab] = useState<"train" | "chat">("train");
  const isTE = language === "te";

  // When role becomes available asynchronously, update language if farmer
  useEffect(() => {
    if (role === "farmer") {
      setLanguage("te");
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/images/Crop-Logo.png" alt="Loading" className="h-20 w-20 mx-auto mb-4 animate-pulse object-contain" />
          <p className="text-muted-foreground">{isTE ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const roleConfig = ROLES.find((r) => r.id === role);
  const toggleLang = () => setLanguage((l) => (l === "en" ? "te" : "en"));

  // Admin view with tabs: Train Data | Chat
  if (role === "admin") {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="bg-agent-header px-4 py-3 flex items-center gap-3 shadow-md">
          <div className="bg-white p-1 rounded-full shadow-inner flex items-center justify-center">
            <img src="/images/Crop-Logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-primary-foreground font-bold text-lg leading-tight">
              {isTE ? "అడ్మిన్ ప్యానెల్" : "Admin Panel"}
            </h1>
            <p className="text-primary-foreground/75 text-xs">
              {isTE ? "డేటా శిక్షణ & AI నిర్వహణ" : "Data Training & AI Management"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleLang} className="text-primary-foreground hover:bg-primary/80">
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/80">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Admin tabs */}
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setAdminTab("train")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              adminTab === "train"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            {isTE ? "డేటా శిక్షణ" : "Train Data"}
          </button>
          <button
            onClick={() => setAdminTab("chat")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              adminTab === "chat"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {isTE ? "AI చాట్" : "AI Chat"}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {adminTab === "train" ? (
            <div className="h-full overflow-y-auto">
              <AdminTrainingPanel language={language} />
            </div>
          ) : (
            <QueryChat language={language} />
          )}
        </div>
      </div>
    );
  }

  // District Officer / Farmer view — chat only
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-agent-header px-4 py-3 flex items-center gap-3 shadow-md">
        <div className="bg-white p-1 rounded-full shadow-inner flex items-center justify-center">
          <img src="/images/Crop-Logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        </div>
        <div className="flex-1">
          <h1 className="text-primary-foreground font-bold text-lg leading-tight">
            {isTE ? "హార్టికల్చర్ AI సహాయకుడు" : "Horticulture AI Assistant"}
          </h1>
          <p className="text-primary-foreground/75 text-xs">
            {isTE ? roleConfig?.labelTe : roleConfig?.labelEn}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleLang} className="text-primary-foreground hover:bg-primary/80">
          <Globe className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/80">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Capabilities bar */}
      {roleConfig && (
        <div className="px-4 py-2 bg-secondary overflow-x-auto flex gap-2">
          {roleConfig.capabilities.map((cap, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full bg-primary/10 text-foreground whitespace-nowrap border border-primary/20"
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <QueryChat language={language} />
      </div>
    </div>
  );
}
