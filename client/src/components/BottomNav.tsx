import { useLocation } from "wouter";
import { Home, Bookmark, Bell, User } from "lucide-react";

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
      data-testid={`nav-${label.toLowerCase()}`}
    >
      <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function BottomNav() {
  const [location, navigate] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Bookmark, label: "Saved", path: "/saved" },
    { icon: Bell, label: "Alerts", path: "/alerts" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-20 px-4">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location === item.path || (item.path !== "/" && location.startsWith(item.path))}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
}
