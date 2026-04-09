import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Language } from "@/types/agent";

export default function AuthPage() {
  const { signInAsDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const navigate = useNavigate();
  const isTE = language === "te";

  const handleDemoLogin = (demoEmail: string, demoRole: "admin" | "district_officer" | "farmer") => {
    signInAsDemo(demoEmail, demoRole);
    navigate("/");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Demo login bypass handled by handleDemoLogin separately
      // This form is now only for regular Supabase login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (error) {
      const err = error as Error;
      toast({
        title: isTE ? "దోషం" : "Error",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex items-center justify-center px-4 overflow-hidden">
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={() => setLanguage((l) => (l === "en" ? "te" : "en"))}
          className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-md hover:bg-primary/90 transition-colors"
        >
          {language === "en" ? "తెలుగు" : "English"}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <img src="/images/Crop-Logo.png" alt="Crop Logo" className="w-20 h-20 mx-auto mb-2 object-contain" />
          <h1 className="text-xl font-bold text-foreground">
            {isTE ? "హార్టికల్చర్ స్మార్ట్ మార్కెట్" : "Horticulture Smart Market"}
          </h1>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {isTE ? "AI ఇంటెలిజెన్స్ ప్లాట్‌ఫారమ్" : "AI Intelligence Platform"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {isTE ? "ఇమెయిల్" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {isTE ? "పాస్‌వర్డ్" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            <Button variant="agent" size="sm" className="w-full py-2" disabled={loading}>
              {loading
                ? isTE ? "లోడ్ అవుతోంది..." : "Loading..."
                : isTE ? "లాగిన్" : "Login"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isTE ? "త్వరిత లాగిన్" : "Quick Login for Demo"}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => handleDemoLogin("admin@agrisense.ai", "admin")}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Admin</p>
                    <p className="text-[9px] text-muted-foreground">admin@agrisense.ai</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary">{isTE ? "లాగిన్ →" : "Log in →"}</span>
              </button>
              <button
                onClick={() => handleDemoLogin("officer@agrisense.ai", "district_officer")}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Officer</p>
                    <p className="text-[9px] text-muted-foreground">officer@agrisense.ai</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary">{isTE ? "లాగిన్ →" : "Log in →"}</span>
              </button>
              <button
                onClick={() => handleDemoLogin("farmer@agrisense.ai", "farmer")}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌾</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Farmer</p>
                    <p className="text-[9px] text-muted-foreground">farmer@agrisense.ai</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary">{isTE ? "లాగిన్ →" : "Log in →"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground font-medium">Powered by</span>
          <img src="/images/HLS.png" alt="HLS Logo" className="h-3 object-contain" />
          <span className="text-[10px] text-foreground font-bold tracking-tight">Hithlaksh Solutions</span>
        </div>
      </div>
    </div>
  );
}
