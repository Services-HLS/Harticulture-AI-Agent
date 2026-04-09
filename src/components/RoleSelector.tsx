import { ROLES, type UserRole, type Language } from "@/types/agent";

interface RoleSelectorProps {
  language: Language;
  onSelect: (role: UserRole) => void;
}

export function RoleSelector({ language, onSelect }: RoleSelectorProps) {
  const isTE = language === "te";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🌿</div>
        <h1 className="text-3xl font-bold text-foreground">
          {isTE ? "హార్టికల్చర్ స్మార్ట్ మార్కెట్" : "Horticulture Smart Market"}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {isTE ? "మీ పాత్రను ఎంచుకోండి" : "Select your role to continue"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className="group flex flex-col items-center p-8 rounded-2xl bg-card border-2 border-border hover:border-primary transition-all duration-200 hover:shadow-lg"
          >
            <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              {role.icon}
            </span>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {isTE ? role.labelTe : role.labelEn}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {isTE ? role.descTe : role.descEn}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
