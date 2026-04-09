import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthCtx {
  user: User | null;
  role: "admin" | "district_officer" | "farmer" | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsDemo: (email: string, role: "admin" | "district_officer" | "farmer") => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  role: null, 
  loading: true, 
  signOut: async () => {},
  signInAsDemo: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthCtx["role"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const demoSession = localStorage.getItem("agrisense-demo-session");
      if (demoSession) {
        try {
          const { user: demoUser, role: demoRole } = JSON.parse(demoSession);
          setUser(demoUser);
          setRole(demoRole);
        } catch (e) {
          localStorage.removeItem("agrisense-demo-session");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("agrisense-demo-session");
    setUser(null);
    setRole(null);
  };

  const signInAsDemo = async (email: string, demoRole: "admin" | "district_officer" | "farmer") => {
    setLoading(true);
    const demoUser = { id: `local-${demoRole}-${Date.now()}`, email };
    
    localStorage.setItem("agrisense-demo-session", JSON.stringify({
      user: demoUser,
      role: demoRole
    }));
    
    setUser(demoUser);
    setRole(demoRole);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, signInAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
